import { describe, expect, it } from 'vitest';
import { parseFrege } from '../frege-parser';
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

  it('parses universal quantification', () => {
    expect(mustParse('|- all x. F(x)')).toEqual({
      kind: 'judgment',
      body: {
        kind: 'forall',
        variable: 'x',
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
        body: {
          kind: 'forall',
          variable: 'y',
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
});
