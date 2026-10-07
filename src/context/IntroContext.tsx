import { createContext, useContext } from 'react';

export const INTRO_STORAGE_KEY = 'intro_shown';

/**
 * Whether the cinematic intro should play: once per browser tab session, never with reduced
 * motion, and not when the visitor arrives on a deep link such as #projects.
 */
export function shouldPlayIntro(): boolean {
  if (typeof window === 'undefined') return false;
  if (typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return false;
  }
  if (window.location.hash && window.location.hash !== '#hero') return false;
  try {
    return window.sessionStorage.getItem(INTRO_STORAGE_KEY) !== 'true';
  } catch {
    return true;
  }
}

export function rememberIntroShown() {
  try {
    window.sessionStorage.setItem(INTRO_STORAGE_KEY, 'true');
  } catch {
    // Storage blocked (private mode, sandbox): the intro may simply replay next load.
  }
}

/** True once the intro has finished (or never played); the hero holds its entrance until then. */
export const IntroDoneContext = createContext(true);

export function useIntroDone(): boolean {
  return useContext(IntroDoneContext);
}
