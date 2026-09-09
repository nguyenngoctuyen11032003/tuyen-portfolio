import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { computeMagneticOffset, PillButton } from './PillButton';

describe('PillButton', () => {
  it('renders as an anchor when href is provided', () => {
    render(<PillButton href="#contact">Liên hệ</PillButton>);
    const el = screen.getByText('Liên hệ');
    expect(el.tagName).toBe('A');
    expect(el).toHaveAttribute('href', '#contact');
  });

  it('renders as a button and fires onClick when no href is provided', () => {
    const onClick = vi.fn();
    render(<PillButton onClick={onClick}>Toggle</PillButton>);
    const el = screen.getByText('Toggle');
    expect(el.tagName).toBe('BUTTON');
    fireEvent.click(el);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('applies the solid variant background class', () => {
    render(
      <PillButton href="#contact" variant="solid">
        Liên hệ
      </PillButton>
    );
    expect(screen.getByText('Liên hệ').className).toContain('bg-primary');
  });
});

describe('computeMagneticOffset', () => {
  const rect = { left: 100, top: 100, width: 40, height: 20 };

  it('returns zero offset when the cursor is exactly at the button center', () => {
    expect(computeMagneticOffset(rect, 120, 110)).toEqual({ x: 0, y: 0 });
  });

  it('scales the offset toward the cursor by the magnetic strength', () => {
    // center is (120, 110); cursor is 10px right and 10px below center
    expect(computeMagneticOffset(rect, 130, 120)).toEqual({ x: 2.5, y: 2.5 });
  });

  it('produces a negative offset when the cursor is left/above center', () => {
    expect(computeMagneticOffset(rect, 110, 100)).toEqual({ x: -2.5, y: -2.5 });
  });
});
