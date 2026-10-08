import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { LangProvider } from '../../context/LangContext';
import { content } from '../../data/content';
import { ArtifactAtlas } from './ArtifactAtlas';

const a = content.vi.artifacts;

function setup() {
  return render(
    <LangProvider>
      <ArtifactAtlas />
    </LangProvider>
  );
}

afterEach(() => {
  vi.useRealTimers();
});

describe('ArtifactAtlas', () => {
  it('renders a tab per artifact with the ship selected by default', () => {
    setup();
    const tabs = screen.getAllByRole('tab');
    expect(tabs).toHaveLength(a.items.length);
    expect(tabs[1]).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('heading', { name: a.items[1].short })).toBeInTheDocument();
    expect(screen.getByText(a.items[1].description)).toBeInTheDocument();
  });

  it('swaps the detail card after the out animation when another tab is chosen', () => {
    vi.useFakeTimers();
    setup();
    fireEvent.click(screen.getAllByRole('tab')[0]);
    expect(screen.getAllByRole('tab')[0]).toHaveAttribute('aria-selected', 'true');
    act(() => {
      vi.advanceTimersByTime(250);
    });
    expect(screen.getByRole('heading', { name: a.items[0].short })).toBeInTheDocument();
    expect(screen.getByText(a.items[0].caption)).toBeInTheDocument();
  });

  it('moves between tabs with the arrow keys', () => {
    setup();
    const tabs = screen.getAllByRole('tab');
    fireEvent.keyDown(tabs[1], { key: 'ArrowRight' });
    expect(screen.getAllByRole('tab')[0]).toHaveAttribute('aria-selected', 'true');
  });

  it('exposes the stage controls with labels and pressed states', () => {
    setup();
    expect(screen.getByRole('button', { name: a.zoomIn })).toHaveAttribute('aria-pressed', 'true');
    const expand = screen.getByRole('button', { name: a.expand });
    fireEvent.click(expand);
    expect(expand).toHaveAttribute('aria-pressed', 'true');
    expect(document.querySelector('#artifacts')).toHaveClass('focus');
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(document.querySelector('#artifacts')).not.toHaveClass('focus');
  });

  it('switches the gallery light', () => {
    setup();
    fireEvent.click(screen.getByRole('button', { name: a.light }));
    expect(document.querySelector('#artifacts')).toHaveAttribute('data-light', 'day');
  });
});
