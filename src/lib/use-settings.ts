import { useCallback, useEffect, useMemo, useState } from 'react';

import type { Language } from './i18n';
import { useStoredState } from './use-stored-state';

// All the des- games live on one site, so they share storage. The language
// is kept in one place for all of them: picking it in one game picks it in
// every game and on the games page. The other settings stay per game.
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

function readShared() {
  try {
    return parseLanguage(localStorage.getItem(KEY));
  } catch {
    return undefined;
  }
}

function writeShared(language: Language) {
  try {
    localStorage.setItem(KEY, JSON.stringify(language));
  } catch {
    // Not shared; this game still uses it for this visit.
  }
}

// useStoredState for a game's settings, with the language shared. Before any
// game has saved a shared language, the game's own saved one is used.
export function useSettings<T extends { language: Language }>(
  key: string,
  initial: T
) {
  const [stored, setStored] = useStoredState<T>(key, initial);
  const [language, setLanguage] = useState<Language>(
    () => readShared() ?? stored.language
  );

  useEffect(() => writeShared(language), [language]);

  // Another game may have changed it meanwhile: in another tab, or while
  // this page waited in the history for Back.
  useEffect(() => {
    const sync = () => {
      const shared = readShared();
      if (shared) setLanguage(shared);
    };
    window.addEventListener('storage', sync);
    window.addEventListener('pageshow', sync);
    document.addEventListener('visibilitychange', sync);
    return () => {
      window.removeEventListener('storage', sync);
      window.removeEventListener('pageshow', sync);
      document.removeEventListener('visibilitychange', sync);
    };
  }, []);

  const settings = useMemo(() => ({ ...stored, language }), [stored, language]);
  const setSettings = useCallback(
    (next: T) => {
      setLanguage(next.language);
      setStored(next);
    },
    [setStored]
  );
  return [settings, setSettings] as const;
}
