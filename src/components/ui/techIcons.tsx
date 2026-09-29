import { TECH_ICONS } from './techIconData';

function luminance(hex: string): number {
  const n = parseInt(hex.replace('#', ''), 16);
  const lin = (c: number) => {
    const v = c / 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * lin((n >> 16) & 255) + 0.7152 * lin((n >> 8) & 255) + 0.0722 * lin(n & 255);
}

/** Brand color for hover; falls back to ink when the brand is too dark for a black background. */
export function hoverColor(name: string): string {
  const icon = TECH_ICONS[name];
  if (!icon || luminance(icon.hex) < 0.05) return '#F4F1EA';
  return icon.hex;
}

export function TechIcon({
  name,
  size = 20,
  className = '',
}: {
  name: string;
  size?: number;
  className?: string;
}) {
  const icon = TECH_ICONS[name];
  if (!icon) return null;
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="currentColor"
      className={className}
    >
      <path d={icon.path} />
    </svg>
  );
}
