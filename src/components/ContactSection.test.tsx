import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LangProvider } from '../context/LangContext';
import { ContactSection } from './ContactSection';

describe('ContactSection', () => {
  it('renders a mailto link to the personal gmail address, not the ICS email', () => {
    render(
      <LangProvider>
        <ContactSection />
      </LangProvider>
    );
    const mailLinks = screen.getAllByRole('link', { name: /Gửi email cho tôi|tt98tuyen@gmail.com/ });
    expect(mailLinks.length).toBeGreaterThan(0);
    mailLinks.forEach((link) => {
      expect(link.getAttribute('href')).toBe('mailto:tt98tuyen@gmail.com');
    });
  });
});
