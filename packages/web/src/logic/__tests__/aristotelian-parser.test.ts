import { describe, expect, it } from 'vitest';
import { parseAristotelian } from '../aristotelian-parser';
import type { AristotelianFormula, Syllogism } from '../aristotelian-types';

function mustParse(src: string): AristotelianFormula {
  const r = parseAristotelian(src);
  if (!r.ok) throw new Error(`expected parse to succeed for ${JSON.stringify(src)}: ${r.error.message}`);
  return r.formula;
}

function mustSyllogism(src: string): Syllogism {
  const f = mustParse(src);
  if (f.kind !== 'syllogism') throw new Error(`expected syllogism for ${JSON.stringify(src)}`);
  return f.syllogism;
}

describe('parseAristotelian — single propositions', () => {
  it('parses A (universal affirmative)', () => {
    expect(mustParse('All Greeks are Mortal')).toEqual({
      kind: 'proposition',
      proposition: { form: 'A', subject: 'Greeks', predicate: 'Mortal' },
    });
  });

  it('parses E (universal negative)', () => {
    expect(mustParse('No fish is Mammal')).toEqual({
      kind: 'proposition',
      proposition: { form: 'E', subject: 'fish', predicate: 'Mammal' },
    });
  });

  it('parses I (particular affirmative)', () => {
    expect(mustParse('Some Greeks are philosophers')).toEqual({
      kind: 'proposition',
      proposition: { form: 'I', subject: 'Greeks', predicate: 'philosophers' },
    });
  });

  it('parses O (particular negative)', () => {
    expect(mustParse('Some swans are not white')).toEqual({
      kind: 'proposition',
      proposition: { form: 'O', subject: 'swans', predicate: 'white' },
    });
  });

  it('strips a trailing period', () => {
    expect(mustParse('All Greeks are Mortal.')).toEqual({
      kind: 'proposition',
      proposition: { form: 'A', subject: 'Greeks', predicate: 'Mortal' },
    });
  });

  it('accepts both is/are', () => {
    const a = mustParse('All cat is Mammal');
    const b = mustParse('All cat are Mammal');
    expect(a).toEqual(b);
  });

  it('rejects "All ... is not" (not a categorical form)', () => {
    const r = parseAristotelian('All cat is not Mammal');
    expect(r.ok).toBe(false);
  });

  it('rejects unknown quantifiers', () => {
    const r = parseAristotelian('Many Greeks are Mortal');
    expect(r.ok).toBe(false);
  });

  it('rejects multi-word terms (phase 1 limitation)', () => {
    const r = parseAristotelian('All Greek philosophers are Wise');
    expect(r.ok).toBe(false);
  });

  it('rejects empty input', () => {
    const r = parseAristotelian('');
    expect(r.ok).toBe(false);
  });
});

describe('parseAristotelian — long-form syllogisms', () => {
  it('parses Barbara (AAA-1)', () => {
    const s = mustSyllogism('All men are Mortal\nAll Greeks are men\nTherefore all Greeks are Mortal');
    expect(s.mood).toBe('AAA');
    expect(s.figure).toBe(1);
    expect(s.middle).toBe('men');
    expect(s.conclusion).toEqual({ form: 'A', subject: 'Greeks', predicate: 'Mortal' });
    expect(s.major.predicate).toBe('Mortal');
    expect(s.minor.subject).toBe('Greeks');
  });

  it('detects Figure 2 (M predicate of both premises)', () => {
    const s = mustSyllogism('No Mammal is Reptile\nAll snake is Reptile\nTherefore no snake is Mammal');
    expect(s.mood).toBe('EAE');
    expect(s.figure).toBe(2);
    expect(s.middle).toBe('Reptile');
  });

  it('detects Figure 3 (M subject of both premises)', () => {
    const s = mustSyllogism(
      'Some cats are not Tame\nAll cats are Mammal\nTherefore some Mammal is not Tame',
    );
    expect(s.mood).toBe('OAO');
    expect(s.figure).toBe(3);
    expect(s.middle).toBe('cats');
  });

  it('detects Figure 4 (M predicate of major, subject of minor)', () => {
    const s = mustSyllogism(
      'All P is M\nAll M is S\nTherefore some S is P',
    );
    expect(s.figure).toBe(4);
    expect(s.middle).toBe('M');
  });

  it('accepts conclusion without an explicit Therefore prefix', () => {
    const s = mustSyllogism('All M is P\nAll S is M\nAll S is P');
    expect(s.mood).toBe('AAA');
    expect(s.figure).toBe(1);
  });

  it('accepts So / Hence as conclusion markers', () => {
    expect(mustSyllogism('All M is P\nAll S is M\nSo all S is P').mood).toBe('AAA');
    expect(mustSyllogism('All M is P\nAll S is M\nHence all S is P').mood).toBe('AAA');
  });

  it('infers major-vs-minor from term content, not line position', () => {
    // Premises in non-standard order: minor first, major second.
    const s = mustSyllogism('All Greeks are men\nAll men are Mortal\nTherefore all Greeks are Mortal');
    expect(s.major.predicate).toBe('Mortal');     // contains conclusion's predicate
    expect(s.minor.subject).toBe('Greeks');       // contains conclusion's subject
    expect(s.figure).toBe(1);
  });

  it('rejects a syllogism with no shared middle term', () => {
    const r = parseAristotelian('All A is B\nAll C is D\nTherefore all A is D');
    expect(r.ok).toBe(false);
  });

  it('rejects a syllogism whose conclusion subject is not in either premise', () => {
    const r = parseAristotelian('All M is P\nAll Q is M\nTherefore all S is P');
    expect(r.ok).toBe(false);
  });

  it('rejects 2 lines (neither proposition nor syllogism)', () => {
    const r = parseAristotelian('All M is P\nAll S is M');
    expect(r.ok).toBe(false);
  });
});

describe('parseAristotelian — compact form', () => {
  it('parses AAA-1 with named terms', () => {
    const s = mustSyllogism('AAA-1/Greeks,men,Mortal');
    expect(s.mood).toBe('AAA');
    expect(s.figure).toBe(1);
    expect(s.middle).toBe('men');
    expect(s.conclusion).toEqual({ form: 'A', subject: 'Greeks', predicate: 'Mortal' });
    expect(s.major).toEqual({ form: 'A', subject: 'men', predicate: 'Mortal' });
    expect(s.minor).toEqual({ form: 'A', subject: 'Greeks', predicate: 'men' });
  });

  it('builds Figure-2 term layout (P-M, S-M)', () => {
    const s = mustSyllogism('EAE-2/snake,Reptile,Mammal');
    expect(s.figure).toBe(2);
    expect(s.major).toEqual({ form: 'E', subject: 'Mammal', predicate: 'Reptile' });
    expect(s.minor).toEqual({ form: 'A', subject: 'snake', predicate: 'Reptile' });
  });

  it('builds Figure-3 term layout (M-P, M-S)', () => {
    const s = mustSyllogism('AAI-3/dog,cat,Mammal');
    expect(s.figure).toBe(3);
    expect(s.major).toEqual({ form: 'A', subject: 'cat', predicate: 'Mammal' });
    expect(s.minor).toEqual({ form: 'A', subject: 'cat', predicate: 'dog' });
  });

  it('builds Figure-4 term layout (P-M, M-S)', () => {
    const s = mustSyllogism('AAI-4/A,B,C');
    expect(s.figure).toBe(4);
    expect(s.major).toEqual({ form: 'A', subject: 'C', predicate: 'B' });
    expect(s.minor).toEqual({ form: 'A', subject: 'B', predicate: 'A' });
  });

  it('rejects invalid figure number', () => {
    const r = parseAristotelian('AAA-5/S,M,P');
    expect(r.ok).toBe(false);
  });

  it('rejects fewer than three terms', () => {
    const r = parseAristotelian('AAA-1/S,M');
    expect(r.ok).toBe(false);
  });
});
