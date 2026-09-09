import { describe, expect, it } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
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
    fireEvent.click(screen.getByLabelText('Mở/đóng menu'));
    expect(screen.getAllByText('Kinh nghiệm').length).toBeGreaterThan(0);
  });

  it('highlights the current section link when its section intersects the viewport', () => {
    class TestIntersectionObserver implements IntersectionObserver {
      static instances: TestIntersectionObserver[] = [];
      readonly root: Element | Document | null = null;
      readonly rootMargin: string = '';
      readonly thresholds: ReadonlyArray<number> = [];
      readonly scrollMargin: string = '';
      callback: IntersectionObserverCallback;
      constructor(callback: IntersectionObserverCallback) {
        this.callback = callback;
        TestIntersectionObserver.instances.push(this);
      }
      observe() {}
      unobserve() {}
      disconnect() {}
      takeRecords(): IntersectionObserverEntry[] {
        return [];
      }
    }

    const originalObserver = globalThis.IntersectionObserver;
    globalThis.IntersectionObserver = TestIntersectionObserver as unknown as typeof IntersectionObserver;
    TestIntersectionObserver.instances = [];

    const skillsSection = document.createElement('section');
    skillsSection.id = 'skills';
    document.body.appendChild(skillsSection);

    render(
      <LangProvider>
        <Navbar />
      </LangProvider>
    );

    const [observerInstance] = TestIntersectionObserver.instances;
    act(() => {
      observerInstance.callback(
        [{ isIntersecting: true, target: skillsSection } as unknown as IntersectionObserverEntry],
        observerInstance
      );
    });

    const skillsLinks = screen.getAllByText('Kỹ năng');
    expect(skillsLinks[0]).toHaveAttribute('aria-current', 'true');

    document.body.removeChild(skillsSection);
    globalThis.IntersectionObserver = originalObserver;
  });
});
