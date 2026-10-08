import { useLang } from '../context/LangContext';
import { useSound } from './useSound';
import './soundToggle.css';

export interface SoundToggleProps {
  variant?: 'header' | 'sheet';
  className?: string;
}

/** Sound on/off: four equalizer bars that dance when on and lie flat when off. */
export function SoundToggle({ variant = 'header', className }: SoundToggleProps) {
  const { t } = useLang();
  const { enabled, supported, live, toggle } = useSound();
  // On, but the browser still needs a click / tap / key press before it lets any sound out.
  const waiting = enabled && supported && !live;

  return (
    <button
      type="button"
      className={`sound-toggle sound-toggle--${variant}${enabled ? ' is-on' : ''}${waiting ? ' is-waiting' : ''} ${className ?? ''}`}
      aria-pressed={enabled}
      aria-label={t.sound.label}
      title={waiting ? t.sound.tapToStart : enabled ? t.sound.turnOff : t.sound.turnOn}
      data-sfx="off"
      // While waiting, this click is the gesture that starts the audio: keep sound on instead of muting.
      onClick={() => (waiting ? undefined : toggle())}
    >
      <span className="sound-eq" aria-hidden="true">
        <i />
        <i />
        <i />
        <i />
      </span>
      {variant === 'sheet' ? (
        <span className="sound-toggle-text" aria-hidden="true">
          {t.sound.label} · {enabled ? t.sound.stateOn : t.sound.stateOff}
        </span>
      ) : null}
    </button>
  );
}
