import { classifyClick } from './delegate';
import { installExtras } from './extras';
import type { SoundId, SoundOptions, SoundSnapshot } from './types';
import { REDUCED_DROP, VOICES, db, minIntervalOf, type ResolvedOptions, type VoiceKit } from './voices';

export const SOUND_STORAGE_KEY = 'sound';
/** Master level. Set from offline renders: -18 left hover/grain ticks near -45 dBFS, inaudible on laptop speakers. */
export const MASTER_DB = -11;

const MAX_VOICES = 16;
const REVEAL_LOCK_MS = 1200;
const HIDE_SUSPEND_MS = 400;
const REDUCED_QUERY = '(prefers-reduced-motion: reduce)';

export interface SoundEngine {
  readonly supported: boolean;
  /** Always safe: never throws, returns nothing. Cost when off: one boolean check. */
  play(id: SoundId, opts?: SoundOptions): void;
  isEnabled(): boolean;
  /** Call inside a user gesture. true: persist 'on', create/resume the context, play 'toggleOn'.
   *  false: play 'toggleOff', fade the master to 0 over 250 ms, suspend, persist 'off'. */
  setEnabled(on: boolean): void;
  toggle(): void;
  /** Inside a gesture: if enabled, create/resume the context. The provider calls it for you. */
  unlock(): void;
  /** enabled && context running && tab visible. Use it to skip expensive work. */
  ready(): boolean;
  /** Drop every source:'auto' sound for the next `ms` ms (max of overlapping calls). */
  suppressAuto(ms: number): void;
  /** clientX → pan in [-0.6, 0.6]. */
  panAt(clientX: number): number;
  subscribe(listener: () => void): () => void;
  /** Same object until something changes. */
  getSnapshot(): SoundSnapshot;
  /** Global listeners (gesture unlock, visibility, reduced motion, click delegate). Returns uninstall. */
  install(): () => void;
}

export interface SoundEnv {
  AudioContextCtor?: typeof AudioContext;
  storage?: Pick<Storage, 'getItem' | 'setItem'> | null;
  now?: () => number;
  matchMedia?: (q: string) => MediaQueryList;
  random?: () => number;
}

interface Graph {
  ctx: AudioContext;
  masterIn: GainNode;
  master: GainNode;
  reverbIn: GainNode;
  noise: AudioBuffer;
}

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
const finite = (v: number | undefined, fallback: number) =>
  typeof v === 'number' && Number.isFinite(v) ? v : fallback;

function hasDocument(): boolean {
  return typeof document !== 'undefined';
}

function docHidden(): boolean {
  return hasDocument() && document.hidden === true;
}

/** Without an argument it uses the browser defaults (same as `sfx`). */
export function createSoundEngine(envArg?: SoundEnv): SoundEngine {
  const env = envArg ?? defaultEnv();
  const Ctor = env.AudioContextCtor;
  const supported = typeof Ctor === 'function';
  const storage = env.storage ?? null;
  const now = env.now ?? (() => Date.now());
  const random = env.random ?? Math.random;
  const mm = typeof env.matchMedia === 'function' ? env.matchMedia : null;

  let enabled = readStored();
  let reduced = false;
  try {
    reduced = mm ? mm(REDUCED_QUERY).matches === true : false;
  } catch {
    reduced = false;
  }

  let graph: Graph | null = null;
  let suppressUntil = 0;
  let revealLock = -Infinity;
  const last = new Map<string, number>();
  let active = 0;
  let suspendTimer: ReturnType<typeof setTimeout> | null = null;
  let hideTimer: ReturnType<typeof setTimeout> | null = null;

  let snapshot: SoundSnapshot = { enabled, supported };
  const listeners = new Set<() => void>();

  function readStored(): boolean {
    try {
      return storage?.getItem(SOUND_STORAGE_KEY) === 'on';
    } catch {
      return false;
    }
  }

  function persist(on: boolean) {
    try {
      storage?.setItem(SOUND_STORAGE_KEY, on ? 'on' : 'off');
    } catch {
      /* private mode / blocked storage */
    }
  }

  function notify() {
    if (snapshot.enabled !== enabled || snapshot.supported !== supported) {
      snapshot = { enabled, supported };
    }
    for (const l of [...listeners]) {
      try {
        l();
      } catch {
        /* a listener must never break the engine */
      }
    }
  }

  /* ----------------------------------------------------------- graph ---- */

  function buildGraph(): Graph | null {
    if (!supported || !Ctor) return null;
    let ctx: AudioContext;
    try {
      ctx = new Ctor({ latencyHint: 'interactive' });
    } catch {
      return null;
    }

    const masterIn = ctx.createGain();
    masterIn.gain.value = 1;
    const hp = ctx.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.value = 30;
    hp.Q.value = 0.707;
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -20;
    comp.knee.value = 10;
    comp.ratio.value = 3;
    comp.attack.value = 0.004;
    comp.release.value = 0.2;
    const master = ctx.createGain();
    master.gain.value = db(MASTER_DB);
    const limiter = ctx.createDynamicsCompressor();
    limiter.threshold.value = -6;
    limiter.knee.value = 0;
    limiter.ratio.value = 20;
    limiter.attack.value = 0.001;
    limiter.release.value = 0.05;
    masterIn.connect(hp);
    hp.connect(comp);
    comp.connect(master);
    master.connect(limiter);
    limiter.connect(ctx.destination);

    // Reverb: code-generated impulse, filtered wet return.
    const reverbIn = ctx.createGain();
    reverbIn.gain.value = 1;
    try {
      const conv = ctx.createConvolver();
      conv.buffer = makeImpulse(ctx, 1.6, random);
      const wetHp = ctx.createBiquadFilter();
      wetHp.type = 'highpass';
      wetHp.frequency.value = 180;
      const wetLp = ctx.createBiquadFilter();
      wetLp.type = 'lowpass';
      wetLp.frequency.value = 7000;
      const wet = ctx.createGain();
      wet.gain.value = 0.9;
      reverbIn.connect(conv);
      conv.connect(wetHp);
      wetHp.connect(wetLp);
      wetLp.connect(wet);
      wet.connect(masterIn);
    } catch {
      /* no reverb — dry only */
    }

    return { ctx, masterIn, master, reverbIn, noise: makeNoise(ctx, 2, random) };
  }

  function ensureGraph(): Graph | null {
    if (!graph) graph = buildGraph();
    return graph;
  }

  function resume(g: Graph): Promise<void> {
    try {
      if (g.ctx.state !== 'running' && g.ctx.state !== 'closed') {
        return g.ctx.resume().catch(() => undefined);
      }
    } catch {
      /* ignore */
    }
    return Promise.resolve();
  }

  /** iOS Safari: a one-sample silent buffer inside the gesture unlocks output. */
  function primeSilence(g: Graph) {
    try {
      const b = g.ctx.createBuffer(1, 1, g.ctx.sampleRate);
      const s = g.ctx.createBufferSource();
      s.buffer = b;
      s.connect(g.ctx.destination);
      s.onended = () => s.disconnect();
      s.start(0);
    } catch {
      /* ignore */
    }
  }

  function setMaster(g: Graph, target: number, mode: 'up' | 'down') {
    try {
      const p = g.master.gain;
      const t = g.ctx.currentTime;
      p.cancelScheduledValues(t);
      if (mode === 'up') {
        p.setValueAtTime(Math.max(0.0001, Math.min(p.value, target)), t);
        // ~99% of target within 120 ms, with no click.
        p.setTargetAtTime(target, t, 0.025);
      } else {
        p.setValueAtTime(p.value, t);
        p.linearRampToValueAtTime(0, t + 0.25);
      }
    } catch {
      /* ignore */
    }
  }

  /* ------------------------------------------------------------ play ---- */

  function play(id: SoundId, opts: SoundOptions = {}): void {
    try {
      if (!enabled) return;
      const g = graph;
      if (!g || g.ctx.state !== 'running') return;
      if (docHidden()) return;
      const auto = opts.source === 'auto';
      if (reduced && (auto || REDUCED_DROP.has(id))) return;
      const t = now();
      if (auto && t < suppressUntil) return;

      const spec = VOICES[id];
      if (!spec) return;
      const intensity = clamp(finite(opts.intensity, 1), 0, 1);
      if (intensity <= 0) return;
      const prev = last.get(id);
      if (prev !== undefined && t - prev < minIntervalOf(id, intensity)) return;
      if (id === 'reveal' && t - revealLock < REVEAL_LOCK_MS) return;
      if (active >= MAX_VOICES) return;

      last.set(id, t);
      if (id === 'reveal') revealLock = t;

      const baseRate = Math.max(0.05, finite(opts.rate, 1));
      const rate = baseRate * Math.pow(2, ((random() - 0.5) * 70) / 1200);
      const gainDb = spec.gainDb + (random() - 0.5) * 3;
      const pan = clamp(finite(opts.pan, 0), -1, 1);
      const delay = Math.max(0, finite(opts.delay, 0));
      const resolved: ResolvedOptions = {
        pan,
        intensity,
        rate,
        baseRate,
        step: typeof opts.step === 'number' && Number.isFinite(opts.step) ? opts.step : undefined,
      };
      build(g, id, resolved, gainDb, g.ctx.currentTime + 0.01 + delay / 1000);
    } catch {
      /* sound must never break the page */
    }
  }

  function build(g: Graph, id: SoundId, o: ResolvedOptions, gainDb: number, t0: number) {
    const { ctx } = g;
    const spec = VOICES[id];
    const nodes: AudioNode[] = [];
    const sources: AudioScheduledSourceNode[] = [];

    const out = ctx.createGain();
    out.gain.value = db(gainDb) * Math.pow(o.intensity, 1.5);
    nodes.push(out);

    let pan: AudioParam | null = null;
    let tail: AudioNode = out;
    if (typeof ctx.createStereoPanner === 'function') {
      const p = ctx.createStereoPanner();
      p.pan.value = o.pan;
      out.connect(p);
      nodes.push(p);
      pan = p.pan;
      tail = p;
    }
    tail.connect(g.masterIn);
    if (spec.send > 0) {
      const send = ctx.createGain();
      send.gain.value = spec.send;
      tail.connect(send);
      send.connect(g.reverbIn);
      nodes.push(send);
    }

    const kit: VoiceKit = {
      ctx,
      out,
      pan,
      noise: g.noise,
      rand: random,
      node(n) {
        nodes.push(n);
        return n;
      },
      source(n) {
        sources.push(n);
        nodes.push(n);
        return n;
      },
    };

    let cleaned = false;
    const cleanup = () => {
      if (cleaned) return;
      cleaned = true;
      active = Math.max(0, active - 1);
      for (const n of nodes) {
        try {
          n.disconnect();
        } catch {
          /* already disconnected */
        }
      }
    };

    active += 1;
    try {
      spec.render(kit, t0, o);
    } catch {
      cleanup();
      return;
    }
    if (sources.length === 0) {
      cleanup();
      return;
    }
    let remaining = sources.length;
    for (const s of sources) {
      s.onended = () => {
        remaining -= 1;
        if (remaining <= 0) cleanup();
      };
    }
  }

  /* ---------------------------------------------------------- control ---- */

  function unlock(): void {
    if (!enabled || !supported) return;
    if (graph && graph.ctx.state === 'running') return;
    const g = ensureGraph();
    if (!g) return;
    if (docHidden()) return;
    primeSilence(g);
    void resume(g);
  }

  function setEnabled(on: boolean): void {
    if (suspendTimer !== null) {
      clearTimeout(suspendTimer);
      suspendTimer = null;
    }
    if (on) {
      enabled = true;
      persist(true);
      const g = supported ? ensureGraph() : null;
      if (g) {
        primeSilence(g);
        setMaster(g, db(MASTER_DB), 'up');
        const chirp = () => {
          if (enabled) play('toggleOn', { delay: 40 });
        };
        if (g.ctx.state === 'running') chirp();
        else void resume(g).then(chirp);
      }
    } else {
      const g = graph;
      if (g && enabled) play('toggleOff');
      enabled = false;
      persist(false);
      if (g) {
        setMaster(g, 0, 'down');
        suspendTimer = setTimeout(() => {
          suspendTimer = null;
          if (!enabled) {
            try {
              void g.ctx.suspend().catch(() => undefined);
            } catch {
              /* ignore */
            }
          }
        }, 300);
      }
    }
    notify();
  }

  function onVisibility() {
    const g = graph;
    if (!g) return;
    if (docHidden()) {
      if (hideTimer !== null) clearTimeout(hideTimer);
      hideTimer = setTimeout(() => {
        hideTimer = null;
        if (docHidden() && g.ctx.state === 'running') {
          try {
            void g.ctx.suspend().catch(() => undefined);
          } catch {
            /* ignore */
          }
        }
      }, HIDE_SUSPEND_MS);
    } else {
      if (hideTimer !== null) {
        clearTimeout(hideTimer);
        hideTimer = null;
      }
      if (enabled) void resume(g);
    }
  }

  function install(): () => void {
    if (typeof window === 'undefined' || !hasDocument()) return () => {};

    const onGesture = () => unlock();
    const gestureOpts: AddEventListenerOptions = { capture: true, passive: true };
    window.addEventListener('pointerdown', onGesture, gestureOpts);
    window.addEventListener('keydown', onGesture, gestureOpts);
    window.addEventListener('touchend', onGesture, gestureOpts);
    document.addEventListener('visibilitychange', onVisibility);

    let mq: MediaQueryList | null = null;
    const onReduced = (e: MediaQueryListEvent | MediaQueryList) => {
      reduced = e.matches === true;
    };
    try {
      mq = mm ? mm(REDUCED_QUERY) : null;
      if (mq) {
        reduced = mq.matches === true;
        if (typeof mq.addEventListener === 'function') mq.addEventListener('change', onReduced);
        else if (typeof mq.addListener === 'function') mq.addListener(onReduced);
      }
    } catch {
      mq = null;
    }

    const onClick = (e: MouseEvent) => {
      if (!enabled) return;
      const target = e.target;
      if (!(target instanceof Element)) return;
      try {
        // Gesture: make sure the context is alive before the delegate plays.
        unlock();
        const { calls, suppressMs } = classifyClick(target, {
          scrollY: window.scrollY,
          innerHeight: window.innerHeight,
          clientX: e.detail === 0 ? null : e.clientX,
          panAt,
        });
        if (suppressMs > 0) suppressAuto(suppressMs);
        for (const [id, opts] of calls) play(id, opts);
      } catch {
        /* ignore */
      }
    };
    document.addEventListener('click', onClick, true);
    const uninstallExtras = installExtras({ play, now, panAt });

    return () => {
      window.removeEventListener('pointerdown', onGesture, gestureOpts);
      window.removeEventListener('keydown', onGesture, gestureOpts);
      window.removeEventListener('touchend', onGesture, gestureOpts);
      document.removeEventListener('visibilitychange', onVisibility);
      document.removeEventListener('click', onClick, true);
      uninstallExtras();
      if (mq) {
        try {
          if (typeof mq.removeEventListener === 'function') mq.removeEventListener('change', onReduced);
          else if (typeof mq.removeListener === 'function') mq.removeListener(onReduced);
        } catch {
          /* ignore */
        }
      }
      if (hideTimer !== null) {
        clearTimeout(hideTimer);
        hideTimer = null;
      }
    };
  }

  function suppressAuto(ms: number): void {
    if (!Number.isFinite(ms) || ms <= 0) return;
    suppressUntil = Math.max(suppressUntil, now() + ms);
  }

  function panAt(clientX: number): number {
    const w = typeof window !== 'undefined' && window.innerWidth > 0 ? window.innerWidth : 1;
    if (!Number.isFinite(clientX)) return 0;
    return clamp((clientX / w) * 2 - 1, -1, 1) * 0.6;
  }

  return {
    supported,
    play,
    isEnabled: () => enabled,
    setEnabled,
    toggle: () => setEnabled(!enabled),
    unlock,
    ready: () => enabled && graph !== null && graph.ctx.state === 'running' && !docHidden(),
    suppressAuto,
    panAt,
    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    getSnapshot: () => snapshot,
    install,
  };
}

/* ------------------------------------------------------------ buffers ---- */

/** 2 s of mono white noise, shared by every noise layer. */
function makeNoise(ctx: BaseAudioContext, seconds: number, random: () => number): AudioBuffer {
  const len = Math.max(1, Math.floor(ctx.sampleRate * seconds));
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = random() * 2 - 1;
  return buf;
}

/**
 * Stereo room impulse: 12 ms pre-delay, independent noise per channel shaped by
 * (1 − t/T)^2.2 · e^(−3t), through a one-pole lowpass that darkens over time.
 */
function makeImpulse(ctx: BaseAudioContext, seconds: number, random: () => number): AudioBuffer {
  const sr = ctx.sampleRate;
  const len = Math.max(1, Math.floor(sr * seconds));
  const pre = Math.floor(sr * 0.012);
  const buf = ctx.createBuffer(2, len, sr);
  for (let c = 0; c < 2; c++) {
    const d = buf.getChannelData(c);
    let y = 0;
    for (let i = 0; i < len; i++) {
      if (i < pre) {
        d[i] = 0;
        continue;
      }
      const t = (i - pre) / sr;
      const T = seconds - pre / sr;
      const shape = Math.pow(Math.max(0, 1 - t / T), 2.2) * Math.exp(-3 * t);
      const k = 0.55 + 0.35 * Math.min(1, t / T);
      y = k * y + (1 - k) * (random() * 2 - 1);
      d[i] = y * shape;
    }
  }
  return buf;
}

/* ---------------------------------------------------------- singleton ---- */

function defaultEnv(): SoundEnv {
  if (typeof window === 'undefined') return {};
  const w = window as Window & {
    AudioContext?: typeof AudioContext;
    webkitAudioContext?: typeof AudioContext;
  };
  let storage: Pick<Storage, 'getItem' | 'setItem'> | null = null;
  try {
    storage = w.localStorage;
  } catch {
    storage = null;
  }
  return {
    AudioContextCtor: w.AudioContext ?? w.webkitAudioContext,
    storage,
    now: () => (typeof performance !== 'undefined' ? performance.now() : Date.now()),
    matchMedia: typeof w.matchMedia === 'function' ? (q: string) => w.matchMedia(q) : undefined,
    random: Math.random,
  };
}

export const sfx: SoundEngine = createSoundEngine(defaultEnv());
