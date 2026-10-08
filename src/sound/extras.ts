import type { SoundId, SoundOptions } from './types';

/**
 * Page-wide sound cues that need no component wiring:
 *  - a "scroll score": each top-level <main> section gets a chord (voices.SECTION_CHORDS) that plays
 *    when the visitor scrolls it into the middle of the screen, so the page reads as one progression;
 *  - keyboard focus: Tab / Shift+Tab walk up / down the pentatonic scale;
 *  - copying text plays "success".
 * Every cue goes through `play`, which is a no-op while sound is off.
 */

type Play = (id: SoundId, opts?: SoundOptions) => void;

export interface ExtrasEnv {
  play: Play;
  now: () => number;
  panAt: (clientX: number) => number;
}

/** A section chord only answers the visitor's own scrolling, not jumps from links. */
export const USER_SCROLL_WINDOW_MS = 1500;
/** Tab must have been pressed this recently for a focus change to count as keyboard navigation. */
export const TAB_WINDOW_MS = 400;
/** Focus steps run D5 … F#6 and wrap. */
export const FOCUS_STEPS = 8;

const SCROLL_KEYS = new Set(['ArrowDown', 'ArrowUp', 'PageDown', 'PageUp', 'Home', 'End', ' ', 'Spacebar']);

/** Pure: should entering section `index` play its chord now? */
export function shouldScore(index: number, lastIndex: number, lastUserScroll: number, nowMs: number): boolean {
  return index >= 0 && index !== lastIndex && nowMs - lastUserScroll < USER_SCROLL_WINDOW_MS;
}

/** Pure: the next focus step, climbing for Tab and falling for Shift+Tab, wrapping inside the range. */
export function nextFocusStep(step: number, backwards: boolean): number {
  const next = step + (backwards ? -1 : 1);
  return ((next % FOCUS_STEPS) + FOCUS_STEPS) % FOCUS_STEPS;
}

/** Top-level sections of <main>, in page order (nested sections are part of their parent). */
export function scoreSections(doc: Document): HTMLElement[] {
  return Array.from(doc.querySelectorAll<HTMLElement>('main section')).filter(
    (el) => !el.parentElement?.closest('section'),
  );
}

export function installExtras(env: ExtrasEnv): () => void {
  if (typeof window === 'undefined' || typeof document === 'undefined') return () => {};
  const { play, now, panAt } = env;
  const cleanups: (() => void)[] = [];

  /* ---- scroll score ---- */
  let lastUserScroll = -Infinity;
  let lastIndex = -1;
  const markScroll = () => {
    lastUserScroll = now();
  };
  const onKeyScroll = (e: KeyboardEvent) => {
    if (SCROLL_KEYS.has(e.key)) markScroll();
  };
  window.addEventListener('wheel', markScroll, { passive: true });
  window.addEventListener('touchmove', markScroll, { passive: true });
  window.addEventListener('keydown', onKeyScroll, { passive: true });
  cleanups.push(() => {
    window.removeEventListener('wheel', markScroll);
    window.removeEventListener('touchmove', markScroll);
    window.removeEventListener('keydown', onKeyScroll);
  });

  if (typeof IntersectionObserver !== 'undefined') {
    const sections = scoreSections(document);
    // A thin band across the middle of the screen: a section is "current" while it crosses it,
    // whatever its height (pinned scenes are several screens tall).
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const index = sections.indexOf(entry.target as HTMLElement);
          if (shouldScore(index, lastIndex, lastUserScroll, now())) {
            play('section', { step: index, source: 'auto' });
          }
          if (index >= 0) lastIndex = index;
        }
      },
      { rootMargin: '-45% 0px -45% 0px', threshold: 0 },
    );
    sections.forEach((s) => io.observe(s));
    cleanups.push(() => io.disconnect());
  }

  /* ---- keyboard focus ---- */
  let lastTab = -Infinity;
  let backwards = false;
  let step = -1;
  const onTab = (e: KeyboardEvent) => {
    if (e.key !== 'Tab') return;
    lastTab = now();
    backwards = e.shiftKey;
  };
  const onFocusIn = (e: FocusEvent) => {
    if (now() - lastTab > TAB_WINDOW_MS) return;
    const el = e.target instanceof Element ? e.target : null;
    if (!el || el === document.body) return;
    step = nextFocusStep(step, backwards);
    const r = el.getBoundingClientRect();
    play('focus', { step, pan: panAt(r.left + r.width / 2) });
  };
  window.addEventListener('keydown', onTab, true);
  document.addEventListener('focusin', onFocusIn);
  cleanups.push(() => {
    window.removeEventListener('keydown', onTab, true);
    document.removeEventListener('focusin', onFocusIn);
  });

  /* ---- copy ---- */
  const onCopy = () => play('success', { intensity: 0.8 });
  document.addEventListener('copy', onCopy);
  cleanups.push(() => document.removeEventListener('copy', onCopy));

  return () => cleanups.forEach((fn) => fn());
}
