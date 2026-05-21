import { describe, expect, it } from 'vitest';
import { evaluateMou } from '../mohist-engine';
import {
  FOUR_CATEGORIES,
  FLAG_OUTCOME,
  outcomeForFlag,
} from '../mohist-types';
import type { MouArgument, MouFlag } from '../mohist-types';

function arg(over: Partial<MouArgument>): MouArgument {
  return {
    base: { subject: 'a white horse', predicate: 'a horse' },
    operator: 'ride',
    outcome: 'shi-er-ran',
    flag: null,
    gloss: null,
    ...over,
  };
}

describe('FOUR_CATEGORIES — the closed structure', () => {
  it('has exactly four categories, numbered 1..4', () => {
    expect(FOUR_CATEGORIES).toHaveLength(4);
    expect(FOUR_CATEGORIES.map(c => c.n)).toEqual([1, 2, 3, 4]);
  });

  it('has exactly one transferring category — shi-er-ran', () => {
    const transferring = FOUR_CATEGORIES.filter(c => c.transfers);
    expect(transferring).toHaveLength(1);
    expect(transferring[0]!.id).toBe('shi-er-ran');
    expect(transferring[0]!.flag).toBeNull();
  });

  it('puts the three non-transferring categories in bijection with the three flags', () => {
    const flags = FOUR_CATEGORIES.filter(c => !c.transfers).map(c => c.flag);
    expect(new Set(flags)).toEqual(new Set<MouFlag>(['opacity', 'scope', 'sortal']));
    // FLAG_OUTCOME is the inverse map and round-trips.
    for (const c of FOUR_CATEGORIES) {
      if (c.flag) expect(FLAG_OUTCOME[c.flag]).toBe(c.id);
    }
  });

  it('outcomeForFlag — no flag means shi-er-ran', () => {
    expect(outcomeForFlag(null)).toBe('shi-er-ran');
    expect(outcomeForFlag('opacity')).toBe('shi-er-bu-ran');
    expect(outcomeForFlag('scope')).toBe('yi-zhou-yi-bu-zhou');
    expect(outcomeForFlag('sortal')).toBe('yi-shi-yi-fei');
  });
});

describe('evaluateMou — form-check', () => {
  it('accepts a well-formed schema', () => {
    const e = evaluateMou(arg({}));
    expect(e.wellFormed).toBe(true);
    expect(e.formIssues).toEqual([]);
  });

  it('rejects an empty operator', () => {
    const e = evaluateMou(arg({ operator: '  ' }));
    expect(e.wellFormed).toBe(false);
    expect(e.verdict).toBe('ill-formed');
    expect(e.formIssues.join(' ')).toMatch(/operator/);
  });

  it('rejects two identical base terms — no genuine parallel', () => {
    const e = evaluateMou(arg({ base: { subject: 'a horse', predicate: 'a horse' } }));
    expect(e.wellFormed).toBe(false);
    expect(e.formIssues.join(' ')).toMatch(/identical/);
  });

  it('treats identical terms case-insensitively', () => {
    const e = evaluateMou(arg({ base: { subject: 'A Horse', predicate: 'a horse' } }));
    expect(e.wellFormed).toBe(false);
  });

  it('constructs the parallel pair by prefixing the operator', () => {
    const e = evaluateMou(arg({}));
    expect(e.parallelPair).toEqual({
      subject: 'ride a white horse',
      predicate: 'ride a horse',
    });
  });
});

describe('evaluateMou — cross-check', () => {
  it('is consistent when no flag is set and the outcome is shi-er-ran', () => {
    const e = evaluateMou(arg({ outcome: 'shi-er-ran', flag: null }));
    expect(e.consistent).toBe(true);
    expect(e.inconsistency).toBeNull();
    expect(e.verdict).toBe('transfers');
  });

  it('is consistent when the flag implies the declared outcome', () => {
    const e = evaluateMou(arg({ outcome: 'shi-er-bu-ran', flag: 'opacity' }));
    expect(e.consistent).toBe(true);
    expect(e.verdict).toBe('fails');
  });

  it('flags an inconsistency when a failure outcome names no flag', () => {
    const e = evaluateMou(arg({ outcome: 'shi-er-bu-ran', flag: null }));
    expect(e.consistent).toBe(false);
    expect(e.verdict).toBe('inconsistent');
    expect(e.inconsistency).toMatch(/no failure mode/);
  });

  it('flags an inconsistency when the flag implies a different outcome', () => {
    const e = evaluateMou(arg({ outcome: 'shi-er-ran', flag: 'opacity' }));
    expect(e.consistent).toBe(false);
    expect(e.verdict).toBe('inconsistent');
    expect(e.expectedCategory.id).toBe('shi-er-bu-ran');
  });

  it('reports each flag pointing at the wrong outcome', () => {
    const e = evaluateMou(arg({ outcome: 'yi-shi-yi-fei', flag: 'scope' }));
    expect(e.consistent).toBe(false);
    expect(e.inconsistency).toMatch(/一周而一不周/);
  });
});

describe('evaluateMou — verdict priority', () => {
  it('ill-formed takes priority over an inconsistency', () => {
    // bad form AND a flag/outcome mismatch — ill-formed wins.
    const e = evaluateMou(
      arg({ operator: '', outcome: 'shi-er-ran', flag: 'opacity' }),
    );
    expect(e.verdict).toBe('ill-formed');
  });

  it('an inconsistency takes priority over the transfer verdict', () => {
    const e = evaluateMou(arg({ outcome: 'shi-er-ran', flag: 'sortal' }));
    expect(e.verdict).toBe('inconsistent');
  });
});
