import { useEffect, useId, useRef, type ReactNode } from 'react';
import { usePresence } from 'framer-motion';

const DURATION = 900;

interface SandTransitionProps {
  children: ReactNode;
  className?: string;
}

/** Filter parameters for a dissolve amount p (0 = solid, 1 = scattered to sand). */
export function sandParams(p: number, entering: boolean) {
  return {
    displacement: 150 * p,
    dx: (entering ? -30 : 30) * p,
    dy: (entering ? -80 : 120) * p,
    blur: 6 * p,
    alpha: Math.max(0, 1 - p * 1.2),
  };
}

/**
 * Child of AnimatePresence that assembles out of drifting sand on enter and blows away on exit,
 * using an SVG filter chain (turbulence -> displacement -> offset -> blur -> alpha).
 */
export function SandTransition({ children, className = '' }: SandTransitionProps) {
  const [isPresent, safeToRemove] = usePresence();
  const filterId = `sand-${useId().replace(/[^a-zA-Z0-9-]/g, '')}`;
  const dispRef = useRef<SVGFEDisplacementMapElement>(null);
  const offsetRef = useRef<SVGFEOffsetElement>(null);
  const blurRef = useRef<SVGFEGaussianBlurElement>(null);
  const alphaRef = useRef<SVGFEColorMatrixElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const entering = isPresent;
    const box = boxRef.current;
    // The filter only runs during the transition; at rest the badge renders crisp and unfiltered.
    const setFiltered = (on: boolean) => {
      if (box) box.style.filter = on ? `url(#${filterId})` : 'none';
    };
    const apply = (p: number) => {
      const v = sandParams(p, entering);
      dispRef.current?.setAttribute('scale', v.displacement.toFixed(2));
      offsetRef.current?.setAttribute('dx', v.dx.toFixed(2));
      offsetRef.current?.setAttribute('dy', v.dy.toFixed(2));
      blurRef.current?.setAttribute('stdDeviation', v.blur.toFixed(2));
      alphaRef.current?.setAttribute('values', `1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 ${v.alpha.toFixed(3)} 0`);
    };

    const reduced =
      typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced || typeof requestAnimationFrame !== 'function') {
      apply(0);
      setFiltered(false);
      if (!entering) safeToRemove?.();
      return;
    }

    const start = performance.now();
    let raf = 0;
    const tick = () => {
      // Read the clock here: rAF timestamps are not on the same timeline as performance.now() everywhere.
      const t = Math.min(1, Math.max(0, (performance.now() - start) / DURATION));
      // Entering settles fast (quartic ease-out); exiting starts slow and then scatters (cubic).
      const p = entering ? 1 - (1 - Math.pow(1 - t, 4)) : Math.pow(t, 3);
      apply(p);
      if (t < 1) raf = requestAnimationFrame(tick);
      else if (entering) setFiltered(false);
      else safeToRemove?.();
    };
    setFiltered(true);
    apply(entering ? 1 : 0);
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [isPresent, safeToRemove, filterId]);

  return (
    <div ref={boxRef} className={className} style={{ filter: `url(#${filterId})` }}>
      <svg width="0" height="0" aria-hidden="true" focusable="false" style={{ position: 'absolute' }}>
        <filter id={filterId} x="-60%" y="-60%" width="220%" height="220%" colorInterpolationFilters="sRGB">
          <feTurbulence type="fractalNoise" baseFrequency="1.8" numOctaves="4" result="noise" />
          <feDisplacementMap ref={dispRef} in="SourceGraphic" in2="noise" scale="150" xChannelSelector="R" yChannelSelector="G" result="sand" />
          <feOffset ref={offsetRef} in="sand" dx="0" dy="0" result="moved" />
          <feGaussianBlur ref={blurRef} in="moved" stdDeviation="6" result="soft" />
          <feColorMatrix ref={alphaRef} in="soft" type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 0 0" />
        </filter>
      </svg>
      {children}
    </div>
  );
}
