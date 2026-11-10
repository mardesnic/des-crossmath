import type { Language } from './i18n';

export type Settings = {
  language: Language;
};

export const initialSettings: Settings = {
  language: 'auto',
};
