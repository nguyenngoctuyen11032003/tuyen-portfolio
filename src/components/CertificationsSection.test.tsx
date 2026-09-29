import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LangProvider } from '../context/LangContext';
import { CertificationsSection } from './CertificationsSection';

describe('CertificationsSection', () => {
  it('renders heading and certifications', () => {
    render(
      <LangProvider>
        <CertificationsSection />
      </LangProvider>
    );
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Chứng chỉ');
    expect(screen.getByText('Oracle Cloud Infrastructure (OCI)')).toBeInTheDocument();
    expect(screen.getByText('Oracle')).toBeInTheDocument();
    expect(screen.getByText('Tin học văn phòng')).toBeInTheDocument();
  });
});
