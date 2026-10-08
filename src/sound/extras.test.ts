import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  FOCUS_STEPS,
  USER_SCROLL_WINDOW_MS,
  installExtras,
  nextFocusStep,
  scoreSections,
  shouldScore,
} from './extras';
import { SECTION_CHORDS, sectionChord } from './voices';

afterEach(() => {
  document.body.innerHTML = '';
});

describe('shouldScore', () => {
  it('plays a new section only right after the visitor scrolled', () => {
    expect(shouldScore(2, 1, 1000, 1000 + USER_SCROLL_WINDOW_MS - 1)).toBe(true);
    expect(shouldScore(2, 1, 1000, 1000 + USER_SCROLL_WINDOW_MS + 1)).toBe(false);
  });

  it('never repeats the section that played last, nor unknown sections', () => {
    expect(shouldScore(2, 2, 1000, 1000)).toBe(false);
    expect(shouldScore(-1, 2, 1000, 1000)).toBe(false);
  });
});

describe('nextFocusStep', () => {
  it('climbs with Tab and falls with Shift+Tab, wrapping', () => {
    expect(nextFocusStep(-1, false)).toBe(0);
    expect(nextFocusStep(FOCUS_STEPS - 1, false)).toBe(0);
    expect(nextFocusStep(0, true)).toBe(FOCUS_STEPS - 1);
    expect(nextFocusStep(3, true)).toBe(2);
  });
});

describe('section chords', () => {
  it('has a chord per section and wraps out-of-range indexes', () => {
    expect(SECTION_CHORDS.length).toBeGreaterThanOrEqual(9);
    expect(sectionChord(SECTION_CHORDS.length)).toEqual(SECTION_CHORDS[0]);
    expect(sectionChord(-1)).toEqual(SECTION_CHORDS[SECTION_CHORDS.length - 1]);
  });

  it('keeps every chord inside D Lydian', () => {
    const lydian = new Set([0, 2, 4, 6, 7, 9, 11]);
    for (const chord of SECTION_CHORDS) {
      for (const s of chord) expect(lydian.has(((s % 12) + 12) % 12)).toBe(true);
    }
  });
});

describe('scoreSections', () => {
  it('lists only top-level sections of <main>, in order', () => {
    document.body.innerHTML =
      '<section id="out"></section><main><section id="a"><section id="nested"></section></section><div><section id="b"></section></div></main>';
    expect(scoreSections(document).map((s) => s.id)).toEqual(['a', 'b']);
  });
});

describe('installExtras', () => {
  it('plays a focus step for keyboard Tab focus but not for mouse focus', () => {
    let t = 0;
    const play = vi.fn();
    document.body.innerHTML = '<button id="x">x</button><button id="y">y</button>';
    const stop = installExtras({ play, now: () => t, panAt: () => 0 });

    document.getElementById('x')!.dispatchEvent(new FocusEvent('focusin', { bubbles: true }));
    expect(play).not.toHaveBeenCalled();

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab' }));
    t = 100;
    document.getElementById('y')!.dispatchEvent(new FocusEvent('focusin', { bubbles: true }));
    expect(play).toHaveBeenCalledWith('focus', { step: 0, pan: 0 });

    stop();
  });

  it('plays success on copy and stops after uninstall', () => {
    const play = vi.fn();
    const stop = installExtras({ play, now: () => 0, panAt: () => 0 });
    document.dispatchEvent(new Event('copy'));
    expect(play).toHaveBeenCalledWith('success', { intensity: 0.8 });
    stop();
    document.dispatchEvent(new Event('copy'));
    expect(play).toHaveBeenCalledTimes(1);
  });
});
