export type SoundId =
  | 'hover'
  | 'tap'
  | 'press'
  | 'toggleOn'
  | 'toggleOff'
  | 'lang'
  | 'menuOpen'
  | 'menuClose'
  | 'modalOpen'
  | 'modalClose'
  | 'slide'
  | 'tick'
  | 'bump'
  | 'glide'
  | 'whoosh'
  | 'reveal'
  | 'swell'
  | 'grain'
  | 'drop'
  | 'chime'
  | 'linkOut'
  | 'boot'
  | 'granted'
  | 'sand'
  | 'section'
  | 'focus'
  | 'success'
  | 'mail'
  | 'download'
  | 'rise'
  | 'impact'
  | 'sparkle'
  | 'riser';

export const SOUND_IDS: readonly SoundId[] = [
  'hover',
  'tap',
  'press',
  'toggleOn',
  'toggleOff',
  'lang',
  'menuOpen',
  'menuClose',
  'modalOpen',
  'modalClose',
  'slide',
  'tick',
  'bump',
  'glide',
  'whoosh',
  'reveal',
  'swell',
  'grain',
  'drop',
  'chime',
  'linkOut',
  'boot',
  'granted',
  'sand',
  'section',
  'focus',
  'success',
  'mail',
  'download',
  'rise',
  'impact',
  'sparkle',
  'riser',
];

export function isSoundId(value: unknown): value is SoundId {
  return typeof value === 'string' && (SOUND_IDS as readonly string[]).includes(value);
}

export interface SoundOptions {
  /** -1 (left) … 1 (right). Default 0. Use sfx.panAt(clientX) for screen position. */
  pan?: number;
  /** 0…1, default 1. Scales gain (curve ^1.5) and, for some voices, length/brightness. */
  intensity?: number;
  /** Pitch multiplier, default 1. >1 higher / "up", <1 lower / "down". */
  rate?: number;
  /** Pentatonic degree for stepped voices (tick, chime). 0 = D5, 5 = D6, -5 = D4. */
  step?: number;
  /** Delay in ms, scheduled on the AudioContext clock (not cancellable). */
  delay?: number;
  /** 'user' (default): direct user action. 'auto': scroll / IO / whileInView / timer / load. */
  source?: 'user' | 'auto';
}

export interface SoundSnapshot {
  /** Sound is wanted: on by default, off only after the visitor turned it off. */
  enabled: boolean;
  /** The browser has Web Audio. */
  supported: boolean;
  /** The audio context is running, i.e. a click / tap / key press has unlocked it. */
  live: boolean;
}
