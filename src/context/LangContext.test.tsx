import { describe, expect, it } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { LangProvider, useLang } from './LangContext';

function Probe() {
  const { lang, toggleLang, t } = useLang();
  return (
    <div>
      <span data-testid="lang">{lang}</span>
      <span data-testid="headline">{t.hero.headline}</span>
      <button onClick={toggleLang}>toggle</button>
    </div>
  );
}

describe('LangContext', () => {
  it('defaults to vi and toggles to en on demand', () => {
    render(
      <LangProvider>
        <Probe />
      </LangProvider>
    );

    expect(screen.getByTestId('lang').textContent).toBe('vi');
    expect(screen.getByTestId('headline').textContent).toContain('Nguyễn Ngọc Tuyền');

    fireEvent.click(screen.getByText('toggle'));

    expect(screen.getByTestId('lang').textContent).toBe('en');
    expect(screen.getByTestId('headline').textContent).toContain('Nguyễn Ngọc Tuyền');
  });

  it('throws when useLang is called outside a LangProvider', () => {
    function Bare() {
      useLang();
      return null;
    }
    expect(() => render(<Bare />)).toThrow('useLang must be used within a LangProvider');
  });
});
