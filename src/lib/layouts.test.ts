import { describe, expect, it } from 'vitest';

import { layoutsFor, parse, SHAPES, transpose } from './layouts';

describe('layouts', () => {
  it('reads every line of a shape', () => {
    const layout = parse(['N?N=N', '?....', 'N....', '=....', 'N....']);
    expect(layout.size).toBe(5);
    expect(layout.lines).toEqual([
      [0, 1, 2, 3, 4],
      [0, 5, 10, 15, 20],
    ]);
  });

  it('turns a shape over', () => {
    expect(transpose(['N?N=N', '?....', 'N....', '=....', 'N....'])).toEqual([
      'N?N=N',
      '?....',
      'N....',
      '=....',
      'N....',
    ]);
    expect(transpose(['N?', '..'])).toEqual(['N.', '?.']);
  });

  it('refuses lines that are not N ? N = N', () => {
    expect(() => parse(['N?N=N?N', ...Array(6).fill('.......')])).toThrow();
    expect(() => parse(['N=N?N', ...Array(4).fill('.....')])).toThrow();
    expect(() => parse(['NN...', ...Array(4).fill('.....')])).toThrow();
  });

  it('has valid shapes with the right number of lines on every level', () => {
    const lineCounts = [[2], [4], [6], [7, 8], [10]];
    SHAPES.forEach((shapes, k) => {
      for (const layout of layoutsFor(k + 1)) {
        expect(lineCounts[k]).toContain(layout.lines.length);
      }
      expect(layoutsFor(k + 1).length).toBeGreaterThanOrEqual(shapes.length);
    });
  });

  it('only has shapes where every line is joined to the rest', () => {
    for (let level = 1; level <= SHAPES.length; level++) {
      for (const { lines } of layoutsFor(level)) {
        const seen = new Set([0]);
        let grew = true;
        while (grew) {
          grew = false;
          lines.forEach((l, k) => {
            if (seen.has(k)) return;
            if ([...seen].some((s) => lines[s].some((i) => l.includes(i)))) {
              seen.add(k);
              grew = true;
            }
          });
        }
        expect(seen.size).toBe(lines.length);
      }
    }
  });
});
