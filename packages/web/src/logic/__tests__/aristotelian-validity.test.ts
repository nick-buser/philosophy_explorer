import { describe, expect, it } from 'vitest';
import { parseAristotelian } from '../aristotelian-parser';
import { ALL_VALID_ENTRIES, checkSyllogism, lookupByMoodFigure } from '../aristotelian-validity';
import type { Figure, Mood, Syllogism } from '../aristotelian-types';

function syl(src: string): Syllogism {
  const r = parseAristotelian(src);
  if (!r.ok || r.formula.kind !== 'syllogism') {
    throw new Error(`expected a syllogism for ${JSON.stringify(src)}`);
  }
  return r.formula.syllogism;
}

describe('validity table — coverage', () => {
  it('lists exactly 24 valid mood-figure pairs', () => {
    expect(ALL_VALID_ENTRIES.length).toBe(24);
  });

  it('marks 9 of those as weakened (existential-import-dependent)', () => {
    const weakened = ALL_VALID_ENTRIES.filter(e => e.weakened);
    expect(weakened.length).toBe(9);
  });

  it('every entry has a non-empty traditional name', () => {
    for (const e of ALL_VALID_ENTRIES) {
      expect(e.name.length).toBeGreaterThan(0);
    }
  });

  it('traditional names are unique', () => {
    const names = ALL_VALID_ENTRIES.map(e => e.name);
    expect(new Set(names).size).toBe(names.length);
  });
});

describe('validity table — Figure 1 perfect syllogisms', () => {
  it.each<[string, string]>([
    ['Barbara',  'AAA'],
    ['Celarent', 'EAE'],
    ['Darii',    'AII'],
    ['Ferio',    'EIO'],
  ])('%s = %s in figure 1', (name, mood) => {
    const entry = lookupByMoodFigure(mood as Mood, 1);
    expect(entry?.name).toBe(name);
    expect(entry?.weakened).toBe(false);
  });
});

describe('checkSyllogism — valid examples', () => {
  it('Barbara via long form', () => {
    const result = checkSyllogism(syl('All men are Mortal\nAll Greeks are men\nTherefore all Greeks are Mortal'));
    expect(result.valid).toBe(true);
    if (result.valid) expect(result.entry.name).toBe('Barbara');
  });

  it('Celarent via long form', () => {
    const result = checkSyllogism(syl('No fish is Mammal\nAll trout is fish\nTherefore no trout is Mammal'));
    expect(result.valid).toBe(true);
    if (result.valid) expect(result.entry.name).toBe('Celarent');
  });

  it('Bocardo (figure 3, OAO)', () => {
    const result = checkSyllogism(syl('Some cats are not Tame\nAll cats are Mammal\nTherefore some Mammal is not Tame'));
    expect(result.valid).toBe(true);
    if (result.valid) expect(result.entry.name).toBe('Bocardo');
  });

  it('Bramantip (figure 4, AAI) — valid but weakened', () => {
    const result = checkSyllogism(syl('AAI-4/A,B,C'));
    expect(result.valid).toBe(true);
    if (result.valid) {
      expect(result.entry.name).toBe('Bramantip');
      expect(result.entry.weakened).toBe(true);
    }
  });
});

describe('checkSyllogism — invalid examples', () => {
  it('AAA-2 is invalid (undistributed middle)', () => {
    const result = checkSyllogism(syl('All cats are Mammal\nAll dogs are Mammal\nTherefore all dogs are cats'));
    expect(result.valid).toBe(false);
  });

  it('AAA-3 is invalid', () => {
    const result = checkSyllogism(syl('AAA-3/A,B,C'));
    expect(result.valid).toBe(false);
  });

  it('IEO-1 is invalid (no relevant rule)', () => {
    const result = checkSyllogism(syl('IEO-1/A,B,C'));
    expect(result.valid).toBe(false);
  });
});

describe('checkSyllogism — import setting', () => {
  it('weakened moods are valid under traditional reading (default)', () => {
    const r = checkSyllogism(syl('AAI-4/A,B,C'));
    expect(r.valid).toBe(true);
    if (r.valid) expect(r.entry.name).toBe('Bramantip');
  });

  it('weakened moods are valid under explicit traditional reading', () => {
    const r = checkSyllogism(syl('AAI-1/A,B,C'), 'traditional');
    expect(r.valid).toBe(true);
  });

  it('weakened moods are invalid under boolean reading', () => {
    const r = checkSyllogism(syl('AAI-4/A,B,C'), 'boolean');
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.entry?.name).toBe('Bramantip');
      expect(r.reason).toBe('weakened-under-boolean');
    }
  });

  it('non-weakened moods stay valid under boolean reading', () => {
    const r = checkSyllogism(syl('AAA-1/A,B,C'), 'boolean');
    expect(r.valid).toBe(true);
    if (r.valid) expect(r.entry.name).toBe('Barbara');
  });

  it('all 9 weakened moods flip to invalid under boolean reading', () => {
    const weakened = ALL_VALID_ENTRIES.filter(e => e.weakened);
    expect(weakened.length).toBe(9);
    for (const e of weakened) {
      const r = checkSyllogism(syl(`${e.mood}-${e.figure}/A,B,C`), 'boolean');
      expect(r.valid, `${e.name} (${e.mood}-${e.figure}) should be invalid under boolean`).toBe(false);
    }
  });

  it('the 15 non-weakened moods stay valid under boolean reading', () => {
    const strong = ALL_VALID_ENTRIES.filter(e => !e.weakened);
    expect(strong.length).toBe(15);
    for (const e of strong) {
      const r = checkSyllogism(syl(`${e.mood}-${e.figure}/A,B,C`), 'boolean');
      expect(r.valid, `${e.name} (${e.mood}-${e.figure}) should be valid under boolean`).toBe(true);
    }
  });

  it('not-in-table moods are invalid under both readings', () => {
    expect(checkSyllogism(syl('AAA-2/A,B,C'), 'traditional').valid).toBe(false);
    expect(checkSyllogism(syl('AAA-2/A,B,C'), 'boolean').valid).toBe(false);
  });
});

describe('checkSyllogism — exhaustive crosscheck', () => {
  it('every entry in ALL_VALID_ENTRIES round-trips through compact-form parse + check', () => {
    for (const e of ALL_VALID_ENTRIES) {
      const compact = `${e.mood}-${e.figure}/A,B,C`;
      const s = syl(compact);
      const r = checkSyllogism(s);
      expect(r.valid, `expected ${compact} to be valid`).toBe(true);
      if (r.valid) {
        expect(r.entry.name).toBe(e.name);
      }
    }
  });

  it('a sample of moods absent from the table check as invalid', () => {
    const samples: [Mood, Figure][] = [
      ['AAA', 2], ['AAA', 3], ['AAA', 4],
      ['III', 1], ['OOO', 2], ['EEE', 4],
    ];
    for (const [mood, figure] of samples) {
      const r = checkSyllogism(syl(`${mood}-${figure}/A,B,C`));
      expect(r.valid, `expected ${mood}-${figure} to be invalid`).toBe(false);
    }
  });
});
