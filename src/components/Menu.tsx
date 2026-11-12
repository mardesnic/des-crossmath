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

// How far a level's numbers go, and whether it's on the big grid.
const range = (level: Level, t: Strings) =>
  [
    t.upTo(RULES[level].max),
    ...(RULES[level].shapes >= 5 ? [t.bigGrid] : []),
  ].join(', ');

// What a level has: its operators and how far the numbers go.
export function LevelName({ level, t }: { level: Level; t: Strings }) {
  return (
    <>
      <span className='level__ops'>{RULES[level].ops.map(show).join(' ')}</span>
      <span className='level__range'>{range(level, t)}</span>
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
            aria-label={`${t.level(n + 1)}: ${RULES[level].ops.map((o) => t.ops[o]).join(', ')}, ${range(level, t)}`}
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
  language,
  setLanguage,
  sound,
  setSound,
  setSettings,
  stats,
  t,
}: {
  settings: Settings;
  language: Language;
  setLanguage: (l: Language) => void;
  sound: boolean;
  setSound: (on: boolean) => void;
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
            value={language}
            label={(l) => (l === 'auto' ? t.automatic : LANG_NAMES[l])}
            onChange={setLanguage}
          />
        </div>

        <div className='field'>
          <span>{t.sound}</span>
          <Segmented
            options={[true, false]}
            value={sound}
            label={(on) => (on ? t.on : t.off)}
            onChange={setSound}
          />
        </div>

        <div className='field'>
          <span>
            {t.expert} <span className='muted'>{t.expertHint}</span>
          </span>
          <Segmented
            options={[true, false]}
            value={settings.expert}
            label={(on) => (on ? t.on : t.off)}
            onChange={(expert) => setSettings({ ...settings, expert })}
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
            {LEVELS.map((level, n) => (
              <tr key={level}>
                <th>
                  {t.level(n + 1)}{' '}
                  <span className='muted'>
                    {RULES[level].ops.map(show).join(' ')}, {range(level, t)}
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
