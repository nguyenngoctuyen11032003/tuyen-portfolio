import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createSoundEngine, MASTER_DB, SOUND_STORAGE_KEY, type SoundEnv } from './engine';
import { SOUND_IDS } from './types';
import { REDUCED_DROP, VOICES, minIntervalOf } from './voices';
import { stepFreq, NOTE } from './notes';

/* ------------------------------------------------------- fake Web Audio ---- */

const audioErrors: string[] = [];

class FakeParam {
  value: number;
  constructor(v = 0) {
    this.value = v;
  }
  setValueAtTime(v: number) {
    this.value = v;
    return this;
  }
  linearRampToValueAtTime(v: number) {
    this.value = v;
    return this;
  }
  exponentialRampToValueAtTime(v: number) {
    if (!(v > 0)) {
      audioErrors.push('exponential ramp to ' + v);
      throw new RangeError('exponential ramp to non-positive value');
    }
    this.value = v;
    return this;
  }
  setTargetAtTime(v: number) {
    this.value = v;
    return this;
  }
  cancelScheduledValues() {
    return this;
  }
}

class FakeNode {
  connections = 0;
  disconnected = false;
  ctx: FakeContext;
  constructor(ctx: FakeContext) {
    this.ctx = ctx;
    ctx.created += 1;
    ctx.nodes.push(this);
  }
  connect<T>(dest: T): T {
    this.connections += 1;
    return dest;
  }
  disconnect() {
    this.disconnected = true;
  }
}

class FakeSource extends FakeNode {
  onended: (() => void) | null = null;
  started = false;
  stopped = false;
  start() {
    this.started = true;
    this.ctx.sources.push(this);
  }
  stop() {
    this.stopped = true;
  }
}

class FakeBuffer {
  private data: Float32Array[];
  numberOfChannels: number;
  length: number;
  sampleRate: number;
  constructor(numberOfChannels: number, length: number, sampleRate: number) {
    this.numberOfChannels = numberOfChannels;
    this.length = length;
    this.sampleRate = sampleRate;
    this.data = Array.from({ length: numberOfChannels }, () => new Float32Array(length));
  }
  get duration() {
    return this.length / this.sampleRate;
  }
  getChannelData(c: number) {
    return this.data[c];
  }
}

class FakeContext {
  static instances: FakeContext[] = [];
  static initialState: AudioContextState = 'running';
  state: AudioContextState = FakeContext.initialState;
  sampleRate = 4000;
  currentTime = 0;
  created = 0;
  nodes: FakeNode[] = [];
  sources: FakeSource[] = [];
  destination = {};
  constructor() {
    FakeContext.instances.push(this);
  }
  resume() {
    this.state = 'running';
    return Promise.resolve();
  }
  suspend() {
    this.state = 'suspended';
    return Promise.resolve();
  }
  createGain() {
    return Object.assign(new FakeNode(this), { gain: new FakeParam(1) });
  }
  createBiquadFilter() {
    return Object.assign(new FakeNode(this), {
      type: 'lowpass',
      frequency: new FakeParam(350),
      Q: new FakeParam(1),
    });
  }
  createDynamicsCompressor() {
    return Object.assign(new FakeNode(this), {
      threshold: new FakeParam(),
      knee: new FakeParam(),
      ratio: new FakeParam(),
      attack: new FakeParam(),
      release: new FakeParam(),
    });
  }
  createConvolver() {
    return Object.assign(new FakeNode(this), { buffer: null as unknown });
  }
  createStereoPanner() {
    return Object.assign(new FakeNode(this), { pan: new FakeParam(0) });
  }
  createOscillator() {
    return Object.assign(new FakeSource(this), {
      type: 'sine',
      frequency: new FakeParam(440),
      detune: new FakeParam(0),
    });
  }
  createBufferSource() {
    return Object.assign(new FakeSource(this), { buffer: null as unknown, loop: false });
  }
  createBuffer(ch: number, len: number, sr: number) {
    return new FakeBuffer(ch, len, sr);
  }
  /** Fire onended on every started source (simulates playback finishing). */
  finishAll() {
    for (const s of this.sources.splice(0)) s.onended?.();
  }
}

function memoryStorage(initial?: string) {
  const map = new Map<string, string>();
  if (initial !== undefined) map.set(SOUND_STORAGE_KEY, initial);
  return {
    map,
    getItem: (k: string) => map.get(k) ?? null,
    setItem: (k: string, v: string) => void map.set(k, v),
  };
}

function setup(over: Partial<SoundEnv> & { stored?: string; reduced?: boolean } = {}) {
  let clock = 1000;
  const storage = memoryStorage(over.stored);
  const mql = {
    matches: over.reduced ?? false,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  } as unknown as MediaQueryList;
  const engine = createSoundEngine({
    AudioContextCtor: FakeContext as unknown as typeof AudioContext,
    storage,
    now: () => clock,
    matchMedia: () => mql,
    random: () => 0.5,
    ...over,
  });
  return {
    engine,
    storage,
    advance: (ms: number) => {
      clock += ms;
    },
    ctx: () => FakeContext.instances[FakeContext.instances.length - 1],
  };
}

/** Nodes created by one play() call. */
function nodesFor(ctx: FakeContext, fn: () => void): number {
  const before = ctx.created;
  fn();
  return ctx.created - before;
}

beforeEach(() => {
  FakeContext.instances = [];
  FakeContext.initialState = 'running';
});
afterEach(() => {
  vi.useRealTimers();
});

/* ---------------------------------------------------------------- tests ---- */

describe('voice table', () => {
  it('defines all 30 ids with the planned levels', () => {
    expect(SOUND_IDS).toHaveLength(30);
    expect(Object.keys(VOICES).sort()).toEqual([...SOUND_IDS].sort());
    expect(VOICES.hover.gainDb).toBe(-19);
    expect(VOICES.tap.gainDb).toBe(-9);
    expect(VOICES.press.gainDb).toBe(-6);
    expect(VOICES.section.gainDb).toBeLessThan(VOICES.press.gainDb);
    expect(minIntervalOf('grain', 1)).toBe(50);
    expect(minIntervalOf('grain', 0)).toBe(110);
    expect([...REDUCED_DROP].sort()).toEqual(
      ['boot', 'glide', 'grain', 'granted', 'reveal', 'sand', 'section', 'swell', 'whoosh'].sort(),
    );
    expect(MASTER_DB).toBe(-11);
  });

  it('maps pentatonic steps around D5', () => {
    expect(stepFreq(0)).toBeCloseTo(NOTE.D5, 2);
    expect(stepFreq(5)).toBeCloseTo(NOTE.D5 * 2, 2);
    expect(stepFreq(-5)).toBeCloseTo(NOTE.D5 / 2, 2);
    expect(stepFreq(3)).toBeCloseTo(NOTE.A5, 0);
  });

  it('renders every voice cleanly, stops every source and frees its nodes', () => {
    const { engine, ctx, advance } = setup({ stored: 'on' });
    engine.unlock();
    const variants = [
      { intensity: 1, rate: 1.4, pan: 0.5, step: -3 },
      { intensity: 0.2, rate: 0.8, pan: -0.4 },
    ];
    for (const opts of variants) {
      for (const id of SOUND_IDS) {
        const c = ctx();
        const from = c.nodes.length;
        audioErrors.length = 0;
        const made = nodesFor(c, () => engine.play(id, opts));
        expect(made, id).toBeGreaterThan(0);
        expect(audioErrors, id).toEqual([]);
        const fresh = c.nodes.slice(from);
        const sources = fresh.filter((n): n is FakeSource => n instanceof FakeSource);
        expect(sources.length, id).toBeGreaterThan(0);
        expect(sources.every((src) => src.started && src.stopped), id).toBe(true);
        c.finishAll();
        expect(fresh.every((n) => n.disconnected), id).toBe(true);
      }
      advance(10_000); // clear throttles before the next variant
    }
  });
});

describe('createSoundEngine', () => {
  it('is a safe no-op without AudioContext', () => {
    const storage = memoryStorage();
    const engine = createSoundEngine({ AudioContextCtor: undefined, storage });
    expect(engine.supported).toBe(false);
    expect(() => engine.play('tap')).not.toThrow();
    expect(() => engine.unlock()).not.toThrow();
    const listener = vi.fn();
    engine.subscribe(listener);
    engine.setEnabled(true);
    expect(storage.map.get(SOUND_STORAGE_KEY)).toBe('on');
    expect(engine.getSnapshot()).toEqual({ enabled: true, supported: false, live: false });
    expect(listener).toHaveBeenCalledTimes(1);
    expect(engine.ready()).toBe(false);
  });

  it('defaults to on, but creates no context until a gesture unlocks it', () => {
    const { engine } = setup();
    expect(engine.isEnabled()).toBe(true);
    engine.play('tap');
    expect(FakeContext.instances).toHaveLength(0);
    expect(engine.getSnapshot().live).toBe(false);
    engine.unlock();
    expect(FakeContext.instances).toHaveLength(1);
  });

  it("remembers an explicit 'off' and stays silent", () => {
    const { engine } = setup({ stored: 'off' });
    expect(engine.isEnabled()).toBe(false);
    engine.unlock();
    engine.play('tap');
    expect(FakeContext.instances).toHaveLength(0);
  });

  it("restores 'on' but waits for a gesture before creating the context", () => {
    const { engine } = setup({ stored: 'on' });
    expect(engine.isEnabled()).toBe(true);
    engine.play('tap');
    expect(FakeContext.instances).toHaveLength(0);
    engine.unlock();
    expect(FakeContext.instances).toHaveLength(1);
    expect(engine.ready()).toBe(true);
  });

  it('drops sounds while the context is suspended (no queue)', () => {
    FakeContext.initialState = 'suspended';
    const { engine, ctx } = setup({ stored: 'on' });
    engine.unlock(); // resume() is async — state is still suspended right now
    const c = ctx();
    c.state = 'suspended';
    expect(nodesFor(c, () => engine.play('tap'))).toBe(0);
    c.state = 'running';
    expect(nodesFor(c, () => engine.play('tap'))).toBeGreaterThan(0);
  });

  it('persists the preference and toggles the snapshot', () => {
    const { engine, storage } = setup();
    const first = engine.getSnapshot();
    expect(engine.getSnapshot()).toBe(first); // stable identity
    engine.setEnabled(true);
    expect(storage.map.get(SOUND_STORAGE_KEY)).toBe('on');
    const on = engine.getSnapshot();
    expect(on).not.toBe(first);
    expect(on.enabled).toBe(true);
    expect(engine.getSnapshot()).toBe(on);
    engine.toggle();
    expect(storage.map.get(SOUND_STORAGE_KEY)).toBe('off');
    expect(engine.getSnapshot().enabled).toBe(false);
  });

  it('throttles repeated plays per id', () => {
    const { engine, ctx, advance } = setup({ stored: 'on' });
    engine.unlock();
    const c = ctx();
    expect(nodesFor(c, () => engine.play('tick'))).toBeGreaterThan(0);
    advance(10);
    expect(nodesFor(c, () => engine.play('tick'))).toBe(0);
    advance(40);
    expect(nodesFor(c, () => engine.play('tick'))).toBeGreaterThan(0);
    // Different ids don't share a key.
    expect(nodesFor(c, () => engine.play('tap'))).toBeGreaterThan(0);
  });

  it('throttles hover as one group and locks reveal globally', () => {
    const { engine, ctx, advance } = setup({ stored: 'on' });
    engine.unlock();
    const c = ctx();
    expect(nodesFor(c, () => engine.play('hover', { pan: -0.5 }))).toBeGreaterThan(0);
    advance(30);
    expect(nodesFor(c, () => engine.play('hover', { pan: 0.5 }))).toBe(0);
    advance(50);
    expect(nodesFor(c, () => engine.play('hover'))).toBeGreaterThan(0);

    expect(nodesFor(c, () => engine.play('reveal'))).toBeGreaterThan(0);
    advance(600);
    expect(nodesFor(c, () => engine.play('reveal'))).toBe(0);
    advance(700);
    expect(nodesFor(c, () => engine.play('reveal'))).toBeGreaterThan(0);
  });

  it('blocks auto sounds while suppressed', () => {
    const { engine, ctx, advance } = setup({ stored: 'on' });
    engine.unlock();
    const c = ctx();
    engine.suppressAuto(1000);
    engine.suppressAuto(200); // never shortens
    expect(nodesFor(c, () => engine.play('swell', { source: 'auto' }))).toBe(0);
    expect(nodesFor(c, () => engine.play('tap'))).toBeGreaterThan(0); // user sounds pass
    advance(1001);
    expect(nodesFor(c, () => engine.play('swell', { source: 'auto' }))).toBeGreaterThan(0);
  });

  it('keeps user feedback but drops motion sounds under reduced motion', () => {
    const { engine, ctx } = setup({ stored: 'on', reduced: true });
    engine.unlock();
    const c = ctx();
    expect(nodesFor(c, () => engine.play('tap'))).toBeGreaterThan(0);
    expect(nodesFor(c, () => engine.play('whoosh'))).toBe(0);
    expect(nodesFor(c, () => engine.play('chime', { source: 'auto' }))).toBe(0);
    expect(nodesFor(c, () => engine.play('chime'))).toBeGreaterThan(0);
  });

  it('caps simultaneous voices at 16 and frees them when they end', () => {
    const { engine, ctx, advance } = setup({ stored: 'on' });
    engine.unlock();
    const c = ctx();
    let played = 0;
    for (let i = 0; i < 20; i++) {
      advance(100);
      if (nodesFor(c, () => engine.play('tick')) > 0) played += 1;
    }
    expect(played).toBe(16);
    c.finishAll();
    advance(100);
    expect(nodesFor(c, () => engine.play('tick'))).toBeGreaterThan(0);
  });

  it('pans by screen position within ±0.6', () => {
    const { engine } = setup();
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: 1000 });
    expect(engine.panAt(0)).toBeCloseTo(-0.6);
    expect(engine.panAt(500)).toBeCloseTo(0);
    expect(engine.panAt(1000)).toBeCloseTo(0.6);
    expect(engine.panAt(5000)).toBeCloseTo(0.6);
  });

  it('fades out and suspends when turned off', async () => {
    vi.useFakeTimers();
    const { engine, ctx } = setup({ stored: 'on' });
    engine.unlock();
    const c = ctx();
    engine.setEnabled(false);
    expect(c.state).toBe('running');
    vi.advanceTimersByTime(300);
    expect(c.state).toBe('suspended');
    expect(engine.ready()).toBe(false);
  });

  it('install() wires and removes global listeners', () => {
    const { engine } = setup();
    const add = vi.spyOn(document, 'addEventListener');
    const remove = vi.spyOn(document, 'removeEventListener');
    const uninstall = engine.install();
    expect(add.mock.calls.map((c) => c[0])).toEqual(
      expect.arrayContaining(['visibilitychange', 'click']),
    );
    uninstall();
    expect(remove.mock.calls.map((c) => c[0])).toEqual(
      expect.arrayContaining(['visibilitychange', 'click']),
    );
    add.mockRestore();
    remove.mockRestore();
  });

  it('plays the delegate sound for a click on a plain button', () => {
    const { engine, ctx } = setup({ stored: 'on' });
    engine.unlock();
    const c = ctx();
    const uninstall = engine.install();
    const btn = document.createElement('button');
    document.body.appendChild(btn);
    expect(nodesFor(c, () => btn.click())).toBeGreaterThan(0);
    btn.setAttribute('data-sfx', 'off');
    expect(nodesFor(c, () => btn.click())).toBe(0);
    btn.remove();
    uninstall();
  });
});
