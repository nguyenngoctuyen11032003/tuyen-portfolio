import type { MouseEvent, ReactNode } from 'react';

interface SurfaceCardProps {
  children: ReactNode;
  className?: string;
}

export function SurfaceCard({ children, className = '' }: SurfaceCardProps) {
  function handleMouseMove(e: MouseEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty('--spot-x', `${e.clientX - rect.left}px`);
    e.currentTarget.style.setProperty('--spot-y', `${e.clientY - rect.top}px`);
  }

  return (
    <div className={`surface-card ${className}`} onMouseMove={handleMouseMove}>
      {children}
    </div>
  );
}
