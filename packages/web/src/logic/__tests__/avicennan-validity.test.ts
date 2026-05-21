import { describe, expect, it } from 'vitest';
import { parseAvicennan } from '../avicennan-parser';
import {
  checkSyllogism,
  compareModality,
  inheritedModality,
} from '../avicennan-validity';
import type { Syllogism } from '../avicennan-types';

function block(...props: string[]): Syllogism {
  const r = parseAvicennan(['syllogism', ...props, 'end'].join('\n'));
  if (!r.ok) throw new Error(`parse failed: ${r.error.message}`);
  if (r.formula.kind !== 'syllogism') throw new Error('expected a syllogism');
  return r.formula.syllogism;
}

describe('compareModality', () => {
  it('orders necessary > perpetual > absolute', () => {
    expect(compareModality('necessary', 'absolute')).toBe('stronger');
    expect(compareModality('absolute', 'necessary')).toBe('weaker');
    expect(compareModality('perpetual', 'perpetual')).toBe('equal');
  });

  it('treats two-sided possibility as incomparable', () => {
    expect(compareModality('possible', 'necessary')).toBe('incomparable');
    expect(compareModality('necessary', 'possible')).toBe('incomparable');
    expect(compareModality('possible', 'possible')).toBe('equal');
  });
});

describe('checkSyllogism — figure 1 (conclusion follows the major)', () => {
  it('necessary major + absolute minor ⊢ necessary conclusion (the contested LXL Barbara)', () => {
    const s = block(
      'necessary every animal is mortal',
      'absolute  every human  is animal',
      'necessary every human  is mortal',
    );
    const v = checkSyllogism(s);
    expect(v.kind).toBe('valid');
    if (v.kind === 'valid') expect(v.inheritedModality).toBe('necessary');
  });

  it('rejects a conclusion claimed stronger than the major (modal fallacy)', () => {
    // Assertorically a perfectly good Barbara, but two absolute premises
    // cannot yield a necessary conclusion.
    const s = block(
      'absolute  every animal is mortal',
      'absolute  every human  is animal',
      'necessary every human  is mortal',
    );
    const v = checkSyllogism(s);
    expect(v.kind).toBe('invalid');
    if (v.kind === 'invalid') expect(v.reason).toMatch(/only 'absolute' follows/);
  });

  it('an absolute major caps the conclusion at absolute regardless of the minor', () => {
    const s = block(
      'absolute  every animal is mortal',
      'necessary every human  is animal',
      'necessary every human  is mortal',
    );
    const v = checkSyllogism(s);
    expect(v.kind).toBe('invalid');
    expect(inheritedModality(s)).toBe('absolute');
  });

  it('accepts an under-claimed conclusion and reports the strongest modality that follows', () => {
    const s = block(
      'necessary every animal is mortal',
      'necessary every human  is animal',
      'absolute  every human  is mortal',
    );
    const v = checkSyllogism(s);
    expect(v.kind).toBe('valid');
    if (v.kind === 'valid') expect(v.inheritedModality).toBe('necessary');
  });

  it('carries perpetual through from the major', () => {
    const s = block(
      'perpetual every animal is mortal',
      'absolute  every human  is animal',
      'perpetual every human  is mortal',
    );
    expect(checkSyllogism(s).kind).toBe('valid');
  });

  it('a possible conclusion is incomparable to a necessary major', () => {
    const s = block(
      'necessary every animal is mortal',
      'absolute  every human  is animal',
      'possible  every human  is mortal',
    );
    const v = checkSyllogism(s);
    expect(v.kind).toBe('invalid');
    if (v.kind === 'invalid') expect(v.reason).toMatch(/possibility/);
  });
});

describe('checkSyllogism — figures 2-4', () => {
  it('accepts a uniform-necessity Cesare in figure 2', () => {
    const s = block(
      'necessary no mammal is reptile',
      'necessary every snake is reptile',
      'necessary no snake is mammal',
    );
    expect(s.figure).toBe(2);
    const v = checkSyllogism(s);
    expect(v.kind).toBe('valid');
    if (v.kind === 'valid') expect(v.inheritedModality).toBe('necessary');
  });

  it('defers a mixed-modality mood outside figure 1', () => {
    const s = block(
      'necessary no mammal is reptile',
      'absolute  every snake is reptile',
      'necessary no snake is mammal',
    );
    const v = checkSyllogism(s);
    expect(v.kind).toBe('invalid');
    if (v.kind === 'invalid') expect(v.reason).toMatch(/phase 2/);
  });
});

describe('checkSyllogism — assertoric skeleton', () => {
  it('rejects an invalid skeleton (undistributed middle, AAA-2)', () => {
    const s = block(
      'necessary every cats is mammal',
      'necessary every dogs is mammal',
      'necessary every dogs is cats',
    );
    expect(s.figure).toBe(2);
    const v = checkSyllogism(s);
    expect(v.kind).toBe('invalid');
    if (v.kind === 'invalid') expect(v.reason).toMatch(/assertoric skeleton/);
  });
});

// ─────────────────────────────────────────────────────────────────────
// Cross-check against a hand-transcribed reconstruction table.
//
// Each row: figure, [majorModality, minorModality, statedConclusion],
// assertoric skeleton (premise quantities/qualities are all universal
// affirmative unless noted), and the expected verdict kind.

describe('avicennan validity — reconstruction cross-check', () => {
  type Row = {
    name: string;
    props: [string, string, string];
    expect: 'valid' | 'invalid';
  };

  const rows: Row[] = [
    {
      name: 'necessity-Barbara (LXL)',
      props: [
        'necessary every animal is mortal',
        'absolute  every human  is animal',
        'necessary every human  is mortal',
      ],
      expect: 'valid',
    },
    {
      name: 'all-necessary Barbara',
      props: [
        'necessary every animal is mortal',
        'necessary every human  is animal',
        'necessary every human  is mortal',
      ],
      expect: 'valid',
    },
    {
      name: 'all-absolute Barbara',
      props: [
        'absolute every animal is mortal',
        'absolute every human  is animal',
        'absolute every human  is mortal',
      ],
      expect: 'valid',
    },
    {
      name: 'necessity-Darii (AII-1)',
      props: [
        'necessary every animal is mortal',
        'necessary some human  is animal',
        'necessary some human  is mortal',
      ],
      expect: 'valid',
    },
    {
      name: 'necessity-Celarent (EAE-1)',
      props: [
        'necessary no animal is stone',
        'necessary every human is animal',
        'necessary no human  is stone',
      ],
      expect: 'valid',
    },
    {
      name: 'modal fallacy — absolute premises, necessary conclusion',
      props: [
        'absolute  every animal is mortal',
        'absolute  every human  is animal',
        'necessary every human  is mortal',
      ],
      expect: 'invalid',
    },
    {
      name: 'figure-2 mixed modality (deferred)',
      props: [
        'necessary no mammal is reptile',
        'absolute  every snake is reptile',
        'necessary no snake is mammal',
      ],
      expect: 'invalid',
    },
  ];

  for (const row of rows) {
    it(row.name, () => {
      const s = block(...row.props);
      expect(checkSyllogism(s).kind).toBe(row.expect);
    });
  }
});
