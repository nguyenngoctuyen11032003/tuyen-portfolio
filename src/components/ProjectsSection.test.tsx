import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LangProvider } from '../context/LangContext';
import { ProjectsSection } from './ProjectsSection';

describe('ProjectsSection', () => {
  it('renders all 6 project cards', () => {
    render(
      <LangProvider>
        <ProjectsSection />
      </LangProvider>
    );
    expect(screen.getByText('Hệ thống quản trị khách sạn ERP')).toBeInTheDocument();
    expect(screen.getByText('Số hoá di tích cho xã phường')).toBeInTheDocument();
    expect(screen.getAllByText(/2025|2024/).length).toBeGreaterThanOrEqual(6);
  });
});
