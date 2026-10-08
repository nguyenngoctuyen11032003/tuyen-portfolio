/**
 * Geometry for the About-section portal: a rounded-rectangle window drawn on a canvas, tilted with
 * a cheap fake perspective. Pure functions so they can be unit-tested without a canvas.
 */

export type Point = [number, number];

const FOCAL = 850;
const ARC_STEPS = 10;

export function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

/** Outline points of a w×h rounded rectangle centred on the origin (radius clamped to fit). */
export function roundedRectPoints(w: number, h: number, radius: number): Point[] {
  const r = Math.max(0, Math.min(radius, w / 2, h / 2));
  const corners: [number, number, number, number][] = [
    [w / 2 - r, -h / 2 + r, -Math.PI / 2, 0],
    [w / 2 - r, h / 2 - r, 0, Math.PI / 2],
    [-w / 2 + r, h / 2 - r, Math.PI / 2, Math.PI],
    [-w / 2 + r, -h / 2 + r, Math.PI, Math.PI * 1.5],
  ];
  const points: Point[] = [];
  for (const [cx, cy, start, end] of corners) {
    for (let i = 0; i <= ARC_STEPS; i++) {
      const a = start + ((end - start) * i) / ARC_STEPS;
      points.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]);
    }
  }
  return points;
}

/** Projects a local point rotated by rx/ry degrees onto the screen around (cx, cy). */
export function project([x, y]: Point, rx: number, ry: number, cx: number, cy: number): Point {
  const ax = (rx * Math.PI) / 180;
  const ay = (ry * Math.PI) / 180;
  const z = x * Math.sin(ay) - y * Math.sin(ax);
  const p = FOCAL / (FOCAL + z);
  return [cx + x * Math.cos(ay) * p, cy + y * Math.cos(ax) * p];
}

/** Rect that covers a target box with media of size mw×mh, centred (CSS object-fit: cover). */
export function coverRect(mw: number, mh: number, x: number, y: number, w: number, h: number) {
  const scale = Math.max(w / mw, h / mh);
  const dw = mw * scale;
  const dh = mh * scale;
  return { x: x + (w - dw) / 2, y: y + (h - dh) / 2, w: dw, h: dh };
}

/** Animates 0→1 with easeInOutCubic over `duration` ms; resolves when done. */
export function animateValue(set: (v: number) => void, duration: number): Promise<void> {
  return new Promise((resolve) => {
    const start = performance.now();
    const step = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      set(easeInOutCubic(t));
      if (t < 1) requestAnimationFrame(step);
      else resolve();
    };
    requestAnimationFrame(step);
  });
}
