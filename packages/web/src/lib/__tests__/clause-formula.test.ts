import { describe, it, expect } from 'vitest';
import { clauseFormula } from '../argument-types';
import type { ArgumentClause, Formalization } from '../argument-types';

const base = { id: 'f1', isPrimary: true, fitScore: null, reason: null, distortionRisk: null } as const;

// Barbara (AAA-1): All man are animal / All individual man are man / ∴ All individual man are animal.
const syllogism: Formalization = {
  ...base,
  formalism: 'aristotelian',
  ast: {
    formula: {
      kind: 'syllogism',
      syllogism: {
        major: { form: 'A', subject: 'man', predicate: 'animal' },
        minor: { form: 'A', subject: 'individual man', predicate: 'man' },
        conclusion: { form: 'A', subject: 'individual man', predicate: 'animal' },
        middle: 'man',
        mood: 'AAA',
        figure: 1,
      },
    },
  },
};

const clause = (role: ArgumentClause['role'], position: number): ArgumentClause => ({
  id: `c${position}`, role, position, verbalText: null, sourceExcerpt: null,
});

describe('clauseFormula — aristotelian syllogism maps each clause to its own proposition', () => {
  it('premise@0 → major, premise@1 → minor, conclusion → conclusion (all distinct)', () => {
    const major = clauseFormula(syllogism, clause('premise', 0));
    const minor = clauseFormula(syllogism, clause('premise', 1));
    const concl = clauseFormula(syllogism, clause('conclusion', 2));

    expect(major).toEqual({ kind: 'proposition', proposition: { form: 'A', subject: 'man', predicate: 'animal' } });
    expect(minor).toEqual({ kind: 'proposition', proposition: { form: 'A', subject: 'individual man', predicate: 'man' } });
    expect(concl).toEqual({ kind: 'proposition', proposition: { form: 'A', subject: 'individual man', predicate: 'animal' } });

    // The bug was all three rendering identically.
    expect(major).not.toEqual(minor);
    expect(minor).not.toEqual(concl);
    expect(major).not.toEqual(concl);
  });

  it('a single-proposition formula returns itself', () => {
    const prop: Formalization = {
      ...base,
      formalism: 'aristotelian',
      ast: { formula: { kind: 'proposition', proposition: { form: 'E', subject: 'swans', predicate: 'black' } } },
    };
    expect(clauseFormula(prop, clause('claim', 0))).toEqual({
      kind: 'proposition',
      proposition: { form: 'E', subject: 'swans', predicate: 'black' },
    });
  });
});
