import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LangProvider } from '../context/LangContext';
import { ExperienceSection } from './ExperienceSection';

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
});
