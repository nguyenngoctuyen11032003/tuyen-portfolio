import { describe, expect, it } from 'vitest';
import { scrollScale } from './useScrollScale';

describe('scrollScale', () => {
  const vh = 1000;

  it('is zero while the element is fully off screen', () => {
    expect(scrollScale(1000, 1400, vh)).toBe(0);
    expect(scrollScale(-500, 0, vh)).toBe(0);
  });

  it('grows as the element rises through the lower part of the viewport', () => {
    expect(scrollScale(900, 1300, vh)).toBeCloseTo(100 / 600);
    expect(scrollScale(400, 800, vh)).toBe(1);
  });

  it('shrinks as the element leaves through the top', () => {
    expect(scrollScale(-300, 160, vh)).toBeCloseTo(0.5);
  });
});
