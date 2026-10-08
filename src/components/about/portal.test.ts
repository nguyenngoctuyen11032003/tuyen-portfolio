import { describe, expect, it } from 'vitest';
import { coverRect, easeInOutCubic, project, roundedRectPoints } from './portal';

describe('portal geometry', () => {
  it('eases from 0 to 1 through the midpoint', () => {
    expect(easeInOutCubic(0)).toBe(0);
    expect(easeInOutCubic(0.5)).toBeCloseTo(0.5);
    expect(easeInOutCubic(1)).toBe(1);
  });

  it('samples 44 points that stay inside the rectangle', () => {
    const pts = roundedRectPoints(320, 350, 90);
    expect(pts).toHaveLength(44);
    for (const [x, y] of pts) {
      expect(Math.abs(x)).toBeLessThanOrEqual(160 + 1e-9);
      expect(Math.abs(y)).toBeLessThanOrEqual(175 + 1e-9);
    }
  });

  it('clamps the radius to half the shorter side', () => {
    const pts = roundedRectPoints(100, 40, 90);
    expect(Math.max(...pts.map(([, y]) => y))).toBeCloseTo(20);
  });

  it('leaves points unchanged with no tilt', () => {
    expect(project([30, -40], 0, 0, 100, 200)).toEqual([130, 160]);
  });

  it('covers the target box like object-fit: cover', () => {
    const r = coverRect(480, 480, 0, 0, 1000, 500);
    expect(r.x).toBeCloseTo(0);
    expect(r.y).toBeCloseTo(-250);
    expect(r.w).toBeCloseTo(1000);
    expect(r.h).toBeCloseTo(1000);
  });
});
