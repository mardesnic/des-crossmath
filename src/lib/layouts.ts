// Grid shapes, drawn as text. N is a number, ? an operator, = an equals
// sign and . an empty square. Every line reads `N ? N = N`, left to right
// or top to bottom, and lines cross only at numbers.

export type Kind = 'num' | 'op' | 'eq';

export type Layout = {
  size: number;
  kinds: (Kind | null)[]; // by cell index, row by row
  lines: number[][]; // cell indices of each line: a, op, b, =, c
};

const KINDS: Record<string, Kind | null> = {
  N: 'num',
  '?': 'op',
  '=': 'eq',
  '.': null,
};

const LINE: Kind[] = ['num', 'op', 'num', 'eq', 'num'];

export function parse(rows: string[]): Layout {
  const size = rows.length;
  if (rows.some((r) => r.length !== size)) throw new Error('Not square');
  const kinds = rows.flatMap((r) =>
    [...r].map((ch) => {
      if (!(ch in KINDS)) throw new Error(`Unknown square ${ch}`);
      return KINDS[ch];
    })
  );

  const lines: number[][] = [];
  const at = (r: number, c: number, across: boolean) =>
    across ? r * size + c : c * size + r;
  for (const across of [true, false]) {
    for (let r = 0; r < size; r++) {
      // Each run of touching squares is a single square (part of a line
      // going the other way) or a whole line.
      let c = 0;
      while (c < size) {
        if (!kinds[at(r, c, across)]) {
          c++;
          continue;
        }
        const run: number[] = [];
        while (c < size && kinds[at(r, c, across)])
          run.push(at(r, c++, across));
        if (run.length === 1) continue;
        if (run.length !== 5 || run.some((i, k) => kinds[i] !== LINE[k]))
          throw new Error(`Bad line at ${run[0]}`);
        lines.push(run);
      }
    }
  }

  // Every square is in a line, and operators and equals in only one.
  kinds.forEach((kind, i) => {
    if (!kind) return;
    const n = lines.filter((l) => l.includes(i)).length;
    if (n === 0 || (kind !== 'num' && n > 1))
      throw new Error(`Square ${i} is in ${n} lines`);
  });

  return { size, kinds, lines };
}

// The same shape turned over its diagonal: rows become columns.
export const transpose = (rows: string[]) =>
  rows.map((_, c) => rows.map((r) => r[c]).join(''));

// Shapes for each level, before turning them over.
export const SHAPES: string[][][] = [
  // Level 1: two lines.
  [
    ['N?N=N', '?....', 'N....', '=....', 'N....'],
    ['N?N=N', '....?', '....N', '....=', '....N'],
    ['N?N=N', '..?..', '..N..', '..=..', '..N..'],
    ['N....', '?....', 'N?N=N', '=....', 'N....'],
  ],
  // Level 2: four lines.
  [
    ['N?N=N', '?.?..', 'N?N=N', '=.=..', 'N.N..'],
    ['N?N=N', '?...?', 'N?N=N', '=...=', 'N...N'],
    ['N?N=N', '?...?', 'N...N', '=...=', 'N?N=N'],
    ['N?N=N', '..?.?', 'N?N=N', '..=.=', '..N.N'],
  ],
  // Level 3: six lines.
  [
    ['N?N=N', '?.?.?', 'N?N=N', '=.=.=', 'N?N=N'],
    [
      'N?N=N..',
      '..?....',
      '..N?N=N',
      '..=...?',
      'N?N=N.N',
      '......=',
      '..N?N=N',
    ],
  ],
  // Level 4: seven or eight lines.
  [
    [
      'N?N=N..',
      '?...?..',
      'N.N?N=N',
      '=.?.=.?',
      'N?N=N.N',
      '..=...=',
      '..N?N=N',
    ],
    [
      'N?N=N..',
      '....?..',
      'N?N=N.N',
      '..?.=.?',
      '..N?N=N',
      '..=...=',
      '..N?N=N',
    ],
  ],
];

export const layoutsFor = (level: number): Layout[] =>
  SHAPES[level - 1].flatMap((rows) => {
    const turned = transpose(rows);
    return turned.join() === rows.join()
      ? [parse(rows)]
      : [parse(rows), parse(turned)];
  });
