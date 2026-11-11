import { describe, expect, it } from 'vitest';

import {
  backspace,
  bank,
  initialStats,
  lineStates,
  newGame,
  place,
  recordWin,
  squareAt,
  startOver,
  take,
  typeDigit,
  undo,
  upgrade,
  type Game,
} from './game';
import type { Puzzle } from './puzzle';

//  3 + _ = _
//  -
//  _
//  =
//  1
const puzzle: Puzzle = {
  level: 1,
  size: 5,
  // prettier-ignore
  solution: [
    3, '+', 4, '=', 7,
    '-', null, null, null, null,
    2, null, null, null, null,
    '=', null, null, null, null,
    1, null, null, null, null,
  ],
  lines: [
    [0, 1, 2, 3, 4],
    [0, 5, 10, 15, 20],
  ],
  blanks: [2, 4, 10],
  tiles: [2, 4, 7],
};

// A puzzle with a missing operator: 6 _ 2 = 3.
const withOp: Puzzle = {
  level: 4,
  size: 5,
  solution: [6, '÷', 2, '=', 3, ...Array(20).fill(null)],
  lines: [[0, 1, 2, 3, 4]],
  blanks: [1, 2],
  tiles: [2, '÷'],
};

describe('playing', () => {
  it('starts with every tile in the bank', () => {
    const game = newGame(puzzle);
    expect(bank(game)).toEqual([0, 1, 2]);
    expect(squareAt(game, 0)).toBe(3);
    expect(squareAt(game, 2)).toBeNull();
    expect(lineStates(game)).toEqual(['open', 'open']);
  });

  it('puts tiles in squares and takes them back', () => {
    let game = place(newGame(puzzle), 1, 2);
    expect(squareAt(game, 2)).toBe(4);
    expect(bank(game)).toEqual([0, 2]);
    game = take(game, 2);
    expect(squareAt(game, 2)).toBeNull();
    expect(bank(game)).toEqual([0, 1, 2]);
  });

  it('swaps out the tile in the way, and only places tiles from the bank', () => {
    let game = place(newGame(puzzle), 0, 4);
    expect(squareAt(game, 4)).toBe(2);
    expect(place(game, 0, 2)).toBe(game);
    game = place(game, 1, 4);
    expect(squareAt(game, 4)).toBe(4);
    expect(bank(game)).toEqual([0, 2]);
  });

  it("doesn't change the given squares or put an operator in a number", () => {
    const game = newGame(puzzle);
    expect(place(game, 0, 0)).toBe(game);
    expect(place(game, 0, 1)).toBe(game);
    expect(typeDigit(game, 5, 0)).toBe(game);
    const ops = newGame(withOp);
    expect(place(ops, 1, 2)).toBe(ops);
    expect(typeDigit(ops, 5, 1)).toBe(ops);
    expect(place(ops, 0, 1)).toBe(ops);
    expect(squareAt(place(ops, 1, 1), 1)).toBe('÷');
  });

  it('marks full lines right or wrong', () => {
    let game = place(newGame(puzzle), 1, 2); // 3 + 4 = _
    game = place(game, 0, 4); // 3 + 4 = 2
    game = place(game, 2, 10); // 3 - 7 = 1
    expect(lineStates(game)).toEqual(['wrong', 'wrong']);
    expect(game.solved).toBe(false);
  });

  it('is solved when every line is right', () => {
    let game = place(newGame(puzzle), 1, 2);
    game = place(game, 2, 4);
    expect(lineStates(game)).toEqual(['right', 'open']);
    expect(game.solved).toBe(false);
    game = place(game, 0, 10);
    expect(lineStates(game)).toEqual(['right', 'right']);
    expect(game.solved).toBe(true);
    // Nothing moves once it's solved.
    expect(take(game, 10)).toBe(game);
    expect(undo(game)).toBe(game);
  });

  it('fills in a missing operator', () => {
    let game = place(newGame(withOp), 1, 1);
    game = place(game, 0, 2);
    expect(game.solved).toBe(true);
  });

  it('undoes moves one at a time, and Start over too', () => {
    let game = place(newGame(puzzle), 1, 2);
    game = place(game, 2, 4);
    game = startOver(game);
    expect(bank(game)).toEqual([0, 1, 2]);
    game = undo(game);
    expect(squareAt(game, 4)).toBe(7);
    game = undo(game);
    expect(squareAt(game, 4)).toBeNull();
    expect(squareAt(game, 2)).toBe(4);
    game = undo(game);
    expect(game.history).toEqual([]);
    expect(undo(game)).toBe(game);
  });

  it("doesn't add a move that changes nothing", () => {
    const game = newGame(puzzle);
    expect(startOver(game)).toBe(game);
    expect(take(game, 2)).toBe(game);
  });
});

describe('typing', () => {
  it('types numbers digit by digit, and rubs them out', () => {
    let game = typeDigit(newGame(puzzle), 1, 4);
    game = typeDigit(game, 2, 4);
    expect(squareAt(game, 4)).toBe(12);
    game = typeDigit(game, 3, 4);
    expect(typeDigit(game, 4, 4)).toBe(game); // three digits at most
    game = backspace(game, 4);
    game = backspace(game, 4);
    expect(squareAt(game, 4)).toBe(1);
    game = backspace(game, 4);
    expect(squareAt(game, 4)).toBeNull();
    expect(backspace(game, 4)).toBe(game);
  });

  it('solves a puzzle by typing, and undoes digit by digit', () => {
    let game = typeDigit(newGame(puzzle), 4, 2);
    game = typeDigit(game, 7, 4);
    expect(bank(game)).toEqual([0]); // the tiles that were typed are used
    game = typeDigit(game, 9, 10);
    expect(game.solved).toBe(false);
    game = backspace(game, 10);
    game = typeDigit(game, 2, 10);
    expect(game.solved).toBe(true);
  });

  it('keeps a line open while its square is being typed in', () => {
    let game = typeDigit(newGame(puzzle), 4, 2);
    game = typeDigit(game, 5, 4); // 3 + 4 = 5, on the way to 57?
    expect(lineStates(game)).toEqual(['wrong', 'open']);
    expect(lineStates(game, 4)).toEqual(['open', 'open']);
  });

  it('leaves typed numbers with no tile on the board when going back to tiles', () => {
    let game = typeDigit(newGame(puzzle), 9, 2);
    expect(bank(game)).toEqual([0, 1, 2]);
    game = place(game, 1, 2);
    expect(squareAt(game, 2)).toBe(4);
    expect(bank(game)).toEqual([0, 2]);
  });
});

describe('saved games', () => {
  it('upgrades games saved with tile indices', () => {
    const old = {
      ...puzzle,
      placed: [null, null, 1, null, 0, ...Array(20).fill(null)],
      history: [Array(25).fill(null)],
      solved: false,
    };
    const game = upgrade(old as unknown as Game);
    expect(squareAt(game, 2)).toBe(4);
    expect(squareAt(game, 4)).toBe(2);
    expect(bank(game)).toEqual([2]);
    expect(undo(game).entries.every((v) => v === null)).toBe(true);
    expect(upgrade(game)).toBe(game);
  });
});

describe('stats', () => {
  it('counts solved puzzles per level', () => {
    let game = place(newGame(puzzle), 1, 2);
    game = place(game, 2, 4);
    game = place(game, 0, 10);
    const stats = recordWin(recordWin(initialStats, game), game);
    expect(stats.solved[1]).toBe(2);
    expect(stats.solved[4]).toBe(0);
  });
});
