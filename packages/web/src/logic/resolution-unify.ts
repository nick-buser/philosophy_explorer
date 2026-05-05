// Robinson unification on Term.
//
// Returns the most general unifier (MGU) as a Substitution, or null
// if the two terms are not unifiable. Uses the occurs check — required
// for soundness in full FOL. Datalog never triggers occurs check
// (no compound terms ⇒ no nested variables) but we keep one code path.

import type { Atom, Literal, Rule, Substitution, Term } from './resolution-types';
import { EMPTY_SUBST } from './resolution-types';

// Apply a substitution to a term, recursively.
export function applyTerm(s: Substitution, t: Term): Term {
  if (t.kind === 'var') {
    const r = s.get(t.name);
    if (!r) return t;
    // Walk: a substitution may map X ↦ Y where Y is itself bound.
    return applyTerm(s, r);
  }
  if (t.kind === 'const') return t;
  return { kind: 'compound', functor: t.functor, args: t.args.map(a => applyTerm(s, a)) };
}

export function applyAtom(s: Substitution, a: Atom): Atom {
  return { predicate: a.predicate, args: a.args.map(t => applyTerm(s, t)) };
}

export function applyLiteral(s: Substitution, l: Literal): Literal {
  return { polarity: l.polarity, atom: applyAtom(s, l.atom) };
}

export function applyRule(s: Substitution, r: Rule): Rule {
  return { head: applyAtom(s, r.head), body: r.body.map(b => applyAtom(s, b)) };
}

// Compose two substitutions: (s1 ∘ s2) applied to t = s1(s2(t)).
export function compose(s1: Substitution, s2: Substitution): Substitution {
  const out: Substitution = new Map();
  for (const [k, v] of s2) out.set(k, applyTerm(s1, v));
  for (const [k, v] of s1) if (!out.has(k)) out.set(k, v);
  return out;
}

// Occurs check: does variable `name` occur in term `t` after applying s?
function occurs(name: string, t: Term, s: Substitution): boolean {
  const w = walk(t, s);
  if (w.kind === 'var') return w.name === name;
  if (w.kind === 'const') return false;
  return w.args.some(a => occurs(name, a, s));
}

// Walk: chase variable bindings to their leaf.
function walk(t: Term, s: Substitution): Term {
  if (t.kind !== 'var') return t;
  const r = s.get(t.name);
  if (!r) return t;
  return walk(r, s);
}

export type UnifyResult = Substitution | null;

export function unifyTerms(a: Term, b: Term, s: Substitution = EMPTY_SUBST): UnifyResult {
  const x = walk(a, s);
  const y = walk(b, s);

  if (x.kind === 'var' && y.kind === 'var' && x.name === y.name) return s;
  if (x.kind === 'var') {
    if (occurs(x.name, y, s)) return null;
    const next = new Map(s);
    next.set(x.name, y);
    return next;
  }
  if (y.kind === 'var') {
    if (occurs(y.name, x, s)) return null;
    const next = new Map(s);
    next.set(y.name, x);
    return next;
  }
  if (x.kind === 'const' && y.kind === 'const') {
    return x.name === y.name ? s : null;
  }
  if (x.kind === 'compound' && y.kind === 'compound') {
    if (x.functor !== y.functor || x.args.length !== y.args.length) return null;
    let cur: Substitution = s;
    for (let i = 0; i < x.args.length; i++) {
      const next = unifyTerms(x.args[i]!, y.args[i]!, cur);
      if (!next) return null;
      cur = next;
    }
    return cur;
  }
  return null;
}

export function unifyAtoms(a: Atom, b: Atom, s: Substitution = EMPTY_SUBST): UnifyResult {
  if (a.predicate !== b.predicate || a.args.length !== b.args.length) return null;
  let cur: Substitution = s;
  for (let i = 0; i < a.args.length; i++) {
    const next = unifyTerms(a.args[i]!, b.args[i]!, cur);
    if (!next) return null;
    cur = next;
  }
  return cur;
}

// Standardize-apart: rename all variables in a clause / rule with a
// fresh suffix so re-using the same source clause in multiple
// resolution / SLD steps doesn't capture variables.
export function freshenTerm(t: Term, suffix: string): Term {
  if (t.kind === 'var') return { kind: 'var', name: `${t.name}${suffix}` };
  if (t.kind === 'const') return t;
  return { kind: 'compound', functor: t.functor, args: t.args.map(a => freshenTerm(a, suffix)) };
}

export function freshenAtom(a: Atom, suffix: string): Atom {
  return { predicate: a.predicate, args: a.args.map(t => freshenTerm(t, suffix)) };
}

export function freshenLiteral(l: Literal, suffix: string): Literal {
  return { polarity: l.polarity, atom: freshenAtom(l.atom, suffix) };
}

export function freshenRule(r: Rule, suffix: string): Rule {
  return { head: freshenAtom(r.head, suffix), body: r.body.map(a => freshenAtom(a, suffix)) };
}

// Restrict a substitution to a set of variables (used to display
// answer substitutions for the SLD query).
export function restrict(s: Substitution, vars: Iterable<string>): Substitution {
  const out: Substitution = new Map();
  for (const v of vars) {
    const t = s.get(v);
    if (t !== undefined) out.set(v, applyTerm(s, t));
  }
  return out;
}
