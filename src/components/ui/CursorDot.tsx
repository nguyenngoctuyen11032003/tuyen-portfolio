import { useEffect, useRef, useState } from 'react';
import { sfx } from '../../sound';

const INTERACTIVE = 'a, button, [data-shot], [role="button"]';

/**
 * Small difference-blended dot that trails the pointer and widens over links, buttons and archive
 * cards. Only on devices with a fine, hovering pointer, and never with reduced motion.
 */
export function CursorDot() {
  const dotRef = useRef<HTMLDivElement>(null);
  const [enabled] = useState(
    () =>
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(hover: hover) and (pointer: fine)').matches &&
      !window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );

  useEffect(() => {
    const dot = dotRef.current;
    if (!enabled || !dot) return;
    let x = -100;
    let y = -100;
    let tx = -100;
    let ty = -100;
    let raf = 0;
    /** Interactive element under the pointer: `hover` sounds only when it changes. */
    let lastHit: Element | null = null;

    const tick = () => {
      x += (tx - x) * 0.2;
      y += (ty - y) * 0.2;
      dot.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`;
      raf = Math.abs(tx - x) + Math.abs(ty - y) > 0.1 ? requestAnimationFrame(tick) : 0;
    };
    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return;
      tx = e.clientX;
      ty = e.clientY;
      dot.classList.add('on');
      const hit = (e.target as Element).closest?.(INTERACTIVE) ?? null;
      dot.classList.toggle('wide', !!hit);
      if (hit !== lastHit) {
        lastHit = hit;
        if (hit && e.buttons === 0 && !hit.closest('[data-sfx-hover="off"]')) {
          sfx.play('hover', { pan: sfx.panAt(e.clientX) });
        }
      }
      if (!raf) raf = requestAnimationFrame(tick);
    };
    const onLeave = () => {
      lastHit = null;
      dot.classList.remove('on');
    };

    window.addEventListener('pointermove', onMove, { passive: true });
    document.documentElement.addEventListener('pointerleave', onLeave);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('pointermove', onMove);
      document.documentElement.removeEventListener('pointerleave', onLeave);
    };
  }, [enabled]);

  if (!enabled) return null;
  return <div ref={dotRef} className="cursor-dot" aria-hidden="true" />;
}
