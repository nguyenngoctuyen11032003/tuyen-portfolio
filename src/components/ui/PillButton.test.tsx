import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PillButton } from './PillButton';

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
    expect(screen.getByText('Liên hệ').className).toContain('bg-[#DEDBC8]');
  });
});
