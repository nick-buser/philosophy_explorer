import { describe, expect, it } from 'vitest';
import { parseBool } from '../boolean-parser';
import { simplify } from '../boolean-simplify';
import { canonicalKey, evalBool, collectVariables } from '../boolean-types';
import type { BoolFormula } from '../boolean-types';

function parse(s: string): BoolFormula {
  const r = parseBool(s);
  if (!r.ok) throw new Error(`parse failed: ${r.error.message}`);
  return r.formula;
}

function simplifyFor(s: string) {
  return simplify(parse(s));
}

// Simplification must preserve truth across every valuation.
function tableMatches(a: BoolFormula, b: BoolFormula): boolean {
  const variables = [...new Set([...collectVariables(a), ...collectVariables(b)])].sort();
  const total = variables.length === 0 ? 1 : 1 << variables.length;
  for (let i = 0; i < total; i++) {
    const env: Record<string, boolean> = {};
    for (let j = 0; j < variables.length; j++) {
      env[variables[j]!] = ((i >> j) & 1) === 1;
    }
    if (evalBool(a, env) !== evalBool(b, env)) return false;
  }
  return true;
}

describe('boolean-simplify', () => {
  it('reduces tautologies to 1', () => {
    expect(canonicalKey(simplifyFor('x + ~x').final)).toBe('1');
    expect(canonicalKey(simplifyFor('1').final)).toBe('1');
  });

  it('reduces contradictions to 0', () => {
    expect(canonicalKey(simplifyFor('x ~x').final)).toBe('0');
    expect(canonicalKey(simplifyFor('0').final)).toBe('0');
  });

  it('applies double-negation', () => {
    expect(canonicalKey(simplifyFor('~~x').final)).toBe('x');
  });

  it('applies absorption: x + x y → x', () => {
    expect(canonicalKey(simplifyFor('x + x y').final)).toBe('x');
  });

  it('applies absorption: x · (x + y) → x', () => {
    expect(canonicalKey(simplifyFor('x (x + y)').final)).toBe('x');
  });

  it('applies De Morgan and continues', () => {
    // ~(x · y) → ~x + ~y; both branches stay around.
    const r = simplifyFor('~(x y)');
    expect(r.steps.some(s => s.rule === 'demorgan-and')).toBe(true);
  });

  it('eliminates implication then absorption: x -> x → 1', () => {
    expect(canonicalKey(simplifyFor('x -> x').final)).toBe('1');
  });

  it('preserves truth across every valuation it touches', () => {
    const cases = ['x + x y', '~(x y)', 'x -> x', 'x ^ x', 'x ^ y', '(x + y) z'];
    for (const src of cases) {
      const initial = parse(src);
      const r = simplify(initial);
      expect(tableMatches(initial, r.final), `${src} truth-preserving`).toBe(true);
    }
  });

  it('terminates with an empty trace at a fixed point', () => {
    const r = simplifyFor('x + y');
    expect(r.steps.length).toBe(0);
  });
});