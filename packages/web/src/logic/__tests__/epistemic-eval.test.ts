import { describe, expect, it } from 'vitest';
import { parseEpistemic } from '../epistemic-parser';
import {
  satisfactionMapE,
  satisfiesE,
  validInModelE,
} from '../epistemic-eval';
import type { EpistemicModel } from '../epistemic-types';

function parse(src: string) {
  const r = parseEpistemic(src);
  if (!r.ok) throw new Error(`parse failed: ${r.error.message}`);
  return r.formula;
}

// Two-world S5 model for alice (total relation), identity for bob.
// p only at w1.
const ASYMMETRIC: EpistemicModel = {
  worlds: [
    { id: 'w0', atoms: [] },
    { id: 'w1', atoms: ['p'] },
  ],
  edges: [
    { from: 'w0', to: 'w0', agent: 'alice' },
    { from: 'w0', to: 'w1', agent: 'alice' },
    { from: 'w1', to: 'w0', agent: 'alice' },
    { from: 'w1', to: 'w1', agent: 'alice' },
    { from: 'w0', to: 'w0', agent: 'bob' },
    { from: 'w1', to: 'w1', agent: 'bob' },
  ],
  agents: ['alice', 'bob'],
  designated: 'w1',
};

describe('K_a — universal quantification over R_a-successors', () => {
  it('K_alice p ⋮ at w1 — alice can’t tell w0 from w1, p ⋮ w0', () => {
    expect(satisfiesE(parse('K_alice p'), ASYMMETRIC, 'w1')).toBe(false);
  });

  it('K_bob p ⊨ at w1 — bob’s only alternative is w1, p ⊨ w1', () => {
    expect(satisfiesE(parse('K_bob p'), ASYMMETRIC, 'w1')).toBe(true);
  });

  it('K_bob p ⋮ at w0 — bob’s only alternative is w0, p ⋮ w0', () => {
    expect(satisfiesE(parse('K_bob p'), ASYMMETRIC, 'w0')).toBe(false);
  });
});

describe('M_a — existential quantification over R_a-successors', () => {
  it('M_alice p ⊨ at w0 — alice considers w1 possible', () => {
    expect(satisfiesE(parse('M_alice p'), ASYMMETRIC, 'w0')).toBe(true);
  });

  it('M_bob p ⋮ at w0 — bob’s only alternative is w0', () => {
    expect(satisfiesE(parse('M_bob p'), ASYMMETRIC, 'w0')).toBe(false);
  });
});

describe('higher-order knowledge', () => {
  it('K_alice K_bob p ⋮ at w1 — at w0 (which alice considers possible), K_bob p fails', () => {
    expect(satisfiesE(parse('K_alice K_bob p'), ASYMMETRIC, 'w1')).toBe(false);
  });

  it('K_alice (K_bob p | K_bob !p) ⊨ at w1 — alice knows bob knows whether p', () => {
    expect(satisfiesE(parse('K_alice (K_bob p | K_bob !p)'), ASYMMETRIC, 'w1')).toBe(true);
  });
});

describe('S5 axioms — alice has S5; verify on the asymmetric model', () => {
  it('K-axiom: K_alice (p -> q) -> (K_alice p -> K_alice q)', () => {
    // Alice has S5 over both worlds, p only at w1, no q anywhere.
    // (p → q) holds at w0 (vacuously) but not at w1 (p ⊨, q ⋮). K_alice (p→q) ⋮ everywhere.
    // So the implication is vacuously true everywhere.
    for (const w of ASYMMETRIC.worlds) {
      expect(satisfiesE(
        parse('K_alice (p -> q) -> (K_alice p -> K_alice q)'),
        ASYMMETRIC,
        w.id,
      )).toBe(true);
    }
  });

  it('T (factivity): K_alice p -> p (S5 has reflexive R_alice)', () => {
    for (const w of ASYMMETRIC.worlds) {
      expect(satisfiesE(parse('K_alice p -> p'), ASYMMETRIC, w.id)).toBe(true);
    }
  });
});

describe('satisfactionMapE and validInModelE', () => {
  it('satisfactionMapE — K_bob p per world', () => {
    const map = satisfactionMapE(parse('K_bob p'), ASYMMETRIC);
    expect(map).toEqual({ w0: false, w1: true });
  });

  it('validInModelE: K-axiom is valid in the asymmetric model', () => {
    expect(validInModelE(
      parse('K_alice (p -> p)'),
      ASYMMETRIC,
    )).toEqual({ valid: true });
  });
});
