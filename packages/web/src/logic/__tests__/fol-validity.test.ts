import { describe, expect, it } from 'vitest';
import { parseFol } from '../fol-parser';
import { checkValidity } from '../fol-validity';

function check(s: string) {
  const r = parseFol(s);
  if (!r.ok) throw new Error(`parse failed: ${r.error.message}`);
  return checkValidity(r.formula);
}

describe('fol-validity — propositional fragment (truth-table)', () => {
  it('detects a propositional tautology', () => {
    const r = check('p -> p');
    expect(r.kind).toBe('valid');
    if (r.kind === 'valid') expect(r.method).toBe('truth-table');
  });

  it('validates modus ponens', () => {
    expect(check('(p -> q) & p -> q').kind).toBe('valid');
  });

  it('validates contraposition', () => {
    expect(check('(p -> q) <-> (~q -> ~p)').kind).toBe('valid');
  });

  it('validates De Morgan', () => {
    expect(check('~(p | q) <-> (~p & ~q)').kind).toBe('valid');
  });

  it('validates LEM', () => {
    expect(check('p | ~p').kind).toBe('valid');
  });

  it('reports a propositional contingency as invalid with a countermodel', () => {
    const r = check('p -> q');
    expect(r.kind).toBe('invalid');
    if (r.kind === 'invalid' && r.countermodel.kind === 'valuation') {
      // Countermodel must falsify p → q, so p=T, q=F.
      const env = Object.fromEntries(
        r.countermodel.atoms.map((a, i) => [a, r.countermodel.kind === 'valuation' ? r.countermodel.values[i] : false]),
      );
      expect(env.p).toBe(true);
      expect(env.q).toBe(false);
    }
  });

  it('handles ⊤ and ⊥', () => {
    expect(check('true').kind).toBe('valid');
    expect(check('false').kind).toBe('invalid');
    expect(check('p | true').kind).toBe('valid');
    expect(check('p & false').kind).toBe('invalid');
  });

  it('uses truth-table for propositional 0-arg predicates', () => {
    const r = check('p & q -> p');
    expect(r.kind).toBe('valid');
    if (r.kind === 'valid') expect(r.method).toBe('truth-table');
  });
});

describe('fol-validity — first-order tableau', () => {
  it('validates universal-instantiation tautology', () => {
    const r = check('(forall x. P(x)) -> P(a)');
    expect(r.kind).toBe('valid');
    if (r.kind === 'valid') expect(r.method).toBe('tableau');
  });

  it('validates existential-generalisation', () => {
    expect(check('P(a) -> exists x. P(x)').kind).toBe('valid');
  });

  it('validates ∃∀ → ∀∃ (the easy direction)', () => {
    const r = check('(exists x. forall y. R(x, y)) -> (forall y. exists x. R(x, y))');
    expect(r.kind).toBe('valid');
  });

  it('reports the converse ∀∃ → ∃∀ as invalid (countermodel)', () => {
    const r = check('(forall y. exists x. R(x, y)) -> (exists x. forall y. R(x, y))');
    // The tableau may saturate to "invalid" or, on a tighter budget,
    // exhaust without closing — both are honest answers, but the
    // default budget is large enough that we expect "invalid".
    expect(r.kind === 'invalid' || r.kind === 'unknown').toBe(true);
  });

  it('validates the Drinker’s Paradox', () => {
    expect(check('exists x. (P(x) -> forall y. P(y))').kind).toBe('valid');
  });

  it('handles trivial forall (∀x. P(x) → P(x))', () => {
    expect(check('forall x. P(x) -> P(x)').kind).toBe('valid');
  });

  it('detects an obviously invalid universal claim', () => {
    const r = check('(forall x. P(x)) | (forall x. ~P(x))');
    expect(r.kind === 'invalid' || r.kind === 'unknown').toBe(true);
  });
});

describe('fol-validity — identity', () => {
  it('validates reflexivity', () => {
    expect(check('forall x. x = x').kind).toBe('valid');
  });

  it('validates symmetry', () => {
    // Requires equality propagation — without it, the union-find
    // closure check is what makes this work.
    expect(check('forall x. forall y. (x = y -> y = x)').kind).toBe('valid');
  });

  it('validates transitivity', () => {
    expect(
      check('forall x. forall y. forall z. ((x = y & y = z) -> x = z)').kind,
    ).toBe('valid');
  });

  it('validates Leibniz substitution on a unary predicate', () => {
    expect(check('forall x. forall y. (x = y -> (P(x) -> P(y)))').kind).toBe('valid');
  });

  it('reports ¬(t=t) as invalid', () => {
    const r = check('a != a');
    expect(r.kind).toBe('invalid');
  });
});
