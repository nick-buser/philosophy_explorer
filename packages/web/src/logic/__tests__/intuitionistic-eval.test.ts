import { describe, expect, it } from 'vitest';
import { parseModal } from '../kripke-parser';
import {
  forces,
  forcesMap,
  validInModel,
  IntuitionisticEvalError,
} from '../intuitionistic-eval';
import type { KripkeModel } from '../kripke-types';

function parse(src: string) {
  const r = parseModal(src);
  if (!r.ok) throw new Error(`parse failed for ${src}: ${r.error.message}`);
  return r.formula;
}

// 2-world chain: w0 ≤ w1, with p only at w1.
const CHAIN: KripkeModel = {
  worlds: [
    { id: 'w0', atoms: [] },
    { id: 'w1', atoms: ['p'] },
  ],
  edges: [
    { from: 'w0', to: 'w0' },
    { from: 'w0', to: 'w1' },
    { from: 'w1', to: 'w1' },
  ],
  designated: 'w0',
};

// 3-world fork: w0 ≤ w1 (with p), w0 ≤ w2 (with q).
const FORK: KripkeModel = {
  worlds: [
    { id: 'w0', atoms: [] },
    { id: 'w1', atoms: ['p'] },
    { id: 'w2', atoms: ['q'] },
  ],
  edges: [
    { from: 'w0', to: 'w0' },
    { from: 'w0', to: 'w1' },
    { from: 'w0', to: 'w2' },
    { from: 'w1', to: 'w1' },
    { from: 'w2', to: 'w2' },
  ],
  designated: 'w0',
};

const SINGLETON: KripkeModel = {
  worlds: [{ id: 'w0', atoms: ['p', 'q'] }],
  edges: [{ from: 'w0', to: 'w0' }],
  designated: 'w0',
};

describe('forces — atoms', () => {
  it('atom forced where it’s in the valuation', () => {
    expect(forces(parse('p'), CHAIN, 'w1')).toBe(true);
  });
  it('atom not forced where it isn’t in the valuation', () => {
    expect(forces(parse('p'), CHAIN, 'w0')).toBe(false);
  });
});

describe('forces — conjunction / disjunction', () => {
  it('conjunction', () => {
    expect(forces(parse('p & q'), SINGLETON, 'w0')).toBe(true);
    expect(forces(parse('p & r'), SINGLETON, 'w0')).toBe(false);
  });
  it('disjunction', () => {
    expect(forces(parse('p | r'), SINGLETON, 'w0')).toBe(true);
    expect(forces(parse('r | s'), SINGLETON, 'w0')).toBe(false);
  });
});

describe('forces — implication and negation are universal-future', () => {
  it('p → p forced everywhere', () => {
    for (const w of CHAIN.worlds) {
      expect(forces(parse('p -> p'), CHAIN, w.id)).toBe(true);
    }
  });

  it('p → q not forced at w0 of CHAIN — p ⊩ w1 but q ⋮ w1', () => {
    expect(forces(parse('p -> q'), CHAIN, 'w0')).toBe(false);
  });

  it('¬p not forced at w0 of CHAIN — w1 forces p', () => {
    expect(forces(parse('!p'), CHAIN, 'w0')).toBe(false);
  });

  it('¬q forced at w0 of CHAIN — no future forces q', () => {
    expect(forces(parse('!q'), CHAIN, 'w0')).toBe(true);
  });

  it('p → ¬¬p (DNI) intuitionistically valid in CHAIN', () => {
    for (const w of CHAIN.worlds) {
      expect(forces(parse('p -> !!p'), CHAIN, w.id)).toBe(true);
    }
  });
});

describe('classical-only principles fail in CHAIN', () => {
  it('LEM (p ∨ ¬p) fails at w0', () => {
    expect(forces(parse('p | !p'), CHAIN, 'w0')).toBe(false);
  });

  it('DNE (¬¬p → p) fails at w0', () => {
    expect(forces(parse('!!p -> p'), CHAIN, 'w0')).toBe(false);
  });

  it('Peirce ((p → q) → p) → p fails at w0', () => {
    expect(forces(parse('((p -> q) -> p) -> p'), CHAIN, 'w0')).toBe(false);
  });
});

describe('classical-only principles fail in FORK', () => {
  it('weak LEM (¬p ∨ ¬¬p) fails at w0', () => {
    expect(forces(parse('!p | !!p'), FORK, 'w0')).toBe(false);
  });

  it('De Morgan classical half ¬(p ∧ q) → (¬p ∨ ¬q) fails at w0', () => {
    expect(forces(parse('!(p & q) -> (!p | !q)'), FORK, 'w0')).toBe(false);
  });

  it('De Morgan intuitionistic half (¬p ∨ ¬q) → ¬(p ∧ q) holds at w0', () => {
    expect(forces(parse('(!p | !q) -> !(p & q)'), FORK, 'w0')).toBe(true);
  });
});

describe('iff de-sugars to two implications', () => {
  it('p ↔ p valid', () => {
    expect(forces(parse('p <-> p'), CHAIN, 'w0')).toBe(true);
  });
  it('p ↔ q not forced at w0 of CHAIN', () => {
    expect(forces(parse('p <-> q'), CHAIN, 'w0')).toBe(false);
  });
});

describe('forcesMap and validInModel', () => {
  it('forcesMap reports per-world truth', () => {
    const map = forcesMap(parse('p'), CHAIN);
    expect(map).toEqual({ w0: false, w1: true });
  });

  it('validInModel: p → p is valid', () => {
    expect(validInModel(parse('p -> p'), CHAIN)).toEqual({ valid: true });
  });

  it('validInModel: LEM fails — failingWorld is w0', () => {
    const r = validInModel(parse('p | !p'), CHAIN);
    expect(r.valid).toBe(false);
    expect(r.failingWorld).toBe('w0');
  });
});

describe('persistence — atoms forced upward stay forced', () => {
  it('once p ⊩ at w1, p ⊩ at every future of w1', () => {
    // CHAIN: w1’s only future is itself.
    expect(forces(parse('p'), CHAIN, 'w1')).toBe(true);
  });
});

describe('modal operators are explicitly rejected', () => {
  it('throws on □p', () => {
    expect(() => forces(parse('[]p'), CHAIN, 'w0')).toThrow(IntuitionisticEvalError);
  });
  it('throws on ◇p', () => {
    expect(() => forces(parse('<>p'), CHAIN, 'w0')).toThrow(IntuitionisticEvalError);
  });
});
