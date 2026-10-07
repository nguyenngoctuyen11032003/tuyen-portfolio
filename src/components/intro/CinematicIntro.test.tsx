import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { LangProvider } from '../../context/LangContext';
import { INTRO_STORAGE_KEY, shouldPlayIntro } from '../../context/IntroContext';
import { CinematicIntro, INTRO_TIMING, bootLines, okLine } from './CinematicIntro';
import { content } from '../../data/content';

function setup() {
  const onComplete = vi.fn();
  render(
    <LangProvider>
      <CinematicIntro onComplete={onComplete} />
    </LangProvider>
  );
  return onComplete;
}

describe('CinematicIntro', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    sessionStorage.clear();
  });
  afterEach(() => {
    vi.useRealTimers();
    document.documentElement.style.overflow = '';
  });

  it('types the boot sequence, then grants access, then completes on its own', () => {
    const onComplete = setup();
    expect(screen.getByText('NNT.PORTFOLIO — BASH — 80×24')).toBeInTheDocument();
    expect(document.documentElement.style.overflow).toBe('hidden');

    act(() => vi.advanceTimersByTime(2300));
    expect(screen.getByText(/SECURITY PROTOCOLS ACTIVE/)).toBeInTheDocument();
    expect(screen.queryByText('ACCESS GRANTED')).not.toBeInTheDocument();

    act(() => vi.advanceTimersByTime(INTRO_TIMING.access - 2300));
    expect(screen.getByText('ACCESS GRANTED')).toBeInTheDocument();
    expect(onComplete).not.toHaveBeenCalled();

    act(() => vi.advanceTimersByTime(INTRO_TIMING.complete - INTRO_TIMING.access));
    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(sessionStorage.getItem(INTRO_STORAGE_KEY)).toBe('true');
    expect(document.documentElement.style.overflow).toBe('');
  });

  it('skips immediately from the button or Escape, only once', () => {
    const onComplete = setup();
    fireEvent.click(screen.getByRole('button', { name: 'SKIP →' }));
    fireEvent.keyDown(window, { key: 'Escape' });
    act(() => vi.advanceTimersByTime(INTRO_TIMING.complete));
    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(sessionStorage.getItem(INTRO_STORAGE_KEY)).toBe('true');
  });

  it('counts the real projects and screenshots in the boot log', () => {
    const projects = content.vi.projects.items;
    const shots = projects.reduce((n, p) => n + (p.images?.length ?? 0), 0);
    const lines = bootLines(projects.length, shots);
    expect(lines.some((l) => l.text === `Archive: ${projects.length} projects · ${shots} screenshots indexed`)).toBe(true);
    expect(lines.map((l) => l.at)).toEqual([...lines.map((l) => l.at)].sort((a, b) => a - b));
    expect(lines.at(-1)!.at).toBeLessThan(INTRO_TIMING.access);
  });

  it('pads OK lines to a shared column', () => {
    expect(okLine('LOADING KERNEL V3.2.1').length).toBe(okLine('MOUNTING FILE SYSTEMS').length);
  });
});

describe('shouldPlayIntro', () => {
  beforeEach(() => sessionStorage.clear());

  it('plays once per tab session', () => {
    expect(shouldPlayIntro()).toBe(true);
    sessionStorage.setItem(INTRO_STORAGE_KEY, 'true');
    expect(shouldPlayIntro()).toBe(false);
  });

  it('does not play on a deep link', () => {
    window.history.replaceState(null, '', '#projects');
    expect(shouldPlayIntro()).toBe(false);
    window.history.replaceState(null, '', window.location.pathname);
  });
});
