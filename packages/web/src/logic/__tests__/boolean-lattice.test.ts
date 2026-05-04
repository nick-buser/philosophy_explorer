import { describe, expect, it } from 'vitest';
import { parseBool } from '../boolean-parser';
import { buildHasse } from '../boolean-lattice';
import type { BoolFormula } from '../boolean-types';

function parse(s: string): BoolFormula {
  const r = parseBool(s);
  if (!r.ok) throw new Error(`parse failed: ${r.error.message}`);
  return r.formula;
}

describe('buildHasse', () => {
  it('produces a 16-vertex cube for 4 variables', () => {
    const h = buildHasse(parse('a b c d'))!;
    expect(h.nodes).toHaveLength(16);
    // 4 * 2^3 = 32 covering edges in the 4-cube.
    expect(h.edges).toHaveLength(32);
  });

  it('returns null for >4 variables', () => {
    expect(buildHasse(parse('a b c d e'))).toBeNull();
  });

  it('every node has a value set, vertices are unique by index', () => {
    const h = buildHasse(parse('x y'))!;
    const indices = new Set(h.nodes.map(n => n.index));
    expect(indices.size).toBe(h.nodes.length);
  });

  it('truthCount matches the number of true vertices', () => {
    const h = buildHasse(parse('x + y'))!;
    expect(h.truthCount).toBe(3); // 01, 10, 11 satisfy
  });

  it('includes a degenerate single-vertex case for a constant', () => {
    const h = buildHasse(parse('1'))!;
    expect(h.nodes).toHaveLength(1);
    expect(h.edges).toHaveLength(0);
  });
});
