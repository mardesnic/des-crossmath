import {
  calc,
  LEVELS,
  type Level,
  type Op,
  type Puzzle,
  type Square,
  type Value,
} from './puzzle';

export type Game = Puzzle & {
  placed: (number | null)[]; // the tile in each square, by cell index
  history: (number | null)[][]; // earlier `placed`, for Undo
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
  placed: puzzle.solution.map(() => null),
  history: [],
  solved: false,
});

export const isBlank = (game: Game, i: number) => game.blanks.includes(i);

// What a square shows: its given value, the tile put there, or null.
export function squareAt(game: Game, i: number): Square {
  if (!isBlank(game, i)) return game.solution[i];
  const tile = game.placed[i];
  return tile === null ? null : game.tiles[tile];
}

const isNumber = (v: Square): v is number => typeof v === 'number';

export function lineState(game: Game, line: number[]): LineState {
  const [a, op, b, , c] = line.map((i) => squareAt(game, i));
  if (a === null || op === null || b === null || c === null) return 'open';
  if (!isNumber(a) || !isNumber(b) || !isNumber(c)) return 'wrong';
  return calc(a, op as Op, b) === c ? 'right' : 'wrong';
}

export const lineStates = (game: Game) =>
  game.lines.map((line) => lineState(game, line));

// The tiles not on the board yet, by index.
export const bank = (game: Game) =>
  game.tiles.flatMap((_, t) => (game.placed.includes(t) ? [] : [t]));

// Numbers go in number squares, operators in operator squares.
export const fits = (game: Game, tile: number, i: number) =>
  isBlank(game, i) &&
  typeof game.tiles[tile] === typeof (game.solution[i] as Value);

function commit(game: Game, placed: (number | null)[]): Game {
  if (placed.every((t, i) => t === game.placed[i])) return game;
  const next = {
    ...game,
    placed,
    history: [...game.history, game.placed],
  };
  const full = next.blanks.every((i) => placed[i] !== null);
  return {
    ...next,
    solved: full && lineStates(next).every((s) => s === 'right'),
  };
}

// Puts a tile in a square. A tile already in that square goes back to the
// bank, and a tile already on the board moves.
export function place(game: Game, tile: number, i: number): Game {
  if (game.solved || !fits(game, tile, i)) return game;
  const placed = game.placed.map((t) => (t === tile ? null : t));
  placed[i] = tile;
  return commit(game, placed);
}

// Takes the tile in a square back to the bank.
export function take(game: Game, i: number): Game {
  if (game.solved || game.placed[i] === null) return game;
  const placed = [...game.placed];
  placed[i] = null;
  return commit(game, placed);
}

// Clears the board. It can be undone, in case it was tapped by mistake.
export const startOver = (game: Game): Game =>
  game.solved
    ? game
    : commit(
        game,
        game.placed.map(() => null)
      );

export function undo(game: Game): Game {
  const last = game.history.at(-1);
  if (!last || game.solved) return game;
  return { ...game, placed: last, history: game.history.slice(0, -1) };
}

export const recordWin = (stats: Stats, game: Game): Stats => ({
  solved: {
    ...initialStats.solved,
    ...stats.solved,
    [game.level]: (stats.solved[game.level] ?? 0) + 1,
  },
});
