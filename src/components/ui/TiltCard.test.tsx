import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { computeTilt, TiltCard } from './TiltCard';

describe('computeTilt', () => {
  const rect = { left: 0, top: 0, width: 100, height: 100 };

  it('returns no rotation when the cursor is at the exact center', () => {
    expect(computeTilt(rect, 50, 50)).toEqual({ rotateX: 0, rotateY: 0, glareX: 50, glareY: 50 });
  });

  it('tilts up and right when the cursor is in the top-right corner', () => {
    const result = computeTilt(rect, 100, 0);
    expect(result.rotateX).toBeGreaterThan(0);
    expect(result.rotateY).toBeGreaterThan(0);
  });

  it('tilts down and left when the cursor is in the bottom-left corner', () => {
    const result = computeTilt(rect, 0, 100);
    expect(result.rotateX).toBeLessThan(0);
    expect(result.rotateY).toBeLessThan(0);
  });
});

describe('TiltCard', () => {
  it('renders its children', () => {
    render(
      <TiltCard>
        <p>Card content</p>
      </TiltCard>
    );
    expect(screen.getByText('Card content')).toBeInTheDocument();
  });
});
