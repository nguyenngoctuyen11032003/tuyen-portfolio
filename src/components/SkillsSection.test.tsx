import { afterEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { LangProvider } from '../context/LangContext';
import { SkillsSection } from './SkillsSection';
import { content } from '../data/content';
import { sfx } from '../sound';

function setup() {
  return render(
    <LangProvider>
      <SkillsSection />
    </LangProvider>
  );
}

describe('SkillsSection', () => {
  const s = content.vi.skills;

  it('renders heading and core label', () => {
    setup();
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Công nghệ');
    expect(screen.getByText('Công nghệ chính')).toBeInTheDocument();
  });

  it('renders core items on the arch', () => {
    setup();
    const coreList = screen.getByRole('list', { name: s.coreLabel });
    const tiles = within(coreList).getAllByRole('listitem');
    expect(tiles).toHaveLength(s.core.length);
    for (const n of s.core) expect(within(coreList).getByText(n)).toBeInTheDocument();
  });

  it('exposes one accessible card per skill group (clones are hidden)', () => {
    setup();
    const slider = screen.getByRole('region', { name: s.sliderLabel });
    expect(within(slider).getAllByRole('heading', { level: 3 })).toHaveLength(s.categories.length);
    const cards = within(slider).getAllByRole('button');
    expect(cards).toHaveLength(s.categories.length);
    for (const c of s.categories) {
      expect(within(slider).getAllByText(c.label).length).toBeGreaterThan(0);
      expect(within(slider).getAllByText(c.items.join(' · ')).length).toBeGreaterThan(0);
    }
  });

  it('selects a card on click and moves with the arrows', () => {
    setup();
    const slider = screen.getByRole('region', { name: s.sliderLabel });
    const cards = within(slider).getAllByRole('button');
    expect(cards[0]).toHaveAttribute('aria-pressed', 'true');
    fireEvent.click(cards[2]);
    expect(cards[2]).toHaveAttribute('aria-pressed', 'true');
    fireEvent.click(screen.getByRole('button', { name: s.prevLabel }));
    expect(cards[1]).toHaveAttribute('aria-pressed', 'true');
  });

  describe('sounds', () => {
    afterEach(() => vi.restoreAllMocks());

    it('slides toward the arrow that was pressed and marks it as self-sounding', () => {
      const play = vi.spyOn(sfx, 'play');
      setup();
      const prev = screen.getByRole('button', { name: s.prevLabel });
      const next = screen.getByRole('button', { name: s.nextLabel });
      expect(prev).toHaveAttribute('data-sfx', 'off');
      expect(next).toHaveAttribute('data-sfx', 'off');
      fireEvent.click(next);
      expect(play).toHaveBeenLastCalledWith('slide', expect.objectContaining({ pan: 0.4, rate: 1.04 }));
      fireEvent.click(prev);
      expect(play).toHaveBeenLastCalledWith('slide', expect.objectContaining({ pan: -0.4, rate: 0.96 }));
    });

    it('taps the active card and slides to another one', () => {
      const play = vi.spyOn(sfx, 'play');
      setup();
      const cards = within(screen.getByRole('region', { name: s.sliderLabel })).getAllByRole('button');
      fireEvent.click(cards[0]);
      expect(play).toHaveBeenLastCalledWith('tap', expect.anything());
      fireEvent.keyDown(cards[2], { key: 'Enter' });
      expect(play).toHaveBeenLastCalledWith('slide', expect.objectContaining({ pan: 0.4 }));
      expect(cards[2]).toHaveAttribute('aria-pressed', 'true');
    });
  });

  it('tells the stack and security story', () => {
    setup();
    expect(screen.getByRole('heading', { name: s.stackTitle })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: s.securityTitle })).toBeInTheDocument();
    expect(screen.getByText(s.note)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: s.securityCta.label })).toHaveAttribute('href', '#certifications');
  });

  it('hides all icons from assistive tech', () => {
    const { container } = setup();
    const svgs = container.querySelectorAll('svg');
    expect(svgs.length).toBeGreaterThan(0);
    svgs.forEach((svg) => expect(svg).toHaveAttribute('aria-hidden', 'true'));
  });

  it('shows no percentages', () => {
    const { container } = setup();
    expect(container.textContent ?? '').not.toMatch(/\d+\s?%/);
  });
});
