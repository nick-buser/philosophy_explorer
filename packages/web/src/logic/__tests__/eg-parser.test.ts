import { describe, expect, it } from 'vitest';
import { parseEg } from '../eg-parser';

describe('parseEg', () => {
  it('parses a single atom on the sheet', () => {
    const r = parseEg('P');
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.tree).toEqual({
      kind: 'sheet',
      children: [{ kind: 'atom', name: 'P' }],
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
        { kind: 'cut', children: [{ kind: 'atom', name: 'P' }] },
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
            { kind: 'atom', name: 'A' },
            { kind: 'cut', children: [{ kind: 'atom', name: 'B' }] },
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
});