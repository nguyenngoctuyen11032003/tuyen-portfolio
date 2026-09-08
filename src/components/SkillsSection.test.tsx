import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LangProvider } from '../context/LangContext';
import { SkillsSection } from './SkillsSection';

describe('SkillsSection', () => {
  it('renders all four skill groups', () => {
    render(
      <LangProvider>
        <SkillsSection />
      </LangProvider>
    );
    expect(screen.getByText('Phát triển Full-Stack')).toBeInTheDocument();
    expect(screen.getByText('Quản lý dự án')).toBeInTheDocument();
    expect(screen.getByText('An ninh mạng')).toBeInTheDocument();
    expect(screen.getByText('Tiếng Anh')).toBeInTheDocument();
  });
});
