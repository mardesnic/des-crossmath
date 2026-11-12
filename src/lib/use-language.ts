import { useEffect, useState } from 'react';

import type { Language } from './i18n';

// All the des- games live on one site, so they share storage. The language
// is kept in one place for all of them: picking it in one game picks it in
// every game and on the games page. Until one is picked, the phone's
// language is used.
const KEY = 'des-language';
const LANGUAGES: readonly string[] = ['auto', 'en', 'hr'];

export function parseLanguage(raw: string | null): Language | undefined {
  try {
    const value: unknown = raw === null ? undefined : JSON.parse(raw);
    return typeof value === 'string' && LANGUAGES.includes(value)
      ? (value as Language)
      : undefined;
  } catch {
    return undefined;
  }
}

function read(): Language {
  try {
    return parseLanguage(localStorage.getItem(KEY)) ?? 'auto';
  } catch {
    return 'auto';
  }
}

export function useLanguage() {
  const [language, setState] = useState<Language>(read);

  // Another game may have changed it meanwhile: in another tab, or while
  // this page waited in the history for Back.
  useEffect(() => {
    const sync = () => setState(read());
    window.addEventListener('storage', sync);
    window.addEventListener('pageshow', sync);
    document.addEventListener('visibilitychange', sync);
    return () => {
      window.removeEventListener('storage', sync);
      window.removeEventListener('pageshow', sync);
      document.removeEventListener('visibilitychange', sync);
    };
  }, []);

  const setLanguage = (next: Language) => {
    try {
      localStorage.setItem(KEY, JSON.stringify(next));
    } catch {
      // Not saved; it still changes for this visit.
    }
    setState(next);
  };

  return [language, setLanguage] as const;
}
