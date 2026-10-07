import { useEffect, type RefObject } from 'react';

const ENTER_RANGE = 0.6; // grows to full size over the bottom 60% of the viewport
const EXIT_RANGE = 0.32; // shrinks away over the top 32%
const MIN_WIDTH = '(min-width: 768px)';

/** Scale (0..1) for an element by its viewport position: grows in from below, shrinks out at the top. */
export function scrollScale(top: number, bottom: number, vh: number): number {
  if (bottom <= 0 || top >= vh) return 0;
  const enter = Math.min(1, (vh - top) / (vh * ENTER_RANGE));
  const exit = Math.min(1, bottom / (vh * EXIT_RANGE));
  return Math.max(0, Math.min(enter, exit));
}

const easeOut = (x: number) => 1 - Math.pow(1 - x, 3);

/**
 * Scroll-scrubbed scale for every `[data-scroll-scale]` element inside the container. Each element
 * scales from its `data-origin` corner (default "center bottom"). Desktop only, and off when the
 * user prefers reduced motion; one rAF loop that only runs while the container is on screen.
 */
export function useScrollScale(containerRef: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const container = containerRef.current;
    if (!container || typeof window.matchMedia !== 'function') return;
    const desktop = window.matchMedia(MIN_WIDTH);
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');

    let raf = 0;
    let visible = false;
    let items: HTMLElement[] = [];

    const reset = () => {
      items.forEach((el) => {
        el.style.transform = '';
        el.style.transformOrigin = '';
      });
    };

    const frame = () => {
      raf = 0;
      if (!visible) return;
      const vh = window.innerHeight;
      for (const el of items) {
        // Measure the unscaled parent: a scaled element's own rect collapses toward its origin.
        const rect = (el.parentElement ?? el).getBoundingClientRect();
        const s = easeOut(scrollScale(rect.top, rect.bottom, vh));
        el.style.transform = s >= 0.999 ? '' : `scale(${s.toFixed(4)})`;
      }
      raf = requestAnimationFrame(frame);
    };

    const start = () => {
      if (!desktop.matches || reduced.matches) {
        reset();
        return;
      }
      items = Array.from(container.querySelectorAll<HTMLElement>('[data-scroll-scale]'));
      items.forEach((el) => {
        el.style.transformOrigin = el.dataset.origin ?? 'center bottom';
      });
      if (!raf) raf = requestAnimationFrame(frame);
    };

    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) start();
    });
    observer.observe(container);

    const onChange = () => {
      cancelAnimationFrame(raf);
      raf = 0;
      if (visible) start();
      else reset();
    };
    desktop.addEventListener('change', onChange);
    reduced.addEventListener('change', onChange);

    return () => {
      observer.disconnect();
      desktop.removeEventListener('change', onChange);
      reduced.removeEventListener('change', onChange);
      cancelAnimationFrame(raf);
      reset();
    };
  }, [containerRef]);
}
