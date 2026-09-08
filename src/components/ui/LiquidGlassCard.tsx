import type { ReactNode } from 'react';

interface LiquidGlassCardProps {
  children: ReactNode;
  className?: string;
  strong?: boolean;
}

export function LiquidGlassCard({ children, className = '', strong = false }: LiquidGlassCardProps) {
  const base = strong ? 'liquid-glass-strong' : 'liquid-glass';
  return <div className={`${base} rounded-3xl ${className}`}>{children}</div>;
}
