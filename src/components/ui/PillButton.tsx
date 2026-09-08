import type { ReactNode } from 'react';

interface PillButtonProps {
  children: ReactNode;
  href?: string;
  onClick?: () => void;
  variant?: 'solid' | 'glass';
  className?: string;
}

export function PillButton({
  children,
  href,
  onClick,
  variant = 'glass',
  className = '',
}: PillButtonProps) {
  const base =
    'rounded-full px-6 py-3 text-sm font-medium transition-all duration-200 hover:scale-[1.03] active:scale-[0.97]';
  const variantClass = variant === 'solid' ? 'bg-[#DEDBC8] text-black' : 'liquid-glass text-white';
  const classes = `${base} ${variantClass} ${className}`;

  if (href) {
    return (
      <a href={href} onClick={onClick} className={classes}>
        {children}
      </a>
    );
  }

  return (
    <button type="button" onClick={onClick} className={classes}>
      {children}
    </button>
  );
}
