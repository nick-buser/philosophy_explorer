import { describe, expect, it } from 'vitest';
import { parseBool } from '../boolean-parser';
import { areEquivalent, buildBoolTruthTable } from '../boolean-truth-table';
import type { BoolFormula } from '../boolean-types';

function parse(s: string): BoolFormula {
  const r = parseBool(s);
  if (!r.ok) throw new Error(`parse failed: ${r.error.message}`);
  return r.formula;
}

describe('boolean-truth-table', () => {
  it('classifies tautologies', () => {
    const t = buildBoolTruthTable(parse('x + ~x'));
    expect(t.status).toBe('tautology');
    expect(t.rows.every(r => r.mainValue)).toBe(true);
  });

  it('classifies contradictions', () => {
    const t = buildBoolTruthTable(parse('x ~x'));
    expect(t.status).toBe('contradiction');
    expect(t.rows.every(r => !r.mainValue)).toBe(true);
  });

  it('classifies contingent formulas', () => {
    const t = buildBoolTruthTable(parse('x + y'));
    expect(t.status).toBe('contingent');
  });

  it('produces 2^n rows and exposes valuations per row', () => {
    const t = buildBoolTruthTable(parse('x y z'));
    expect(t.variables).toEqual(['x', 'y', 'z']);
    expect(t.rows).toHaveLength(8);
  });

  it('handles single-variable formulas', () => {
    const t = buildBoolTruthTable(parse('x'));
    expect(t.rows).toHaveLength(2);
  });

  it('lists subformulas before the main formula', () => {
    const t = buildBoolTruthTable(parse('x + y'));
    // Last column is the main formula.
    expect(t.subformulas.length).toBeGreaterThan(t.variables.length);
  });
});

describe('areEquivalent', () => {
  it('is true for De Morgan', () => {
    expect(areEquivalent(parse('~(x y)'), parse('~x + ~y'))).toBe(true);
  });
  it('is false for x and ~x', () => {
    expect(areEquivalent(parse('x'), parse('~x'))).toBe(false);
  });
  it('is true for absorption: x + x y vs x', () => {
    expect(areEquivalent(parse('x + x y'), parse('x'))).toBe(true);
  });
});
