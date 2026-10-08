import { NOTE, stepFreq } from './notes';
import type { SoundId } from './types';

/**
 * Synthesis recipes. Every sound is generated at runtime with Web Audio —
 * no audio files. Each voice renders into `kit.out`, a per-voice bus whose
 * gain is already set to the voice peak (gainDb + jitter, × intensity^1.5).
 * Components inside a voice are mixed at relative dB (0 = the main layer).
 *
 * Rules that keep everything click-free:
 *  - every audible gain starts at 0.0001 and ramps (never a hard jump);
 *  - sources stop only after their envelope has fully decayed;
 *  - noise reuses one shared buffer with a random start offset.
 */

export interface ResolvedOptions {
  pan: number;
  intensity: number;
  /** Pitch multiplier after ±35 cent humanising jitter. */
  rate: number;
  /** Pitch multiplier as requested (no jitter) — use it for direction decisions. */
  baseRate: number;
  step: number | undefined;
}

export interface VoiceKit {
  ctx: BaseAudioContext;
  /** Voice bus input. */
  out: AudioNode;
  /** The voice's StereoPanner pan param, when the browser has one. */
  pan: AudioParam | null;
  noise: AudioBuffer;
  rand: () => number;
  /** Register a node for disconnect once the voice ends. */
  node<T extends AudioNode>(n: T): T;
  /** Register a scheduled source; the voice ends when the last one ends. */
  source<T extends AudioScheduledSourceNode>(n: T): T;
}

export interface VoiceSpec {
  /** Peak level of the voice before the master (−18 dB). */
  gainDb: number;
  /** Minimum ms between two plays of this id. */
  minInterval: number | ((intensity: number) => number);
  /** Reverb send amount (0…1). */
  send: number;
  /** Kept when the user prefers reduced motion. */
  reduced: boolean;
  render(kit: VoiceKit, t0: number, o: ResolvedOptions): void;
}

const SILENT = 0.0001;
const TAIL = 0.03;

export const db = (x: number): number => Math.pow(10, x / 20);

/** Standard envelope: 0.0001 → linear to peak in `a` → exponential to 0.0001 over `d`. */
export function envelope(param: AudioParam, t: number, a: number, d: number, peak: number): void {
  const attack = Math.max(0.001, a);
  const decay = Math.max(0.004, d);
  param.setValueAtTime(SILENT, t);
  param.linearRampToValueAtTime(Math.max(SILENT * 2, peak), t + attack);
  param.exponentialRampToValueAtTime(SILENT, t + attack + decay);
}

interface ToneOpts {
  type?: OscillatorType;
  freq: number;
  /** Exponential pitch glide target and duration. */
  to?: number;
  glide?: number;
  t: number;
  a: number;
  d: number;
  /** Level relative to the voice peak, in dB. */
  rel?: number;
  detune?: number;
  dest?: AudioNode;
}

function tone(k: VoiceKit, o: ToneOpts): OscillatorNode {
  const { ctx } = k;
  const osc = k.source(ctx.createOscillator());
  osc.type = o.type ?? 'sine';
  const f0 = clampFreq(o.freq);
  osc.frequency.setValueAtTime(f0, o.t);
  if (o.to !== undefined) {
    osc.frequency.exponentialRampToValueAtTime(clampFreq(o.to), o.t + (o.glide ?? o.a + o.d));
  }
  if (o.detune) osc.detune.value = o.detune;
  const g = k.node(ctx.createGain());
  envelope(g.gain, o.t, o.a, o.d, db(o.rel ?? 0));
  osc.connect(g);
  g.connect(o.dest ?? k.out);
  osc.start(o.t);
  osc.stop(o.t + Math.max(0.001, o.a) + o.d + TAIL);
  return osc;
}

interface FilterSpec {
  type: BiquadFilterType;
  freq: number;
  /** Exponential sweep target, reached at `t + sweep`. */
  to?: number;
  sweep?: number;
  Q?: number;
}

interface NoiseOpts {
  t: number;
  a: number;
  d: number;
  rel?: number;
  filters?: FilterSpec[];
  dest?: AudioNode;
}

function filter(k: VoiceKit, f: FilterSpec, t: number): BiquadFilterNode {
  const bq = k.node(k.ctx.createBiquadFilter());
  bq.type = f.type;
  bq.Q.value = f.Q ?? (f.type === 'lowpass' || f.type === 'highpass' ? 0.707 : 1);
  bq.frequency.setValueAtTime(clampFreq(f.freq), t);
  if (f.to !== undefined) {
    bq.frequency.exponentialRampToValueAtTime(clampFreq(f.to), t + (f.sweep ?? 0.1));
  }
  return bq;
}

function noise(k: VoiceKit, o: NoiseOpts): AudioBufferSourceNode {
  const { ctx } = k;
  const src = k.source(ctx.createBufferSource());
  src.buffer = k.noise;
  src.loop = true;
  let node: AudioNode = src;
  for (const f of o.filters ?? []) {
    const bq = filter(k, f, o.t);
    node.connect(bq);
    node = bq;
  }
  const g = k.node(ctx.createGain());
  envelope(g.gain, o.t, o.a, o.d, db(o.rel ?? 0));
  node.connect(g);
  g.connect(o.dest ?? k.out);
  const offset = k.rand() * Math.max(0, k.noise.duration - 0.1);
  src.start(o.t, offset);
  src.stop(o.t + Math.max(0.001, o.a) + o.d + TAIL);
  return src;
}

/** A plain gain node (used as a sub-bus with a shared filter). */
function bus(k: VoiceKit, dest: AudioNode, rel = 0): GainNode {
  const g = k.node(k.ctx.createGain());
  g.gain.value = db(rel);
  g.connect(dest);
  return g;
}

function clampFreq(f: number): number {
  return Math.min(20000, Math.max(20, Number.isFinite(f) ? f : 440));
}

/** Pan automation, clamped to the panner range. */
function panRamp(k: VoiceKit, from: number, to: number, t: number, len: number): void {
  if (!k.pan) return;
  const c = (v: number) => Math.max(-1, Math.min(1, v));
  k.pan.setValueAtTime(c(from), t);
  k.pan.linearRampToValueAtTime(c(to), t + len);
}

/** Frequency `semi` semitones above D4. */
const semi = (s: number): number => NOTE.D4 * Math.pow(2, s / 12);

/** A lowpass sub-bus: everything routed through it loses the hiss above `freq`. */
function lowpass(k: VoiceKit, freq: number, dest: AudioNode = k.out): BiquadFilterNode {
  const lp = k.node(k.ctx.createBiquadFilter());
  lp.type = 'lowpass';
  lp.Q.value = 0.5;
  lp.frequency.value = clampFreq(freq);
  lp.connect(dest);
  return lp;
}

/* ------------------------------------------------------------ instruments -- */

interface PluckOpts {
  freq: number;
  t: number;
  /** Ring time of the body in seconds. */
  d?: number;
  rel?: number;
  /** 0 = felt mallet, 1 = brighter kalimba tine. */
  bright?: number;
  dest?: AudioNode;
}

/**
 * Kalimba / marimba pluck: a sine body that settles from a hair sharp, a woody
 * 4th partial that dies fast and a soft mallet thump, all under a lowpass, with
 * a 3 ms onset so it never clicks. The house sound for small UI feedback.
 */
function pluck(k: VoiceKit, o: PluckOpts): void {
  const d = o.d ?? 0.3;
  const bright = o.bright ?? 0.5;
  const rel = o.rel ?? 0;
  const lp = lowpass(k, Math.min(5200, o.freq * (4 + 4 * bright)), o.dest ?? k.out);
  tone(k, { freq: o.freq * 1.004, to: o.freq, glide: 0.03, t: o.t, a: 0.003, d, rel, dest: lp });
  tone(k, { freq: o.freq * 4, t: o.t, a: 0.002, d: d * 0.16, rel: rel - 16 + 6 * bright, dest: lp });
  tone(k, { freq: o.freq * 2, t: o.t, a: 0.003, d: d * 0.4, rel: rel - 18, dest: lp });
  noise(k, { t: o.t, a: 0.002, d: 0.012, rel: rel - 24, filters: [{ type: 'lowpass', freq: 1400 }], dest: lp });
}

interface PadOpts {
  freqs: number[];
  t: number;
  a: number;
  d: number;
  rel?: number;
  /** Delay between voices of the chord (soft strum). */
  strum?: number;
  cutoff?: number;
  dest?: AudioNode;
}

/** Soft electric-piano pad: sine + a quiet detuned triangle per note, lowpassed. */
function pad(k: VoiceKit, o: PadOpts): void {
  const lp = lowpass(k, o.cutoff ?? 2200, o.dest ?? k.out);
  const rel = o.rel ?? 0;
  o.freqs.forEach((f, i) => {
    const t = o.t + i * (o.strum ?? 0);
    const r = rel - i * 1.5;
    tone(k, { freq: f, t, a: o.a, d: o.d, rel: r, dest: lp });
    tone(k, { type: 'triangle', freq: f, t, a: o.a * 1.5, d: o.d * 0.8, rel: r - 9, detune: 7, dest: lp });
  });
}

interface AirOpts {
  t: number;
  a: number;
  d: number;
  from: number;
  to: number;
  rel?: number;
  q?: number;
  dest?: AudioNode;
}

/** Breath of air: a wide band of noise sweeping `from` → `to`, never brighter than 2.4 kHz. */
function air(k: VoiceKit, o: AirOpts): void {
  noise(k, {
    t: o.t,
    a: o.a,
    d: o.d,
    rel: o.rel,
    dest: o.dest,
    filters: [
      { type: 'bandpass', freq: o.from, to: o.to, sweep: o.a + o.d, Q: o.q ?? 0.55 },
      { type: 'lowpass', freq: 2400 },
    ],
  });
}

/** Soft silver bell: gentle FM (index decays fast) so it rings without a metallic bite. */
function bell(k: VoiceKit, freq: number, t: number, d: number, rel = 0, dest?: AudioNode): void {
  const { ctx } = k;
  const fc = clampFreq(freq);
  const mod = k.source(ctx.createOscillator());
  mod.frequency.value = fc * 1.4;
  const index = k.node(ctx.createGain());
  index.gain.setValueAtTime(1.2 * fc, t);
  index.gain.exponentialRampToValueAtTime(1, t + 0.35);
  mod.connect(index);
  const car = tone(k, { freq: fc, t, a: 0.004, d, rel, dest });
  index.connect(car.frequency);
  mod.start(t);
  mod.stop(t + 0.004 + d + TAIL);
}

/* ------------------------------------------------------- section chords -- */

/**
 * One chord per page section (semitones from D4), all inside D Lydian, so
 * scrolling down the page plays a slow progression that resolves at the end.
 * Index = the section's position in <main>.
 */
export const SECTION_CHORDS: readonly (readonly number[])[] = [
  [-12, -5, 4, 11], // Hero          Dmaj7
  [-12, -5, 4, 11, 14], // About     Dmaj9
  [-15, -8, 0, 7, 14], // Experience Bm11
  [-12, 2, 6, 9, 14], // Skills      E/D (the Lydian colour)
  [-8, -1, 4, 7, 11], // Archive     F#m7
  [-5, 2, 7, 9, 11], // Projects     A6/9
  [-12, 4, 6, 11, 16], // Artifacts  Dmaj7#11
  [-15, -3, 4, 7, 12], // Certs      Bm7
  [-12, -5, 4, 9, 14, 16], // Contact D6/9 — home
];

export function sectionChord(index: number): readonly number[] {
  const n = SECTION_CHORDS.length;
  return SECTION_CHORDS[((Math.round(index) % n) + n) % n];
}

/* -------------------------------------------------------------------------- */

export const VOICES: Record<SoundId, VoiceSpec> = {
  /* A tiny kalimba note; the pitch wanders over three pentatonic notes so a row of hovers sounds like wind chimes. */
  hover: {
    gainDb: -19,
    minInterval: 70,
    send: 0.12,
    reduced: true,
    render(k, t, o) {
      const step = 3 + Math.floor(k.rand() * 3);
      pluck(k, { freq: stepFreq(step) * o.rate, t, d: 0.14, bright: 0.3 });
    },
  },

  /* Generic button: a short marimba note. */
  tap: {
    gainDb: -9,
    minInterval: 60,
    send: 0.1,
    reduced: true,
    render(k, t, o) {
      pluck(k, { freq: NOTE.D5 * o.rate, t, d: 0.2, bright: 0.35 });
    },
  },

  /* Primary CTA: a low marimba fifth with a soft halo above. */
  press: {
    gainDb: -6,
    minInterval: 120,
    send: 0.2,
    reduced: true,
    render(k, t, o) {
      const r = o.rate;
      pluck(k, { freq: NOTE.D4 * r, t, d: 0.42, bright: 0.25 });
      pluck(k, { freq: NOTE.A4 * r, t: t + 0.012, d: 0.34, rel: -5, bright: 0.3 });
      pad(k, { freqs: [NOTE.Fs5 * r, NOTE.A5 * r], t: t + 0.03, a: 0.05, d: 0.45, rel: -16, cutoff: 2600 });
    },
  },

  toggleOn: {
    gainDb: -10,
    minInterval: 150,
    send: 0.18,
    reduced: true,
    render(k, t, o) {
      pluck(k, { freq: NOTE.A5 * o.rate, t, d: 0.22, bright: 0.5 });
      pluck(k, { freq: NOTE.D6 * o.rate, t: t + 0.06, d: 0.32, bright: 0.5 });
    },
  },

  toggleOff: {
    gainDb: -12,
    minInterval: 150,
    send: 0.15,
    reduced: true,
    render(k, t, o) {
      const lp = lowpass(k, 2600);
      pluck(k, { freq: NOTE.D6 * o.rate, t, d: 0.2, bright: 0.3, dest: lp });
      pluck(k, { freq: NOTE.A5 * o.rate, t: t + 0.06, d: 0.28, bright: 0.2, dest: lp });
    },
  },

  /* Language flip: a fifth, up for VI→EN, down for the reverse. */
  lang: {
    gainDb: -11,
    minInterval: 200,
    send: 0.15,
    reduced: true,
    render(k, t, o) {
      const notes = o.baseRate >= 1 ? [NOTE.D5, NOTE.A5] : [NOTE.A5, NOTE.D5];
      notes.forEach((n, i) => pluck(k, { freq: n * o.rate, t: t + i * 0.05, d: 0.24, bright: 0.45 }));
      air(k, { t, a: 0.02, d: 0.1, from: 900, to: 1600, rel: -16 });
    },
  },

  /* A curtain of air opening, with a rising third. */
  menuOpen: {
    gainDb: -13,
    minInterval: 250,
    send: 0.25,
    reduced: true,
    render(k, t, o) {
      const d = 0.16 * (1 + 0.4 * o.intensity);
      air(k, { t, a: 0.05, d, from: 450, to: 1500 });
      pluck(k, { freq: NOTE.Fs5 * o.rate, t: t + 0.02, d: 0.16, rel: -4, bright: 0.3 });
      pluck(k, { freq: NOTE.A5 * o.rate, t: t + 0.07, d: 0.2, rel: -6, bright: 0.3 });
    },
  },

  menuClose: {
    gainDb: -14,
    minInterval: 150,
    send: 0.2,
    reduced: true,
    render(k, t, o) {
      air(k, { t, a: 0.015, d: 0.14, from: 1400, to: 450 });
      pluck(k, { freq: NOTE.A5 * o.rate, t, d: 0.12, rel: -6, bright: 0.2 });
      pluck(k, { freq: NOTE.Fs5 * o.rate, t: t + 0.05, d: 0.16, rel: -8, bright: 0.2 });
    },
  },

  /* A glass pane set down: air, a low felt note, then a soft bell dyad. */
  modalOpen: {
    gainDb: -10,
    minInterval: 300,
    send: 0.3,
    reduced: true,
    render(k, t, o) {
      air(k, { t, a: 0.08, d: 0.16, from: 350, to: 1300, rel: -2 });
      pluck(k, { freq: NOTE.D3 * o.rate, t, d: 0.35, rel: -4, bright: 0.1 });
      bell(k, NOTE.Fs5 * o.rate, t + 0.14, 0.55, -8);
      bell(k, NOTE.A5 * o.rate, t + 0.17, 0.55, -10);
    },
  },

  modalClose: {
    gainDb: -12,
    minInterval: 200,
    send: 0.2,
    reduced: true,
    render(k, t, o) {
      air(k, { t, a: 0.015, d: 0.14, from: 1200, to: 380 });
      pluck(k, { freq: NOTE.D5 * o.rate, t, d: 0.16, rel: -4, bright: 0.2 });
    },
  },

  /* Directional horizontal move: a pluck that travels with a soft breath. */
  slide: {
    gainDb: -13,
    minInterval: 90,
    send: 0.15,
    reduced: true,
    render(k, t, o) {
      const len = 0.08 + 0.2 * o.intensity;
      air(k, { t, a: 0.02, d: Math.max(0.03, len - 0.02), from: 700 * o.rate, to: 1100 * o.rate, rel: -4 });
      pluck(k, { freq: NOTE.B4 * o.rate, t, d: 0.14, rel: 0, bright: 0.3 });
      if (o.pan !== 0) panRamp(k, o.pan * 0.3, o.pan, t, len);
    },
  },

  /* Pitched kalimba step on the D major pentatonic. */
  tick: {
    gainDb: -12,
    minInterval: 45,
    send: 0.12,
    reduced: true,
    render(k, t, o) {
      pluck(k, { freq: stepFreq(o.step ?? 5) * o.rate, t, d: 0.16, bright: 0.4 });
    },
  },

  /* Soft limit: a wood block, not a buzzer. */
  bump: {
    gainDb: -11,
    minInterval: 250,
    send: 0.06,
    reduced: true,
    render(k, t, o) {
      const lp = lowpass(k, 1200);
      tone(k, { freq: 196 * o.rate, to: 174 * o.rate, glide: 0.06, t, a: 0.002, d: 0.1, dest: lp });
      tone(k, { freq: 196 * 2.6 * o.rate, t, a: 0.002, d: 0.03, rel: -12, dest: lp });
      noise(k, { t, a: 0.001, d: 0.02, rel: -14, filters: [{ type: 'lowpass', freq: 500 }] });
    },
  },

  /* In-page navigation: air opening (up) or settling (down). */
  glide: {
    gainDb: -13,
    minInterval: 400,
    send: 0.3,
    reduced: false,
    render(k, t, o) {
      const len = 0.35 + 0.55 * o.intensity;
      const a = len * 0.35;
      const up = o.baseRate >= 1;
      air(k, { t, a, d: len - a, from: up ? 400 : 1800, to: up ? 1800 : 400, q: 0.45 });
      if (o.intensity > 0.6) pad(k, { freqs: [NOTE.D3 * o.rate, NOTE.A3 * o.rate], t, a, d: len - a, rel: -16, cutoff: 900 });
    },
  },

  /* Cinematic transition: a long breath with a low pad under it. */
  whoosh: {
    gainDb: -10,
    minInterval: 300,
    send: 0.35,
    reduced: false,
    render(k, t, o) {
      const len = 0.5 + 0.7 * o.intensity;
      const a = len * 0.45;
      air(k, { t, a, d: len - a, from: 250 * o.rate, to: 1600 * o.rate });
      if (o.pan !== 0) panRamp(k, -o.pan, o.pan, t, len);
      if (o.intensity >= 0.8) {
        tone(k, { freq: NOTE.D2 * o.rate, to: NOTE.D3 * o.rate, glide: len, t, a, d: len - a, rel: -14 });
        pad(k, { freqs: [NOTE.A3 * o.rate], t, a, d: len - a, rel: -20, cutoff: 1200 });
      }
    },
  },

  /* Lydian shimmer as content appears: three soft bells. */
  reveal: {
    gainDb: -15,
    minInterval: 400,
    send: 0.4,
    reduced: false,
    render(k, t, o) {
      [NOTE.A5, NOTE.Cs6, NOTE.E6].forEach((n, i) =>
        tone(k, { freq: n * o.rate, t: t + i * 0.05, a: 0.015, d: 0.7, rel: -4 - i * 2 }),
      );
    },
  },

  /* Cinematic pad: D3 A3 F#4 G#4 through an opening-then-closing lowpass. */
  swell: {
    gainDb: -14,
    minInterval: 1500,
    send: 0.45,
    reduced: false,
    render(k, t, o) {
      const { ctx } = k;
      const len = 1.2 + 1.0 * o.intensity;
      const a = len * 0.45;
      const lp = k.node(ctx.createBiquadFilter());
      lp.type = 'lowpass';
      lp.Q.value = 0.5;
      lp.frequency.setValueAtTime(300, t);
      lp.frequency.exponentialRampToValueAtTime(1500, t + a);
      lp.frequency.exponentialRampToValueAtTime(500, t + len);
      const amp = k.node(ctx.createGain());
      envelope(amp.gain, t, a, len - a, 1);
      lp.connect(amp);
      amp.connect(k.out);
      const chord: [number, number][] = [
        [NOTE.D3, -8],
        [NOTE.A3, -9],
        [NOTE.Fs4, -11],
        [NOTE.Gs4, -20],
      ];
      for (const [n, rel] of chord) {
        for (const cents of [-6, 6]) {
          const osc = k.source(ctx.createOscillator());
          osc.type = 'triangle';
          osc.frequency.value = n * o.rate;
          osc.detune.value = cents;
          osc.connect(bus(k, lp, rel));
          osc.start(t + k.rand() * 0.004);
          osc.stop(t + len + TAIL);
        }
      }
    },
  },

  /* Wooden friction grain while dragging / spinning (no hiss). */
  grain: {
    gainDb: -4,
    minInterval: (intensity) => 110 - 60 * intensity,
    send: 0.1,
    reduced: false,
    render(k, t, o) {
      const dur = 0.02 + k.rand() * 0.014;
      const center = (420 + 700 * o.intensity) * o.rate * (1 + (k.rand() - 0.5) * 0.3);
      noise(k, {
        t,
        a: 0.003,
        d: dur,
        filters: [
          { type: 'bandpass', freq: center, Q: 1.6 },
          { type: 'lowpass', freq: 1800 },
        ],
      });
      if (o.baseRate >= 1.3) pluck(k, { freq: NOTE.E6 * o.rate, t, d: 0.06, rel: -10, bright: 0.2 });
    },
  },

  /* Set down / land. */
  drop: {
    gainDb: -7,
    minInterval: 150,
    send: 0.18,
    reduced: true,
    render(k, t, o) {
      tone(k, { freq: 220 * o.rate, to: 110 * o.rate, glide: 0.12, t, a: 0.004, d: 0.18 * (0.5 + o.intensity) });
      noise(k, { t, a: 0.003, d: 0.05, rel: -10, filters: [{ type: 'lowpass', freq: 420 }] });
      if (o.intensity >= 0.9) tone(k, { freq: NOTE.D2, t, a: 0.006, d: 0.4, rel: -8 });
    },
  },

  /* Silver bell on a pentatonic step. */
  chime: {
    gainDb: -9,
    minInterval: 300,
    send: 0.4,
    reduced: true,
    render(k, t, o) {
      const fc = stepFreq(o.step ?? 5) * o.rate;
      bell(k, fc, t, 1.1);
      tone(k, { freq: fc * 2, t, a: 0.006, d: 0.6, rel: -16 });
    },
  },

  /* Leaving the page: an upward portamento with a soft breath. */
  linkOut: {
    gainDb: -12,
    minInterval: 250,
    send: 0.2,
    reduced: true,
    render(k, t, o) {
      tone(k, { freq: NOTE.A5 * o.rate, to: NOTE.E6 * o.rate, glide: 0.12, t, a: 0.004, d: 0.24 });
      pluck(k, { freq: NOTE.A4 * o.rate, t, d: 0.18, rel: -8, bright: 0.2 });
      air(k, { t, a: 0.06, d: 0.1, from: 800, to: 1900, rel: -14 });
    },
  },

  /* Terminal boot line: a soft burst of keystrokes, then a quiet "ok" when the line succeeds. */
  boot: {
    gainDb: -14,
    minInterval: 40,
    send: 0.06,
    reduced: false,
    render(k, t, o) {
      const keys = 3 + Math.floor(k.rand() * 3);
      for (let i = 0; i < keys; i++) {
        const at = t + i * (0.022 + k.rand() * 0.018);
        noise(k, {
          t: at,
          a: 0.001,
          d: 0.01 + k.rand() * 0.006,
          rel: -2 - k.rand() * 4,
          filters: [
            { type: 'bandpass', freq: 1500 + k.rand() * 900, Q: 1.4 },
            { type: 'lowpass', freq: 3000 },
          ],
        });
        tone(k, { freq: (260 + k.rand() * 60) * o.rate, t: at, a: 0.001, d: 0.014, rel: -12 });
      }
      if (o.intensity >= 0.95) pluck(k, { freq: NOTE.A5 * o.rate, t: t + 0.12, d: 0.12, rel: -6, bright: 0.3 });
    },
  },

  /* ACCESS GRANTED — the signature chord. */
  granted: {
    gainDb: -6,
    minInterval: 5000,
    send: 0.45,
    reduced: false,
    render(k, t, o) {
      const r = o.rate;
      pad(k, { freqs: [NOTE.D4 * r, NOTE.A4 * r], t, a: 0.012, d: 1.2, cutoff: 2400 });
      pad(k, { freqs: [NOTE.Fs5 * r, NOTE.Cs6 * r], t: t + 0.14, a: 0.012, d: 1.0, rel: -2, cutoff: 3200 });
      for (const n of [NOTE.E6, NOTE.Gs6, NOTE.A6, NOTE.Cs7]) {
        bell(k, n * r, t + 0.18 + k.rand() * 0.27, 0.5, -18);
      }
      tone(k, { freq: NOTE.D2, t, a: 0.02, d: 0.6, rel: -14 });
    },
  },

  /* Badge dissolves to sand, then crystallises. */
  sand: {
    gainDb: -12,
    minInterval: 600,
    send: 0.3,
    reduced: false,
    render(k, t, o) {
      const N1 = 28;
      for (let i = 0; i < N1; i++) {
        const at = 0.8 * Math.pow(i / N1, 1.7) + k.rand() * 0.012;
        noise(k, {
          t: t + at,
          a: 0.002,
          d: 0.008 + k.rand() * 0.012,
          rel: -2 - 8 * (i / N1),
          filters: [{ type: 'bandpass', freq: 1400 + k.rand() * 2600, Q: 3 }],
        });
      }
      const N2 = 18;
      for (let i = 0; i < N2; i++) {
        const p = i / (N2 - 1);
        noise(k, {
          t: t + 0.9 + 0.6 * Math.pow(p, 0.7),
          a: 0.002,
          d: 0.008 + k.rand() * 0.012,
          rel: -8 + 5 * p,
          filters: [{ type: 'bandpass', freq: 1800 * Math.pow(4200 / 1800, p), Q: 3 }],
        });
      }
      bell(k, NOTE.Cs6 * o.rate, t + 1.5, 0.45, -8);
      bell(k, NOTE.E6 * o.rate, t + 1.53, 0.45, -10);
    },
  },

  /* ---------------------------------------------------------- new voices -- */

  /* Entering a page section: a soft strummed chord from SECTION_CHORDS (step = section index). */
  section: {
    gainDb: -24,
    minInterval: 1200,
    send: 0.5,
    reduced: false,
    render(k, t, o) {
      const freqs = sectionChord(o.step ?? 0).map((s) => semi(s) * o.rate);
      pad(k, { freqs, t, a: 0.09, d: 1.7, strum: 0.035, cutoff: 2000 });
      air(k, { t, a: 0.25, d: 0.6, from: 300, to: 900, rel: -20 });
    },
  },

  /* Keyboard focus moving (Tab): a whisper of a kalimba that climbs the scale. */
  focus: {
    gainDb: -18,
    minInterval: 50,
    send: 0.1,
    reduced: true,
    render(k, t, o) {
      pluck(k, { freq: stepFreq(o.step ?? 2) * o.rate, t, d: 0.12, bright: 0.25 });
    },
  },

  /* Copied / done: a rising fourth with a little sparkle. */
  success: {
    gainDb: -10,
    minInterval: 400,
    send: 0.3,
    reduced: true,
    render(k, t, o) {
      pluck(k, { freq: NOTE.A5 * o.rate, t, d: 0.22, bright: 0.5 });
      pluck(k, { freq: NOTE.D6 * o.rate, t: t + 0.08, d: 0.4, bright: 0.5 });
      bell(k, NOTE.A6 * o.rate, t + 0.14, 0.35, -16);
    },
  },

  /* Writing an email: paper slide, then two notes. */
  mail: {
    gainDb: -11,
    minInterval: 400,
    send: 0.25,
    reduced: true,
    render(k, t, o) {
      air(k, { t, a: 0.03, d: 0.12, from: 600, to: 1500, rel: -4 });
      pluck(k, { freq: NOTE.Fs5 * o.rate, t: t + 0.04, d: 0.2, bright: 0.4 });
      pluck(k, { freq: NOTE.B5 * o.rate, t: t + 0.11, d: 0.3, bright: 0.4 });
    },
  },

  /* Download: a descending triad that lands with a soft thud. */
  download: {
    gainDb: -10,
    minInterval: 400,
    send: 0.25,
    reduced: true,
    render(k, t, o) {
      [NOTE.A5, NOTE.Fs5, NOTE.D5].forEach((n, i) =>
        pluck(k, { freq: n * o.rate, t: t + i * 0.06, d: 0.22 + i * 0.06, rel: -i, bright: 0.35 }),
      );
      tone(k, { freq: 165 * o.rate, to: 110 * o.rate, glide: 0.1, t: t + 0.19, a: 0.004, d: 0.18, rel: -6 });
    },
  },

  /* Back to the top: the pentatonic run up, with a rising breath. */
  rise: {
    gainDb: -12,
    minInterval: 800,
    send: 0.35,
    reduced: true,
    render(k, t, o) {
      for (let i = 0; i < 6; i++) {
        pluck(k, { freq: stepFreq(i) * o.rate, t: t + i * 0.045, d: 0.22, rel: -i * 0.8, bright: 0.4 });
      }
      air(k, { t, a: 0.15, d: 0.2, from: 400, to: 1800, rel: -10 });
    },
  },
};

/** Ids dropped entirely under prefers-reduced-motion. */
export const REDUCED_DROP: ReadonlySet<SoundId> = new Set(
  (Object.keys(VOICES) as SoundId[]).filter((id) => !VOICES[id].reduced),
);

export function minIntervalOf(id: SoundId, intensity: number): number {
  const m = VOICES[id].minInterval;
  return typeof m === 'function' ? m(intensity) : m;
}
