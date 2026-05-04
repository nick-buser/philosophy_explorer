import { describe, expect, it } from 'vitest';
import { parseBool } from '../boolean-parser';
import { renderUnicode } from '../boolean-render';
import type { BoolFormula } from '../boolean-types';

function parse(s: string): BoolFormula {
  const r = parseBool(s);
  if (!r.ok) throw new Error(`parse failed: ${r.error.message} at ${r.error.position}`);
  return r.formula;
}

function render(s: string): string {
  return renderUnicode(parse(s));
}

describe('boolean-parser', () => {
  it('parses single-letter atoms', () => {
    expect(parse('x')).toEqual({ kind: 'var', name: 'x' });
  });

  it('parses constants', () => {
    expect(parse('0')).toEqual({ kind: 'zero' });
    expect(parse('1')).toEqual({ kind: 'one' });
    expect(parse('⊥')).toEqual({ kind: 'zero' });
    expect(parse('⊤')).toEqual({ kind: 'one' });
  });

  it('parses juxtaposition as conjunction', () => {
    expect(render('xy')).toBe('xy');
    expect(render('x y')).toBe('xy');
    expect(render('x · y')).toBe('xy');
    expect(render('x*y')).toBe('xy');
  });

  it('parses + as disjunction', () => {
    expect(render('x + y')).toBe('x + y');
    expect(render('x|y')).toBe('x + y');
  });

  it('parses both spellings of NOT', () => {
    expect(render('~x')).toBe('x′');
    expect(render('!x')).toBe('x′');
    expect(render('¬x')).toBe('x′');
    expect(render("x'")).toBe('x′');
    // Postfix primes stack literally in the AST; the simplifier
    // cancels them via double-negation, but the parser does not.
    expect(render("x''")).toBe('(x′)′');
  });

  it('respects precedence: AND tighter than OR', () => {
    // x + y z reads as x + (y · z)
    const f = parse('x + y z');
    expect(f.kind).toBe('or');
  });

  it('parses XOR via ^', () => {
    expect(render('x ^ y')).toBe('x ⊕ y');
  });

  it('parses implication', () => {
    expect(render('x -> y')).toBe('x → y');
  });

  it('parses biconditional', () => {
    expect(render('x <-> y')).toBe('x ↔ y');
  });

  it('handles parentheses', () => {
    // (x + y) z parses as (x + y) · z
    const f = parse('(x + y) z');
    expect(f.kind).toBe('and');
  });

  it('supports De Morgan as a single expression', () => {
    expect(render('~(x y) <-> ~x + ~y')).toBe('(xy)′ ↔ x′ + y′');
  });

  it("rejects multi-letter identifiers — 'xy' is not a single atom", () => {
    // It does parse, but as juxtaposition (and). Confirm by checking the
    // shape rather than the spelling.
    const f = parse('xy');
    expect(f.kind).toBe('and');
  });

  it('reports a parse error for empty input', () => {
    const r = parseBool('');
    expect(r.ok).toBe(false);
  });

  it('reports a parse error for unbalanced parens', () => {
    const r = parseBool('(x + y');
    expect(r.ok).toBe(false);
  });
});