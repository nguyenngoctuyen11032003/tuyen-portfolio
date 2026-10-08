import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { sfx } from '../sound';
import { LangProvider } from '../context/LangContext';
import { links } from '../data/content';
import { ContactSection, outroStages } from './ContactSection';

describe('ContactSection', () => {
  it('renders a mailto link to the personal gmail address', () => {
    render(
      <LangProvider>
        <ContactSection />
      </LangProvider>
    );
    screen.getAllByRole('link').forEach((a) => {
      expect(a.getAttribute('href')).not.toContain('@ics.vn');
    });
    const mailLinks = screen.getAllByRole('link', { name: /Gửi email cho tôi|nguyenngoctuyen11032003@gmail.com/ });
    expect(mailLinks.length).toBeGreaterThan(0);
    mailLinks.forEach((link) => {
      expect(link.getAttribute('href')).toBe('mailto:nguyenngoctuyen11032003@gmail.com');
    });
  });

  it('links to GitHub and LinkedIn in a new tab', () => {
    render(
      <LangProvider>
        <ContactSection />
      </LangProvider>
    );
    for (const [name, href] of [
      [/GitHub/, links.github],
      [/LinkedIn/, links.linkedin],
    ] as const) {
      const found = screen.getAllByRole('link', { name });
      expect(found.length).toBeGreaterThan(0);
      found.forEach((a) => {
        expect(a).toHaveAttribute('href', href);
        expect(a).toHaveAttribute('target', '_blank');
        expect(a.getAttribute('rel')).toContain('noopener');
      });
    }
  });
});

describe('outro sounds', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  /** Mounts the outro with a controllable scroll position (0..1) and a manual frame queue. */
  function mountOutro(start: number) {
    let p = start;
    let io: IntersectionObserverCallback = () => {};
    let frames: FrameRequestCallback[] = [];
    vi.stubGlobal('matchMedia', (q: string) => ({ matches: false, media: q }) as MediaQueryList);
    vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => frames.push(cb));
    vi.stubGlobal(
      'IntersectionObserver',
      class {
        constructor(cb: IntersectionObserverCallback) {
          io = cb;
        }
        observe() {}
        disconnect() {}
      }
    );
    const play = vi.spyOn(sfx, 'play');
    const { container } = render(
      <LangProvider>
        <ContactSection />
      </LangProvider>
    );
    const section = container.querySelector('section')!;
    const travel = 1000;
    section.getBoundingClientRect = () =>
      ({ top: -p * travel, height: window.innerHeight + travel }) as DOMRect;
    const flush = () => {
      const run = frames;
      frames = [];
      run.forEach((cb) => cb(0));
    };
    const visible = (on: boolean) => {
      io([{ isIntersecting: on } as IntersectionObserverEntry], {} as IntersectionObserver);
      flush();
    };
    const scrollTo = (next: number) => {
      p = next;
      window.dispatchEvent(new Event('scroll'));
      flush();
    };
    return { play, visible, scrollTo, ids: () => play.mock.calls.map((c) => c[0]) };
  }

  it('plays each stage once on the way down and stays silent on the way back up', () => {
    const o = mountOutro(0);
    o.visible(true);
    expect(o.ids()).toEqual([]);
    o.scrollTo(0.3);
    expect(o.ids()).toEqual(['swell']);
    o.scrollTo(1);
    expect(o.ids()).toEqual(['swell', 'reveal', 'whoosh', 'drop', 'chime', 'tick']);
    o.play.mockClear();
    o.scrollTo(0);
    o.scrollTo(1);
    expect(o.ids()).toEqual(['swell', 'reveal', 'whoosh', 'drop', 'chime', 'tick']);
    o.play.mockClear();
    o.scrollTo(0.98);
    expect(o.ids()).toEqual([]);
  });

  it('adopts the current state silently on a deep link or re-entry', () => {
    const o = mountOutro(1);
    o.visible(true);
    expect(o.ids()).toEqual([]);
    o.visible(false);
    o.scrollTo(0);
    o.visible(true);
    o.scrollTo(0.01);
    expect(o.ids()).toEqual([]);
  });
});

describe('outroStages', () => {
  it('starts dark with the pill hidden and ends white with everything shown', () => {
    expect(outroStages(0)).toEqual({ overlay: 0, pill: 0, footer: 0 });
    expect(outroStages(1)).toEqual({ overlay: 1, pill: 1, footer: 1 });
  });

  it('washes to white before the pill finishes growing', () => {
    const mid = outroStages(0.55);
    expect(mid.overlay).toBe(1);
    expect(mid.pill).toBeGreaterThan(0);
    expect(mid.pill).toBeLessThan(1);
    expect(mid.footer).toBe(0);
  });
});
