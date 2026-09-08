// src/components/ui/WordsPullUp.test.tsx
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { splitWords, WordsPullUp } from './WordsPullUp';

describe('splitWords', () => {
  it('splits on single spaces and drops empty tokens from repeated spaces', () => {
    expect(splitWords('Cùng nhau  xây dựng')).toEqual(['Cùng', 'nhau', 'xây', 'dựng']);
  });

  it('returns an empty array for an empty string', () => {
    expect(splitWords('')).toEqual([]);
  });
});

describe('WordsPullUp', () => {
  it('renders every word of the text', () => {
    render(<WordsPullUp text="Từ dòng code đầu tiên" />);
    expect(screen.getByText('Từ')).toBeInTheDocument();
    expect(screen.getByText('dòng')).toBeInTheDocument();
    expect(screen.getByText('tiên')).toBeInTheDocument();
  });
});
