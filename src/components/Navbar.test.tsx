import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { LangProvider } from '../context/LangContext';
import { sfx } from '../sound';
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
    expect(skillsLinks[0].closest('a')).toHaveAttribute('aria-current', 'true');

    document.body.removeChild(skillsSection);
    globalThis.IntersectionObserver = originalObserver;
  });
});

describe('Navbar sounds', () => {
  afterEach(() => vi.restoreAllMocks());

  it('puts a sound toggle in the header and the mobile sheet, and sounds the language switch', () => {
    const play = vi.spyOn(sfx, 'play');
    render(
      <LangProvider>
        <Navbar />
      </LangProvider>
    );
    expect(screen.getAllByRole('button', { name: 'Âm thanh', hidden: true })).toHaveLength(2);

    const lang = screen.getByRole('button', { name: 'Chuyển ngôn ngữ' });
    expect(lang).toHaveAttribute('data-sfx', 'off');
    fireEvent.click(lang);
    expect(play).toHaveBeenCalledWith('lang', { rate: 1.06 });
  });

  it('opens with menuOpen, switches with a directional slide, closes with menuClose, but not via a panel link', () => {
    const play = vi.spyOn(sfx, 'play');
    const { container } = render(
      <LangProvider>
        <Navbar />
      </LangProvider>
    );
    const trigger = (id: string) => container.querySelector<HTMLButtonElement>(`[data-menu="${id}"]`)!;
    expect(trigger('profile')).toHaveAttribute('data-sfx-hover', 'off');

    fireEvent.click(trigger('profile'));
    expect(play).toHaveBeenLastCalledWith('menuOpen', expect.objectContaining({ pan: expect.any(Number) }));

    fireEvent.click(trigger('work'));
    expect(play).toHaveBeenLastCalledWith('slide', { intensity: 0.3, rate: 1.06, pan: 0.25 });

    fireEvent.click(trigger('work'));
    expect(play).toHaveBeenLastCalledWith('menuClose');

    play.mockClear();
    fireEvent.click(trigger('connect'));
    fireEvent.click(container.querySelector('[data-panel="connect"] a')!);
    expect(play.mock.calls.map((c) => c[0])).toEqual(['menuOpen']);
  });
});
