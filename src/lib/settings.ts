import type { Language } from './i18n';

export type Settings = {
  language: Language;
  sound: boolean;
  // Type the numbers on a number pad instead of placing tiles.
  expert: boolean;
};

export const initialSettings: Settings = {
  language: 'auto',
  sound: true,
  expert: false,
};
