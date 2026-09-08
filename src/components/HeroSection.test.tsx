import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LangProvider } from '../context/LangContext';
import { HeroSection, splitAccent } from './HeroSection';

describe('splitAccent', () => {
  it('splits the headline around the accent phrase', () => {
    expect(splitAccent('Build, then defend safely.', 'defend')).toEqual([
      'Build, then',
      'defend',
      'safely.',
    ]);
  });

  it('falls back to [headline, "", ""] when the accent is not found', () => {
    expect(splitAccent('Build, then defend.', 'missing')).toEqual(['Build, then defend.', '', '']);
  });
});

describe('HeroSection', () => {
  it('renders the VI subheading and CTA labels by default', () => {
    render(
      <LangProvider>
        <HeroSection />
      </LangProvider>
    );
    expect(screen.getByText(/Nhân viên kỹ thuật tại/)).toBeInTheDocument();
    expect(screen.getByText('Xem dự án')).toBeInTheDocument();
  });
});
