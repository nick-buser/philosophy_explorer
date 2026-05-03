import { describe, expect, it } from 'vitest';
import { parseFol } from '../fol-parser';
import { renderUnicode, renderKatex } from '../fol-render';

function unicode(s: string): string {
  const r = parseFol(s);
  if (!r.ok) throw new Error('parse failed');
  return renderUnicode(r.formula);
}

function katex(s: string): string {
  const r = parseFol(s);
  if (!r.ok) throw new Error('parse failed');
  return renderKatex(r.formula);
}

describe('fol-render — unicode', () => {
  it('uses ∀/∃ glyphs', () => {
    expect(unicode('forall x. P(x)')).toBe('∀x. P(x)');
    expect(unicode('exists x. P(x)')).toBe('∃x. P(x)');
  });

  it('uses ¬ ∧ ∨ → ↔', () => {
    expect(unicode('~(p & q)')).toBe('¬(p ∧ q)');
    expect(unicode('p | q')).toBe('p ∨ q');
    expect(unicode('p -> q')).toBe('p → q');
    expect(unicode('p <-> q')).toBe('p ↔ q');
  });

  it('renders ¬(t=u) as t ≠ u', () => {
    expect(unicode('a != b')).toBe('a ≠ b');
  });

  it('parenthesises a quantifier on the LEFT of a binary connective', () => {
    expect(unicode('(forall x. P(x)) -> Q(a)')).toBe('(∀x. P(x)) → Q(a)');
  });

  it('does NOT parenthesise a wide-scope quantifier on the RIGHT', () => {
    // P(a) → ∀x. Q(x) is unambiguous: the dot marks the scope.
    expect(unicode('P(a) -> forall x. Q(x)')).toBe('P(a) → ∀x. Q(x)');
  });

  it('does NOT parenthesise a quantifier under negation', () => {
    expect(unicode('~forall x. P(x)')).toBe('¬∀x. P(x)');
  });
});

describe('fol-render — katex', () => {
  it('emits TeX commands for the operators', () => {
    const t = katex('forall x. P(x) -> Q(x)');
    expect(t).toContain('\\forall');
    expect(t).toContain('\\to');
  });

  it('wraps multi-letter predicate names in \\mathrm', () => {
    expect(katex('Even(x)')).toContain('\\mathrm{Even}');
  });

  it('leaves single-letter predicates unchanged', () => {
    expect(katex('P(x)')).toContain('P(x)');
    expect(katex('P(x)')).not.toContain('\\mathrm{P}');
  });

  it('emits \\neq for non-identity', () => {
    expect(katex('a != b')).toContain('\\neq');
  });
});
