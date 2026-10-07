import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LangProvider } from '../context/LangContext';
import { content } from '../data/content';
import { ExperienceSection, careerSpan, formatDuration, isOngoing, monthsInPeriod } from './ExperienceSection';

const VI_UNITS = content.vi.experience.units;
const EN_UNITS = content.en.experience.units;

describe('experience durations', () => {
  it('counts months inclusively', () => {
    expect(monthsInPeriod('03/2023 – 06/2024')).toBe(16);
    expect(monthsInPeriod('09/2024 – 02/2025')).toBe(6);
  });

  it('runs an open-ended period to now', () => {
    expect(isOngoing('07/2025 – nay')).toBe(true);
    expect(isOngoing('09/2024 – 02/2025')).toBe(false);
    expect(monthsInPeriod('07/2025 – nay', new Date(2026, 9, 1))).toBe(16);
  });

  it('formats years and months per language', () => {
    expect(formatDuration(16, VI_UNITS)).toBe('1 năm 4 tháng');
    expect(formatDuration(6, EN_UNITS)).toBe('6 mos');
    expect(formatDuration(25, EN_UNITS)).toBe('2 yrs 1 mo');
    expect(formatDuration(12, EN_UNITS)).toBe('1 yr');
  });

  it('spans from the first start year to now when a role is ongoing', () => {
    expect(careerSpan(content.vi.experience.items, new Date(2026, 9, 1))).toEqual([2023, 2026]);
  });
});

describe('ExperienceSection', () => {
  it('renders all three experience entries in order', () => {
    render(
      <LangProvider>
        <ExperienceSection />
      </LangProvider>
    );
    const orgs = screen.getAllByText(/Khang Minh|Học Mãi|An ninh mạng Quốc tế ICS/);
    expect(orgs).toHaveLength(3);
    expect(screen.getByText(/Khang Minh/)).toBeInTheDocument();
  });

  it('renders ICS period and achievements', () => {
    render(
      <LangProvider>
        <ExperienceSection />
      </LangProvider>
    );
    expect(screen.getByText('07/2025 – nay')).toBeInTheDocument();
    const item = content.vi.experience.items[0];
    expect(item.achievements?.length).toBeGreaterThan(0);
    expect(screen.getByText(item.achievements![0])).toBeInTheDocument();
  });
});
