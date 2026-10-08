import { describe, expect, it } from 'vitest';
import trailImages from '../../data/trailImages.json';
import { cardKeyframes, shuffled, spawnGap, tiltFor, trailSteps } from './trailMotion';

describe('spawnGap', () => {
  it('scales with the card but never drops below a floor', () => {
    expect(spawnGap(74)).toBeCloseTo(31.08);
    expect(spawnGap(40)).toBe(26);
  });
});

describe('tiltFor', () => {
  it('leans with the direction of travel', () => {
    expect(tiltFor(1, 0)).toBe(8);
    expect(tiltFor(-1, 0)).toBe(-8);
  });

  it('keeps the jitter small', () => {
    expect(Math.abs(tiltFor(1, 1))).toBeLessThanOrEqual(10.5);
    expect(Math.abs(tiltFor(-1, -1))).toBeLessThanOrEqual(10.5);
  });
});

describe('trailSteps', () => {
  it('deals nothing until the pointer has travelled a full gap', () => {
    expect(trailSteps(0, 0, 40, 0, 50)).toEqual({ steps: [], x: 0, y: 0 });
  });

  it('spaces cards exactly one gap apart along the path, each gliding from the last', () => {
    const { steps, x, y } = trailSteps(0, 0, 0, 160, 50);
    expect(steps.map((s) => [s.fromY, s.y])).toEqual([
      [0, 50],
      [50, 100],
      [100, 150],
    ]);
    expect([x, y]).toEqual([0, 150]);
    expect(steps.every((s) => s.ux === 0)).toBe(true);
  });

  it('skips ahead on a long jump instead of bursting a pile', () => {
    const { steps, x } = trailSteps(0, 0, 1000, 0, 50, 3);
    expect(steps).toHaveLength(3);
    expect(steps[0].fromX).toBeCloseTo(850);
    expect(x).toBeCloseTo(1000);
  });
});

describe('cardKeyframes', () => {
  const frames = cardKeyframes(10, 20, 110, 120, 5, 100);

  it('fades in, holds, then fades out', () => {
    expect(frames.map((f) => f.opacity)).toEqual([0, 1, 1, 0.85, 0]);
    expect(frames[0].offset).toBe(0);
    expect(frames.at(-1)!.offset).toBe(1);
  });

  it('glides from the previous card to its own spot, then drops below it', () => {
    expect(frames[0].transform).toContain('translate3d(10.0px, 20.0px, 0)');
    expect(frames[1].transform).toContain('translate3d(110.0px, 120.0px, 0)');
    expect(frames.at(-1)!.transform).toContain('translate3d(110.0px, 220.0px, 0)');
  });
});

describe('shuffled', () => {
  it('keeps every item and leaves the input untouched', () => {
    const input = [1, 2, 3, 4, 5];
    const out = shuffled(input, () => 0.3);
    expect(out.slice().sort()).toEqual(input);
    expect(input).toEqual([1, 2, 3, 4, 5]);
  });
});

describe('trail manifest', () => {
  it('lists the generated photos', () => {
    expect(trailImages.length).toBeGreaterThan(0);
    for (const src of trailImages) expect(src).toMatch(/^\/trail\/trail-\d+\.webp$/);
  });
});
