import { useEffect, type RefObject } from 'react';

interface HeroMotionRefs {
  section: RefObject<HTMLElement | null>;
  starfield: RefObject<HTMLElement | null>;
  copy: RefObject<HTMLElement | null>;
  figure: RefObject<HTMLElement | null>;
}

const STAR_X = 8; // px of starfield parallax at the section edges
const STAR_Y = 6;

/**
 * One shared rAF loop for the hero: starfield parallax (mouse, desktop) and the scroll-out drift
 * (copy rises and fades, figure lags behind). Nothing with reduced motion; the loop sleeps once
 * settled. The refs object must be stable across renders.
 */
export function useHeroMotion(refs: HeroMotionRefs) {
  useEffect(() => {
    const section = refs.section.current;
    if (!section || typeof window.matchMedia !== 'function') return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const pointerQuery = window.matchMedia('(min-width: 1024px) and (pointer: fine)');
    // Below 1024px .hero-copy is display:contents, so the drift only runs on the desktop layout.
    const scrollQuery = window.matchMedia('(min-width: 1024px)');

    let tx = 0;
    let ty = 0;
    let x = 0;
    let y = 0;
    let scrollTarget = 0;
    let scroll = 0;
    let visible = true;
    let raf = 0;
    let last = 0;

    const apply = () => {
      const stars = refs.starfield.current;
      const copy = refs.copy.current;
      const figure = refs.figure.current;
      if (stars) {
        stars.style.setProperty('--sx', `${(x * STAR_X).toFixed(2)}px`);
        stars.style.setProperty('--sy', `${(y * STAR_Y).toFixed(2)}px`);
      }
      const p = Math.min(1, Math.max(0, scroll / Math.max(1, section.offsetHeight)));
      if (copy) {
        copy.style.transform = scroll ? `translate3d(0, ${(scroll * -0.1).toFixed(2)}px, 0)` : '';
        copy.style.opacity = scroll ? (1 - p * 0.9).toFixed(3) : '';
      }
      if (figure) figure.style.translate = scroll ? `0 ${(scroll * 0.12).toFixed(2)}px` : '';
    };

    const tick = (now: number) => {
      raf = 0;
      const dt = last ? Math.min(64, now - last) : 16.67;
      last = now;
      const k = 1 - Math.pow(0.92, dt / 16.67);
      x += (tx - x) * k;
      y += (ty - y) * k;
      scroll += (scrollTarget - scroll) * Math.min(1, k * 2.5);
      if (Math.abs(tx - x) < 0.0005) x = tx;
      if (Math.abs(ty - y) < 0.0005) y = ty;
      if (Math.abs(scrollTarget - scroll) < 0.05) scroll = scrollTarget;
      apply();
      if (x !== tx || y !== ty || scroll !== scrollTarget) raf = requestAnimationFrame(tick);
      else last = 0;
    };
    const kick = () => {
      if (!raf && visible) raf = requestAnimationFrame(tick);
    };

    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse' || !pointerQuery.matches) return;
      const rect = section.getBoundingClientRect();
      tx = Math.max(-1, Math.min(1, ((e.clientX - rect.left) / rect.width) * 2 - 1));
      ty = Math.max(-1, Math.min(1, ((e.clientY - rect.top) / rect.height) * 2 - 1));
      kick();
    };
    const onLeave = () => {
      tx = 0;
      ty = 0;
      kick();
    };
    const onScroll = () => {
      scrollTarget = scrollQuery.matches ? Math.max(0, window.scrollY) : 0;
      kick();
    };

    const io =
      typeof IntersectionObserver !== 'undefined'
        ? new IntersectionObserver(([entry]) => {
            visible = entry.isIntersecting;
            if (visible) onScroll();
          })
        : null;
    io?.observe(section);

    section.addEventListener('pointermove', onMove);
    section.addEventListener('pointerleave', onLeave);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    return () => {
      cancelAnimationFrame(raf);
      io?.disconnect();
      section.removeEventListener('pointermove', onMove);
      section.removeEventListener('pointerleave', onLeave);
      window.removeEventListener('scroll', onScroll);
    };
  }, [refs]);
}
