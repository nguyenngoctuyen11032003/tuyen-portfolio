import { describe, expect, it } from 'vitest';
import { content, links } from './content';

const CORE = [
  'TypeScript',
  'JavaScript',
  'NestJS',
  'Node.js',
  'Next.js',
  'React',
  'Flutter',
  'PostgreSQL',
  'Redis',
  'Docker',
  'Git',
  'GitHub',
];

const ALLOWED = new Set([
  ...CORE,
  'Dart',
  'Java',
  'Python',
  'SQL',
  'HTML5',
  'CSS3',
  'Android',
  'MySQL',
  'Linux',
  'Nginx',
  'CI/CD',
  'AWS',
  'Oracle Cloud (OCI)',
  'Firebase',
  'REST API',
  'JWT',
  'Authentication',
  'Authorization',
  'JSP',
  'Rust',
  'Tauri',
  'PDFium',
  'QPDF',
  'Tailwind CSS',
  'PHP',
  'Bootstrap',
  'jQuery',
  'Leaflet',
  'OpenStreetMap',
]);

describe('content', () => {
  it('has matching structural shape for vi and en', () => {
    expect(content.vi.experience.items.length).toBe(content.en.experience.items.length);
    expect(content.vi.skills.categories.length).toBe(content.en.skills.categories.length);
    expect(content.vi.projects.items.length).toBe(content.en.projects.items.length);
    expect(content.vi.nav.links.length).toBe(content.en.nav.links.length);
  });

  it('has exactly 9 featured projects', () => {
    expect(content.vi.projects.items).toHaveLength(9);
  });

  it('has exactly 3 experience entries matching the CV', () => {
    expect(content.vi.experience.items).toHaveLength(3);
  });

  it('has the hero accent word contained inside the hero headline for both languages', () => {
    expect(content.vi.hero.headline).toContain(content.vi.hero.accent);
    expect(content.en.hero.headline).toContain(content.en.hero.accent);
  });

  it('publishes the personal gmail address in both languages', () => {
    expect(content.vi.contact.email).toBe('nguyenngoctuyen11032003@gmail.com');
    expect(content.en.contact.email).toBe('nguyenngoctuyen11032003@gmail.com');
  });

  it('has localized a11y labels for both languages', () => {
    expect(content.vi.a11y).toEqual({
      toggleMenu: 'Mở/đóng menu',
      toggleLanguage: 'Chuyển ngôn ngữ',
      email: 'Email',
      scrollDown: 'Cuộn xuống',
      backToTop: 'Lên đầu trang',
      openInNewTab: 'mở trong tab mới',
    });
    expect(content.en.a11y).toEqual({
      toggleMenu: 'Toggle menu',
      toggleLanguage: 'Toggle language',
      email: 'Email',
      scrollDown: 'Scroll down',
      backToTop: 'Back to top',
      openInNewTab: 'opens in a new tab',
    });
  });

  it('starts the ICS experience period at 07/2025 in both languages', () => {
    expect(content.vi.experience.items[0].period.startsWith('07/2025')).toBe(true);
    expect(content.en.experience.items[0].period.startsWith('07/2025')).toBe(true);
  });

  it('gives every project the Full-Stack Developer role', () => {
    for (const lang of ['vi', 'en'] as const) {
      for (const p of content[lang].projects.items) {
        expect(p.role).toBe('Full-Stack Developer');
      }
    }
  });

  it('contains no forbidden or invented claims', () => {
    const json = JSON.stringify(content);
    const forbidden = [
      /Project Manager/i,
      /Quản lý dự án/i,
      /Project Management/i,
      /tt98tuyen/,
      /\d+\s?%/,
      /keeps systems safe/i,
      /giữ hệ thống an toàn/i,
      /Working proficiency/i,
      /\b3\+/,
      /@ics\.vn/i,
    ];
    for (const re of forbidden) {
      expect(json).not.toMatch(re);
    }
  });

  it('has the exact core stack', () => {
    expect(content.en.skills.core).toEqual(CORE);
    expect(content.vi.skills.core).toEqual(CORE);
  });

  it('only uses allowed stack items in skills and project tags', () => {
    for (const lang of ['vi', 'en'] as const) {
      const c = content[lang];
      const all = [
        ...c.skills.core,
        ...c.skills.categories.flatMap((cat) => cat.items),
        ...c.projects.items.flatMap((p) => p.tags ?? []),
      ];
      for (const item of all) {
        expect(ALLOWED.has(item), `unexpected item: ${item}`).toBe(true);
      }
    }
  });

  it('keeps skills category items identical between vi and en', () => {
    expect(content.vi.skills.categories.map((c) => c.items)).toEqual(
      content.en.skills.categories.map((c) => c.items),
    );
  });

  it('lists the OCI certification', () => {
    for (const lang of ['vi', 'en'] as const) {
      expect(content[lang].certifications.items.map((i) => i.name)).toContain(
        'Oracle Cloud Infrastructure (OCI)',
      );
    }
  });

  it('exposes the exact external links', () => {
    expect(links).toEqual({
      github: 'https://github.com/nguyenngoctuyen11032003',
      linkedin:
        'https://www.linkedin.com/in/tuy%E1%BB%81n-nguy%E1%BB%85n-ng%E1%BB%8Dc-40432243b/',
      caseStudies: 'https://github.com/nguyenngoctuyen11032003/project-case-studies',
      cv: '/cv.pdf',
    });
  });
});
