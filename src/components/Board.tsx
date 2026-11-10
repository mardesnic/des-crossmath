import type { CSSProperties } from 'react';

import {
  fits,
  isBlank,
  squareAt,
  type Game,
  type LineState,
} from '../lib/game';
import type { Strings } from '../lib/i18n';
import { show, type Square } from '../lib/puzzle';

const NUMBER = 3;
const SIGN = 2;

export type Wobble = { cells: number[]; key: number };

type Props = {
  game: Game;
  states: LineState[];
  selectedTile?: number;
  selectedSquare?: number;
  wobble?: Wobble;
  onSquare: (i: number) => void;
  t: Strings;
};

export function Board({
  game,
  states,
  selectedTile,
  selectedSquare,
  wobble,
  onSquare,
  t,
}: Props) {
  const { size, lines } = game;

  const stateOf = (i: number): LineState => {
    // Lines given in full stay plain, so green is always the child's work.
    const mine = lines.flatMap((l, k) =>
      l.includes(i) && l.some((j) => isBlank(game, j)) ? [states[k]] : []
    );
    if (mine.includes('wrong')) return 'wrong';
    return mine.includes('right') ? 'right' : 'open';
  };

  const spoken = (v: Square) =>
    v === null
      ? t.empty
      : v === '='
        ? t.equals
        : typeof v === 'number'
          ? String(v)
          : t.ops[v];

  // Numbers sit on even rows and columns and get more room than the signs
  // between them.
  const tracks = Array.from({ length: size }, (_, k) =>
    k % 2 ? `${SIGN}fr` : `${NUMBER}fr`
  ).join(' ');
  const units = Math.ceil(size / 2) * NUMBER + Math.floor(size / 2) * SIGN;
  const style = {
    '--size': size,
    '--num': NUMBER / units,
    '--sign': SIGN / units,
    gridTemplateColumns: tracks,
    gridTemplateRows: tracks,
  } as CSSProperties;

  return (
    <div className='board' style={style}>
      {game.solution.map((given, i) => {
        if (given === null) return <div key={i} />;
        const value = squareAt(game, i);
        const state = stateOf(i);
        const classes = ['sq', `sq--${state}`];
        const shaking = wobble?.cells.includes(i);
        const content = (
          <span
            key={shaking ? wobble!.key : 0}
            className={shaking ? 'sq__in sq__in--wobble' : 'sq__in'}
          >
            {value === null ? '' : show(value)}
          </span>
        );

        if (!isBlank(game, i)) {
          classes.push(typeof given === 'number' ? 'sq--num' : 'sq--sign');
          return (
            <div key={i} className={classes.join(' ')}>
              {content}
            </div>
          );
        }

        classes.push('sq--blank');
        if (typeof given !== 'number') classes.push('sq--op');
        if (value !== null) classes.push('sq--filled');
        if (i === selectedSquare) classes.push('sq--selected');
        if (selectedTile !== undefined && fits(game, selectedTile, i))
          classes.push('sq--target');
        return (
          <button
            key={i}
            className={classes.join(' ')}
            onClick={() => onSquare(i)}
            disabled={game.solved}
            aria-label={`${t.square(Math.floor(i / size) + 1, (i % size) + 1)}, ${spoken(value)}`}
          >
            {content}
          </button>
        );
      })}
    </div>
  );
}

export function Tiles({
  game,
  selected,
  onTile,
  t,
}: {
  game: Game;
  selected?: number;
  onTile: (tile: number) => void;
  t: Strings;
}) {
  return (
    <div className='tiles' aria-label={t.pickTile}>
      {game.tiles.map((v, k) => {
        // A placed tile leaves a gap, so the others don't jump about.
        if (game.placed.includes(k))
          return <span key={k} className='tile tile--gap' />;
        const classes = ['tile'];
        if (typeof v !== 'number') classes.push('tile--op');
        if (k === selected) classes.push('tile--on');
        return (
          <button
            key={k}
            className={classes.join(' ')}
            onClick={() => onTile(k)}
            aria-pressed={k === selected}
            aria-label={typeof v === 'number' ? String(v) : t.ops[v]}
          >
            {show(v)}
          </button>
        );
      })}
    </div>
  );
}
