import {
  calc,
  LEVELS,
  type Level,
  type Op,
  type Puzzle,
  type Square,
  type Value,
} from './puzzle';

type Entries = (Value | null)[];

export type Game = Puzzle & {
  // What is in each square, by cell index: from a tile or typed in.
  entries: Entries;
  history: Entries[]; // earlier `entries`, for Undo
  solved: boolean;
};

export type LineState = 'open' | 'right' | 'wrong';

export type Stats = { solved: Record<Level, number> };

export const initialStats: Stats = {
  solved: Object.fromEntries(LEVELS.map((l) => [l, 0])) as Record<
    Level,
    number
  >,
};

export const newGame = (puzzle: Puzzle): Game => ({
  ...puzzle,
  entries: puzzle.solution.map(() => null),
  history: [],
  solved: false,
});

// Games saved before typing came in kept tile indices in `placed`.
type OldGame = Puzzle & {
  placed: (number | null)[];
  history: (number | null)[][];
  solved: boolean;
};

export function upgrade(saved: Game | OldGame): Game {
  if ('entries' in saved) return saved;
  const { placed, history, ...rest } = saved;
  const toEntries = (p: (number | null)[]) =>
    p.map((t) => (t === null ? null : saved.tiles[t]));
  return {
    ...rest,
    entries: toEntries(placed),
    history: history.map(toEntries),
  };
}

export const isBlank = (game: Game, i: number) => game.blanks.includes(i);

// What a square shows: its given value, what was put there, or null.
export const squareAt = (game: Game, i: number): Square =>
  isBlank(game, i) ? game.entries[i] : game.solution[i];

const isNumber = (v: Square): v is number => typeof v === 'number';

export function lineState(game: Game, line: number[]): LineState {
  const [a, op, b, , c] = line.map((i) => squareAt(game, i));
  if (a === null || op === null || b === null || c === null) return 'open';
  if (!isNumber(a) || !isNumber(b) || !isNumber(c)) return 'wrong';
  return calc(a, op as Op, b) === c ? 'right' : 'wrong';
}

// Lines through `editing`, a square still being typed in, stay open: 5 on
// the way to 56 isn't a mistake yet.
export const lineStates = (game: Game, editing?: number) =>
  game.lines.map((line) =>
    editing !== undefined && line.includes(editing)
      ? 'open'
      : lineState(game, line)
  );

// Which tiles are on the board: each entry uses up one tile of its value.
// A typed number with no tile of its own uses none.
export function used(game: Game): boolean[] {
  const out = game.tiles.map(() => false);
  for (const i of game.blanks) {
    const v = game.entries[i];
    const t = game.tiles.findIndex((tile, k) => !out[k] && tile === v);
    if (v !== null && t >= 0) out[t] = true;
  }
  return out;
}

// The tiles not on the board yet, by index.
export const bank = (game: Game) => {
  const on = used(game);
  return game.tiles.flatMap((_, t) => (on[t] ? [] : [t]));
};

// Numbers go in number squares, operators in operator squares.
export const fits = (game: Game, v: Value, i: number) =>
  isBlank(game, i) && typeof v === typeof (game.solution[i] as Value);

function commit(game: Game, entries: Entries): Game {
  if (entries.every((v, i) => v === game.entries[i])) return game;
  const next = {
    ...game,
    entries,
    history: [...game.history, game.entries],
  };
  const full = next.blanks.every((i) => entries[i] !== null);
  return {
    ...next,
    solved: full && lineStates(next).every((s) => s === 'right'),
  };
}

// Puts a tile in a square. A tile already in that square goes back to the
// bank.
export function place(game: Game, tile: number, i: number): Game {
  const v = game.tiles[tile];
  if (game.solved || !bank(game).includes(tile) || !fits(game, v, i))
    return game;
  const entries = [...game.entries];
  entries[i] = v;
  return commit(game, entries);
}

// The longest number that can be typed.
export const MAX_DIGITS = 3;

// Types a digit at the end of the number in a square.
export function typeDigit(game: Game, digit: number, i: number): Game {
  const now = game.entries[i];
  if (game.solved || !fits(game, digit, i)) return game;
  const before = typeof now === 'number' ? String(now) : '';
  if (before.length >= MAX_DIGITS) return game;
  const entries = [...game.entries];
  entries[i] = Number(before + digit);
  return commit(game, entries);
}

// Rubs out the last digit of the number in a square.
export function backspace(game: Game, i: number): Game {
  const now = game.entries[i];
  if (game.solved || typeof now !== 'number') return game;
  const entries = [...game.entries];
  entries[i] = now >= 10 ? Math.floor(now / 10) : null;
  return commit(game, entries);
}

// Empties a square; a tile in it goes back to the bank.
export function take(game: Game, i: number): Game {
  if (game.solved || game.entries[i] === null) return game;
  const entries = [...game.entries];
  entries[i] = null;
  return commit(game, entries);
}

// Clears the board. It can be undone, in case it was tapped by mistake.
export const startOver = (game: Game): Game =>
  game.solved
    ? game
    : commit(
        game,
        game.entries.map(() => null)
      );

export function undo(game: Game): Game {
  const last = game.history.at(-1);
  if (!last || game.solved) return game;
  return { ...game, entries: last, history: game.history.slice(0, -1) };
}

export const recordWin = (stats: Stats, game: Game): Stats => ({
  solved: {
    ...initialStats.solved,
    ...stats.solved,
    [game.level]: (stats.solved[game.level] ?? 0) + 1,
  },
});
