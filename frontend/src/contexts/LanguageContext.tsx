import { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';
import { translations } from '../locales';
import type { Lang, Translations } from '../locales';

interface LangContextValue {
  lang: Lang;
  i18n: Translations;
  toggleLanguage: () => void;
}

const LanguageContext = createContext<LangContextValue | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>(
    () => (localStorage.getItem('lang') as Lang | null) ?? 'ja'
  );

  const toggleLanguage = () => {
    const next: Lang = lang === 'ja' ? 'en' : 'ja';
    setLang(next);
    localStorage.setItem('lang', next);
  };

  return (
    <LanguageContext.Provider value={{ lang, i18n: translations[lang], toggleLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLang(): LangContextValue {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLang must be used within LanguageProvider');
  return ctx;
}
