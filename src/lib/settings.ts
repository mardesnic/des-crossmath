import type { Language } from './i18n';

export type Settings = {
  language: Language;
  sound: boolean;
};

export const initialSettings: Settings = {
  language: 'auto',
  sound: true,
};
