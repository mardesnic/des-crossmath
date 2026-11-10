import { useEffect, useState } from 'react';

import { SettingsView } from './components/Menu';
import { STRINGS, detectLang } from './lib/i18n';
import { initialSettings, type Settings } from './lib/settings';
import { useStoredState } from './lib/use-stored-state';
import { useWakeLock } from './lib/use-wake-lock';

export default function App() {
  // Keys are prefixed: other apps on the same GitHub Pages origin share
  // this storage.
  const [settings, setSettings] = useStoredState<Settings>(
    'crossmath-settings',
    initialSettings
  );
  const [view, setView] = useState<'play' | 'settings'>('play');
  useWakeLock();

  const lang = settings.language === 'auto' ? detectLang() : settings.language;
  const t = STRINGS[lang];
  useEffect(() => {
    document.documentElement.lang = lang;
    document.title = t.title;
  }, [lang, t]);

  return (
    <main className='app'>
      <header className='header'>
        <h1>{t.title}</h1>
        <button
          className='button button--small'
          onClick={() => setView(view === 'play' ? 'settings' : 'play')}
        >
          {view === 'play' ? t.settings : t.done}
        </button>
      </header>

      {view === 'settings' ? (
        <SettingsView settings={settings} setSettings={setSettings} t={t} />
      ) : (
        <section className='card'>
          <p>{t.comingSoon}</p>
        </section>
      )}

      <footer className='footer'>
        <a href='https://github.com/mardesnic/des-crossmath'>{t.source}</a>
      </footer>
    </main>
  );
}
