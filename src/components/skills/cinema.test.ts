import { describe, expect, it } from 'vitest';
import { computeFrame, segmentInOut, smoothstep } from './cinema';

const at = (scroll: number) => computeFrame(scroll, 0, 0, 900).vars;

describe('skills cinema timeline', () => {
  it('smoothstep clamps and eases', () => {
    expect(smoothstep(0, 10, -5)).toBe(0);
    expect(smoothstep(0, 10, 5)).toBe(0.5);
    expect(smoothstep(0, 10, 20)).toBe(1);
  });

  it('segmentInOut is active only between enter and exit', () => {
    expect(segmentInOut(0, 10, 20, 30, 40).active).toBe(0);
    expect(segmentInOut(25, 10, 20, 30, 40).active).toBe(1);
    expect(segmentInOut(50, 10, 20, 30, 40).active).toBe(0);
  });

  it('starts on the title with the slider parked off-screen', () => {
    const v = at(0);
    expect(v['--title-opacity']).toBe('1.0000');
    expect(v['--panel2-opacity']).toBe('0.0000');
    expect(v['--slider-enter-x']).toBe('420.000vw');
    expect(v['--slider-pe']).toBe('none');
  });

  it('shows one story panel at a time', () => {
    expect(Number(at(1100)['--panel2-opacity'])).toBe(1);
    expect(Number(at(1100)['--panel3-opacity'])).toBe(0);
    expect(Number(at(2340)['--panel3-opacity'])).toBe(1);
    expect(Number(at(2340)['--panel2-opacity'])).toBe(0);
    expect(at(2340)['--panel3-pe']).toBe('auto');
  });

  it('crossfades the floor grid to its blurred twin instead of animating a blur', () => {
    expect(at(0)['--grid-sharp-opacity']).toBe('0.8000');
    expect(at(0)['--grid-soft-opacity']).toBe('0.0000');
    expect(Number(at(1100)['--grid-sharp-opacity'])).toBe(0);
    expect(Number(at(1100)['--grid-soft-opacity'])).toBeGreaterThan(0.5);
    expect(Object.values(at(1100)).some((v) => v.includes('blur'))).toBe(false);
  });

  it('widens the arch with scale, keeping it anchored to its sinking bottom edge', () => {
    // Fully widened (frame 2 entered, not yet exiting): grow = 105 / 67.2.
    const archH = 300;
    const grow = 105 / 67.2;
    const v = computeFrame(1100, 0, 0, 900, archH).vars;
    const base = computeFrame(1100, 0, 0, 900, 0).vars;
    expect(Number(v['--arch-scale']) / (1.02 + (1100 / 2700) * 0.23)).toBeCloseTo(grow, 3);
    // Bottom edge: +13vh down, minus the part of the growth below the 48% origin.
    const shift = parseFloat(v['--arch-y']) - parseFloat(base['--arch-y']);
    expect(shift).toBeCloseTo(-0.52 * archH * (grow - 1), 1);
  });

  it('keeps the arch faint behind panel 1, then fades it out completely as it launches', () => {
    expect(Number(at(1100)['--arch-opacity'])).toBeCloseTo(0.12, 2);
    expect(Number(at(2340)['--arch-opacity'])).toBe(0);
  });

  it('lands the slider and arms the controls at the end', () => {
    const end = computeFrame(3700, 0, 0, 900);
    expect(end.vars['--slider-enter-x']).toBe('0.000vw');
    expect(end.vars['--title-opacity']).toBe('0.0000');
    expect(end.controlsReady).toBe(true);
    expect(computeFrame(3400, 0, 0, 900).controlsReady).toBe(false);
  });
});
