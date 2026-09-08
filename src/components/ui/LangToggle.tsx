import { useLang } from '../../context/LangContext';

export function LangToggle() {
  const { lang, toggleLang } = useLang();
  return (
    <button
      type="button"
      onClick={toggleLang}
      className="liquid-glass rounded-full px-3 py-1.5 text-xs font-medium text-white/80 hover:text-white transition-colors"
      aria-label="Toggle language"
    >
      {lang === 'vi' ? 'VI / EN' : 'EN / VI'}
    </button>
  );
}
