import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LangProvider } from '../context/LangContext';
import { links } from '../data/content';
import { ContactSection } from './ContactSection';

describe('ContactSection', () => {
  it('renders a mailto link to the personal gmail address', () => {
    render(
      <LangProvider>
        <ContactSection />
      </LangProvider>
    );
    screen.getAllByRole('link').forEach((a) => {
      expect(a.getAttribute('href')).not.toContain('@ics.vn');
    });
    const mailLinks = screen.getAllByRole('link', { name: /Gửi email cho tôi|nguyenngoctuyen11032003@gmail.com/ });
    expect(mailLinks.length).toBeGreaterThan(0);
    mailLinks.forEach((link) => {
      expect(link.getAttribute('href')).toBe('mailto:nguyenngoctuyen11032003@gmail.com');
    });
  });

  it('links to GitHub and LinkedIn in a new tab', () => {
    render(
      <LangProvider>
        <ContactSection />
      </LangProvider>
    );
    for (const [name, href] of [
      [/GitHub/, links.github],
      [/LinkedIn/, links.linkedin],
    ] as const) {
      const found = screen.getAllByRole('link', { name });
      expect(found.length).toBeGreaterThan(0);
      found.forEach((a) => {
        expect(a).toHaveAttribute('href', href);
        expect(a).toHaveAttribute('target', '_blank');
        expect(a.getAttribute('rel')).toContain('noopener');
      });
    }
  });
});
