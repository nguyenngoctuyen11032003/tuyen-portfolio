import { createContext, useContext, useState, type ReactNode } from 'react';
import { content, type Content, type Lang } from '../data/content';

interface LangContextValue {
  lang: Lang;
  toggleLang: () => void;
  t: Content;
}

const LangContext = createContext<LangContextValue | undefined>(undefined);

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>('vi');
  const toggleLang = () => setLang((prev) => (prev === 'vi' ? 'en' : 'vi'));

  return (
    <LangContext.Provider value={{ lang, toggleLang, t: content[lang] }}>
      {children}
    </LangContext.Provider>
  );
}

export function useLang(): LangContextValue {
  const ctx = useContext(LangContext);
  if (!ctx) {
    throw new Error('useLang must be used within a LangProvider');
  }
  return ctx;
}
