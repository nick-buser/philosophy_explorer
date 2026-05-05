import { describe, expect, it } from 'vitest';
import {
  closeUnder,
  closeUnderFrame,
  frameDiagnostics,
  isEuclidean,
  isReflexive,
  isSerial,
  isSymmetric,
  isTransitive,
  validateAgainst,
} from '../kripke-frame-check';
import type { KripkeModel } from '../kripke-types';

const TWO_WORLD_LINE: KripkeModel = {
  worlds: [
    { id: 'w0', atoms: [] },
    { id: 'w1', atoms: [] },
  ],
  edges: [{ from: 'w0', to: 'w1' }],
};

const TWO_WORLD_REFLEX: KripkeModel = {
  worlds: [
    { id: 'w0', atoms: [] },
    { id: 'w1', atoms: [] },
  ],
  edges: [
    { from: 'w0', to: 'w0' },
    { from: 'w0', to: 'w1' },
    { from: 'w1', to: 'w1' },
  ],
};

const TWO_WORLD_SYMM: KripkeModel = {
  worlds: [
    { id: 'w0', atoms: [] },
    { id: 'w1', atoms: [] },
  ],
  edges: [
    { from: 'w0', to: 'w1' },
    { from: 'w1', to: 'w0' },
  ],
};

describe('isReflexive', () => {
  it('holds when every world has a self-loop', () => {
    expect(isReflexive(TWO_WORLD_REFLEX).holds).toBe(true);
  });

  it('reports the first violating world', () => {
    const r = isReflexive(TWO_WORLD_LINE);
    expect(r.holds).toBe(false);
    if (r.holds) return;
    expect(r.witness).toEqual({ kind: 'reflexive', world: 'w0' });
  });
});

describe('isSymmetric', () => {
  it('holds when every edge has its reverse', () => {
    expect(isSymmetric(TWO_WORLD_SYMM).holds).toBe(true);
  });

  it('reports the offending edge when symmetry fails', () => {
    const r = isSymmetric(TWO_WORLD_LINE);
    expect(r.holds).toBe(false);
    if (r.holds) return;
    expect(r.witness).toEqual({ kind: 'symmetric', from: 'w0', to: 'w1' });
  });
});

describe('isTransitive', () => {
  it('holds for a transitively-closed chain', () => {
    const m: KripkeModel = {
      worlds: [
        { id: 'a', atoms: [] },
        { id: 'b', atoms: [] },
        { id: 'c', atoms: [] },
      ],
      edges: [
        { from: 'a', to: 'b' },
        { from: 'b', to: 'c' },
        { from: 'a', to: 'c' },
      ],
    };
    expect(isTransitive(m).holds).toBe(true);
  });

  it('reports a triple a→b→c lacking a→c', () => {
    const m: KripkeModel = {
      worlds: [
        { id: 'a', atoms: [] },
        { id: 'b', atoms: [] },
        { id: 'c', atoms: [] },
      ],
      edges: [
        { from: 'a', to: 'b' },
        { from: 'b', to: 'c' },
      ],
    };
    const r = isTransitive(m);
    expect(r.holds).toBe(false);
    if (r.holds) return;
    expect(r.witness).toEqual({ kind: 'transitive', via: ['a', 'b', 'c'] });
  });
});

describe('isSerial', () => {
  it('holds when every world has at least one successor', () => {
    expect(isSerial(TWO_WORLD_REFLEX).holds).toBe(true);
  });

  it('reports a dead-end world', () => {
    const r = isSerial(TWO_WORLD_LINE);
    expect(r.holds).toBe(false);
    if (r.holds) return;
    expect(r.witness).toEqual({ kind: 'serial', world: 'w1' });
  });
});

describe('isEuclidean', () => {
  it('holds in a one-equivalence-class S5 frame', () => {
    const m: KripkeModel = {
      worlds: [
        { id: 'w0', atoms: [] },
        { id: 'w1', atoms: [] },
      ],
      edges: [
        { from: 'w0', to: 'w0' },
        { from: 'w0', to: 'w1' },
        { from: 'w1', to: 'w0' },
        { from: 'w1', to: 'w1' },
      ],
    };
    expect(isEuclidean(m).holds).toBe(true);
  });

  it('fails when two successors of a world are not mutually accessible', () => {
    const m: KripkeModel = {
      worlds: [
        { id: 'a', atoms: [] },
        { id: 'b', atoms: [] },
        { id: 'c', atoms: [] },
      ],
      edges: [
        { from: 'a', to: 'b' },
        { from: 'a', to: 'c' },
      ],
    };
    expect(isEuclidean(m).holds).toBe(false);
  });
});

describe('frameDiagnostics — aggregate satisfied set', () => {
  it('lists every constraint that holds', () => {
    const d = frameDiagnostics(TWO_WORLD_REFLEX);
    expect(d.satisfied).toContain('reflexive');
    expect(d.satisfied).toContain('serial');
  });
});

describe('validateAgainst — declared frame class', () => {
  it('K accepts any model', () => {
    expect(validateAgainst(TWO_WORLD_LINE, 'K').ok).toBe(true);
  });

  it('T rejects a non-reflexive model with a witness', () => {
    const r = validateAgainst(TWO_WORLD_LINE, 'T');
    expect(r.ok).toBe(false);
    expect(r.violations).toHaveLength(1);
  });

  it('S5 accepts a closed two-world equivalence class', () => {
    const m: KripkeModel = {
      worlds: [
        { id: 'w0', atoms: [] },
        { id: 'w1', atoms: [] },
      ],
      edges: [
        { from: 'w0', to: 'w0' },
        { from: 'w1', to: 'w1' },
        { from: 'w0', to: 'w1' },
        { from: 'w1', to: 'w0' },
      ],
    };
    expect(validateAgainst(m, 'S5').ok).toBe(true);
  });
});

describe('closeUnder — adds the smallest set of edges', () => {
  it('adds reflexive self-loops', () => {
    const closed = closeUnder(TWO_WORLD_LINE, ['reflexive']);
    expect(isReflexive(closed).holds).toBe(true);
  });

  it('adds symmetric reverses', () => {
    const closed = closeUnder(TWO_WORLD_LINE, ['symmetric']);
    expect(isSymmetric(closed).holds).toBe(true);
  });

  it('takes transitive closure', () => {
    const m: KripkeModel = {
      worlds: [
        { id: 'a', atoms: [] },
        { id: 'b', atoms: [] },
        { id: 'c', atoms: [] },
        { id: 'd', atoms: [] },
      ],
      edges: [
        { from: 'a', to: 'b' },
        { from: 'b', to: 'c' },
        { from: 'c', to: 'd' },
      ],
    };
    const closed = closeUnder(m, ['transitive']);
    expect(isTransitive(closed).holds).toBe(true);
  });
});

describe('closeUnderFrame — frame-class-driven closure', () => {
  it('closes a line under S5 to an equivalence class', () => {
    const closed = closeUnderFrame(TWO_WORLD_LINE, 'S5');
    expect(validateAgainst(closed, 'S5').ok).toBe(true);
  });

  it('closes a line under S4 (reflexive + transitive)', () => {
    const closed = closeUnderFrame(TWO_WORLD_LINE, 'S4');
    expect(validateAgainst(closed, 'S4').ok).toBe(true);
  });

  it('K closure is the identity', () => {
    expect(closeUnderFrame(TWO_WORLD_LINE, 'K').edges).toEqual(TWO_WORLD_LINE.edges);
  });
});
