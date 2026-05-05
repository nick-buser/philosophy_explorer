import { describe, expect, it } from 'vitest';
import { parseTemporal } from '../temporal-parser';

function ok(src: string) {
  const r = parseTemporal(src);
  if (!r.ok) throw new Error(`expected parse to succeed for ${src}: ${r.error.message}`);
  return r.formula;
}

describe('parseTemporal — atoms and connectives', () => {
  it('parses an atom', () => {
    expect(ok('p')).toEqual({ kind: 'atom', name: 'p' });
  });

  it('parses negation', () => {
    expect(ok('!p')).toEqual({ kind: 'not', body: { kind: 'atom', name: 'p' } });
  });

  it('reserved letter X is not consumed when followed by an identifier char', () => {
    // 'Xs' should parse as the atom 'Xs', not "X s"
    expect(ok('Xs')).toEqual({ kind: 'atom', name: 'Xs' });
  });
});

describe('parseTemporal — temporal operators', () => {
  it('X p — next', () => {
    expect(ok('X p')).toEqual({
      kind: 'next',
      body: { kind: 'atom', name: 'p' },
    });
  });

  it('F p — eventually', () => {
    expect(ok('F p').kind).toBe('eventually');
  });

  it('G p — always', () => {
    expect(ok('G p').kind).toBe('always');
  });

  it('p U q — until', () => {
    const f = ok('p U q');
    expect(f.kind).toBe('until');
    if (f.kind === 'until') {
      expect(f.left).toEqual({ kind: 'atom', name: 'p' });
      expect(f.right).toEqual({ kind: 'atom', name: 'q' });
    }
  });

  it('U is right-associative — p U q U r is p U (q U r)', () => {
    const f = ok('p U q U r');
    expect(f.kind).toBe('until');
    if (f.kind === 'until') expect(f.right.kind).toBe('until');
  });

  it('X binds tighter than & — X p & q is (X p) & q', () => {
    const f = ok('X p & q');
    expect(f.kind).toBe('and');
    if (f.kind === 'and') {
      expect(f.left.kind).toBe('next');
      expect(f.right).toEqual({ kind: 'atom', name: 'q' });
    }
  });

  it('nested temporal operators — G F p', () => {
    const f = ok('G F p');
    expect(f.kind).toBe('always');
    if (f.kind === 'always') expect(f.body.kind).toBe('eventually');
  });

  it('parenthesized — G(req -> F resp)', () => {
    const f = ok('G(req -> F resp)');
    expect(f.kind).toBe('always');
    if (f.kind === 'always') expect(f.body.kind).toBe('implies');
  });
});

describe('parseTemporal — Unicode glyphs', () => {
  it('◯ is recognised as next', () => {
    expect(ok('◯p').kind).toBe('next');
  });
  it('◇ is recognised as eventually', () => {
    expect(ok('◇p').kind).toBe('eventually');
  });
  it('□ is recognised as always', () => {
    expect(ok('□p').kind).toBe('always');
  });
});

describe('parseTemporal — error cases', () => {
  it('errors on empty input', () => {
    expect(parseTemporal('').ok).toBe(false);
  });

  it('errors on dangling operator', () => {
    expect(parseTemporal('X').ok).toBe(false);
  });
});
