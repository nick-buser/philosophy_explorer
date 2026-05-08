import { describe, expect, it } from 'vitest';
import { parseFrege } from '../frege-parser';
import { orderOf } from '../frege-types';
import type { FregeFormula } from '../frege-types';

function mustParse(src: string): FregeFormula {
  const r = parseFrege(src);
  if (!r.ok) throw new Error(`expected parse to succeed for ${JSON.stringify(src)}: ${r.error.message}`);
  return r.formula;
}

describe('parseFrege — judgment wrapper and atoms', () => {
  it('parses a bare atom as a content (not a judgment)', () => {
    expect(mustParse('p')).toEqual({
      kind: 'content',
      body: { kind: 'atom', name: 'p', args: [] },
    });
  });

  it('parses |- A as a judgment', () => {
    expect(mustParse('|- A')).toEqual({
      kind: 'judgment',
      body: { kind: 'atom', name: 'A', args: [] },
    });
  });

  it('parses an atom with arguments', () => {
    expect(mustParse('|- F(x, y)')).toEqual({
      kind: 'judgment',
      body: { kind: 'atom', name: 'F', args: ['x', 'y'] },
    });
  });

  it('tolerates whitespace around the turnstile', () => {
    expect(mustParse('  |-  p  ')).toEqual({
      kind: 'judgment',
      body: { kind: 'atom', name: 'p', args: [] },
    });
  });
});

describe('parseFrege — unary connectives', () => {
  it('parses negation', () => {
    expect(mustParse('|- ~p')).toEqual({
      kind: 'judgment',
      body: { kind: 'not', body: { kind: 'atom', name: 'p', args: [] } },
    });
  });

  it('chains negation right-to-left', () => {
    expect(mustParse('|- ~~p')).toEqual({
      kind: 'judgment',
      body: {
        kind: 'not',
        body: { kind: 'not', body: { kind: 'atom', name: 'p', args: [] } },
      },
    });
  });

  it('parses universal quantification with individual sort for lowercase variables', () => {
    expect(mustParse('|- all x. F(x)')).toEqual({
      kind: 'judgment',
      body: {
        kind: 'forall',
        variable: 'x',
        sort: 'individual',
        body: { kind: 'atom', name: 'F', args: ['x'] },
      },
    });
  });

  it('nests quantifiers right-to-left', () => {
    expect(mustParse('|- all x. all y. R(x, y)')).toEqual({
      kind: 'judgment',
      body: {
        kind: 'forall',
        variable: 'x',
        sort: 'individual',
        body: {
          kind: 'forall',
          variable: 'y',
          sort: 'individual',
          body: { kind: 'atom', name: 'R', args: ['x', 'y'] },
        },
      },
    });
  });

  it('treats `all` as a keyword, but `allowed` as an identifier', () => {
    // `allowed` should be parsed as an atom name, not a quantifier
    // missing its variable.
    const r = parseFrege('|- allowed');
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.formula).toEqual({
      kind: 'judgment',
      body: { kind: 'atom', name: 'allowed', args: [] },
    });
  });
});

describe('parseFrege — conditional', () => {
  it('parses a simple implication with antecedent first, consequent second', () => {
    // `p -> q` reads "if p then q"; the AST stores antecedent + consequent
    // explicitly so the renderer can flip orientation.
    expect(mustParse('|- p -> q')).toEqual({
      kind: 'judgment',
      body: {
        kind: 'cond',
        antecedent: { kind: 'atom', name: 'p', args: [] },
        consequent: { kind: 'atom', name: 'q', args: [] },
      },
    });
  });

  it('-> is right-associative', () => {
    // a -> b -> c = a -> (b -> c)
    expect(mustParse('|- a -> b -> c')).toEqual({
      kind: 'judgment',
      body: {
        kind: 'cond',
        antecedent: { kind: 'atom', name: 'a', args: [] },
        consequent: {
          kind: 'cond',
          antecedent: { kind: 'atom', name: 'b', args: [] },
          consequent: { kind: 'atom', name: 'c', args: [] },
        },
      },
    });
  });

  it('parenthesization overrides right-assoc default', () => {
    // (a -> b) -> c
    const f = mustParse('|- (a -> b) -> c');
    expect(f.kind).toBe('judgment');
    if (f.kind !== 'judgment') return;
    const body = f.body;
    expect(body.kind).toBe('cond');
    if (body.kind !== 'cond') return;
    expect(body.antecedent.kind).toBe('cond');
    expect(body.consequent.kind).toBe('atom');
  });

  it('combines negation, quantifier, and conditional', () => {
    expect(mustParse('|- all x. F(x) -> G(x)')).toEqual({
      kind: 'judgment',
      body: {
        kind: 'forall',
        variable: 'x',
        sort: 'individual',
        body: {
          kind: 'cond',
          antecedent: { kind: 'atom', name: 'F', args: ['x'] },
          consequent: { kind: 'atom', name: 'G', args: ['x'] },
        },
      },
    });
  });

  it('renders Frege’s axiom 1 (positive paradox)', () => {
    // p -> (q -> p)
    const f = mustParse('|- p -> (q -> p)');
    expect(f.kind).toBe('judgment');
    if (f.kind !== 'judgment') return;
    expect(f.body.kind).toBe('cond');
  });
});

describe('parseFrege — existential', () => {
  it('parses an existential with individual sort', () => {
    expect(mustParse('|- exists x. F(x)')).toEqual({
      kind: 'judgment',
      body: {
        kind: 'exists',
        variable: 'x',
        sort: 'individual',
        body: { kind: 'atom', name: 'F', args: ['x'] },
      },
    });
  });

  it('treats `exists` as a keyword, not an identifier prefix', () => {
    // `existsX` should still parse as an atom name (not the existential
    // keyword followed by `X`).
    const r = parseFrege('|- existsX');
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.formula).toEqual({
      kind: 'judgment',
      body: { kind: 'atom', name: 'existsX', args: [] },
    });
  });

  it('mixes existential and universal under a single judgment', () => {
    expect(mustParse('|- all x. exists y. R(x, y)')).toEqual({
      kind: 'judgment',
      body: {
        kind: 'forall',
        variable: 'x',
        sort: 'individual',
        body: {
          kind: 'exists',
          variable: 'y',
          sort: 'individual',
          body: { kind: 'atom', name: 'R', args: ['x', 'y'] },
        },
      },
    });
  });
});

describe('parseFrege — higher-order quantification', () => {
  it('infers predicate sort from an uppercase bound variable', () => {
    // `all F. F(a)` — F is bound and used as a predicate. Sort is
    // 'predicate' purely because the head letter is uppercase.
    expect(mustParse('|- all F. F(a)')).toEqual({
      kind: 'judgment',
      body: {
        kind: 'forall',
        variable: 'F',
        sort: 'predicate',
        body: { kind: 'atom', name: 'F', args: ['a'] },
      },
    });
  });

  it('infers predicate sort for higher-order existential', () => {
    expect(mustParse('|- exists F. F(a)')).toEqual({
      kind: 'judgment',
      body: {
        kind: 'exists',
        variable: 'F',
        sort: 'predicate',
        body: { kind: 'atom', name: 'F', args: ['a'] },
      },
    });
  });

  it('mixes individual and predicate quantifiers', () => {
    // |- all x. exists F. F(x) — every individual has some property
    expect(mustParse('|- all x. exists F. F(x)')).toEqual({
      kind: 'judgment',
      body: {
        kind: 'forall',
        variable: 'x',
        sort: 'individual',
        body: {
          kind: 'exists',
          variable: 'F',
          sort: 'predicate',
          body: { kind: 'atom', name: 'F', args: ['x'] },
        },
      },
    });
  });
});

describe('parseFrege — identity of content', () => {
  it('parses A == B as iden', () => {
    expect(mustParse('|- p == q')).toEqual({
      kind: 'judgment',
      body: {
        kind: 'iden',
        left:  { kind: 'atom', name: 'p', args: [] },
        right: { kind: 'atom', name: 'q', args: [] },
      },
    });
  });

  it('== is lower precedence than ->', () => {
    // `A -> B == C` parses as `(A -> B) == C` because == sits at the
    // outermost level.
    const f = mustParse('|- A -> B == C');
    expect(f.kind).toBe('judgment');
    if (f.kind !== 'judgment') return;
    expect(f.body.kind).toBe('iden');
    if (f.body.kind !== 'iden') return;
    expect(f.body.left.kind).toBe('cond');
    expect(f.body.right.kind).toBe('atom');
  });

  it('== is right-associative', () => {
    // a == b == c parses as a == (b == c)
    const f = mustParse('|- a == b == c');
    if (f.kind !== 'judgment' || f.body.kind !== 'iden') {
      throw new Error('expected nested iden');
    }
    expect(f.body.right.kind).toBe('iden');
  });

  it('binds inside a quantifier body (Frege axiom 52 shape)', () => {
    // |- (a == b) -> (P(a) -> P(b))
    const f = mustParse('|- (a == b) -> (P(a) -> P(b))');
    if (f.kind !== 'judgment' || f.body.kind !== 'cond') {
      throw new Error('expected top-level conditional');
    }
    expect(f.body.antecedent.kind).toBe('iden');
    expect(f.body.consequent.kind).toBe('cond');
  });
});

describe('orderOf', () => {
  it('classifies a propositional formula', () => {
    expect(orderOf(mustParse('|- p -> q'))).toBe('propositional');
  });

  it('classifies a first-order formula', () => {
    expect(orderOf(mustParse('|- all x. F(x) -> G(x)'))).toBe('first-order');
  });

  it('classifies a higher-order formula', () => {
    expect(orderOf(mustParse('|- all F. F(a)'))).toBe('higher-order');
  });

  it('mixed orders report higher-order', () => {
    expect(orderOf(mustParse('|- all x. exists F. F(x)'))).toBe('higher-order');
  });
});

describe('parseFrege — error cases', () => {
  it('rejects empty input', () => {
    expect(parseFrege('').ok).toBe(false);
  });

  it('rejects whitespace-only input', () => {
    expect(parseFrege('   ').ok).toBe(false);
  });

  it('rejects an unclosed group', () => {
    expect(parseFrege('|- (p -> q').ok).toBe(false);
  });

  it('rejects a missing variable after `all`', () => {
    expect(parseFrege('|- all . F(x)').ok).toBe(false);
  });

  it('rejects a missing variable after `exists`', () => {
    expect(parseFrege('|- exists . F(x)').ok).toBe(false);
  });

  it('rejects a missing dot after the bound variable', () => {
    expect(parseFrege('|- all x F(x)').ok).toBe(false);
  });

  it('rejects an unexpected character', () => {
    expect(parseFrege('|- p @ q').ok).toBe(false);
  });

  it('rejects trailing junk', () => {
    expect(parseFrege('|- p )').ok).toBe(false);
  });

  it('rejects an unterminated argument list', () => {
    expect(parseFrege('|- F(x').ok).toBe(false);
  });

  it('rejects a stray operator', () => {
    expect(parseFrege('|- ->').ok).toBe(false);
  });

  it('rejects a stray identity sign', () => {
    expect(parseFrege('|- ==').ok).toBe(false);
  });
});
