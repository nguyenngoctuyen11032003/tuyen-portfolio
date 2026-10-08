import { useLang } from '../../context/LangContext';
import { sfx } from '../../sound';

export function LangToggle() {
  const { lang, toggleLang, t } = useLang();
  return (
    <button
      type="button"
      data-sfx="off"
      onClick={() => {
        sfx.play('lang', { rate: lang === 'vi' ? 1.06 : 0.94 });
        toggleLang();
      }}
      className="liquid-glass rounded-full px-3 py-1.5 font-body text-[length:var(--text-xs)] font-medium leading-[var(--leading-normal)] tracking-[var(--tracking-caps)] text-white/80 hover:text-white transition-colors"
      aria-label={t.a11y.toggleLanguage}
    >
      {lang === 'vi' ? 'VI / EN' : 'EN / VI'}
    </button>
  );
}
