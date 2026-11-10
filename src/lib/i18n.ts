import type { Level } from './puzzle';

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
  cancel: 'Cancel',
  newGame: 'New game',
  undo: 'Undo',
  startOver: 'Start over',
  wellDone: 'Well done!',
  nextPuzzle: 'Next puzzle',
  changeLevel: 'Change level',
  // The numbers each level goes up to.
  upTo: (n: number) => `up to ${n}`,
  level: (l: Level) => `Level ${l}`,
  square: (row: number, col: number) => `Row ${row}, column ${col}`,
  empty: 'empty',
  pickTile: 'Pick a tile, then the square it goes in',
  ops: { '+': 'plus', '-': 'minus', '×': 'times', '÷': 'divided by' },
  equals: 'equals',
  language: 'Language',
  automatic: 'Automatic',
  statistics: 'Statistics',
  solved: 'Solved',
  source: 'Source',
};

export type Strings = typeof en;

const hr: Strings = {
  title: 'Računska križaljka',
  settings: 'Postavke',
  done: 'Gotovo',
  cancel: 'Odustani',
  newGame: 'Nova igra',
  undo: 'Poništi',
  startOver: 'Ispočetka',
  wellDone: 'Bravo!',
  nextPuzzle: 'Sljedeća križaljka',
  changeLevel: 'Promijeni razinu',
  upTo: (n: number) => `do ${n}`,
  level: (l: Level) => `Razina ${l}`,
  square: (row: number, col: number) => `Red ${row}, stupac ${col}`,
  empty: 'prazno',
  pickTile: 'Odaberi pločicu, pa polje u koje ide',
  ops: { '+': 'plus', '-': 'minus', '×': 'puta', '÷': 'podijeljeno s' },
  equals: 'jednako',
  language: 'Jezik',
  automatic: 'Automatski',
  statistics: 'Statistika',
  solved: 'Riješeno',
  source: 'Izvorni kod',
};

export const STRINGS: Record<Lang, Strings> = { en, hr };
