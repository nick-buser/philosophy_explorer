import { describe, expect, it } from 'vitest';
import {
  INTUITIONISTIC_AXIOMS,
  intuitionisticAxiomVerdicts,
} from '../intuitionistic-axioms';
import type { KripkeModel } from '../kripke-types';

const CHAIN_PQ: KripkeModel = {
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

const FORK_PQ: KripkeModel = {
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

describe('INTUITIONISTIC_AXIOMS — definition sanity', () => {
  it('every axiom has a unique short label', () => {
    const labels = INTUITIONISTIC_AXIOMS.map(a => a.short);
    expect(new Set(labels).size).toBe(labels.length);
  });

  it('each axiom has a non-empty schema and gloss', () => {
    for (const a of INTUITIONISTIC_AXIOMS) {
      expect(a.schema.length).toBeGreaterThan(0);
      expect(a.gloss.length).toBeGreaterThan(0);
      expect(['valid', 'classical-only']).toContain(a.kind);
    }
  });
});

describe('verdicts on the canonical 2-world chain', () => {
  const verdicts = intuitionisticAxiomVerdicts(CHAIN_PQ);
  const byShort = Object.fromEntries(verdicts.map(v => [v.axiom.short, v]));

  it('intuitionistically valid: MP', () => {
    expect(byShort.MP!.valid).toBe(true);
  });
  it('intuitionistically valid: I (identity)', () => {
    expect(byShort.I!.valid).toBe(true);
  });
  it('intuitionistically valid: ∧I', () => {
    expect(byShort['∧I']!.valid).toBe(true);
  });
  it('classical-only: LEM fails', () => {
    expect(byShort.LEM!.valid).toBe(false);
    expect(byShort.LEM!.failure?.world).toBe('w0');
  });
  it('classical-only: DNE fails', () => {
    expect(byShort.DNE!.valid).toBe(false);
  });
  it('classical-only: Peirce fails', () => {
    expect(byShort.Peirce!.valid).toBe(false);
  });
});

describe('verdicts on the 3-world fork', () => {
  const verdicts = intuitionisticAxiomVerdicts(FORK_PQ);
  const byShort = Object.fromEntries(verdicts.map(v => [v.axiom.short, v]));

  it('weak LEM fails on the fork (it didn’t fail on the chain)', () => {
    expect(byShort.wLEM!.valid).toBe(false);
  });

  it('De Morgan classical half fails on the fork', () => {
    expect(byShort.DM!.valid).toBe(false);
  });
});
