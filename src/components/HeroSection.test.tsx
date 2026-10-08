import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LangProvider } from '../context/LangContext';
import { content, links } from '../data/content';
import { HeroSection } from './HeroSection';
import { splitAccent, splitName, splitStat } from './hero/text';
import { formatHanoiTime } from './hero/useHanoiTime';

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

describe('splitName', () => {
  it('splits after the first word and NFC-normalises', () => {
    expect(splitName('Nguyễn Ngọc Tuyền'.normalize('NFD'))).toEqual(['Nguyễn', 'Ngọc Tuyền']);
  });

  it('keeps a single word on the first line', () => {
    expect(splitName('Tuyền')).toEqual(['Tuyền', '']);
  });
});

describe('splitStat', () => {
  it('separates the number from its suffix', () => {
    expect(splitStat('2+')).toEqual([2, '+']);
    expect(splitStat('9')).toEqual([9, '']);
    expect(splitStat('n/a')).toEqual([null, 'n/a']);
  });
});

describe('formatHanoiTime', () => {
  it('formats in the Asia/Ho_Chi_Minh zone (UTC+7, 24h)', () => {
    const t = formatHanoiTime(new Date('2026-10-08T14:05:00Z'), 'vi');
    expect(t).toEqual({ label: '21:05', dateTime: '21:05+07:00' });
  });
});

describe('HeroSection', () => {
  const setup = () =>
    render(
      <LangProvider>
        <HeroSection />
      </LangProvider>
    );

  it('renders the VI subheading and CTA labels by default', () => {
    setup();
    expect(screen.getByText(/Kỹ sư CNTT · Lập trình viên Full-Stack tại/)).toBeInTheDocument();
    expect(screen.getByText('Xem dự án')).toBeInTheDocument();
  });

  it('uses the name as the only h1', () => {
    setup();
    const h1 = screen.getByRole('heading', { level: 1 });
    expect(h1.textContent).toContain('Nguyễn');
    expect(h1.textContent).toContain('Ngọc Tuyền');
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
  });

  it('renders CV download and GitHub links', () => {
    setup();
    const cv = screen.getByRole('link', { name: /Tải CV/ });
    expect(cv).toHaveAttribute('href', '/cv.pdf');
    expect(cv).toHaveAttribute('download');
    const gh = screen.getByRole('link', { name: /GitHub/ });
    expect(gh).toHaveAttribute('href', links.github);
    expect(gh).toHaveAttribute('target', '_blank');
    expect(gh.getAttribute('rel')).toContain('noopener');
  });

  it('describes the fallback portrait', () => {
    setup();
    expect(screen.getByRole('img').getAttribute('alt')).toMatch(/Nguyễn Ngọc Tuyền/);
  });

  it('lists the key figures with their final values', () => {
    setup();
    expect(screen.getByText('dự án tiêu biểu')).toBeInTheDocument();
    expect(screen.getByText('9')).toBeInTheDocument();
  });

  it('links the scroll cue to the next section', () => {
    setup();
    expect(screen.getByRole('link', { name: 'Cuộn xuống' })).toHaveAttribute('href', '#about');
  });

  it('falls back to the illustrated portrait without WebGL', () => {
    const { container } = setup();
    expect(container.querySelector('canvas.hero-avatar')).toBeNull();
    expect(container.querySelector('img.hero-fallback')).not.toBeNull();
  });

  it('spells the name without diacritics in English', () => {
    expect(content.en.hero.name).toBe('Nguyen Ngoc Tuyen');
    expect(content.en.hero.portraitAlt + content.en.hero.figureAlt).toMatch(/^[ -~]+$/);
    expect(content.vi.hero.name).toBe('Nguyễn Ngọc Tuyền');
  });
});
