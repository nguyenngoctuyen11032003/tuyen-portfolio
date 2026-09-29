import { describe, expect, it } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { LangProvider } from '../context/LangContext';
import { ProjectsSection } from './ProjectsSection';
import { content } from '../data/content';

function setup() {
  return render(
    <LangProvider>
      <ProjectsSection />
    </LangProvider>
  );
}

describe('ProjectsSection', () => {
  it('renders all 6 project cards', () => {
    setup();
    expect(screen.getByText('Hệ thống quản trị khách sạn ERP')).toBeInTheDocument();
    expect(screen.getByText('Số hoá di tích cho xã phường')).toBeInTheDocument();
    expect(screen.getAllByText(/2025|2024/).length).toBeGreaterThanOrEqual(6);
  });

  it('renders every project description', () => {
    setup();
    for (const p of content.vi.projects.items) {
      expect(screen.getByText(p.description!)).toBeInTheDocument();
    }
  });

  it('renders tags, the also line, and no legacy text', () => {
    setup();
    expect(screen.getByText('JSP')).toBeInTheDocument();
    expect(
      screen.getByText('Ngoài ra: website doanh nghiệp & sản phẩm, công cụ nghiệp vụ nội bộ.')
    ).toBeInTheDocument();
    expect(screen.queryByText('Quản lý dự án')).not.toBeInTheDocument();
  });

  it('localizes detail button labels', () => {
    setup();
    const buttons = screen.getAllByRole('button', { name: /^Xem chi tiết/ });
    expect(buttons).toHaveLength(6);
  });

  it('shows case study link in modal when available', () => {
    setup();
    fireEvent.click(screen.getByRole('button', { name: /Xem chi tiết Hệ thống HRM/ }));
    const link = screen.getByRole('link', { name: /Xem case study/ });
    expect(link.getAttribute('href')).toMatch(/hrm-system\.md$/);
    expect(link).toHaveAttribute('target', '_blank');
    expect(link.getAttribute('rel')).toContain('noopener');
  });

  it('shows no case study link when absent', () => {
    setup();
    fireEvent.click(screen.getByRole('button', { name: /Xem chi tiết Hệ thống quản lý Lớp học/ }));
    expect(screen.queryByRole('link', { name: /Xem case study/ })).not.toBeInTheDocument();
  });
});
