import { LANG_NAMES, LANGS, type Language, type Strings } from '../lib/i18n';
import type { Settings } from '../lib/settings';

function Segmented<T>({
  options,
  value,
  label,
  onChange,
}: {
  options: readonly T[];
  value: T;
  label: (o: T) => string;
  onChange: (o: T) => void;
}) {
  return (
    <div className='segmented'>
      {options.map((o) => (
        <button
          key={String(o)}
          aria-pressed={value === o}
          onClick={() => onChange(o)}
        >
          {label(o)}
        </button>
      ))}
    </div>
  );
}

export function SettingsView({
  settings,
  setSettings,
  t,
}: {
  settings: Settings;
  setSettings: (s: Settings) => void;
  t: Strings;
}) {
  const languages: Language[] = ['auto', ...LANGS];

  return (
    <section className='card'>
      <h2>{t.settings}</h2>

      <div className='field'>
        <span>{t.language}</span>
        <Segmented
          options={languages}
          value={settings.language}
          label={(l) => (l === 'auto' ? t.automatic : LANG_NAMES[l])}
          onChange={(language) => setSettings({ ...settings, language })}
        />
      </div>
    </section>
  );
}
