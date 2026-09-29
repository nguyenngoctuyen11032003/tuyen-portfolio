import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import { TechIcon, hoverColor } from './techIcons';
import { TECH_ICONS } from './techIconData';

describe('techIcons', () => {
  it('has entries for core brands', () => {
    for (const n of ['TypeScript', 'React', 'NestJS', 'PostgreSQL', 'Docker', 'Git']) {
      expect(TECH_ICONS[n]).toBeDefined();
    }
  });
  it('has no entry for brands without icons', () => {
    expect(TECH_ICONS['Java']).toBeUndefined();
    expect(TECH_ICONS['AWS']).toBeUndefined();
  });
  it('has valid paths and hex colors', () => {
    for (const icon of Object.values(TECH_ICONS)) {
      expect(icon.path.startsWith('M')).toBe(true);
      expect(icon.hex).toMatch(/^#[0-9A-Fa-f]{6}$/);
    }
  });
  it('renders an aria-hidden svg only when an icon exists', () => {
    const a = render(<TechIcon name="React" />);
    const svg = a.container.querySelector('svg');
    expect(svg).not.toBeNull();
    expect(svg).toHaveAttribute('aria-hidden', 'true');
    expect(svg).not.toHaveAttribute('role');
    const b = render(<TechIcon name="SQL" />);
    expect(b.container.querySelector('svg')).toBeNull();
  });
  it('computes hover colors', () => {
    expect(TECH_ICONS['React'].hex.toUpperCase()).toBe('#61DAFB');
    expect(hoverColor('React').toUpperCase()).toBe('#61DAFB');
    expect(hoverColor('GitHub')).toBe('#F4F1EA');
    expect(hoverColor('Unknown')).toBe('#F4F1EA');
  });
});
