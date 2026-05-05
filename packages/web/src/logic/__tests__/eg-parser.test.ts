import { describe, expect, it } from 'vitest';
import { parseEg } from '../eg-parser';

describe('parseEg — alpha', () => {
  it('parses a single atom on the sheet', () => {
    const r = parseEg('P');
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.tree).toEqual({
      kind: 'sheet',
      children: [{ kind: 'atom', name: 'P', hooks: [] }],
    });
  });

  it('treats juxtaposition as conjunction on the sheet', () => {
    const r = parseEg('P Q R');
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.tree.kind).toBe('sheet');
    expect((r.tree as Extract<typeof r.tree, { kind: 'sheet' }>).children).toHaveLength(3);
  });

  it('parses a cut as negation', () => {
    const r = parseEg('(P)');
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.tree).toEqual({
      kind: 'sheet',
      children: [
        { kind: 'cut', children: [{ kind: 'atom', name: 'P', hooks: [] }] },
      ],
    });
  });

  it("parses Peirce's scroll (A (B)) as implication", () => {
    const r = parseEg('(A (B))');
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.tree).toEqual({
      kind: 'sheet',
      children: [
        {
          kind: 'cut',
          children: [
            { kind: 'atom', name: 'A', hooks: [] },
            { kind: 'cut', children: [{ kind: 'atom', name: 'B', hooks: [] }] },
          ],
        },
      ],
    });
  });

  it('accepts an empty cut', () => {
    const r = parseEg('()');
    expect(r.ok).toBe(true);
  });

  it('accepts nested cuts with whitespace', () => {
    const r = parseEg('  ((  P  Q  ))  ');
    expect(r.ok).toBe(true);
  });

  it('reports an unclosed cut as a parse error', () => {
    const r = parseEg('(P');
    expect(r.ok).toBe(false);
  });

  it('reports an unexpected closing paren', () => {
    const r = parseEg('P)');
    expect(r.ok).toBe(false);
  });

  it('keeps "P (x)" as juxtaposed atom-and-cut, not a predicate', () => {
    // Whitespace before `(` blocks hook attachment, preserving alpha.
    const r = parseEg('P (x)');
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.tree).toEqual({
      kind: 'sheet',
      children: [
        { kind: 'atom', name: 'P', hooks: [] },
        { kind: 'cut', children: [{ kind: 'atom', name: 'x', hooks: [] }] },
      ],
    });
  });
});

describe('parseEg — beta hooks', () => {
  it('parses a unary predicate with one hook', () => {
    const r = parseEg('P(x)');
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.tree).toEqual({
      kind: 'sheet',
      children: [{ kind: 'atom', name: 'P', hooks: ['x'] }],
    });
  });

  it('parses a binary predicate with two hooks', () => {
    const r = parseEg('R(x,y)');
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.tree).toEqual({
      kind: 'sheet',
      children: [{ kind: 'atom', name: 'R', hooks: ['x', 'y'] }],
    });
  });

  it('parses an empty hook list as 0-ary explicitly', () => {
    const r = parseEg('P()');
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.tree).toEqual({
      kind: 'sheet',
      children: [{ kind: 'atom', name: 'P', hooks: [] }],
    });
  });

  it('parses repeated hook names', () => {
    const r = parseEg('Loves(x,x)');
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.tree).toEqual({
      kind: 'sheet',
      children: [{ kind: 'atom', name: 'Loves', hooks: ['x', 'x'] }],
    });
  });

  it('parses a predicate inside a cut', () => {
    const r = parseEg('(P(x))');
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.tree).toEqual({
      kind: 'sheet',
      children: [
        {
          kind: 'cut',
          children: [{ kind: 'atom', name: 'P', hooks: ['x'] }],
        },
      ],
    });
  });

  it('reports an unclosed hook list as a parse error', () => {
    const r = parseEg('P(x');
    expect(r.ok).toBe(false);
  });

  it('reports a missing comma in the hook list', () => {
    const r = parseEg('R(x y)');
    expect(r.ok).toBe(false);
  });
});

describe('parseEg — beta identity', () => {
  it('parses x = y on the sheet', () => {
    const r = parseEg('x = y');
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.tree).toEqual({
      kind: 'sheet',
      children: [{ kind: 'eq', left: 'x', right: 'y' }],
    });
  });

  it('parses x=y without surrounding whitespace', () => {
    const r = parseEg('x=y');
    expect(r.ok).toBe(true);
  });

  it('parses identity alongside predicates', () => {
    const r = parseEg('P(x) Q(y) x = y');
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.tree).toEqual({
      kind: 'sheet',
      children: [
        { kind: 'atom', name: 'P', hooks: ['x'] },
        { kind: 'atom', name: 'Q', hooks: ['y'] },
        { kind: 'eq', left: 'x', right: 'y' },
      ],
    });
  });

  it('parses identity inside a cut', () => {
    const r = parseEg('(x = y)');
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.tree).toEqual({
      kind: 'sheet',
      children: [
        { kind: 'cut', children: [{ kind: 'eq', left: 'x', right: 'y' }] },
      ],
    });
  });
});
