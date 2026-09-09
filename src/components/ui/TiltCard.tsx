import type { MouseEvent, ReactNode } from 'react';
import { useState } from 'react';
import { motion } from 'framer-motion';

interface TiltCardProps {
  children: ReactNode;
  className?: string;
}

const TILT_STRENGTH = 10;

export function computeTilt(
  rect: Pick<DOMRect, 'left' | 'top' | 'width' | 'height'>,
  clientX: number,
  clientY: number
): { rotateX: number; rotateY: number; glareX: number; glareY: number } {
  const px = (clientX - rect.left) / rect.width;
  const py = (clientY - rect.top) / rect.height;
  return {
    rotateX: (0.5 - py) * TILT_STRENGTH,
    rotateY: (px - 0.5) * TILT_STRENGTH,
    glareX: px * 100,
    glareY: py * 100,
  };
}

const RESET_TILT = { rotateX: 0, rotateY: 0, glareX: 50, glareY: 50 };

export function TiltCard({ children, className = '' }: TiltCardProps) {
  const [tilt, setTilt] = useState(RESET_TILT);
  const [hovering, setHovering] = useState(false);

  function handleMouseMove(e: MouseEvent<HTMLDivElement>) {
    setTilt(computeTilt(e.currentTarget.getBoundingClientRect(), e.clientX, e.clientY));
  }

  function handleMouseEnter() {
    setHovering(true);
  }

  function handleMouseLeave() {
    setHovering(false);
    setTilt(RESET_TILT);
  }

  return (
    <motion.div
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`relative ${className}`}
      style={{ transformPerspective: 800 }}
      animate={{ rotateX: tilt.rotateX, rotateY: tilt.rotateY }}
      transition={{ type: 'spring', stiffness: 200, damping: 20 }}
    >
      {children}
      <div
        className="pointer-events-none absolute inset-0 rounded-[inherit] transition-opacity duration-200"
        style={{
          background: `radial-gradient(circle at ${tilt.glareX}% ${tilt.glareY}%, rgba(52,211,153,0.25), transparent 60%)`,
          opacity: hovering ? 1 : 0,
        }}
      />
    </motion.div>
  );
}
