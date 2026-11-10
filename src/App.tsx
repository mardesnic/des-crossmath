import { useEffect, useState } from 'react';

import { Board, Tiles, type Wobble } from './components/Board';
import { Confetti } from './components/Confetti';
import { Icon } from './components/Icon';
import { LevelName, NewGame, SettingsView } from './components/Menu';
import {
  fits,
  initialStats,
  lineStates,
  newGame,
  place,
  recordWin,
  startOver,
  take,
  undo,
  type Game,
  type Stats,
} from './lib/game';
import { STRINGS, detectLang } from './lib/i18n';
import { generate, type Level } from './lib/puzzle';
import { initialSettings, type Settings } from './lib/settings';
import { useStoredState } from './lib/use-stored-state';
import { useWakeLock } from './lib/use-wake-lock';

type View = 'play' | 'new' | 'settings';
type Selection = { tile?: number; square?: number };

export default function App() {
  // Keys are prefixed: other apps on the same GitHub Pages origin share
  // this storage.
  const [{ game }, setStore] = useStoredState<{ game?: Game }>('crossmath', {});
  const [settings, setSettings] = useStoredState<Settings>(
    'crossmath-settings',
    initialSettings
  );
  const [stats, setStats] = useStoredState<Stats>(
    'crossmath-stats',
    initialStats
  );
  const [view, setView] = useState<View>(game ? 'play' : 'new');
  const [selection, setSelection] = useState<Selection>({});
  const [wobble, setWobble] = useState<Wobble>();
  const [celebrating, setCelebrating] = useState(false);
  useWakeLock();

  const lang = settings.language === 'auto' ? detectLang() : settings.language;
  const t = STRINGS[lang];
  useEffect(() => {
    document.documentElement.lang = lang;
    document.title = t.title;
  }, [lang, t]);

  const start = (level: Level) => {
    setStore({ game: newGame(generate(level)) });
    setSelection({});
    setWobble(undefined);
    setView('play');
  };

  // Applies a move. A line that is now full and wrong gives a little shake.
  const update = (next: Game, moved?: number) => {
    if (!game || next === game) return;
    setSelection({});
    if (next.solved && !game.solved) {
      setStats(recordWin(stats, next));
      setCelebrating(true);
    }
    const states = lineStates(next);
    const wrong = next.lines.filter(
      (l, k) =>
        states[k] === 'wrong' && moved !== undefined && l.includes(moved)
    );
    setWobble(
      wrong.length ? { cells: wrong.flat(), key: Date.now() } : undefined
    );
    setStore({ game: next });
  };

  const onTile = (tile: number) => {
    if (!game) return;
    const { square } = selection;
    if (square !== undefined && fits(game, tile, square)) {
      update(place(game, tile, square), square);
    } else {
      setSelection(selection.tile === tile ? {} : { tile });
    }
  };

  const onSquare = (i: number) => {
    if (!game) return;
    const { tile } = selection;
    if (tile !== undefined && fits(game, tile, i)) {
      update(place(game, tile, i), i);
    } else if (game.placed[i] !== null) {
      // Tapping a filled square takes its tile back, ready for another.
      update(take(game, i));
      setSelection({ square: i });
    } else {
      setSelection(selection.square === i ? {} : { square: i });
    }
  };

  return (
    <main className='app'>
      <header className='header'>
        <h1>{t.title}</h1>
        <div className='header__actions'>
          {view === 'play' ? (
            <>
              <button
                className='button button--small'
                onClick={() => setView('new')}
              >
                {t.newGame}
              </button>
              <button
                className='button button--small button--icon'
                onClick={() => setView('settings')}
                aria-label={t.settings}
              >
                <Icon name='settings' />
              </button>
            </>
          ) : (
            game && (
              <button
                className='button button--small'
                onClick={() => setView('play')}
              >
                {view === 'new' ? t.cancel : t.done}
              </button>
            )
          )}
        </div>
      </header>

      {view === 'new' && <NewGame onStart={start} t={t} />}
      {view === 'settings' && (
        <SettingsView
          settings={settings}
          setSettings={setSettings}
          stats={stats}
          t={t}
        />
      )}

      {view === 'play' && game && (
        <>
          <div className='status'>
            <LevelName level={game.level} t={t} />
          </div>

          <Board
            game={game}
            states={lineStates(game)}
            selectedTile={selection.tile}
            selectedSquare={selection.square}
            wobble={wobble}
            onSquare={onSquare}
            t={t}
          />

          {game.solved ? (
            <section className='card solved'>
              <h2>{t.wellDone}</h2>
              <div className='solved__actions'>
                <button className='button' onClick={() => start(game.level)}>
                  {t.nextPuzzle}
                </button>
                <button
                  className='button button--secondary'
                  onClick={() => setView('new')}
                >
                  {t.changeLevel}
                </button>
              </div>
            </section>
          ) : (
            <>
              <Tiles
                game={game}
                selected={selection.tile}
                onTile={onTile}
                t={t}
              />
              <div className='tools'>
                <button
                  className='tool'
                  onClick={() => update(undo(game))}
                  disabled={!game.history.length}
                >
                  <Icon name='undo' />
                  {t.undo}
                </button>
                <button
                  className='tool'
                  onClick={() => update(startOver(game))}
                  disabled={game.placed.every((p) => p === null)}
                >
                  <Icon name='clear' />
                  {t.startOver}
                </button>
              </div>
            </>
          )}
        </>
      )}

      {view === 'settings' && (
        <footer className='footer'>
          <a href='https://github.com/mardesnic/des-crossmath'>{t.source}</a>
        </footer>
      )}
      {celebrating && <Confetti onDone={() => setCelebrating(false)} />}
    </main>
  );
}
