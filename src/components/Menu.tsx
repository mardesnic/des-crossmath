import type { Stats } from '../lib/game';
import { LANG_NAMES, LANGS, type Language, type Strings } from '../lib/i18n';
import { LEVELS, RULES, show, type Level } from '../lib/puzzle';
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

// What a level has: its operators and how far the numbers go.
export function LevelName({ level, t }: { level: Level; t: Strings }) {
  return (
    <>
      <span className='level__ops'>{RULES[level].ops.map(show).join(' ')}</span>
      <span className='level__range'>{t.upTo(RULES[level].max)}</span>
    </>
  );
}

export function NewGame({
  onStart,
  t,
}: {
  onStart: (level: Level) => void;
  t: Strings;
}) {
  return (
    <section className='card'>
      <h2>{t.newGame}</h2>
      <div className='levels'>
        {LEVELS.map((level, n) => (
          <button
            key={level}
            className='level'
            onClick={() => onStart(level)}
            aria-label={`${t.level(level)}: ${RULES[level].ops.map((o) => t.ops[o]).join(', ')}, ${t.upTo(RULES[level].max)}`}
          >
            <span className='level__pips' aria-hidden='true'>
              {LEVELS.map((_, k) => (
                <span key={k} className={k <= n ? 'pip pip--on' : 'pip'} />
              ))}
            </span>
            <LevelName level={level} t={t} />
          </button>
        ))}
      </div>
    </section>
  );
}

export function SettingsView({
  settings,
  setSettings,
  stats,
  t,
}: {
  settings: Settings;
  setSettings: (s: Settings) => void;
  stats: Stats;
  t: Strings;
}) {
  const languages: Language[] = ['auto', ...LANGS];

  return (
    <>
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

      <section className='card'>
        <h2>{t.statistics}</h2>
        <table className='stats'>
          <thead>
            <tr>
              <th />
              <th>{t.solved}</th>
            </tr>
          </thead>
          <tbody>
            {LEVELS.map((level) => (
              <tr key={level}>
                <th>
                  {t.level(level)}{' '}
                  <span className='muted'>
                    {RULES[level].ops.map(show).join(' ')},{' '}
                    {t.upTo(RULES[level].max)}
                  </span>
                </th>
                <td>{stats.solved[level] ?? 0}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </>
  );
}
