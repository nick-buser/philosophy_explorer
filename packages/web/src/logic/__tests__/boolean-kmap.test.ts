import { describe, expect, it } from 'vitest';
import { parseBool } from '../boolean-parser';
import { buildKMap } from '../boolean-kmap';
import type { BoolFormula } from '../boolean-types';

function parse(s: string): BoolFormula {
  const r = parseBool(s);
  if (!r.ok) throw new Error(`parse failed: ${r.error.message}`);
  return r.formula;
}

describe('buildKMap', () => {
  it('produces a 2×2 grid for a 2-var formula', () => {
    const k = buildKMap(parse('x + y'))!;
    expect(k.cells).toHaveLength(4);
    expect(k.rows.labels).toEqual(['0', '1']);
    expect(k.cols.labels).toEqual(['0', '1']);
  });

  it('produces a 4×4 grid for a 4-var formula', () => {
    const k = buildKMap(parse('a b c + a b ~c + a ~b c d'))!;
    expect(k.cells).toHaveLength(16);
    expect(k.rows.labels).toEqual(['00', '01', '11', '10']);
    expect(k.cols.labels).toEqual(['00', '01', '11', '10']);
  });

  it('returns null for >4 variables', () => {
    expect(buildKMap(parse('a b c d e'))).toBeNull();
  });

  it('every minterm cell is in some prime implicant', () => {
    const k = buildKMap(parse('x y + x z + y z'))!;
    const minterms = k.cells.filter(c => c.value).map(c => c.minterm);
    const covered = new Set<number>();
    for (const pi of k.cover) for (const m of pi.minterms) covered.add(m);
    for (const m of minterms) expect(covered.has(m), `minterm ${m} covered`).toBe(true);
  });

  it('cover is empty for a contradiction', () => {
    const k = buildKMap(parse('x ~x'))!;
    expect(k.cover).toHaveLength(0);
    expect(k.cells.every(c => !c.value)).toBe(true);
  });

  it('cover is a single all-ones implicant for a tautology', () => {
    const k = buildKMap(parse('x + ~x'))!;
    expect(k.cover).toHaveLength(1);
    expect(k.cover[0]!.minterms).toHaveLength(2);
  });

  it('finds the consensus theorem redundancy: x y + ~x z + y z reduces to two PIs', () => {
    // x y + ~x z + y z is equivalent to x y + ~x z (consensus: y z is redundant).
    const k = buildKMap(parse('x y + ~x z + y z'))!;
    expect(k.cover.length).toBe(2);
  });
});
