import { layoutsFor, type Layout } from './layouts';

export const OPS = ['+', '-', '×', '÷'] as const;
export type Op = (typeof OPS)[number];
export type Value = number | Op;
export type Square = Value | '=' | null;

export const LEVELS = [1, 2, 3, 4] as const;
export type Level = (typeof LEVELS)[number];

type Rules = {
  ops: Op[];
  must: Op[]; // operators every puzzle on the level has
  max: number; // the largest number, answers included
  table: number; // × and ÷ stay inside this times table
  blanks: [number, number]; // how many numbers are missing, at least/most
  opBlanks: number; // how many operators are missing
  onePerLine: boolean; // at most one missing number in a line
};

export const RULES: Record<Level, Rules> = {
  1: {
    ops: ['+', '-'],
    must: [],
    max: 10,
    table: 0,
    blanks: [2, 2],
    opBlanks: 0,
    onePerLine: true,
  },
  2: {
    ops: ['+', '-'],
    must: [],
    max: 20,
    table: 0,
    blanks: [3, 4],
    opBlanks: 0,
    onePerLine: true,
  },
  3: {
    ops: ['+', '-', '×'],
    must: ['×'],
    max: 50,
    table: 10,
    blanks: [4, 5],
    opBlanks: 0,
    onePerLine: false,
  },
  4: {
    ops: ['+', '-', '×', '÷'],
    must: ['×', '÷'],
    max: 100,
    table: 10,
    blanks: [5, 6],
    opBlanks: 2,
    onePerLine: false,
  },
};

export type Puzzle = {
  level: Level;
  size: number;
  solution: Square[]; // by cell index, row by row
  lines: number[][]; // cell indices of each line: a, op, b, =, c
  blanks: number[]; // the squares to fill in
  tiles: Value[]; // what goes in them, in order: numbers, then operators
};

export type Rng = () => number;

// Shows a value the way it's written by hand: a real minus sign.
export const show = (v: Value | '=') => (v === '-' ? '−' : String(v));

// What `a op b` comes to, or undefined when it isn't a whole number.
export function calc(a: number, op: Op, b: number): number | undefined {
  if (op === '+') return a + b;
  if (op === '-') return a - b;
  if (op === '×') return a * b;
  return b !== 0 && a % b === 0 ? a / b : undefined;
}

// Every line the level allows with each operator, as [a, b, c]: no
// numbers outside the range, no +0, ×1 or ÷1, and nothing below 1.
export function linesFor(rules: Rules): Record<Op, Triple[]> {
  const out = { '+': [], '-': [], '×': [], '÷': [] } as Record<Op, Triple[]>;
  const { max, table } = rules;
  for (let a = 1; a <= max; a++) {
    for (let b = 1; b <= max; b++) {
      if (a + b <= max) out['+'].push([a, b, a + b]);
      if (a - b >= 1) out['-'].push([a, b, a - b]);
      if (a >= 2 && b >= 2 && a <= table && b <= table && a * b <= max)
        out['×'].push([a, b, a * b]);
      if (b >= 2 && b <= table && a % b === 0 && a / b >= 2 && a / b <= table)
        out['÷'].push([a, b, a / b]);
    }
  }
  return out;
}

type Triple = [number, number, number];

// A level's lines with one operator, also looked up by a, b or c.
type Index = { all: Triple[]; by: Map<number, Triple[]>[] };

function index(lines: Triple[]): Index {
  const by = [0, 1, 2].map(() => new Map<number, Triple[]>());
  for (const t of lines) {
    t.forEach((v, k) => {
      const list = by[k].get(v);
      if (list) list.push(t);
      else by[k].set(v, [t]);
    });
  }
  return { all: lines, by };
}

const pick = <T>(xs: readonly T[], rng: Rng): T =>
  xs[Math.floor(rng() * xs.length)];

function shuffle<T>(xs: readonly T[], rng: Rng): T[] {
  const out = [...xs];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

// Lines in an order where each one crosses one already filled, so the
// numbers it has to match are known as early as possible.
function lineOrder(layout: Layout, rng: Rng): number[] {
  const { lines } = layout;
  const order = [Math.floor(rng() * lines.length)];
  while (order.length < lines.length) {
    const next = shuffle(
      lines.map((_, k) => k),
      rng
    ).find(
      (k) =>
        !order.includes(k) &&
        lines[k].some((i) => order.some((o) => lines[o].includes(i)))
    );
    order.push(next ?? lines.findIndex((_, k) => !order.includes(k)));
  }
  return order;
}

// Puts a true line on every line of the layout, or gives up.
function fill(
  layout: Layout,
  rules: Rules,
  table: Record<Op, Index>,
  rng: Rng
): Square[] | undefined {
  const order = lineOrder(layout, rng);
  const cells: Square[] = layout.kinds.map((k) => (k === 'eq' ? '=' : null));
  let budget = 400;

  const go = (n: number): boolean => {
    if (n === order.length) return true;
    if (--budget < 0) return false;
    const [ia, io, ib, , ic] = layout.lines[order[n]];
    const known = [ia, ib, ic].map((i) => cells[i] as number | null);
    const first = known.findIndex((v) => v !== null);
    for (const op of shuffle(rules.ops, rng)) {
      // Look up by one known number, then check the others.
      const some =
        first < 0
          ? table[op].all
          : (table[op].by[first].get(known[first]!) ?? []);
      const fits = some.filter((t) =>
        known.every((v, k) => v === null || v === t[k])
      );
      // A few tries each, so one bad choice early can't eat the budget.
      for (let k = 0; k < 4 && fits.length; k++) {
        const [a, b, c] = pick(fits, rng);
        const before = [cells[ia], cells[ib], cells[ic]];
        cells[ia] = a;
        cells[io] = op;
        cells[ib] = b;
        cells[ic] = c;
        if (go(n + 1)) return true;
        [cells[ia], cells[ib], cells[ic]] = before;
        cells[io] = null;
      }
    }
    return false;
  };

  if (!go(0)) return undefined;
  const ops = layout.lines.map((l) => cells[l[1]]);
  if (rules.must.some((op) => !ops.includes(op))) return undefined;
  return cells;
}

// The operators that make a line true. Missing operators should have
// exactly one, or a child can't tell which goes where.
export const opsThatFit = (a: number, b: number, c: number) =>
  OPS.filter((op) => calc(a, op, b) === c);

// Whether the missing squares can be worked out one at a time, each from
// a line where it is the only one missing. That also means there is only
// one way to fill them in.
export function canSolveStepByStep(
  solution: Square[],
  lines: number[][],
  blanks: number[]
): boolean {
  const open = new Set(blanks);
  let progress = true;
  while (open.size && progress) {
    progress = false;
    for (const line of lines) {
      const missing = line.filter((i) => open.has(i));
      if (missing.length !== 1) continue;
      const [ia, io, ib, , ic] = line;
      if (missing[0] === io) {
        const [a, b, c] = [ia, ib, ic].map((i) => solution[i] as number);
        if (opsThatFit(a, b, c).length !== 1) continue;
      }
      open.delete(missing[0]);
      progress = true;
    }
  }
  return open.size === 0;
}

function chooseBlanks(
  layout: Layout,
  solution: Square[],
  rules: Rules,
  rng: Rng
): number[] | undefined {
  const { lines, kinds } = layout;
  const [least, most] = rules.blanks;
  // Solving one line at a time fills in one square a line, so there can't
  // be more missing squares than lines.
  const want = Math.min(
    least + Math.floor(rng() * (most - least + 1)),
    lines.length - rules.opBlanks
  );
  const blanks: number[] = [];

  const tryAdd = (i: number) => {
    blanks.push(i);
    if (canSolveStepByStep(solution, lines, blanks)) return true;
    blanks.pop();
    return false;
  };

  // Operators first, from lines where only one operator fits.
  let ops = 0;
  for (const line of shuffle(lines, rng)) {
    if (ops === rules.opBlanks) break;
    const [a, b, c] = [line[0], line[2], line[4]].map(
      (i) => solution[i] as number
    );
    if (opsThatFit(a, b, c).length === 1 && tryAdd(line[1])) ops++;
  }
  if (ops < rules.opBlanks) return undefined;

  let numbers = 0;
  const cells = kinds.flatMap((k, i) => (k === 'num' ? [i] : []));
  for (const i of shuffle(cells, rng)) {
    if (numbers === want) break;
    if (
      rules.onePerLine &&
      lines.some(
        (l) => l.includes(i) && l.some((j) => j !== i && blanks.includes(j))
      )
    )
      continue;
    if (tryAdd(i)) numbers++;
  }
  return numbers === want ? blanks : undefined;
}

const tileOrder = (v: Value) =>
  typeof v === 'number' ? v : 1000 + OPS.indexOf(v);

export function generate(level: Level, rng: Rng = Math.random): Puzzle {
  const rules = RULES[level];
  const all = linesFor(rules);
  const table = Object.fromEntries(
    OPS.map((op) => [op, index(all[op])])
  ) as Record<Op, Index>;
  const layouts = layoutsFor(level);
  for (let attempt = 0; ; attempt++) {
    // Never loop for ever on a phone; the tests check this is never hit.
    if (attempt > 500) throw new Error(`No puzzle for level ${level}`);
    const layout = pick(layouts, rng);
    const solution = fill(layout, rules, table, rng);
    if (!solution) continue;
    const blanks = chooseBlanks(layout, solution, rules, rng);
    if (!blanks) continue;
    const tiles = blanks
      .map((i) => solution[i] as Value)
      .sort((a, b) => tileOrder(a) - tileOrder(b));
    return {
      level,
      size: layout.size,
      solution,
      lines: layout.lines,
      blanks: blanks.sort((a, b) => a - b),
      tiles,
    };
  }
}
