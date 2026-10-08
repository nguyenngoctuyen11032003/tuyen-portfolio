import { afterEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { LangProvider } from '../context/LangContext';
import { CertificationsSection } from './CertificationsSection';
import { sandParams } from './ui/SandTransition';
import { sfx } from '../sound';

function setup() {
  render(
    <LangProvider>
      <CertificationsSection />
    </LangProvider>
  );
}

describe('CertificationsSection', () => {
  it('lists every certificate with the first one expanded', () => {
    setup();
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Chứng chỉ');
    expect(screen.getByRole('button', { name: 'OCI 2025 · Architect Associate' })).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('button', { name: 'OCI 2025 · Foundations Associate' })).toHaveAttribute('aria-expanded', 'false');
    expect(screen.getByRole('button', { name: 'Tin học văn phòng' })).toBeInTheDocument();
    expect(screen.getByText('30/10/2025')).toBeInTheDocument();
    expect(screen.getByText('30/10/2027')).toBeInTheDocument();
  });

  it('links the expanded certificate to its Oracle verification page', () => {
    setup();
    const link = screen.getByRole('link', { name: /Xác minh trên Oracle — Oracle Cloud Infrastructure 2025 Certified Architect/ });
    expect(link.getAttribute('href')).toMatch(/^https:\/\/catalog-education\.oracle\.com\/ords\/certview\/sharebadge\?id=E74E09EA/);
    expect(link).toHaveAttribute('target', '_blank');
    expect(link.getAttribute('rel')).toContain('noopener');
  });

  it('switches to another certificate when picked', async () => {
    setup();
    fireEvent.click(screen.getByRole('button', { name: 'OCI 2025 · Foundations Associate' }));
    expect(screen.getByRole('button', { name: 'OCI 2025 · Foundations Associate' })).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText('27/10/2025')).toBeInTheDocument();
    // The old badge blows away first (mode="wait"), then the new one assembles.
    expect(
      await screen.findByRole('img', { name: 'Oracle Cloud Infrastructure 2025 Certified Foundations Associate' }, { timeout: 3000 })
    ).toBeInTheDocument();
  });
});

describe('CertificationsSection sounds', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('plays sand when another certificate is picked and stays silent on the open one', () => {
    const play = vi.spyOn(sfx, 'play');
    setup();
    fireEvent.click(screen.getByRole('button', { name: 'OCI 2025 · Architect Associate' }));
    expect(play).not.toHaveBeenCalledWith('sand');
    fireEvent.click(screen.getByRole('button', { name: 'OCI 2025 · Foundations Associate' }));
    expect(play).toHaveBeenCalledWith('sand');
  });

  it('chimes on the verify link without stopping the navigation', () => {
    const play = vi.spyOn(sfx, 'play');
    setup();
    const link = screen.getByRole('link', { name: /Xác minh trên Oracle/ });
    expect(link).toHaveAttribute('data-sfx', 'off');
    expect(fireEvent.click(link)).toBe(true);
    expect(play).toHaveBeenCalledWith('drop', { intensity: 0.7 });
    expect(play).toHaveBeenCalledWith('chime', { delay: 70, intensity: 0.6 });
  });
});

describe('sandParams', () => {
  it('is fully solid at rest and scattered at the start of a transition', () => {
    expect(sandParams(0, true)).toEqual({ displacement: 0, dx: -0, dy: -0, blur: 0, alpha: 1 });
    const scattered = sandParams(1, false);
    expect(scattered.displacement).toBe(150);
    expect(scattered.dy).toBe(120);
    expect(scattered.alpha).toBe(0);
  });

  it('drifts up while assembling and down while blowing away', () => {
    expect(sandParams(0.5, true).dy).toBeLessThan(0);
    expect(sandParams(0.5, false).dy).toBeGreaterThan(0);
  });
});
