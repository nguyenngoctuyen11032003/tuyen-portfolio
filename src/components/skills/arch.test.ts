import { describe, expect, it } from 'vitest';
import { archPositions } from './arch';

/** Distance between two tiles in units of the arch width (bottom % is of the height). */
const gap = (p: { left: number; bottom: number }, q: { left: number; bottom: number }, aspect = 2.3) =>
  Math.hypot((p.left - q.left) / 100, (p.bottom - q.bottom) / 100 / aspect);

describe('archPositions', () => {
  it('runs from the left foot over the top to the right foot', () => {
    const pts = archPositions(12);
    expect(pts).toHaveLength(12);
    expect(pts[0].left).toBeCloseTo(6);
    expect(pts[0].bottom).toBeCloseTo(8);
    expect(pts[11].left).toBeCloseTo(94);
    expect(pts[11].bottom).toBeCloseTo(8);
  });

  it('keeps neighbouring tiles evenly spaced, ends included', () => {
    const pts = archPositions(12);
    const gaps = pts.slice(1).map((p, i) => gap(p, pts[i]));
    const min = Math.min(...gaps);
    const max = Math.max(...gaps);
    expect(max / min).toBeLessThan(1.05);
  });

  it('handles tiny counts', () => {
    expect(archPositions(0)).toEqual([]);
    expect(archPositions(1)).toEqual([{ left: 50, bottom: 80 }]);
  });
});
