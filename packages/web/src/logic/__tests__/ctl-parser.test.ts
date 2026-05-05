import { describe, expect, it } from 'vitest';
import { parseCtl } from '../ctl-parser';

function ok(src: string) {
  const r = parseCtl(src);
  if (!r.ok) throw new Error(`expected parse to succeed for ${src}: ${r.error.message}`);
  return r.formula;
}

describe('parseCtl — atoms and connectives', () => {
  it('atom', () => {
    expect(ok('p')).toEqual({ kind: 'atom', name: 'p' });
  });
  it('connectives compose', () => {
    const f = ok('p & q | r');
    expect(f.kind).toBe('or');
  });
});

describe('parseCtl — paired path-temporal operators', () => {
  it('AX p', () => {
    expect(ok('AX p').kind).toBe('AX');
  });
  it('EX p', () => {
    expect(ok('EX p').kind).toBe('EX');
  });
  it('AF p', () => {
    expect(ok('AF p').kind).toBe('AF');
  });
  it('EF p', () => {
    expect(ok('EF p').kind).toBe('EF');
  });
  it('AG p', () => {
    expect(ok('AG p').kind).toBe('AG');
  });
  it('EG p', () => {
    expect(ok('EG p').kind).toBe('EG');
  });

  it('A[p U q] — universal until', () => {
    const f = ok('A[p U q]');
    expect(f.kind).toBe('AU');
    if (f.kind === 'AU') {
      expect(f.left).toEqual({ kind: 'atom', name: 'p' });
      expect(f.right).toEqual({ kind: 'atom', name: 'q' });
    }
  });

  it('E[p U q] — existential until', () => {
    expect(ok('E[p U q]').kind).toBe('EU');
  });

  it('atom Ap is just an atom (no whitespace before [) ', () => {
    expect(ok('Ap')).toEqual({ kind: 'atom', name: 'Ap' });
  });

  it('AX is a keyword and not consumed when followed by an identifier char', () => {
    expect(ok('AXp')).toEqual({ kind: 'atom', name: 'AXp' });
  });
});

describe('parseCtl — nesting', () => {
  it('AG (req -> AF resp)', () => {
    const f = ok('AG (req -> AF resp)');
    expect(f.kind).toBe('AG');
    if (f.kind === 'AG') {
      expect(f.body.kind).toBe('implies');
    }
  });

  it('EX EG p', () => {
    const f = ok('EX EG p');
    expect(f.kind).toBe('EX');
    if (f.kind === 'EX') expect(f.body.kind).toBe('EG');
  });
});

describe('parseCtl — error cases', () => {
  it('errors on empty input', () => {
    expect(parseCtl('').ok).toBe(false);
  });

  it('errors on dangling AX', () => {
    expect(parseCtl('AX').ok).toBe(false);
  });

  it('errors on A[ without U', () => {
    expect(parseCtl('A[p q]').ok).toBe(false);
  });
});
