import { useEffect, useRef, useState } from 'react';

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
      dot.classList.toggle('wide', !!(e.target as Element).closest?.(INTERACTIVE));
      if (!raf) raf = requestAnimationFrame(tick);
    };
    const onLeave = () => dot.classList.remove('on');

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
