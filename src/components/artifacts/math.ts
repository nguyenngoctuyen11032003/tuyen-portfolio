/** Pure helpers for the artifact stage, kept free of three.js so they are cheap to test. */

export const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

/** Frame-rate independent exponential approach of `current` toward `target`. */
export const damp = (current: number, target: number, rate: number, dt: number) =>
  current + (target - current) * (1 - Math.exp(-rate * dt));

export const easeInCubic = (t: number) => t * t * t;

export const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

/** Back-overshoot curve: 0 at t = 0, peaks a little above 1, settles at exactly 1. */
export const outBack = (t: number) => 1 + 2.2 * Math.pow(t - 1, 3) + 1.2 * Math.pow(t - 1, 2);

/** Pixel radius a unit-radius artifact is framed at inside a box of the given size. */
export const radiusPx = (width: number, height: number) => Math.min(width * 0.5, height * 0.6) * 1.0;

/**
 * Background position that centres a point (u, v in 0..1 of the image) inside a round lens
 * when the image is drawn at `size` times the lens width, for an image of the given aspect (h / w).
 */
export function lensPosition(u: number, v: number, size: number, aspect: number): string {
  const along = (point: number, scale: number) => {
    if (scale <= 1) return 50;
    const p = (point * scale - 0.5) / (scale - 1);
    return Math.round(clamp(p, 0, 1) * 1000) / 10;
  };
  return `${along(u, size)}% ${along(v, size * aspect)}%`;
}
