import { describe, expect, it } from 'vitest';
import { clamp, damp, easeInCubic, easeOutCubic, lensPosition, outBack, radiusPx } from './math';

describe('easing', () => {
  it('starts at 0 and ends at 1', () => {
    for (const fn of [easeInCubic, easeOutCubic, outBack]) {
      expect(fn(0)).toBeCloseTo(0);
      expect(fn(1)).toBeCloseTo(1);
    }
  });

  it('outBack overshoots a little before settling', () => {
    const peak = Math.max(...Array.from({ length: 101 }, (_, i) => outBack(i / 100)));
    expect(peak).toBeGreaterThan(1.03);
    expect(peak).toBeLessThan(1.08);
  });
});

describe('damp', () => {
  it('moves toward the target without overshooting, independent of step size', () => {
    const one = damp(0, 10, 6, 0.1);
    let two = damp(0, 10, 6, 0.05);
    two = damp(two, 10, 6, 0.05);
    expect(one).toBeGreaterThan(0);
    expect(one).toBeLessThan(10);
    expect(two).toBeCloseTo(one, 6);
  });
});

describe('radiusPx', () => {
  it('is limited by the tighter of half the width and 60% of the height', () => {
    expect(radiusPx(800, 2000)).toBe(400);
    expect(radiusPx(2000, 500)).toBe(300);
  });
});

describe('lensPosition', () => {
  it('centres the requested point of the image in the lens', () => {
    const size = 5.2;
    const [x] = lensPosition(0.7, 0.5, size, 1).split(' ').map(parseFloat);
    // Point under the lens centre for background-position p: (0.5 + p * (size - 1)) / size.
    expect((0.5 + (x / 100) * (size - 1)) / size).toBeCloseTo(0.7, 2);
  });

  it('keeps positions inside 0–100%', () => {
    expect(lensPosition(0, 1, 5.2, 1)).toBe('0% 100%');
    expect(clamp(-1, 0, 1)).toBe(0);
  });
});
