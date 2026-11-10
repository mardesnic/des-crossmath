export const LANGS = ['en', 'hr'] as const;
export type Lang = (typeof LANGS)[number];
export type Language = 'auto' | Lang;

// Each language's name in that language, for the picker.
export const LANG_NAMES: Record<Lang, string> = {
  en: 'English',
  hr: 'Hrvatski',
};

export function detectLang(): Lang {
  const preferred = navigator.languages ?? [navigator.language];
  return preferred.some((l) => l.toLowerCase().startsWith('hr')) ? 'hr' : 'en';
}

const en = {
  title: 'Cross Math',
  settings: 'Settings',
  done: 'Done',
  newGame: 'New game',
  undo: 'Undo',
  startOver: 'Start over',
  wellDone: 'Well done!',
  comingSoon: 'The puzzle is coming soon.',
  language: 'Language',
  automatic: 'Automatic',
  source: 'Source',
};

export type Strings = typeof en;

const hr: Strings = {
  title: 'Računska križaljka',
  settings: 'Postavke',
  done: 'Gotovo',
  newGame: 'Nova igra',
  undo: 'Poništi',
  startOver: 'Ispočetka',
  wellDone: 'Bravo!',
  comingSoon: 'Križaljka stiže uskoro.',
  language: 'Jezik',
  automatic: 'Automatski',
  source: 'Izvorni kod',
};

export const STRINGS: Record<Lang, Strings> = { en, hr };
