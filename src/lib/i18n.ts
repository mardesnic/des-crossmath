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
  title: 'Crossmath',
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
  // The hardest level's board, to tell it apart from the one before.
  bigGrid: 'big grid',
  level: (n: number) => `Level ${n}`,
  square: (row: number, col: number) => `Row ${row}, column ${col}`,
  empty: 'empty',
  pickTile: 'Pick a tile, then the square it goes in',
  pickSquare: 'Pick a square, then type its number',
  numberPad: 'Number pad',
  erase: 'Rub out',
  ops: { '+': 'plus', '-': 'minus', '×': 'times', '÷': 'divided by' },
  equals: 'equals',
  language: 'Language',
  automatic: 'Automatic',
  sound: 'Sound and vibration',
  expert: 'Expert mode',
  expertHint: 'Type the numbers instead of picking tiles',
  on: 'On',
  off: 'Off',
  statistics: 'Statistics',
  solved: 'Solved',
  allGames: 'All games',
  source: 'Source',
  version: 'Version',
};

export type Strings = typeof en;

const hr: Strings = {
  title: 'Križmatka',
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
  bigGrid: 'velika mreža',
  level: (n: number) => `Razina ${n}`,
  square: (row: number, col: number) => `Red ${row}, stupac ${col}`,
  empty: 'prazno',
  pickTile: 'Odaberi pločicu, pa polje u koje ide',
  pickSquare: 'Odaberi polje, pa upiši broj',
  numberPad: 'Brojevi',
  erase: 'Obriši',
  ops: { '+': 'plus', '-': 'minus', '×': 'puta', '÷': 'podijeljeno s' },
  equals: 'jednako',
  language: 'Jezik',
  automatic: 'Automatski',
  sound: 'Zvuk i vibracija',
  expert: 'Stručni način',
  expertHint: 'Upisuj brojeve umjesto biranja pločica',
  on: 'Uključeno',
  off: 'Isključeno',
  statistics: 'Statistika',
  solved: 'Riješeno',
  allGames: 'Sve igre',
  source: 'Izvorni kod',
  version: 'Verzija',
};

export const STRINGS: Record<Lang, Strings> = { en, hr };
