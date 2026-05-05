import { describe, expect, it } from 'vitest';
import { parseCtl } from '../ctl-parser';
import {
  satisfactionMapC,
  satisfiesC,
  validInModelC,
} from '../ctl-eval';
import type { KripkeModel } from '../ctl-types';

function parse(src: string) {
  const r = parseCtl(src);
  if (!r.ok) throw new Error(`parse failed: ${r.error.message}`);
  return r.formula;
}

// Branching frame:
//   s0 → s1 (p)
//   s0 → s2 (∅, self-loop)
//   s1 → s1
const FORK_P_ON_ONE: KripkeModel = {
  worlds: [
    { id: 's0', atoms: [] },
    { id: 's1', atoms: ['p'] },
    { id: 's2', atoms: [] },
  ],
  edges: [
    { from: 's0', to: 's1' },
    { from: 's0', to: 's2' },
    { from: 's1', to: 's1' },
    { from: 's2', to: 's2' },
  ],
  designated: 's0',
};

// All states have p; serial on every state.
const ALL_P: KripkeModel = {
  worlds: [
    { id: 's0', atoms: ['p'] },
    { id: 's1', atoms: ['p'] },
  ],
  edges: [
    { from: 's0', to: 's1' },
    { from: 's1', to: 's0' },
  ],
  designated: 's0',
};

describe('next operators (AX / EX)', () => {
  it('EX p ⊨ s0 (s1 carries p)', () => {
    expect(satisfiesC(parse('EX p'), FORK_P_ON_ONE, 's0')).toBe(true);
  });

  it('AX p ⋮ s0 (s2 lacks p)', () => {
    expect(satisfiesC(parse('AX p'), FORK_P_ON_ONE, 's0')).toBe(false);
  });

  it('AX p ⊨ s0 of ALL_P', () => {
    expect(satisfiesC(parse('AX p'), ALL_P, 's0')).toBe(true);
  });
});

describe('eventually operators (AF / EF)', () => {
  it('EF p ⊨ s0 of FORK_P_ON_ONE (path through s1)', () => {
    expect(satisfiesC(parse('EF p'), FORK_P_ON_ONE, 's0')).toBe(true);
  });

  it('AF p ⋮ s0 of FORK_P_ON_ONE (s2-branch never reaches p)', () => {
    expect(satisfiesC(parse('AF p'), FORK_P_ON_ONE, 's0')).toBe(false);
  });

  it('AF p ⊨ s0 of ALL_P', () => {
    expect(satisfiesC(parse('AF p'), ALL_P, 's0')).toBe(true);
  });
});

describe('always operators (AG / EG)', () => {
  it('EG p ⊨ s1 of FORK_P_ON_ONE (s1 self-loops with p)', () => {
    expect(satisfiesC(parse('EG p'), FORK_P_ON_ONE, 's1')).toBe(true);
  });

  it('AG p ⋮ s0 of FORK_P_ON_ONE (s2 reachable, lacks p)', () => {
    expect(satisfiesC(parse('AG p'), FORK_P_ON_ONE, 's0')).toBe(false);
  });

  it('AG p ⊨ s0 of ALL_P', () => {
    expect(satisfiesC(parse('AG p'), ALL_P, 's0')).toBe(true);
  });
});

describe('until operators (AU / EU)', () => {
  // s0 → s1 → s2 (q), with s0 also → s3 (q). p at s0 and s1.
  const UNTIL_M: KripkeModel = {
    worlds: [
      { id: 's0', atoms: ['p'] },
      { id: 's1', atoms: ['p'] },
      { id: 's2', atoms: ['q'] },
      { id: 's3', atoms: ['q'] },
    ],
    edges: [
      { from: 's0', to: 's1' },
      { from: 's0', to: 's3' },
      { from: 's1', to: 's2' },
      { from: 's2', to: 's2' },
      { from: 's3', to: 's3' },
    ],
    designated: 's0',
  };

  it('A[p U q] ⊨ s0 — every path reaches q with p meanwhile', () => {
    expect(satisfiesC(parse('A[p U q]'), UNTIL_M, 's0')).toBe(true);
  });

  it('E[p U q] ⊨ s0', () => {
    expect(satisfiesC(parse('E[p U q]'), UNTIL_M, 's0')).toBe(true);
  });
});

describe('CTL identities — engine sanity', () => {
  it('AG p <-> !EF !p valid on FORK_P_ON_ONE', () => {
    const r = validInModelC(parse('AG p <-> !EF !p'), FORK_P_ON_ONE);
    expect(r.valid).toBe(true);
  });

  it('EF p unfold: EF p <-> (p | EX EF p)', () => {
    const r = validInModelC(parse('EF p <-> (p | EX EF p)'), FORK_P_ON_ONE);
    expect(r.valid).toBe(true);
  });

  it('AG p unfold: AG p <-> (p & AX AG p)', () => {
    const r = validInModelC(parse('AG p <-> (p & AX AG p)'), ALL_P);
    expect(r.valid).toBe(true);
  });

  it('A[p U q] -> AF q', () => {
    const m: KripkeModel = {
      worlds: [
        { id: 's0', atoms: ['p'] },
        { id: 's1', atoms: ['q'] },
      ],
      edges: [
        { from: 's0', to: 's1' },
        { from: 's1', to: 's1' },
      ],
    };
    const r = validInModelC(parse('A[p U q] -> AF q'), m);
    expect(r.valid).toBe(true);
  });
});

describe('satisfactionMapC', () => {
  it('reports per-state truth for atom p', () => {
    const map = satisfactionMapC(parse('p'), FORK_P_ON_ONE);
    expect(map).toEqual({ s0: false, s1: true, s2: false });
  });
});
