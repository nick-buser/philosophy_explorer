import { describe, expect, it } from 'vitest';
import { parseAvicennan } from '../avicennan-parser';
import type { Proposition, Syllogism } from '../avicennan-types';

function prop(input: string): Proposition {
  const r = parseAvicennan(input);
  if (!r.ok) throw new Error(`expected parse to succeed: ${r.error.message}`);
  if (r.formula.kind !== 'proposition') throw new Error('expected a proposition');
  return r.formula.proposition;
}

function syll(input: string): Syllogism {
  const r = parseAvicennan(input);
  if (!r.ok) throw new Error(`expected parse to succeed: ${r.error.message}`);
  if (r.formula.kind !== 'syllogism') throw new Error('expected a syllogism');
  return r.formula.syllogism;
}

describe('avicennan parser — single proposition', () => {
  it('parses a universal affirmative', () => {
    expect(prop('necessary every animal is mortal')).toEqual({
      quantity: 'universal',
      quality: 'affirmative',
      modality: 'necessary',
      subject: 'animal',
      predicate: 'mortal',
    });
  });

  it('parses a universal negative with "no"', () => {
    const p = prop('perpetual no stone is alive');
    expect(p.quantity).toBe('universal');
    expect(p.quality).toBe('negative');
    expect(p.modality).toBe('perpetual');
  });

  it('parses a particular affirmative with "some"', () => {
    const p = prop('absolute some human is awake');
    expect(p.quantity).toBe('particular');
    expect(p.quality).toBe('affirmative');
  });

  it('parses a particular negative with "some … is not"', () => {
    const p = prop('possible some human is not awake');
    expect(p.quantity).toBe('particular');
    expect(p.quality).toBe('negative');
    expect(p.modality).toBe('possible');
  });

  it('accepts every phase-1 modality token', () => {
    for (const m of ['necessary', 'perpetual', 'absolute', 'possible'] as const) {
      expect(prop(`${m} every a is b`).modality).toBe(m);
    }
  });

  it('accepts transliteration aliases', () => {
    expect(prop('daruri every a is b').modality).toBe('necessary');
    expect(prop('daima every a is b').modality).toBe('perpetual');
    expect(prop('mutlaqa every a is b').modality).toBe('absolute');
    expect(prop('mumkina every a is b').modality).toBe('possible');
  });

  it('skips -- and # line comments', () => {
    expect(prop('necessary every animal is mortal  -- the major').subject).toBe('animal');
    expect(prop('necessary every animal is mortal  # note').subject).toBe('animal');
  });
});

describe('avicennan parser — proposition errors', () => {
  it('rejects empty input', () => {
    const r = parseAvicennan('   ');
    expect(r.ok).toBe(false);
  });

  it('rejects a missing modality', () => {
    const r = parseAvicennan('every animal is mortal');
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.message).toMatch(/modality/);
  });

  it('rejects a bad quantifier', () => {
    const r = parseAvicennan('necessary most animals are mortal');
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.message).toMatch(/quantifier/);
  });

  it('rejects "every … is not"', () => {
    const r = parseAvicennan('necessary every animal is not mortal');
    expect(r.ok).toBe(false);
  });

  it('rejects a trailing token', () => {
    const r = parseAvicennan('necessary every animal is mortal today');
    expect(r.ok).toBe(false);
  });
});

describe('avicennan parser — syllogism block', () => {
  const barbara = [
    'syllogism',
    '  necessary every animal is mortal',
    '  absolute  every human  is animal',
    '  necessary every human  is mortal',
    'end',
  ].join('\n');

  it('parses a figure-1 block, deriving the middle term', () => {
    const s = syll(barbara);
    expect(s.figure).toBe(1);
    expect(s.middle).toBe('animal');
    expect(s.major.modality).toBe('necessary');
    expect(s.minor.modality).toBe('absolute');
    expect(s.conclusion.subject).toBe('human');
    expect(s.conclusion.predicate).toBe('mortal');
  });

  it('detects figure 2 (middle is predicate of both premises)', () => {
    const s = syll([
      'syllogism',
      'necessary no mammal is reptile',
      'absolute every snake is reptile',
      'necessary no snake is mammal',
      'end',
    ].join('\n'));
    expect(s.figure).toBe(2);
    expect(s.middle).toBe('reptile');
  });

  it('rejects a block without end', () => {
    const r = parseAvicennan('syllogism\nnecessary every a is b\nabsolute every c is a\nnecessary every c is b');
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.message).toMatch(/end/);
  });

  it('rejects the wrong proposition count', () => {
    const r = parseAvicennan('syllogism\nnecessary every a is b\nabsolute every c is a\nend');
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.message).toMatch(/exactly 3/);
  });

  it('rejects premises that share no middle term', () => {
    const r = parseAvicennan([
      'syllogism',
      'necessary every animal is mortal',
      'absolute every human is rational',
      'necessary every human is mortal',
      'end',
    ].join('\n'));
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.message).toMatch(/middle term/);
  });

  it('rejects a bare three-line input without a block', () => {
    const r = parseAvicennan('necessary every a is b\nabsolute every c is a\nnecessary every c is b');
    expect(r.ok).toBe(false);
  });
});
