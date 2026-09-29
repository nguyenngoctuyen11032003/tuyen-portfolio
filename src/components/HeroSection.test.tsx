import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LangProvider } from '../context/LangContext';
import { links } from '../data/content';
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
    expect(screen.getByText(/Kỹ sư CNTT · Lập trình viên Full-Stack tại/)).toBeInTheDocument();
    expect(screen.getByText('Xem dự án')).toBeInTheDocument();
  });

  it('renders CV download and GitHub links', () => {
    render(
      <LangProvider>
        <HeroSection />
      </LangProvider>
    );
    const cv = screen.getByRole('link', { name: /Tải CV/ });
    expect(cv).toHaveAttribute('href', '/cv.pdf');
    expect(cv).toHaveAttribute('download');
    const gh = screen.getByRole('link', { name: /GitHub/ });
    expect(gh).toHaveAttribute('href', links.github);
    expect(gh).toHaveAttribute('target', '_blank');
    expect(gh.getAttribute('rel')).toContain('noopener');
  });
});
