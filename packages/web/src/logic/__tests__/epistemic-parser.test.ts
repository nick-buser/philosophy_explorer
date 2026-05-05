import { describe, expect, it } from 'vitest';
import { parseEpistemic } from '../epistemic-parser';

function ok(src: string) {
  const r = parseEpistemic(src);
  if (!r.ok) throw new Error(`expected parse to succeed for ${src}: ${r.error.message}`);
  return r.formula;
}

describe('parseEpistemic — atoms and connectives', () => {
  it('parses a single atom', () => {
    expect(ok('p')).toEqual({ kind: 'atom', name: 'p' });
  });

  it('parses negation', () => {
    expect(ok('!p')).toEqual({ kind: 'not', body: { kind: 'atom', name: 'p' } });
  });

  it('parses conjunction left-associative', () => {
    const f = ok('p & q & r');
    expect(f.kind).toBe('and');
    if (f.kind === 'and') expect(f.left.kind).toBe('and');
  });

  it('parses implication right-associative', () => {
    const f = ok('p -> q -> r');
    expect(f.kind).toBe('implies');
    if (f.kind === 'implies') expect(f.right.kind).toBe('implies');
  });
});

describe('parseEpistemic — knowledge operators', () => {
  it('K_a p binds the agent name', () => {
    const f = ok('K_alice p');
    expect(f).toEqual({
      kind: 'know',
      agent: 'alice',
      body: { kind: 'atom', name: 'p' },
    });
  });

  it('M_a p — consideration', () => {
    const f = ok('M_bob p');
    expect(f.kind).toBe('consider');
    if (f.kind === 'consider') {
      expect(f.agent).toBe('bob');
      expect(f.body).toEqual({ kind: 'atom', name: 'p' });
    }
  });

  it('[a] p alternative syntax for K_a', () => {
    expect(ok('[alice] p')).toEqual({
      kind: 'know',
      agent: 'alice',
      body: { kind: 'atom', name: 'p' },
    });
  });

  it('<<a>> p alternative syntax for M_a', () => {
    expect(ok('<<bob>> p')).toEqual({
      kind: 'consider',
      agent: 'bob',
      body: { kind: 'atom', name: 'p' },
    });
  });

  it('nested K — K_a K_b p', () => {
    const f = ok('K_alice K_bob p');
    expect(f.kind).toBe('know');
    if (f.kind === 'know') {
      expect(f.agent).toBe('alice');
      expect(f.body.kind).toBe('know');
    }
  });

  it('K_a binds tighter than & — K_a p & q is (K_a p) & q', () => {
    const f = ok('K_a p & q');
    expect(f.kind).toBe('and');
    if (f.kind === 'and') {
      expect(f.left.kind).toBe('know');
      expect(f.right).toEqual({ kind: 'atom', name: 'q' });
    }
  });

  it('K_a (p & q) — parenthesized argument', () => {
    const f = ok('K_a (p & q)');
    expect(f.kind).toBe('know');
    if (f.kind === 'know') expect(f.body.kind).toBe('and');
  });
});

describe('parseEpistemic — error cases', () => {
  it('errors on empty input', () => {
    const r = parseEpistemic('');
    expect(r.ok).toBe(false);
  });

  it('errors on unclosed [a]', () => {
    const r = parseEpistemic('[alice p');
    expect(r.ok).toBe(false);
  });
});
