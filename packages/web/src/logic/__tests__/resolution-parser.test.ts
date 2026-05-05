import { describe, expect, it } from 'vitest';
import { parseProgram } from '../resolution-parser';
import { formatAtom, formatClause, formatRule } from '../resolution-types';

function ok(src: string) {
  const r = parseProgram(src);
  if (!r.ok) throw new Error(`expected parse to succeed; got "${r.error.message}" at line ${r.error.line}`);
  return r;
}

describe('resolution-parser — mode detection', () => {
  it('detects clauses mode from ∨', () => {
    const r = ok('p ∨ q\n~p ∨ r');
    expect(r.mode).toBe('clauses');
    expect(r.program.mode).toBe('clauses');
  });

  it('detects clauses mode from a unit negative literal', () => {
    const r = ok('~p');
    expect(r.mode).toBe('clauses');
  });

  it('detects clauses mode from ⊢', () => {
    const r = ok('p\n⊢ q');
    expect(r.mode).toBe('clauses');
  });

  it('detects horn mode from a `?-` query line', () => {
    const r = ok('p(a).\n?- p(X).');
    expect(r.mode).toBe('horn');
  });

  it('detects horn mode from a rule', () => {
    const r = ok('p(X) :- q(X).\nq(a).\n?- p(Y).');
    expect(r.mode).toBe('horn');
  });

  it('detects datalog mode from facts and rules without a query', () => {
    const r = ok('edge(a, b).\nedge(b, c).\ntc(X, Y) :- edge(X, Y).');
    expect(r.mode).toBe('datalog');
  });

  it('rejects mixing clause and Horn syntax', () => {
    const r = parseProgram('p ∨ q\nfact(a) :- other(a).');
    expect(r.ok).toBe(false);
  });

  it('rejects datalog programs with compound function symbols', () => {
    const r = parseProgram('p(cons(X, nil)).');
    expect(r.ok).toBe(false);
  });
});

describe('resolution-parser — clauses mode', () => {
  it('parses a unit positive clause once at least one line forces clauses mode', () => {
    // A bare `p` on its own is ambiguous — the parser defaults to
    // Datalog (it's a fact). With a clause-mode neighbour the unit
    // line joins the clause set as the unit clause {p}.
    const r = ok('p\n~q');
    expect(r.program.mode).toBe('clauses');
    if (r.program.mode !== 'clauses') throw new Error();
    expect(r.program.clauses).toHaveLength(2);
    expect(formatClause(r.program.clauses[0]!)).toBe('p');
    expect(formatClause(r.program.clauses[1]!)).toBe('¬q');
  });

  it('parses a multi-literal clause with mixed polarity', () => {
    const r = ok('~p ∨ q ∨ ~r');
    if (r.program.mode !== 'clauses') throw new Error();
    expect(formatClause(r.program.clauses[0]!)).toBe('¬p ∨ q ∨ ¬r');
  });

  it('accepts | as an alternative disjunction glyph', () => {
    const r = ok('p | q | r');
    if (r.program.mode !== 'clauses') throw new Error();
    expect(formatClause(r.program.clauses[0]!)).toBe('p ∨ q ∨ r');
  });

  it('accepts \\/ as an alternative disjunction glyph', () => {
    const r = ok('p \\/ q');
    if (r.program.mode !== 'clauses') throw new Error();
    expect(formatClause(r.program.clauses[0]!)).toBe('p ∨ q');
  });

  it('captures a goal line as a separate clause', () => {
    const r = ok('p\n~p ∨ q\n⊢ q');
    if (r.program.mode !== 'clauses') throw new Error();
    expect(r.program.clauses).toHaveLength(2);
    expect(r.program.goals).toHaveLength(1);
    expect(formatClause(r.program.goals[0]!)).toBe('q');
  });

  it('parses FOL clauses with predicates and variables', () => {
    const r = ok('p(a)\n~p(X) ∨ q(X)\n⊢ q(a)');
    if (r.program.mode !== 'clauses') throw new Error();
    expect(formatClause(r.program.clauses[0]!)).toBe('p(a)');
    expect(formatClause(r.program.clauses[1]!)).toBe('¬p(X) ∨ q(X)');
    expect(formatClause(r.program.goals[0]!)).toBe('q(a)');
  });
});

describe('resolution-parser — horn mode', () => {
  it('parses a fact', () => {
    const r = ok('parent(alice, bob).\n?- parent(alice, X).');
    if (r.program.mode !== 'horn') throw new Error();
    expect(r.program.rules).toHaveLength(1);
    expect(formatRule(r.program.rules[0]!)).toBe('parent(alice, bob).');
    expect(r.program.query.atoms.map(formatAtom)).toEqual(['parent(alice, X)']);
  });

  it('parses a recursive rule', () => {
    const r = ok([
      'parent(alice, bob).',
      'ancestor(X, Y) :- parent(X, Y).',
      'ancestor(X, Z) :- parent(X, Y), ancestor(Y, Z).',
      '?- ancestor(alice, Z).',
    ].join('\n'));
    if (r.program.mode !== 'horn') throw new Error();
    expect(r.program.rules).toHaveLength(3);
    expect(formatRule(r.program.rules[2]!)).toBe('ancestor(X, Z) :- parent(X, Y), ancestor(Y, Z).');
  });

  it('parses a multi-atom query', () => {
    const r = ok('p(a).\nq(b).\n?- p(X), q(Y).');
    if (r.program.mode !== 'horn') throw new Error();
    expect(r.program.query.atoms).toHaveLength(2);
    expect(r.program.query.atoms.map(formatAtom)).toEqual(['p(X)', 'q(Y)']);
  });
});

describe('resolution-parser — datalog mode', () => {
  it('parses an edge / closure program', () => {
    const r = ok([
      'edge(a, b).',
      'edge(b, c).',
      'tc(X, Y) :- edge(X, Y).',
      'tc(X, Y) :- edge(X, Z), tc(Z, Y).',
    ].join('\n'));
    if (r.program.mode !== 'datalog') throw new Error();
    expect(r.program.rules).toHaveLength(4);
    expect(r.program.query).toBeNull();
  });

  it('rejects compound function symbols in a datalog program', () => {
    const r = parseProgram('p(f(X)).');
    expect(r.ok).toBe(false);
  });
});

describe('resolution-parser — comments and continuations', () => {
  it('skips %-prefixed comment lines', () => {
    const r = ok('% top-level comment\np(a).\n?- p(X).');
    if (r.program.mode !== 'horn') throw new Error();
    expect(r.program.rules).toHaveLength(1);
  });

  it('joins continuation lines until a `.` terminator', () => {
    const r = ok([
      'ancestor(X, Z) :-',
      '  parent(X, Y),',
      '  ancestor(Y, Z).',
      '?- ancestor(a, X).',
    ].join('\n'));
    if (r.program.mode !== 'horn') throw new Error();
    expect(r.program.rules).toHaveLength(1);
    expect(formatRule(r.program.rules[0]!)).toBe('ancestor(X, Z) :- parent(X, Y), ancestor(Y, Z).');
  });
});

describe('resolution-parser — error reporting', () => {
  it('reports an error with the line number', () => {
    const r = parseProgram('p(a).\n???');
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.error.line).toBe(2);
  });
});
