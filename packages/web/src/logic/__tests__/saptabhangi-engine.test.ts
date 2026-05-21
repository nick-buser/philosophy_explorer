import { describe, expect, it } from 'vitest';
import { classifyBhanga } from '../saptabhangi-engine';
import { SEVEN_BHANGAS, modeSetKey } from '../saptabhangi-types';
import type { BasicMode, Predication } from '../saptabhangi-types';

function predicationOf(modes: BasicMode[]): Predication {
  return {
    subject: 's',
    predicate: 'p',
    standpoints: modes.map((mode, i) => ({ name: `n${i}`, mode })),
  };
}

describe('SEVEN_BHANGAS — the closed structure', () => {
  it('has exactly seven entries', () => {
    expect(SEVEN_BHANGAS).toHaveLength(7);
  });

  it('is 3 singletons, 3 pairs, and 1 triple', () => {
    const bySize = new Map<number, number>();
    for (const b of SEVEN_BHANGAS) {
      bySize.set(b.modes.length, (bySize.get(b.modes.length) ?? 0) + 1);
    }
    expect(bySize.get(1)).toBe(3);
    expect(bySize.get(2)).toBe(3);
    expect(bySize.get(3)).toBe(1);
  });

  it('numbers the bhaṅgas 1 through 7', () => {
    expect(SEVEN_BHANGAS.map(b => b.n)).toEqual([1, 2, 3, 4, 5, 6, 7]);
  });

  it('the seven mode-sets are all distinct and all non-empty', () => {
    const keys = SEVEN_BHANGAS.map(b => modeSetKey(b.modes));
    expect(new Set(keys).size).toBe(7);
    for (const b of SEVEN_BHANGAS) expect(b.modes.length).toBeGreaterThan(0);
  });
});

describe('classifyBhanga', () => {
  it('classifies a single asti standpoint as bhaṅga 1', () => {
    expect(classifyBhanga(predicationOf(['asti'])).bhanga.n).toBe(1);
  });

  it('classifies asti + nāsti as bhaṅga 3, regardless of standpoint order', () => {
    expect(classifyBhanga(predicationOf(['asti', 'nasti'])).bhanga.n).toBe(3);
    expect(classifyBhanga(predicationOf(['nasti', 'asti'])).bhanga.n).toBe(3);
  });

  it('classifies all three modes as bhaṅga 7', () => {
    expect(classifyBhanga(predicationOf(['asti', 'nasti', 'avaktavya'])).bhanga.n).toBe(7);
  });

  it('treats repeated assertions of a mode as one — a re-assertion, not a new mode', () => {
    const c = classifyBhanga(predicationOf(['asti', 'asti', 'asti']));
    expect(c.bhanga.n).toBe(1);
    expect(c.presentModes).toEqual(['asti']);
  });

  it('reaches every one of the seven bhaṅgas', () => {
    const reached = new Set<number>();
    for (const b of SEVEN_BHANGAS) {
      reached.add(classifyBhanga(predicationOf(b.modes)).bhanga.n);
    }
    expect([...reached].sort((a, b) => a - b)).toEqual([1, 2, 3, 4, 5, 6, 7]);
  });

  it('reports which standpoints contributed each present mode', () => {
    const p: Predication = {
      subject: 's',
      predicate: 'p',
      standpoints: [
        { name: 'substance', mode: 'asti' },
        { name: 'shape', mode: 'nasti' },
        { name: 'colour', mode: 'asti' },
      ],
    };
    const c = classifyBhanga(p);
    expect(c.bhanga.n).toBe(3);
    const asti = c.byMode.find(x => x.mode === 'asti')!;
    expect(asti.standpoints).toEqual(['substance', 'colour']);
  });
});
