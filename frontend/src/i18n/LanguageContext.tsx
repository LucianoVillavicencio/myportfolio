import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import {
  DEFAULT_LANGUAGE,
  LANGUAGES,
  LOCALES,
  dictionaries,
  type Dictionary,
  type Language,
} from './translations';

const STORAGE_KEY = 'portfolio_lang';

function readStoredLanguage(): Language {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return LANGUAGES.includes(stored as Language) ? (stored as Language) : DEFAULT_LANGUAGE;
  } catch {
    return DEFAULT_LANGUAGE;
  }
}

interface LanguageValue {
  lang: Language;
  setLang: (lang: Language) => void;
  /** Dictionary for the active language. */
  t: Dictionary;
  locale: string;
}

const LanguageContext = createContext<LanguageValue | null>(null);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lang, setLang] = useState<Language>(readStoredLanguage);

  useEffect(() => {
    document.documentElement.lang = lang;
    try {
      localStorage.setItem(STORAGE_KEY, lang);
    } catch {
      // Storage unavailable (private mode); the choice just won't persist
    }
  }, [lang]);

  const value = useMemo(
    () => ({ lang, setLang, t: dictionaries[lang], locale: LOCALES[lang] }),
    [lang],
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
};

export function useI18n() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useI18n must be used inside LanguageProvider');
  return ctx;
}

/**
 * Picks the active language's text for a bilingual field, falling back to the
 * other language when it's empty.
 */
export function localized(lang: Language, es: string, en: string): string {
  return (lang === 'es' ? es || en : en || es) ?? '';
}
