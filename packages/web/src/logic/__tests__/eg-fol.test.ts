import { describe, expect, it } from 'vitest';
import { parseEg } from '../eg-parser';
import { egToFol } from '../eg-fol';
import type { FolFormula } from '../fol-types';

function trans(src: string): FolFormula {
  const r = parseEg(src);
  if (!r.ok) throw new Error(`parse failed: ${r.error.message}`);
  return egToFol(r.tree);
}

describe('egToFol — alpha (propositional)', () => {
  it('translates an atom to a 0-ary predicate', () => {
    expect(trans('P')).toEqual({ kind: 'pred', name: 'P', args: [] });
  });

  it('translates a cut to negation', () => {
    expect(trans('(P)')).toEqual({
      kind: 'not',
      body: { kind: 'pred', name: 'P', args: [] },
    });
  });

  it('translates juxtaposition to conjunction', () => {
    expect(trans('P Q')).toEqual({
      kind: 'and',
      left:  { kind: 'pred', name: 'P', args: [] },
      right: { kind: 'pred', name: 'Q', args: [] },
    });
  });

  it('translates Peirce’s scroll to ¬(A ∧ ¬B)', () => {
    expect(trans('(A (B))')).toEqual({
      kind: 'not',
      body: {
        kind: 'and',
        left:  { kind: 'pred', name: 'A', args: [] },
        right: { kind: 'not', body: { kind: 'pred', name: 'B', args: [] } },
      },
    });
  });

  it('translates an empty sheet to ⊤', () => {
    expect(trans('')).toEqual({ kind: 'top' });
  });

  it('translates an empty cut to ⊥-equivalent ¬⊤', () => {
    expect(trans('()')).toEqual({ kind: 'not', body: { kind: 'top' } });
  });
});

describe('egToFol — beta (first-order)', () => {
  it('binds a single line of identity at its outermost area', () => {
    // ∃x. P(x)
    expect(trans('P(x)')).toEqual({
      kind: 'exists',
      variable: 'x',
      body: {
        kind: 'pred',
        name: 'P',
        args: [{ kind: 'var', name: 'x' }],
      },
    });
  });

  it('binds a line confined to a cut inside the cut (¬∃ ≡ ∀¬)', () => {
    // (P(x))  ⇒  ¬∃x. P(x)
    expect(trans('(P(x))')).toEqual({
      kind: 'not',
      body: {
        kind: 'exists',
        variable: 'x',
        body: {
          kind: 'pred',
          name: 'P',
          args: [{ kind: 'var', name: 'x' }],
        },
      },
    });
  });

  it('shares a line across the sheet for a single ∃-binder', () => {
    // Man(x) Mortal(x) ⇒  ∃x. Man(x) ∧ Mortal(x)
    expect(trans('Man(x) Mortal(x)')).toEqual({
      kind: 'exists',
      variable: 'x',
      body: {
        kind: 'and',
        left:  { kind: 'pred', name: 'Man',    args: [{ kind: 'var', name: 'x' }] },
        right: { kind: 'pred', name: 'Mortal', args: [{ kind: 'var', name: 'x' }] },
      },
    });
  });

  it('translates "every man is mortal" via the scroll-with-line', () => {
    // (Man(x) (Mortal(x)))  ⇒  ¬∃x. Man(x) ∧ ¬Mortal(x)
    expect(trans('(Man(x) (Mortal(x)))')).toEqual({
      kind: 'not',
      body: {
        kind: 'exists',
        variable: 'x',
        body: {
          kind: 'and',
          left:  { kind: 'pred', name: 'Man', args: [{ kind: 'var', name: 'x' }] },
          right: {
            kind: 'not',
            body: { kind: 'pred', name: 'Mortal', args: [{ kind: 'var', name: 'x' }] },
          },
        },
      },
    });
  });

  it('binds two distinct lines with two ∃-binders at the outer area', () => {
    // R(x,y)  ⇒  ∃x. ∃y. R(x, y)
    expect(trans('R(x,y)')).toEqual({
      kind: 'exists',
      variable: 'x',
      body: {
        kind: 'exists',
        variable: 'y',
        body: {
          kind: 'pred',
          name: 'R',
          args: [
            { kind: 'var', name: 'x' },
            { kind: 'var', name: 'y' },
          ],
        },
      },
    });
  });

  it('binds the inner line at the inner cut for the everyone-loves-someone shape', () => {
    // (P(x) (L(x,y)))  ⇒  ¬∃x. P(x) ∧ ¬∃y. L(x,y)
    const f = trans('(P(x) (L(x,y)))');
    // Top: ¬∃x.
    expect(f.kind).toBe('not');
    if (f.kind !== 'not') return;
    expect(f.body.kind).toBe('exists');
    if (f.body.kind !== 'exists') return;
    expect(f.body.variable).toBe('x');
    // Inside: P(x) ∧ ¬∃y. L(x,y)
    expect(f.body.body.kind).toBe('and');
    if (f.body.body.kind !== 'and') return;
    expect(f.body.body.right.kind).toBe('not');
    if (f.body.body.right.kind !== 'not') return;
    expect(f.body.body.right.body.kind).toBe('exists');
    if (f.body.body.right.body.kind !== 'exists') return;
    expect(f.body.body.right.body.variable).toBe('y');
  });

  it('translates identity', () => {
    // x = y  ⇒  ∃x. ∃y. x = y
    expect(trans('x = y')).toEqual({
      kind: 'exists',
      variable: 'x',
      body: {
        kind: 'exists',
        variable: 'y',
        body: {
          kind: 'eq',
          left:  { kind: 'var', name: 'x' },
          right: { kind: 'var', name: 'y' },
        },
      },
    });
  });

  it('translates a self-loving relation (line reused on both hooks)', () => {
    // Loves(x,x)  ⇒  ∃x. Loves(x, x)
    expect(trans('Loves(x,x)')).toEqual({
      kind: 'exists',
      variable: 'x',
      body: {
        kind: 'pred',
        name: 'Loves',
        args: [
          { kind: 'var', name: 'x' },
          { kind: 'var', name: 'x' },
        ],
      },
    });
  });
});
