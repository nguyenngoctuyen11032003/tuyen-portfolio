import { afterEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { sfx } from '../../sound';
import { ProjectGallery } from './ProjectGallery';

const images = [
  { src: '/a.webp', alt: 'A' },
  { src: '/b.webp', alt: 'B' },
  { src: '/c.webp', alt: 'C' },
];
const labels = { prev: 'Prev', next: 'Next', show: 'Show' };

afterEach(() => {
  vi.restoreAllMocks();
});

describe('ProjectGallery sounds', () => {
  it('slides right on next and left on the arrow key', () => {
    const play = vi.spyOn(sfx, 'play');
    render(<ProjectGallery images={images} labels={labels} />);
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    expect(screen.getByText('2 / 3')).toBeInTheDocument();
    expect(play).toHaveBeenLastCalledWith('slide', expect.objectContaining({ pan: 0.3 }));
    fireEvent.keyDown(document, { key: 'ArrowLeft' });
    expect(screen.getByText('1 / 3')).toBeInTheDocument();
    expect(play).toHaveBeenLastCalledWith('slide', expect.objectContaining({ pan: -0.3 }));
  });

  it('ticks on a new thumbnail and stays silent on the current one', () => {
    const play = vi.spyOn(sfx, 'play');
    render(<ProjectGallery images={images} labels={labels} />);
    fireEvent.click(screen.getByRole('button', { name: 'Show 1: A' }));
    expect(play).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Show 3: C' }));
    expect(play).toHaveBeenCalledWith('tick', expect.objectContaining({ step: 2, pan: 0.3 }));
    expect(screen.getByText('3 / 3')).toBeInTheDocument();
  });

  it('marks its buttons so the click delegate stays out', () => {
    render(<ProjectGallery images={images} labels={labels} />);
    for (const button of screen.getAllByRole('button')) expect(button).toHaveAttribute('data-sfx', 'off');
  });
});
