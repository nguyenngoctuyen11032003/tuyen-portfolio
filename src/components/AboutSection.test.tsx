import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LangProvider } from '../context/LangContext';
import { AboutSection } from './AboutSection';

describe('AboutSection', () => {
  it('renders the avatar image and education details', () => {
    render(
      <LangProvider>
        <AboutSection />
      </LangProvider>
    );
    expect(screen.getByAltText('Nguyễn Ngọc Tuyền')).toBeInTheDocument();
    expect(screen.getByText('Trường Đại học Công Nghệ Đông Á')).toBeInTheDocument();
    expect(screen.getByText(/09\/2021 – 06\/2025/)).toBeInTheDocument();
  });

  it('renders the italic clause inside the intro paragraph', () => {
    render(
      <LangProvider>
        <AboutSection />
      </LangProvider>
    );
    expect(screen.getByText('một công ty an ninh mạng quốc tế')).toBeInTheDocument();
  });
});
