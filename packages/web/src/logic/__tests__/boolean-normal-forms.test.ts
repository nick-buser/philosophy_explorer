import { describe, expect, it } from 'vitest';
import { parseBool } from '../boolean-parser';
import { toAnf, toCnf, toDnf } from '../boolean-normal-forms';
import { areEquivalent } from '../boolean-truth-table';
import type { BoolFormula } from '../boolean-types';

function parse(s: string): BoolFormula {
  const r = parseBool(s);
  if (!r.ok) throw new Error(`parse failed: ${r.error.message}`);
  return r.formula;
}

describe('boolean-normal-forms', () => {
  it('DNF of a tautology is equivalent to 1', () => {
    expect(areEquivalent(toDnf(parse('x + ~x')), { kind: 'one' })).toBe(true);
  });

  it('DNF of a contradiction is the literal 0', () => {
    // No minterms ⇒ DNF returns ⊥ explicitly.
    expect(toDnf(parse('x ~x'))).toEqual({ kind: 'zero' });
  });

  it('CNF of a contradiction is equivalent to 0', () => {
    expect(areEquivalent(toCnf(parse('x ~x')), { kind: 'zero' })).toBe(true);
  });

  it('CNF of a tautology is the literal 1', () => {
    // No maxterms ⇒ CNF returns ⊤ explicitly.
    expect(toCnf(parse('x + ~x'))).toEqual({ kind: 'one' });
  });

  it('DNF, CNF, ANF are equivalent to the original', () => {
    const cases = ['x + y', 'x y + ~x z', '(x + y) z', 'x ^ y'];
    for (const src of cases) {
      const f = parse(src);
      expect(areEquivalent(f, toDnf(f)), `DNF ≡ ${src}`).toBe(true);
      expect(areEquivalent(f, toCnf(f)), `CNF ≡ ${src}`).toBe(true);
      expect(areEquivalent(f, toAnf(f)), `ANF ≡ ${src}`).toBe(true);
    }
  });

  it('ANF of XOR is x ⊕ y', () => {
    const anf = toAnf(parse('x ^ y'));
    // Top node should be xor with operands x and y (in some order).
    expect(anf.kind).toBe('xor');
  });
});
