import { describe, expect, it } from 'vitest';
import { datalogForward, refute, sld } from '../resolution-engine';
import { parseProgram } from '../resolution-parser';
import { formatAtom } from '../resolution-types';

function parsed(src: string) {
  const r = parseProgram(src);
  if (!r.ok) throw new Error(`parse failed: ${r.error.message}`);
  return r;
}

describe('resolution-engine — propositional refutation', () => {
  it('derives ⊥ from {p, ¬p}', () => {
    const p = parsed('p\n~p');
    if (p.program.mode !== 'clauses') throw new Error();
    const r = refute(p.program.clauses, p.program.goals);
    expect(r.outcome).toBe('refuted');
    expect(r.emptyClauseId).not.toBeNull();
  });

  it('refutes modus ponens via goal negation', () => {
    const p = parsed('p\n~p ∨ q\n⊢ q');
    if (p.program.mode !== 'clauses') throw new Error();
    const r = refute(p.program.clauses, p.program.goals);
    expect(r.outcome).toBe('refuted');
  });

  it('refutes the unsatisfiable {p ∨ q, ¬p, ¬q}', () => {
    const p = parsed('p ∨ q\n~p\n~q');
    if (p.program.mode !== 'clauses') throw new Error();
    const r = refute(p.program.clauses, p.program.goals);
    expect(r.outcome).toBe('refuted');
  });

  it('saturates and reports satisfiability for {p, q ∨ r}', () => {
    // q ∨ r forces clauses mode; p as a unit clause joins it.
    const p = parsed('p\nq ∨ r');
    if (p.program.mode !== 'clauses') throw new Error();
    const r = refute(p.program.clauses, p.program.goals);
    expect(r.outcome).toBe('saturated');
    expect(r.emptyClauseId).toBeNull();
  });
});

describe('resolution-engine — first-order refutation', () => {
  it('refutes ∀X. p(X) → q(X), p(a) ⊢ q(a) via unification', () => {
    const p = parsed('p(a)\n~p(X) ∨ q(X)\n⊢ q(a)');
    if (p.program.mode !== 'clauses') throw new Error();
    const r = refute(p.program.clauses, p.program.goals);
    expect(r.outcome).toBe('refuted');
    // Find the resolvent that bound X to a — at least one resolvent
    // should carry a non-empty mgu.
    const hasUnification = r.dag.some(n => n.source.kind === 'resolvent' && n.source.mgu.size > 0);
    expect(hasUnification).toBe(true);
  });

  it('does not refute a satisfiable FOL clause set', () => {
    // {p(a), q(b) ∨ r(b)} — no two clauses have complementary literals.
    const p = parsed('p(a)\nq(b) ∨ r(b)');
    if (p.program.mode !== 'clauses') throw new Error();
    const r = refute(p.program.clauses, p.program.goals);
    expect(r.outcome).toBe('saturated');
  });
});

describe('resolution-engine — SLD', () => {
  it('answers a base-rule query', () => {
    const p = parsed('parent(alice, bob).\nancestor(X, Y) :- parent(X, Y).\n?- ancestor(alice, Z).');
    if (p.program.mode !== 'horn') throw new Error();
    const r = sld(p.program.rules, p.program.query);
    expect(r.outcome).toBe('success');
    // The first answer is Z = bob (via the base rule).
    expect(r.answer).not.toBeNull();
    const z = r.answer!.get('Z');
    expect(z?.kind === 'const' ? z.name : null).toBe('bob');
  });

  it('answers a recursive ancestor query', () => {
    const p = parsed([
      'parent(alice, bob).',
      'parent(bob, carol).',
      'ancestor(X, Y) :- parent(X, Y).',
      'ancestor(X, Z) :- parent(X, Y), ancestor(Y, Z).',
      '?- ancestor(alice, carol).',
    ].join('\n'));
    if (p.program.mode !== 'horn') throw new Error();
    const r = sld(p.program.rules, p.program.query);
    expect(r.outcome).toBe('success');
  });

  it('reports failure for a query with no derivation', () => {
    const p = parsed('p(a).\n?- p(b).');
    if (p.program.mode !== 'horn') throw new Error();
    const r = sld(p.program.rules, p.program.query);
    expect(r.outcome).toBe('failure');
    expect(r.answer).toBeNull();
  });

  it('handles compound terms (append)', () => {
    const p = parsed([
      'append(nil, L, L).',
      'append(cons(H, T), L, cons(H, R)) :- append(T, L, R).',
      '?- append(cons(one, nil), cons(two, nil), R).',
    ].join('\n'));
    if (p.program.mode !== 'horn') throw new Error();
    const r = sld(p.program.rules, p.program.query);
    expect(r.outcome).toBe('success');
    const rBinding = r.answer!.get('R');
    // R should be cons(one, cons(two, nil))
    expect(formatAtom({ predicate: 'unwrap', args: [rBinding!] }))
      .toBe('unwrap(cons(one, cons(two, nil)))');
  });
});

describe('resolution-engine — Datalog forward chaining', () => {
  it('derives transitive closure to fixpoint', () => {
    const p = parsed([
      'edge(a, b).',
      'edge(b, c).',
      'edge(c, d).',
      'tc(X, Y) :- edge(X, Y).',
      'tc(X, Y) :- edge(X, Z), tc(Z, Y).',
    ].join('\n'));
    if (p.program.mode !== 'datalog') throw new Error();
    const r = datalogForward(p.program.rules);
    // edges: 3 + tc entries: (a,b)(b,c)(c,d)(a,c)(b,d)(a,d) = 6 → 9 total.
    expect(r.totalFacts).toBe(9);
    const tc = r.factsByPredicate.get('tc/2') ?? [];
    expect(tc.map(formatAtom).sort()).toEqual([
      'tc(a, b)', 'tc(a, c)', 'tc(a, d)',
      'tc(b, c)', 'tc(b, d)',
      'tc(c, d)',
    ]);
  });

  it('produces strata where each round is derivable from earlier rounds only', () => {
    const p = parsed([
      'edge(a, b).',
      'edge(b, c).',
      'tc(X, Y) :- edge(X, Y).',
      'tc(X, Y) :- edge(X, Z), tc(Z, Y).',
    ].join('\n'));
    if (p.program.mode !== 'datalog') throw new Error();
    const r = datalogForward(p.program.rules);
    expect(r.strata[0]!.iteration).toBe(0);
    expect(r.strata[0]!.newFacts.length).toBe(2); // two edge facts
    expect(r.strata[1]!.iteration).toBe(1);
    // Round 1: tc(a,b) and tc(b,c) from the base rule.
    expect(r.strata[1]!.newFacts.map(d => formatAtom(d.fact)).sort())
      .toEqual(['tc(a, b)', 'tc(b, c)']);
    // Round 2: tc(a,c) from edge(a,b) + tc(b,c).
    expect(r.strata[2]!.newFacts.map(d => formatAtom(d.fact)).sort())
      .toEqual(['tc(a, c)']);
  });

  it('reaches a fixpoint with no further derivations', () => {
    const p = parsed('p(a).\nq(X) :- p(X).');
    if (p.program.mode !== 'datalog') throw new Error();
    const r = datalogForward(p.program.rules);
    expect(r.totalFacts).toBe(2);
    // After deriving q(a), the next round derives nothing — loop exits.
    expect(r.strata).toHaveLength(2);
  });
});
