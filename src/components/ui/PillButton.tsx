import type { MouseEvent, ReactNode } from 'react';
import { useState } from 'react';
import { motion } from 'framer-motion';

interface PillButtonProps {
  children: ReactNode;
  href?: string;
  onClick?: () => void;
  variant?: 'solid' | 'glass';
  className?: string;
}

const MAGNETIC_STRENGTH = 0.25;

export function computeMagneticOffset(
  rect: Pick<DOMRect, 'left' | 'top' | 'width' | 'height'>,
  clientX: number,
  clientY: number
): { x: number; y: number } {
  const relX = clientX - (rect.left + rect.width / 2);
  const relY = clientY - (rect.top + rect.height / 2);
  return { x: relX * MAGNETIC_STRENGTH, y: relY * MAGNETIC_STRENGTH };
}

export function PillButton({
  children,
  href,
  onClick,
  variant = 'glass',
  className = '',
}: PillButtonProps) {
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const base =
    'rounded-full px-6 py-3 text-sm font-medium transition-all duration-200 hover:scale-[1.03] active:scale-[0.97]';
  const variantClass = variant === 'solid' ? 'bg-primary text-black' : 'liquid-glass text-white';
  const classes = `${base} ${variantClass} ${className}`;

  function handleMouseMove(e: MouseEvent<HTMLElement>) {
    setOffset(computeMagneticOffset(e.currentTarget.getBoundingClientRect(), e.clientX, e.clientY));
  }

  function handleMouseLeave() {
    setOffset({ x: 0, y: 0 });
  }

  const motionProps = {
    onMouseMove: handleMouseMove,
    onMouseLeave: handleMouseLeave,
    animate: { x: offset.x, y: offset.y },
    transition: { type: 'spring' as const, stiffness: 150, damping: 12, mass: 0.2 },
  };

  if (href) {
    return (
      <motion.a href={href} onClick={onClick} className={classes} {...motionProps}>
        {children}
      </motion.a>
    );
  }

  return (
    <motion.button type="button" onClick={onClick} className={classes} {...motionProps}>
      {children}
    </motion.button>
  );
}
