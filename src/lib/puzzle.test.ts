import { describe, expect, it } from 'vitest';

import {
  backwardness,
  canSolveStepByStep,
  generate,
  LEVELS,
  RULES,
  type Op,
  type Puzzle,
  type Square,
  type Value,
} from './puzzle';

// A small seeded random number generator, so failures can be replayed.
function seeded(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Plain arithmetic, written apart from the game's own.
function truth(a: Square, op: Square, b: Square, c: Square) {
  if (typeof a !== 'number' || typeof b !== 'number') return false;
  if (op === '+') return a + b === c;
  if (op === '-') return a - b === c;
  if (op === '×') return a * b === c;
  if (op === '÷') return a === (c as number) * b;
  return false;
}

// Every way to put the tiles in the blanks that makes all lines true,
// counting equal tiles as the same.
function solutions(p: Puzzle, limit = 5): Value[][] {
  const found: Value[][] = [];
  const grid = [...p.solution];
  for (const i of p.blanks) grid[i] = null;
  const left = new Map<Value, number>();
  for (const t of p.tiles) left.set(t, (left.get(t) ?? 0) + 1);

  const ok = () =>
    p.lines.every((line) => {
      const [a, op, b, , c] = line.map((i) => grid[i]);
      if ([a, op, b, c].includes(null)) return true;
      return truth(a, op, b, c);
    });

  const go = (k: number) => {
    if (found.length >= limit) return;
    if (k === p.blanks.length) {
      found.push(p.blanks.map((i) => grid[i] as Value));
      return;
    }
    const i = p.blanks[k];
    for (const [v, n] of left) {
      if (!n) continue;
      grid[i] = v;
      left.set(v, n - 1);
      if (ok()) go(k + 1);
      left.set(v, n);
      grid[i] = null;
    }
  };
  go(0);
  return found;
}

const show = (p: Puzzle) =>
  Array.from({ length: p.size }, (_, r) =>
    p.solution
      .slice(r * p.size, (r + 1) * p.size)
      .map((v, c) =>
        p.blanks.includes(r * p.size + c)
          ? '_'.padStart(3)
          : String(v ?? '.').padStart(3)
      )
      .join('')
  ).join('\n');

describe('generated puzzles', () => {
  for (const level of LEVELS) {
    it(`on level ${level} have one answer, inside the rules`, () => {
      const rules = RULES[level];
      const rng = seeded(level * 1000);
      for (let n = 0; n < 150; n++) {
        const p = generate(level, rng);
        const where = `\n${show(p)}`;

        // The given grid adds up.
        for (const line of p.lines) {
          const [a, op, b, eq, c] = line.map((i) => p.solution[i]);
          expect(eq, where).toBe('=');
          expect(rules.ops, where).toContain(op);
          expect(truth(a, op, b, c), where).toBe(true);
          for (const v of [a, b, c]) {
            expect(v, where).toBeGreaterThanOrEqual(1);
            expect(v, where).toBeLessThanOrEqual(rules.max);
          }
          if (op === '×' || op === '÷') {
            const [x, y] = op === '×' ? [a, b] : [b, c];
            for (const f of [x, y] as number[]) {
              expect(f, where).toBeGreaterThanOrEqual(2);
              expect(f, where).toBeLessThanOrEqual(rules.table);
            }
          }
        }
        const ops = p.lines.map((l) => p.solution[l[1]] as Op);
        for (const op of rules.must) expect(ops, where).toContain(op);

        // The tiles are exactly what's missing.
        const missing = p.blanks.map((i) => p.solution[i] as Value);
        expect([...p.tiles].sort(), where).toEqual(missing.sort());
        // Only numbers are missing; the operators are always given.
        for (const t of p.tiles) expect(typeof t, where).toBe('number');
        expect(p.tiles.length, where).toBeGreaterThanOrEqual(rules.blanks[0]);
        expect(p.tiles.length, where).toBeLessThanOrEqual(rules.blanks[1]);

        // Every line has something to fill in.
        for (const line of p.lines) {
          expect(
            line.some((i) => p.blanks.includes(i)),
            where
          ).toBe(true);
        }

        // One answer, found without guessing.
        expect(solutions(p), where).toHaveLength(1);
        expect(canSolveStepByStep(p.solution, p.lines, p.blanks)).toBe(true);
        if (rules.backwards) {
          const back = p.blanks.filter(
            (i) => backwardness(i, p.lines, p.solution) > 0
          );
          expect(back.length / p.blanks.length, where).toBeGreaterThan(0.6);
        }
        if (rules.onePerLine) {
          for (const line of p.lines) {
            const n = line.filter((i) => p.blanks.includes(i)).length;
            expect(n, where).toBeLessThanOrEqual(1);
          }
        }
      }
    });
  }

  it('is quick enough to make on a phone', () => {
    const start = performance.now();
    for (const level of LEVELS) for (let n = 0; n < 20; n++) generate(level);
    expect((performance.now() - start) / (LEVELS.length * 20)).toBeLessThan(25);
  });
});

describe('backwardness', () => {
  // 8 ÷ 2 = 4
  const solution: Square[] = [8, '÷', 2, '=', 4];
  const lines = [[0, 1, 2, 3, 4]];
  it('is 0 for an answer, more on the left, most in − and ÷', () => {
    expect(backwardness(4, lines, solution)).toBe(0);
    expect(backwardness(0, lines, solution)).toBe(2);
    const plus: Square[] = [8, '+', 2, '=', 10];
    expect(backwardness(0, lines, plus)).toBe(1);
  });
});

describe('step by step', () => {
  it('needs an operator to be the only one that fits', () => {
    // 2 ? 2 = 4 could be + or ×.
    const solution: Square[] = [2, '+', 2, '=', 4];
    expect(canSolveStepByStep(solution, [[0, 1, 2, 3, 4]], [1])).toBe(false);
    const other: Square[] = [6, '-', 2, '=', 4];
    expect(canSolveStepByStep(other, [[0, 1, 2, 3, 4]], [1])).toBe(true);
  });

  it("can't work out two missing squares in one line alone", () => {
    const solution: Square[] = [3, '+', 4, '=', 7];
    expect(canSolveStepByStep(solution, [[0, 1, 2, 3, 4]], [0, 2])).toBe(false);
  });
});
