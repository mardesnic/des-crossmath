import { useEffect, useMemo, useState } from 'react';

import { Board, NumberPad, Tiles, type Wobble } from './components/Board';
import { HomeLink } from './components/HomeLink';
import { Confetti } from './components/Confetti';
import { Icon } from './components/Icon';
import { NewGame, SettingsView } from './components/Menu';
import {
  backspace,
  fits,
  initialStats,
  lineStates,
  newGame,
  place,
  recordWin,
  startOver,
  take,
  typeDigit,
  undo,
  upgrade,
  type Game,
  type Stats,
} from './lib/game';
import { STRINGS, detectLang } from './lib/i18n';
import { generate, nextLevel, type Level } from './lib/puzzle';
import { initialSettings, type Settings } from './lib/settings';
import { popMenu, pushMenu, useBackButton } from './lib/use-back-button';
import { useCheer } from './lib/use-cheer';
import { useLanguage, useSound } from './lib/use-shared-settings';
import { useStoredState } from './lib/use-stored-state';
import { useWakeLock } from './lib/use-wake-lock';

type View = 'play' | 'new' | 'settings';
type Selection = { tile?: number; square?: number };

export default function App() {
  // Keys are prefixed: other apps on the same GitHub Pages origin share
  // this storage.
  const [store, setStore] = useStoredState<{ game?: Game }>('crossmath', {});
  const game = useMemo(() => store.game && upgrade(store.game), [store.game]);
  const [settings, setSettings] = useStoredState<Settings>(
    'crossmath-settings',
    initialSettings
  );
  const [stats, setStats] = useStoredState<Stats>(
    'crossmath-stats',
    initialStats
  );
  const [view, setViewState] = useState<View>(game ? 'play' : 'new');
  // Menus open over the game, so the phone's Back button closes them.
  const setView = (next: View) => {
    if (next === 'play') popMenu();
    else pushMenu();
    setViewState(next);
  };
  useBackButton(() => {
    if (game) setViewState('play');
  });
  const [selection, setSelection] = useState<Selection>({});
  const [wobble, setWobble] = useState<Wobble>();
  const [celebrating, setCelebrating] = useState(false);
  useWakeLock();
  const [sound, setSound] = useSound();
  const cheer = useCheer(sound);

  const [language, setLanguage] = useLanguage();
  const lang = language === 'auto' ? detectLang() : language;
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

  const { expert } = settings;
  // In expert mode the picked square is the one being typed in.
  const editing = expert ? selection.square : undefined;

  // A full line through `i` that is wrong gives a little shake.
  const shake = (g: Game, i?: number) => {
    const states = lineStates(g);
    const wrong = g.lines.filter(
      (l, k) => states[k] === 'wrong' && i !== undefined && l.includes(i)
    );
    setWobble(
      wrong.length ? { cells: wrong.flat(), key: Date.now() } : undefined
    );
  };

  // Applies a move.
  const update = (next: Game, moved?: number, keep?: Selection) => {
    if (!game || next === game) return;
    setSelection(keep ?? {});
    if (next.solved && !game.solved) {
      setStats(recordWin(stats, next));
      setCelebrating(true);
      cheer();
    }
    if (keep) setWobble(undefined);
    else shake(next, moved);
    setStore({ game: next });
  };

  // Expert mode: a square is judged once you're done typing in it.
  const select = (next: Selection) => {
    if (game && editing !== undefined && next.square !== editing)
      shake(game, editing);
    setSelection(next);
  };

  const onDigit = (d: number) => {
    if (game && editing !== undefined)
      update(typeDigit(game, d, editing), editing, { square: editing });
  };
  const onErase = () => {
    if (game && editing !== undefined)
      update(backspace(game, editing), editing, { square: editing });
  };

  // A keyboard works for typing too.
  useEffect(() => {
    if (!expert || view !== 'play') return;
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if (/^[0-9]$/.test(e.key)) onDigit(Number(e.key));
      else if (e.key === 'Backspace') onErase();
      else if (e.key === 'Enter' || e.key === 'Escape') select({});
      else return;
      e.preventDefault();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const onTile = (tile: number) => {
    if (!game) return;
    const { square } = selection;
    if (square !== undefined && fits(game, game.tiles[tile], square)) {
      update(place(game, tile, square), square);
    } else {
      setSelection(selection.tile === tile ? {} : { tile });
    }
  };

  const onSquare = (i: number) => {
    if (!game) return;
    if (expert) {
      select(selection.square === i ? {} : { square: i });
      return;
    }
    const { tile } = selection;
    if (tile !== undefined && fits(game, game.tiles[tile], i)) {
      update(place(game, tile, i), i);
    } else if (game.entries[i] !== null) {
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
        <div className='header__title'>
          <HomeLink label={t.allGames} />
          <h1>{t.title}</h1>
        </div>
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
                className='button button--small button--icon'
                onClick={() => setView('play')}
                aria-label={t.close}
              >
                <Icon name='close' />
              </button>
            )
          )}
        </div>
      </header>

      {view === 'new' && <NewGame onStart={start} t={t} />}
      {view === 'settings' && (
        <SettingsView
          language={language}
          setLanguage={setLanguage}
          sound={sound}
          setSound={setSound}
          settings={settings}
          setSettings={setSettings}
          stats={stats}
          t={t}
        />
      )}

      {view === 'play' && game && (
        <>
          <Board
            game={game}
            states={lineStates(game, editing)}
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
                <button
                  className='button'
                  onClick={() => start(nextLevel(game.level))}
                >
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
              {expert ? (
                <NumberPad
                  active={editing !== undefined}
                  onDigit={onDigit}
                  onErase={onErase}
                  onDone={() => select({})}
                  t={t}
                />
              ) : (
                <Tiles
                  game={game}
                  selected={selection.tile}
                  onTile={onTile}
                  t={t}
                />
              )}
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
                  disabled={game.entries.every((p) => p === null)}
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
          <a href='/des-kids-games/'>{t.allGames}</a>
          <a href='https://github.com/mardesnic/des-crossmath'>{t.source}</a>
          <span className='footer__version'>
            {t.version} {__VERSION__}
          </span>
        </footer>
      )}
      {celebrating && <Confetti onDone={() => setCelebrating(false)} />}
    </main>
  );
}
