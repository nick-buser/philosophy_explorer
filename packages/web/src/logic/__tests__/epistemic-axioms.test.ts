import { describe, expect, it } from 'vitest';
import {
  EPISTEMIC_AXIOMS,
  epistemicAxiomVerdicts,
} from '../epistemic-axioms';
import type { EpistemicModel } from '../epistemic-types';

const TWO_WORLD_S5_BOTH: EpistemicModel = {
  worlds: [
    { id: 'w0', atoms: [] },
    { id: 'w1', atoms: ['p'] },
  ],
  edges: [
    // alice: total relation (S5 over {w0, w1})
    { from: 'w0', to: 'w0', agent: 'alice' },
    { from: 'w0', to: 'w1', agent: 'alice' },
    { from: 'w1', to: 'w0', agent: 'alice' },
    { from: 'w1', to: 'w1', agent: 'alice' },
    { from: 'w0', to: 'w0', agent: 'bob' },
    { from: 'w0', to: 'w1', agent: 'bob' },
    { from: 'w1', to: 'w0', agent: 'bob' },
    { from: 'w1', to: 'w1', agent: 'bob' },
  ],
  agents: ['alice', 'bob'],
  designated: 'w0',
};

// Bob's relation is non-reflexive at w0 (KD45-ish) — T should fail for bob.
const BOB_NON_REFLEXIVE: EpistemicModel = {
  worlds: [
    { id: 'w0', atoms: [] },
    { id: 'w1', atoms: ['p'] },
  ],
  edges: [
    // alice: S5
    { from: 'w0', to: 'w0', agent: 'alice' },
    { from: 'w0', to: 'w1', agent: 'alice' },
    { from: 'w1', to: 'w0', agent: 'alice' },
    { from: 'w1', to: 'w1', agent: 'alice' },
    // bob: serial + transitive + Euclidean but not reflexive
    { from: 'w0', to: 'w1', agent: 'bob' },
    { from: 'w1', to: 'w1', agent: 'bob' },
  ],
  agents: ['alice', 'bob'],
  designated: 'w0',
};

describe('EPISTEMIC_AXIOMS — definition sanity', () => {
  it('every axiom has a unique short label', () => {
    const labels = EPISTEMIC_AXIOMS.map(a => a.short);
    expect(new Set(labels).size).toBe(labels.length);
  });
});

describe('verdicts on TWO_WORLD_S5_BOTH', () => {
  const verdicts = epistemicAxiomVerdicts(TWO_WORLD_S5_BOTH);

  it('every axiom holds for every agent on full S5', () => {
    for (const v of verdicts) {
      expect(v.valid, `${v.axiom.short} for ${v.agent} unexpectedly failed`).toBe(true);
    }
  });
});

describe('verdicts on BOB_NON_REFLEXIVE', () => {
  const verdicts = epistemicAxiomVerdicts(BOB_NON_REFLEXIVE);
  const byAgentAxiom = (agent: string, short: string) =>
    verdicts.find(v => v.agent === agent && v.axiom.short === short);

  it('T (factivity) fails for bob, holds for alice', () => {
    expect(byAgentAxiom('bob', 'T')!.valid).toBe(false);
    expect(byAgentAxiom('alice', 'T')!.valid).toBe(true);
  });

  it('K, 4, 5, D all hold for both agents', () => {
    for (const short of ['K', '4', '5', 'D']) {
      expect(byAgentAxiom('alice', short)!.valid).toBe(true);
      expect(byAgentAxiom('bob', short)!.valid).toBe(true);
    }
  });
});
