import { describe, expect, it } from 'vitest';
import { parseTemporal } from '../temporal-parser';
import {
  satisfactionMapT,
  satisfiesT,
  validInTrace,
} from '../temporal-eval';
import type { Trace } from '../temporal-types';

function parse(src: string) {
  const r = parseTemporal(src);
  if (!r.ok) throw new Error(`parse failed: ${r.error.message}`);
  return r.formula;
}

// Stutter trace s0(p), s1(p), with loopBack at last index.
const STUTTER_P_FOREVER: Trace = {
  states: [
    { id: 's0', atoms: ['p'] },
    { id: 's1', atoms: ['p'] },
  ],
  loopBack: 1,
  start: 0,
};

// Cyclic trace: s0(p), s1(p), s2(), looping back to 0.
// Infinite unrolling: p, p, ¬p, p, p, ¬p, ...
const CYCLIC_P_DROPS: Trace = {
  states: [
    { id: 's0', atoms: ['p'] },
    { id: 's1', atoms: ['p'] },
    { id: 's2', atoms: [] },
  ],
  loopBack: 0,
  start: 0,
};

// p only at s2. Stutter at s2.
const REACH_P: Trace = {
  states: [
    { id: 's0', atoms: [] },
    { id: 's1', atoms: [] },
    { id: 's2', atoms: ['p'] },
  ],
  loopBack: 2,
  start: 0,
};

describe('next (X)', () => {
  it('X p at s0 of REACH_P is false (s1 has no p)', () => {
    expect(satisfiesT(parse('X p'), REACH_P, 0)).toBe(false);
  });

  it('X p at s1 of REACH_P is true (s2 has p)', () => {
    expect(satisfiesT(parse('X p'), REACH_P, 1)).toBe(true);
  });

  it('X p at s2 of REACH_P is true (stutter — s2 next is itself)', () => {
    expect(satisfiesT(parse('X p'), REACH_P, 2)).toBe(true);
  });
});

describe('eventually (F)', () => {
  it('F p holds at every position of REACH_P (p eventually)', () => {
    for (let i = 0; i < REACH_P.states.length; i++) {
      expect(satisfiesT(parse('F p'), REACH_P, i)).toBe(true);
    }
  });

  it('F q fails at every position of REACH_P (q never)', () => {
    for (let i = 0; i < REACH_P.states.length; i++) {
      expect(satisfiesT(parse('F q'), REACH_P, i)).toBe(false);
    }
  });

  it('F p holds at every position of CYCLIC_P_DROPS (p reachable from anywhere)', () => {
    for (let i = 0; i < CYCLIC_P_DROPS.states.length; i++) {
      expect(satisfiesT(parse('F p'), CYCLIC_P_DROPS, i)).toBe(true);
    }
  });
});

describe('always (G)', () => {
  it('G p holds at every position of STUTTER_P_FOREVER', () => {
    for (let i = 0; i < STUTTER_P_FOREVER.states.length; i++) {
      expect(satisfiesT(parse('G p'), STUTTER_P_FOREVER, i)).toBe(true);
    }
  });

  it('G p fails at every position of CYCLIC_P_DROPS (p drops at s2 forever-often)', () => {
    for (let i = 0; i < CYCLIC_P_DROPS.states.length; i++) {
      expect(satisfiesT(parse('G p'), CYCLIC_P_DROPS, i)).toBe(false);
    }
  });
});

describe('until (U)', () => {
  it('p U q at s0 of REACH_P is undefined since q is absent — fails', () => {
    expect(satisfiesT(parse('p U q'), REACH_P, 0)).toBe(false);
  });

  it('p U q with q at s2 and p at s0/s1 holds at s0', () => {
    const trace: Trace = {
      states: [
        { id: 's0', atoms: ['p'] },
        { id: 's1', atoms: ['p'] },
        { id: 's2', atoms: ['q'] },
      ],
      loopBack: 2,
      start: 0,
    };
    expect(satisfiesT(parse('p U q'), trace, 0)).toBe(true);
    expect(satisfiesT(parse('p U q'), trace, 1)).toBe(true);
    expect(satisfiesT(parse('p U q'), trace, 2)).toBe(true);
  });

  it('p U q fails at s0 if p drops before q is reached', () => {
    const trace: Trace = {
      states: [
        { id: 's0', atoms: ['p'] },
        { id: 's1', atoms: [] },          // p drops here
        { id: 's2', atoms: ['q'] },
      ],
      loopBack: 2,
      start: 0,
    };
    expect(satisfiesT(parse('p U q'), trace, 0)).toBe(false);
  });
});

describe('LTL identities — engine sanity', () => {
  it('F p ↔ ¬G ¬p valid on every position of every trace tested', () => {
    for (const trace of [STUTTER_P_FOREVER, CYCLIC_P_DROPS, REACH_P]) {
      const r = validInTrace(parse('F p <-> !G !p'), trace);
      expect(r.valid, `failed on trace at ${r.failingState}`).toBe(true);
    }
  });

  it('G(p & q) ↔ (Gp & Gq)', () => {
    const trace: Trace = {
      states: [
        { id: 's0', atoms: ['p', 'q'] },
        { id: 's1', atoms: ['p', 'q'] },
      ],
      loopBack: 1,
    };
    const r = validInTrace(parse('G(p & q) <-> (G p & G q)'), trace);
    expect(r.valid).toBe(true);
  });

  it('F(p | q) ↔ (Fp | Fq)', () => {
    const trace: Trace = {
      states: [
        { id: 's0', atoms: [] },
        { id: 's1', atoms: ['p'] },
        { id: 's2', atoms: ['q'] },
      ],
      loopBack: 2,
    };
    const r = validInTrace(parse('F(p | q) <-> (F p | F q)'), trace);
    expect(r.valid).toBe(true);
  });

  it('p U q implies F q', () => {
    const trace: Trace = {
      states: [
        { id: 's0', atoms: ['p'] },
        { id: 's1', atoms: ['q'] },
      ],
      loopBack: 1,
    };
    const r = validInTrace(parse('(p U q) -> F q'), trace);
    expect(r.valid).toBe(true);
  });
});

describe('satisfactionMapT', () => {
  it('reports per-state truth', () => {
    const map = satisfactionMapT(parse('p'), REACH_P);
    expect(map).toEqual({ s0: false, s1: false, s2: true });
  });
});
