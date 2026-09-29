import { describe, expect, it } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { LangProvider } from '../context/LangContext';
import { SkillsSection } from './SkillsSection';
import { content } from '../data/content';

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

  it('renders core items, category labels and items', () => {
    setup();
    const coreList = screen.getByRole('list', { name: s.coreLabel });
    const tiles = within(coreList).getAllByRole('listitem');
    expect(tiles).toHaveLength(s.core.length);
    for (const n of s.core) expect(within(coreList).getByText(n)).toBeInTheDocument();
    expect(screen.getAllByRole('heading', { level: 3 })).toHaveLength(s.categories.length);
    for (const c of s.categories) {
      expect(screen.getAllByText(c.label).length).toBeGreaterThan(0);
      for (const i of c.items) expect(screen.getAllByText(i).length).toBeGreaterThan(0);
    }
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
