import { describe, expect, it } from 'vitest';
import { parseModal } from '../kripke-parser';
import { renderUnicode } from '../kripke-render';

function mustParse(src: string) {
  const r = parseModal(src);
  if (!r.ok) throw new Error(`expected parse to succeed for ${JSON.stringify(src)}: ${r.error.message}`);
  return r.formula;
}

describe('parseModal — atoms and unary', () => {
  it('parses a single atom', () => {
    expect(mustParse('p')).toEqual({ kind: 'atom', name: 'p' });
  });

  it('parses negation (ASCII and Unicode)', () => {
    expect(mustParse('!p')).toEqual({ kind: 'not', body: { kind: 'atom', name: 'p' } });
    expect(mustParse('¬p')).toEqual({ kind: 'not', body: { kind: 'atom', name: 'p' } });
    expect(mustParse('~p')).toEqual({ kind: 'not', body: { kind: 'atom', name: 'p' } });
  });

  it('parses box and dia (ASCII and Unicode)', () => {
    expect(mustParse('[]p')).toEqual({ kind: 'box', body: { kind: 'atom', name: 'p' } });
    expect(mustParse('□p')).toEqual({ kind: 'box', body: { kind: 'atom', name: 'p' } });
    expect(mustParse('<>p')).toEqual({ kind: 'dia', body: { kind: 'atom', name: 'p' } });
    expect(mustParse('◇p')).toEqual({ kind: 'dia', body: { kind: 'atom', name: 'p' } });
  });

  it('chains unary operators right-to-left', () => {
    // [][]p = box (box p)
    expect(mustParse('[][]p')).toEqual({
      kind: 'box',
      body: { kind: 'box', body: { kind: 'atom', name: 'p' } },
    });
    // !<>p = not (dia p)
    expect(mustParse('!<>p')).toEqual({
      kind: 'not',
      body: { kind: 'dia', body: { kind: 'atom', name: 'p' } },
    });
  });
});

describe('parseModal — binary connectives and precedence', () => {
  it('parses conjunction (ASCII and Unicode)', () => {
    expect(mustParse('p & q')).toEqual({
      kind: 'and',
      left: { kind: 'atom', name: 'p' },
      right: { kind: 'atom', name: 'q' },
    });
    expect(mustParse('p ∧ q')).toEqual(mustParse('p & q'));
  });

  it('& binds tighter than |', () => {
    // p | q & r = p | (q & r)
    expect(mustParse('p | q & r')).toEqual({
      kind: 'or',
      left: { kind: 'atom', name: 'p' },
      right: {
        kind: 'and',
        left: { kind: 'atom', name: 'q' },
        right: { kind: 'atom', name: 'r' },
      },
    });
  });

  it('| binds tighter than ->', () => {
    // p | q -> r = (p | q) -> r
    const f = mustParse('p | q -> r');
    expect(f.kind).toBe('implies');
    if (f.kind !== 'implies') return;
    expect(f.left.kind).toBe('or');
  });

  it('unary binds tighter than all binary ops', () => {
    // []p & q = ([]p) & q, not [](p & q)
    const f = mustParse('[]p & q');
    expect(f).toEqual({
      kind: 'and',
      left: { kind: 'box', body: { kind: 'atom', name: 'p' } },
      right: { kind: 'atom', name: 'q' },
    });
  });

  it('-> is right-associative', () => {
    // a -> b -> c = a -> (b -> c)
    const f = mustParse('a -> b -> c');
    expect(f).toEqual({
      kind: 'implies',
      left: { kind: 'atom', name: 'a' },
      right: {
        kind: 'implies',
        left: { kind: 'atom', name: 'b' },
        right: { kind: 'atom', name: 'c' },
      },
    });
  });

  it('& and | are left-associative', () => {
    // a & b & c = (a & b) & c
    const f = mustParse('a & b & c');
    expect(f).toEqual({
      kind: 'and',
      left: {
        kind: 'and',
        left: { kind: 'atom', name: 'a' },
        right: { kind: 'atom', name: 'b' },
      },
      right: { kind: 'atom', name: 'c' },
    });
  });

  it('parenthesization overrides precedence', () => {
    // (p | q) & r vs p | q & r
    const f1 = mustParse('(p | q) & r');
    expect(f1.kind).toBe('and');
    if (f1.kind !== 'and') return;
    expect(f1.left.kind).toBe('or');
  });
});

describe('parseModal — canonical modal formulas', () => {
  it('K axiom: [](p -> q) -> ([]p -> []q)', () => {
    const f = mustParse('[](p -> q) -> ([]p -> []q)');
    expect(f.kind).toBe('implies');
  });

  it('T axiom: []p -> p', () => {
    const f = mustParse('[]p -> p');
    expect(f).toEqual({
      kind: 'implies',
      left: { kind: 'box', body: { kind: 'atom', name: 'p' } },
      right: { kind: 'atom', name: 'p' },
    });
  });

  it('4 axiom: []p -> [][]p', () => {
    const f = mustParse('[]p -> [][]p');
    expect(f.kind).toBe('implies');
  });

  it('5 axiom: <>p -> []<>p', () => {
    const f = mustParse('<>p -> []<>p');
    expect(f.kind).toBe('implies');
  });
});

describe('parseModal — whitespace and errors', () => {
  it('tolerates extra whitespace', () => {
    const f = mustParse('  []  p   ->   p  ');
    expect(f.kind).toBe('implies');
  });

  it('rejects empty input', () => {
    const r = parseModal('');
    expect(r.ok).toBe(false);
  });

  it('rejects unclosed paren', () => {
    const r = parseModal('(p -> q');
    expect(r.ok).toBe(false);
  });

  it('rejects unexpected char', () => {
    const r = parseModal('p @ q');
    expect(r.ok).toBe(false);
  });

  it('rejects trailing junk', () => {
    const r = parseModal('p )');
    expect(r.ok).toBe(false);
  });
});

describe('renderUnicode — round-trip and minimal parens', () => {
  it('renders atoms and unary without parens', () => {
    expect(renderUnicode(mustParse('p'))).toBe('p');
    expect(renderUnicode(mustParse('[]p'))).toBe('□p');
    expect(renderUnicode(mustParse('[][]p'))).toBe('□□p');
    expect(renderUnicode(mustParse('!<>p'))).toBe('¬◇p');
  });

  it('omits parens when precedence allows', () => {
    expect(renderUnicode(mustParse('p & q'))).toBe('p ∧ q');
    expect(renderUnicode(mustParse('p | q & r'))).toBe('p ∨ q ∧ r');
    expect(renderUnicode(mustParse('[]p & q'))).toBe('□p ∧ q');
  });

  it('preserves right-assoc ->', () => {
    // a -> b -> c should render the same (no forced parens)
    expect(renderUnicode(mustParse('a -> b -> c'))).toBe('a → b → c');
  });

  it('adds parens when structure demands it', () => {
    // (p | q) & r — the or must be parenthesized under and
    expect(renderUnicode(mustParse('(p | q) & r'))).toBe('(p ∨ q) ∧ r');
  });

  it('round-trips canonical modal axioms', () => {
    expect(renderUnicode(mustParse('[]p -> p'))).toBe('□p → p');
    expect(renderUnicode(mustParse('[]p -> [][]p'))).toBe('□p → □□p');
    // Right-assoc → means the outer parens on the right are redundant
    // and correctly stripped: both spellings parse to the same AST.
    expect(renderUnicode(mustParse('[](p -> q) -> ([]p -> []q)')))
      .toBe('□(p → q) → □p → □q');
    expect(renderUnicode(mustParse('[](p -> q) -> []p -> []q')))
      .toBe('□(p → q) → □p → □q');
    expect(renderUnicode(mustParse('<>p -> []<>p'))).toBe('◇p → □◇p');
  });
});
