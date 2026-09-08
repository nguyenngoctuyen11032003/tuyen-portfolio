import { describe, expect, it } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { LangProvider } from '../context/LangContext';
import { Navbar } from './Navbar';

describe('Navbar', () => {
  it('renders all VI nav links and the contact CTA by default', () => {
    render(
      <LangProvider>
        <Navbar />
      </LangProvider>
    );
    expect(screen.getAllByText('Về tôi').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Dự án').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Liên hệ').length).toBeGreaterThan(0);
  });

  it('opens the mobile menu on hamburger click', () => {
    render(
      <LangProvider>
        <Navbar />
      </LangProvider>
    );
    fireEvent.click(screen.getByLabelText('Toggle menu'));
    expect(screen.getAllByText('Kinh nghiệm').length).toBeGreaterThan(0);
  });
});
