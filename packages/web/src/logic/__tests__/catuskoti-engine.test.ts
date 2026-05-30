import { describe, expect, it } from 'vitest';
import {
  evaluateCatuskoti,
  evaluateCorners,
  fdeAnd,
  fdeNot,
  fdeOr,
} from '../catuskoti-engine';
import { FOUR_KOTIS, valueKey } from '../catuskoti-types';
import type { KotiNumber, Proposition, TruthValue } from '../catuskoti-types';

function propOf(koti: KotiNumber, reading: Proposition['reading'] = 'affirming'): Proposition {
  return { text: 'A', koti, reading };
}

// The FDE value of the formula at koṭi `n`, evaluated under v(A).
function cornerValue(vA: TruthValue[], n: KotiNumber): TruthValue[] {
  return evaluateCorners(vA).find(c => c.koti.n === n)!.value;
}

describe('FOUR_KOTIS — the closed structure', () => {
  it('has exactly four entries', () => {
    expect(FOUR_KOTIS).toHaveLength(4);
  });

  it('numbers the koṭis 1 through 4', () => {
    expect(FOUR_KOTIS.map(k => k.n)).toEqual([1, 2, 3, 4]);
  });

  it('is the four distinct subsets of {true, false} — one empty, two singletons, one pair', () => {
    const keys = FOUR_KOTIS.map(k => valueKey(k.values));
    expect(new Set(keys).size).toBe(4);
    const sizes = FOUR_KOTIS.map(k => k.values.length).sort();
    expect(sizes).toEqual([0, 1, 1, 2]);
  });

  it('places affirmation at {true}, negation at {false}, both at the glut, neither at the gap', () => {
    expect(FOUR_KOTIS[0]!.values).toEqual(['true']);
    expect(FOUR_KOTIS[1]!.values).toEqual(['false']);
    expect(FOUR_KOTIS[2]!.values).toEqual(['true', 'false']);
    expect(FOUR_KOTIS[3]!.values).toEqual([]);
  });
});

describe('FDE connectives', () => {
  it('negation swaps truth and falsity, and fixes the glut and the gap', () => {
    expect(fdeNot(['true'])).toEqual(['false']);
    expect(fdeNot(['false'])).toEqual(['true']);
    expect(fdeNot(['true', 'false'])).toEqual(['true', 'false']);
    expect(fdeNot([])).toEqual([]);
  });

  it('conjunction is true iff both true, false iff either false', () => {
    expect(fdeAnd(['true'], ['true'])).toEqual(['true']);
    expect(fdeAnd(['true'], ['false'])).toEqual(['false']);
    expect(fdeAnd(['true'], [])).toEqual([]);
    expect(fdeAnd(['true', 'false'], ['true', 'false'])).toEqual(['true', 'false']);
  });

  it('disjunction is true iff either true, false iff both false', () => {
    expect(fdeOr(['true'], ['false'])).toEqual(['true']);
    expect(fdeOr(['false'], ['false'])).toEqual(['false']);
    expect(fdeOr([], [])).toEqual([]);
    expect(fdeOr(['true', 'false'], [])).toEqual(['true']);
  });
});

describe('evaluateCorners — the four corner-formulas under v(A)', () => {
  it('koṭi 1 (v(A)={true}) designates only the A corner', () => {
    const corners = evaluateCorners(['true']);
    expect(corners.filter(c => c.designated).map(c => c.koti.n)).toEqual([1]);
  });

  it('koṭi 2 (v(A)={false}) designates only the ¬A corner', () => {
    const corners = evaluateCorners(['false']);
    expect(corners.filter(c => c.designated).map(c => c.koti.n)).toEqual([2]);
  });

  it('koṭi 3 (v(A) is the glut) designates all four corners', () => {
    const corners = evaluateCorners(['true', 'false']);
    expect(corners.every(c => c.designated)).toBe(true);
  });

  it('koṭi 4 (v(A) is the gap) designates no corner — not even ¬(A∨¬A)', () => {
    const corners = evaluateCorners([]);
    expect(corners.some(c => c.designated)).toBe(false);
    expect(cornerValue([], 4)).toEqual([]);
  });

  it('the A corner always reproduces v(A)', () => {
    expect(cornerValue(['true'], 1)).toEqual(['true']);
    expect(cornerValue(['false'], 1)).toEqual(['false']);
    expect(cornerValue([], 1)).toEqual([]);
  });
});

describe('evaluateCatuskoti', () => {
  it('places the proposition at the koṭi the input picks', () => {
    for (const n of [1, 2, 3, 4] as KotiNumber[]) {
      expect(evaluateCatuskoti(propOf(n)).koti.n).toBe(n);
    }
  });

  it('the proposition value is the selected koṭi value set', () => {
    expect(evaluateCatuskoti(propOf(3)).propositionValue).toEqual(['true', 'false']);
    expect(evaluateCatuskoti(propOf(4)).propositionValue).toEqual([]);
  });

  it('affirms the corner under the affirming reading', () => {
    expect(evaluateCatuskoti(propOf(1, 'affirming')).verdict).toBe('affirmed');
  });

  it('rejects the corner under the prasaṅga reading', () => {
    expect(evaluateCatuskoti(propOf(1, 'prasanga')).verdict).toBe('rejected');
  });

  it('reaches every one of the four koṭis', () => {
    const reached = new Set<number>();
    for (const n of [1, 2, 3, 4] as KotiNumber[]) {
      reached.add(evaluateCatuskoti(propOf(n)).koti.n);
    }
    expect([...reached].sort((a, b) => a - b)).toEqual([1, 2, 3, 4]);
  });
});
