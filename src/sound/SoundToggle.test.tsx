import { act, fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { LangProvider, useLang } from '../context/LangContext';
import { sfx, SOUND_STORAGE_KEY, SoundToggle } from './index';

function LangSwitch() {
  const { toggleLang } = useLang();
  return (
    <button type="button" data-testid="lang" onClick={toggleLang}>
      lang
    </button>
  );
}

function renderToggle(variant?: 'header' | 'sheet') {
  return render(
    <LangProvider>
      <SoundToggle variant={variant} />
      <LangSwitch />
    </LangProvider>,
  );
}

beforeEach(() => {
  act(() => sfx.setEnabled(false));
  window.localStorage.clear();
});

describe('SoundToggle', () => {
  it('is off by default and labelled in Vietnamese', () => {
    renderToggle();
    const btn = screen.getByRole('button', { name: 'Âm thanh' });
    expect(btn).toHaveAttribute('aria-pressed', 'false');
    expect(btn).toHaveAttribute('title', 'Bật âm thanh');
    expect(btn).toHaveAttribute('data-sfx', 'off');
    expect(btn).toHaveAttribute('type', 'button');
    expect(sfx.supported).toBe(false); // jsdom: no Web Audio, still rendered
  });

  it('toggles aria-pressed and persists the choice', () => {
    renderToggle();
    const btn = screen.getByRole('button', { name: 'Âm thanh' });
    fireEvent.click(btn);
    expect(btn).toHaveAttribute('aria-pressed', 'true');
    expect(btn).toHaveClass('is-on');
    expect(btn).toHaveAttribute('title', 'Tắt âm thanh');
    expect(window.localStorage.getItem(SOUND_STORAGE_KEY)).toBe('on');
    fireEvent.click(btn);
    expect(btn).toHaveAttribute('aria-pressed', 'false');
    expect(window.localStorage.getItem(SOUND_STORAGE_KEY)).toBe('off');
  });

  it('switches labels to English', () => {
    renderToggle();
    fireEvent.click(screen.getByTestId('lang'));
    const btn = screen.getByRole('button', { name: 'Sound' });
    expect(btn).toHaveAttribute('title', 'Turn sound on');
    fireEvent.click(btn);
    expect(btn).toHaveAttribute('title', 'Turn sound off');
  });

  it('shows the state text in the sheet variant', () => {
    const { container } = renderToggle('sheet');
    const btn = screen.getByRole('button', { name: 'Âm thanh' });
    expect(btn).toHaveClass('sound-toggle--sheet');
    expect(container.querySelector('.sound-toggle-text')).toHaveTextContent('Âm thanh · Đang tắt');
    fireEvent.click(btn);
    expect(container.querySelector('.sound-toggle-text')).toHaveTextContent('Âm thanh · Đang bật');
    fireEvent.click(screen.getByTestId('lang'));
    expect(container.querySelector('.sound-toggle-text')).toHaveTextContent('Sound · On');
  });

  it('reflects changes made outside the component', () => {
    renderToggle();
    act(() => sfx.setEnabled(true));
    expect(screen.getByRole('button', { name: 'Âm thanh' })).toHaveAttribute('aria-pressed', 'true');
  });
});
