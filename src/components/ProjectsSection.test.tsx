import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { LangProvider } from '../context/LangContext';
import { ProjectsSection, bentoOrigins, bentoSpans, yearSpan } from './ProjectsSection';
import { content } from '../data/content';
import { sfx } from '../sound';

function setup() {
  return render(
    <LangProvider>
      <ProjectsSection />
    </LangProvider>
  );
}

describe('ProjectsSection', () => {
  it('renders all 9 project cards', () => {
    setup();
    for (const p of content.vi.projects.items) {
      expect(screen.getByRole('heading', { name: p.title })).toBeInTheDocument();
    }
    expect(screen.getAllByText(/2026|2025|2024/).length).toBeGreaterThanOrEqual(9);
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
    expect(buttons).toHaveLength(9);
  });

  it('shows case study link in modal when available', () => {
    setup();
    fireEvent.click(screen.getByRole('button', { name: /Xem chi tiết Hệ thống HRM/ }));
    const link = screen.getByRole('link', { name: /Xem case study/ });
    expect(link.getAttribute('href')).toMatch(/hrm-system\.md$/);
    expect(link).toHaveAttribute('target', '_blank');
    expect(link.getAttribute('rel')).toContain('noopener');
  });

  it('opens the screenshot gallery from a project cover', async () => {
    setup();
    fireEvent.click(screen.getByRole('button', { name: /^Xem chi tiết Hệ thống CRM/ }));
    expect(screen.getByRole('img', { name: 'Trang chủ CRM với các chỉ số kinh doanh' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Ảnh tiếp theo' }));
    expect(
      await screen.findByRole('img', { name: 'Biểu đồ marketing: người tiếp cận theo nguồn và chi phí theo tháng' })
    ).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /^Xem ảnh \d/ })).toHaveLength(8);
  });

  it('shows the live website link when available', () => {
    setup();
    fireEvent.click(screen.getByRole('button', { name: /Xem chi tiết Nền tảng tuyển dụng/ }));
    const link = screen.getByRole('link', { name: /Xem website/ });
    expect(link).toHaveAttribute('href', 'https://vietdai-recruitment-web.vercel.app/');
  });

  it('shows the source code link when available', () => {
    setup();
    fireEvent.click(screen.getByRole('button', { name: /Xem chi tiết Gym Training Plan/ }));
    const link = screen.getByRole('link', { name: /Mã nguồn/ });
    expect(link).toHaveAttribute('href', 'https://github.com/nguyenngoctuyen11032003/gym-for-beginners');
    expect(link).toHaveAttribute('target', '_blank');
  });

  it('shows no case study link when absent', () => {
    setup();
    fireEvent.click(screen.getByRole('button', { name: /Xem chi tiết Bản đồ số cơ giới hoá/ }));
    expect(screen.queryByRole('link', { name: /Xem case study/ })).not.toBeInTheDocument();
  });

  it('links the gym and e-learning projects to their live websites', () => {
    setup();
    fireEvent.click(screen.getByRole('button', { name: /Xem chi tiết Gym Training Plan/ }));
    expect(screen.getByRole('link', { name: /Xem website/ })).toHaveAttribute(
      'href',
      'https://gym-for-beginners-ten.vercel.app/'
    );
    fireEvent.click(screen.getByRole('button', { name: 'Đóng' }));
    fireEvent.click(screen.getByRole('button', { name: /Xem chi tiết Nền tảng đào tạo/ }));
    expect(screen.getByRole('link', { name: /Xem website/ })).toHaveAttribute(
      'href',
      'https://elearning-platform-neon.vercel.app/'
    );
  });
});

describe('featured stage', () => {
  it('leads with the first project and switches its screenshots', () => {
    setup();
    const lead = content.vi.projects.items[0];
    const switches = screen.getAllByRole('button', { name: (name) => name.startsWith(`${lead.title}: `) });
    expect(switches).toHaveLength(lead.images!.length);
    expect(switches[0]).toHaveAttribute('aria-pressed', 'true');
    fireEvent.click(switches[1]);
    expect(switches[1]).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByText(lead.images![1].alt)).toBeInTheDocument();
  });

  it('opens the lead project on the screenshot being shown', () => {
    setup();
    const lead = content.vi.projects.items[0];
    fireEvent.click(screen.getByRole('button', { name: (name) => name.startsWith(`${lead.title}: 2/`) }));
    fireEvent.click(screen.getByRole('button', { name: `Xem chi tiết ${lead.title}` }));
    expect(screen.getByRole('img', { name: lead.images![1].alt })).toBeInTheDocument();
  });

  it('ticks and slides when a screenshot switch is picked', () => {
    const play = vi.spyOn(sfx, 'play');
    setup();
    const lead = content.vi.projects.items[0];
    const switches = screen.getAllByRole('button', { name: (name) => name.startsWith(`${lead.title}: `) });
    fireEvent.click(switches[0]);
    expect(play).not.toHaveBeenCalled();
    fireEvent.click(switches[1]);
    expect(play).toHaveBeenCalledWith('tick', { step: 3, intensity: 0.7 });
    expect(play).toHaveBeenCalledWith('slide', { intensity: 0.5, pan: 0.3 });
    expect(switches[1]).toHaveAttribute('data-sfx', 'off');
    play.mockRestore();
  });
});

describe('bento layout', () => {
  it('alternates 7/5 and 5/7 rows', () => {
    expect(bentoSpans(8)).toEqual([7, 5, 5, 7, 7, 5, 5, 7]);
  });

  it('grows each card from the gutter between the pair', () => {
    expect(bentoOrigins(4)).toEqual(['right bottom', 'left bottom', 'right bottom', 'left bottom']);
  });
});

describe('yearSpan', () => {
  it('spans the earliest to the latest project year', () => {
    expect(
      yearSpan([
        { title: 'a', years: '2024–2025', role: '', scope: '' },
        { title: 'b', years: '2026', role: '', scope: '' },
      ]),
    ).toBe('2024 — 2026');
    expect(yearSpan([{ title: 'a', years: '2026', role: '', scope: '' }])).toBe('2026');
  });
});
