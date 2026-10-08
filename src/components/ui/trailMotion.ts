/** Pure helpers for the cursor image trail (ImageTrail.tsx). */

/** Total life of one card: glide in, hold, then drop away. */
export const TRAIL_DURATION = 1600;

/** Most cards dealt in one frame; a faster flick skips ahead rather than bursting a pile. */
export const MAX_PER_FRAME = 3;

/** Cursor travel (px) between two cards, scaled to the card so the stack overlaps the same at any size. */
export function spawnGap(cardSize: number): number {
  return Math.max(18, cardSize * 0.42);
}

/** Lean into the direction of travel (`ux` is the unit x of the path) plus a little jitter. */
export function tiltFor(ux: number, jitter: number): number {
  return Math.round((ux * 8 + jitter * 2.5) * 10) / 10;
}

export interface TrailStep {
  fromX: number;
  fromY: number;
  x: number;
  y: number;
  ux: number;
}

/**
 * Cards dealt for the pointer having moved from the last card (`ax`, `ay`) to (`mx`, `my`): one
 * every `gap` px along the straight path, so they land evenly however fast the pointer moves and
 * each glides in over the same distance from where the previous one landed. Returns the steps and
 * the new anchor; at most `max` steps, skipping ahead on a long jump.
 */
export function trailSteps(ax: number, ay: number, mx: number, my: number, gap: number, max = MAX_PER_FRAME) {
  const dx = mx - ax;
  const dy = my - ay;
  const dist = Math.hypot(dx, dy);
  const count = Math.floor(dist / gap);
  if (count < 1) return { steps: [] as TrailStep[], x: ax, y: ay };
  const ux = dx / dist;
  const uy = dy / dist;
  let x = ax + ux * gap * Math.max(0, count - max);
  let y = ay + uy * gap * Math.max(0, count - max);
  const steps: TrailStep[] = [];
  for (let i = 0; i < Math.min(count, max); i++) {
    const nx = x + ux * gap;
    const ny = y + uy * gap;
    steps.push({ fromX: x, fromY: y, x: nx, y: ny, ux });
    x = nx;
    y = ny;
  }
  return { steps, x, y };
}

function at(x: number, y: number, rot: number, scale: number) {
  return `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0) rotate(${rot}deg) scale(${scale})`;
}

/**
 * One card's whole life as a single WAAPI timeline: it starts small where the previous card
 * landed and glides out to its own spot, rests there while the stack builds, then falls `drop` px
 * with gravity-like easing while fading out.
 */
export function cardKeyframes(fromX: number, fromY: number, toX: number, toY: number, rot: number, drop: number): Keyframe[] {
  return [
    { offset: 0, opacity: 0, transform: at(fromX, fromY, rot * 1.6, 0.6), easing: 'cubic-bezier(0.22, 1, 0.36, 1)' },
    { offset: 0.28, opacity: 1, transform: at(toX, toY, rot, 1), easing: 'ease-in-out' },
    { offset: 0.52, opacity: 1, transform: at(toX, toY + 2, rot, 0.985), easing: 'cubic-bezier(0.5, 0, 0.75, 0)' },
    { offset: 0.8, opacity: 0.85, transform: at(toX, toY + drop * 0.55, rot * 0.8, 0.9), easing: 'linear' },
    { offset: 1, opacity: 0, transform: at(toX, toY + drop, rot * 0.7, 0.82) },
  ];
}

/** The light streaks above a falling card only show while it drops. */
export const STREAK_KEYFRAMES: Keyframe[] = [
  { offset: 0, opacity: 0, transform: 'scaleY(0.2)' },
  { offset: 0.55, opacity: 0, transform: 'scaleY(0.2)', easing: 'ease-out' },
  { offset: 0.75, opacity: 0.7, transform: 'scaleY(1)', easing: 'ease-in' },
  { offset: 1, opacity: 0, transform: 'scaleY(1.15)' },
];

/** Fisher–Yates with an injectable random source, so each visit deals the photos in a new order. */
export function shuffled<T>(items: readonly T[], random: () => number = Math.random): T[] {
  const out = items.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}
