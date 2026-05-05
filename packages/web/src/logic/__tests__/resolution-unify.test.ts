import { describe, expect, it } from 'vitest';
import { applyAtom, applyTerm, compose, freshenRule, unifyAtoms, unifyTerms } from '../resolution-unify';
import { formatTerm, type Atom, type Substitution, type Term } from '../resolution-types';

const v = (name: string): Term => ({ kind: 'var', name });
const c = (name: string): Term => ({ kind: 'const', name });
const f = (functor: string, ...args: Term[]): Term => ({ kind: 'compound', functor, args });
const a = (predicate: string, ...args: Term[]): Atom => ({ predicate, args });

function fmtSubst(s: Substitution | null): string {
  if (s === null) return 'null';
  const entries = Array.from(s.entries()).sort(([a], [b]) => a.localeCompare(b));
  return entries.map(([k, v]) => `${k}=${formatTerm(v)}`).join(', ');
}

describe('resolution-unify — primitives', () => {
  it('unifies two identical constants', () => {
    expect(fmtSubst(unifyTerms(c('a'), c('a')))).toBe('');
  });

  it('rejects two different constants', () => {
    expect(unifyTerms(c('a'), c('b'))).toBeNull();
  });

  it('binds a variable to a constant', () => {
    expect(fmtSubst(unifyTerms(v('X'), c('a')))).toBe('X=a');
  });

  it('binds a variable to a variable (one-way only)', () => {
    expect(fmtSubst(unifyTerms(v('X'), v('Y')))).toBe('X=Y');
  });

  it('unifies compound terms element-wise', () => {
    const r = unifyTerms(f('p', v('X'), c('b')), f('p', c('a'), v('Y')));
    expect(fmtSubst(r)).toBe('X=a, Y=b');
  });

  it('rejects different functors', () => {
    expect(unifyTerms(f('p', v('X')), f('q', v('X')))).toBeNull();
  });

  it('rejects different arities', () => {
    expect(unifyTerms(f('p', v('X')), f('p', v('X'), v('Y')))).toBeNull();
  });

  it('respects the occurs check', () => {
    expect(unifyTerms(v('X'), f('p', v('X')))).toBeNull();
  });

  it('chains bindings via walk', () => {
    // Unify p(X, Y) with p(Y, a): X bound to Y, Y bound to a, so X = a transitively
    const r = unifyAtoms(a('p', v('X'), v('Y')), a('p', v('Y'), c('a')));
    expect(r).not.toBeNull();
    // Apply the substitution to X — should chase through to a.
    expect(formatTerm(applyTerm(r!, v('X')))).toBe('a');
    expect(formatTerm(applyTerm(r!, v('Y')))).toBe('a');
  });
});

describe('resolution-unify — atoms', () => {
  it('unifies two atoms with the same predicate and matching arity', () => {
    expect(fmtSubst(unifyAtoms(a('p', c('a'), v('Y')), a('p', v('X'), c('b')))))
      .toBe('X=a, Y=b');
  });

  it('rejects atoms with different predicates', () => {
    expect(unifyAtoms(a('p', v('X')), a('q', v('X')))).toBeNull();
  });
});

describe('resolution-unify — apply / compose', () => {
  it('apply substitutes variables in a term', () => {
    const s: Substitution = new Map([['X', c('a')]]);
    expect(formatTerm(applyTerm(s, v('X')))).toBe('a');
    expect(formatTerm(applyTerm(s, f('p', v('X'), v('Y'))))).toBe('p(a, Y)');
  });

  it('compose(s1, s2) applied to t equals s1(s2(t))', () => {
    const s1: Substitution = new Map([['Y', c('b')]]);
    const s2: Substitution = new Map([['X', v('Y')]]);
    const c12 = compose(s1, s2);
    // Direct: s1(s2(X)) = s1(Y) = b
    expect(formatTerm(applyTerm(c12, v('X')))).toBe('b');
  });
});

describe('resolution-unify — freshening', () => {
  it('renames variables in a rule with the suffix, leaving constants alone', () => {
    const r = { head: a('p', v('X'), c('a')), body: [a('q', v('X'), v('Y'))] };
    const fresh = freshenRule(r, '_z');
    expect(fresh.head.args.map(formatTerm)).toEqual(['X_z', 'a']);
    expect(fresh.body[0]!.args.map(formatTerm)).toEqual(['X_z', 'Y_z']);
  });
});

describe('resolution-unify — applyAtom round-trip', () => {
  it('applies a substitution to every term in an atom', () => {
    const s: Substitution = new Map([['X', c('a')], ['Y', c('b')]]);
    const out = applyAtom(s, a('p', v('X'), f('g', v('Y'))));
    expect(out.predicate).toBe('p');
    expect(formatTerm(out.args[0]!)).toBe('a');
    expect(formatTerm(out.args[1]!)).toBe('g(b)');
  });
});
