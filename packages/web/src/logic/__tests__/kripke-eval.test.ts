import { describe, expect, it } from 'vitest';
import { findLogicSystem } from '../../data/logic-systems';
import { parseModal } from '../kripke-parser';
import {
  satisfactionMap,
  satisfies,
  validInModel,
} from '../kripke-eval';
import type { KripkeModel } from '../kripke-types';

function parse(src: string) {
  const r = parseModal(src);
  if (!r.ok) throw new Error(`parse failed for ${src}: ${r.error.message}`);
  return r.formula;
}

const TWO_WORLD: KripkeModel = {
  worlds: [
    { id: 'w0', atoms: [] },
    { id: 'w1', atoms: ['p'] },
  ],
  edges: [{ from: 'w0', to: 'w1' }],
  designated: 'w0',
};

const REFLEX_BOTH: KripkeModel = {
  worlds: [
    { id: 'w0', atoms: ['p'] },
    { id: 'w1', atoms: ['p'] },
  ],
  edges: [
    { from: 'w0', to: 'w0' },
    { from: 'w0', to: 'w1' },
    { from: 'w1', to: 'w1' },
  ],
  designated: 'w0',
};

const SINK: KripkeModel = {
  // w0 has no successors. □φ is vacuously true; ◇φ is vacuously false.
  worlds: [{ id: 'w0', atoms: [] }],
  edges: [],
  designated: 'w0',
};

describe('satisfies — atoms and propositional connectives', () => {
  const m: KripkeModel = {
    worlds: [{ id: 'w0', atoms: ['p'] }],
    edges: [],
    designated: 'w0',
  };

  it('atom true at world that lists it', () => {
    expect(satisfies(parse('p'), m, 'w0')).toBe(true);
  });

  it('atom false at world that does not list it', () => {
    expect(satisfies(parse('q'), m, 'w0')).toBe(false);
  });

  it('negation', () => {
    expect(satisfies(parse('!p'), m, 'w0')).toBe(false);
    expect(satisfies(parse('!q'), m, 'w0')).toBe(true);
  });

  it('conjunction', () => {
    const m2: KripkeModel = { worlds: [{ id: 'w', atoms: ['p', 'q'] }], edges: [] };
    expect(satisfies(parse('p & q'), m2, 'w')).toBe(true);
    expect(satisfies(parse('p & r'), m2, 'w')).toBe(false);
  });

  it('disjunction', () => {
    expect(satisfies(parse('p | q'), m, 'w0')).toBe(true);
    expect(satisfies(parse('q | r'), m, 'w0')).toBe(false);
  });

  it('material implication', () => {
    expect(satisfies(parse('p -> p'), m, 'w0')).toBe(true);
    expect(satisfies(parse('q -> p'), m, 'w0')).toBe(true);   // false antecedent
    expect(satisfies(parse('p -> q'), m, 'w0')).toBe(false);  // true to false
  });

  it('biconditional', () => {
    expect(satisfies(parse('p <-> p'), m, 'w0')).toBe(true);
    expect(satisfies(parse('p <-> q'), m, 'w0')).toBe(false);
  });
});

describe('satisfies — modal operators', () => {
  it('□p true at w0 when p holds at every R-successor', () => {
    expect(satisfies(parse('[]p'), TWO_WORLD, 'w0')).toBe(true);
  });

  it('□p false at w0 when some successor lacks p', () => {
    const m: KripkeModel = {
      worlds: [
        { id: 'w0', atoms: [] },
        { id: 'w1', atoms: ['p'] },
        { id: 'w2', atoms: [] },
      ],
      edges: [
        { from: 'w0', to: 'w1' },
        { from: 'w0', to: 'w2' },
      ],
    };
    expect(satisfies(parse('[]p'), m, 'w0')).toBe(false);
  });

  it('◇p true when at least one successor has p', () => {
    expect(satisfies(parse('<>p'), TWO_WORLD, 'w0')).toBe(true);
  });

  it('◇p false when no successor has p', () => {
    const m: KripkeModel = {
      worlds: [
        { id: 'w0', atoms: [] },
        { id: 'w1', atoms: [] },
      ],
      edges: [{ from: 'w0', to: 'w1' }],
    };
    expect(satisfies(parse('<>p'), m, 'w0')).toBe(false);
  });

  it('□p vacuously true at a world with no successors', () => {
    expect(satisfies(parse('[]p'), SINK, 'w0')).toBe(true);
  });

  it('◇p vacuously false at a world with no successors', () => {
    expect(satisfies(parse('<>p'), SINK, 'w0')).toBe(false);
  });

  it('nested modalities — □□p', () => {
    expect(satisfies(parse('[][]p'), REFLEX_BOTH, 'w0')).toBe(true);
  });

  it('duality — ◇p ↔ ¬□¬p', () => {
    const fml = parse('<>p <-> !([]!p)');
    for (const w of TWO_WORLD.worlds) {
      expect(satisfies(fml, TWO_WORLD, w.id)).toBe(true);
    }
  });
});

describe('satisfactionMap', () => {
  it('reports per-world truth for every world', () => {
    const map = satisfactionMap(parse('p'), TWO_WORLD);
    expect(map).toEqual({ w0: false, w1: true });
  });
});

describe('validInModel', () => {
  it('valid when forced at every world', () => {
    expect(validInModel(parse('p -> p'), TWO_WORLD)).toEqual({ valid: true });
  });

  it('reports a failing-world witness when invalid', () => {
    const r = validInModel(parse('p'), TWO_WORLD);
    expect(r.valid).toBe(false);
    expect(r.failingWorld).toBe('w0');
  });
});

// Regression cross-check: every shipped Kripke example carries a
// hand-authored `satisfied` value, and the engine should agree at the
// designated world. This is the consistency hook that
// `kripke-modal-logic.md` §5 anticipated.
describe('engine ↔ hand-authored cross-check (shipped examples)', () => {
  const kripke = findLogicSystem('kripke');
  if (!kripke) throw new Error('kripke system not found');

  for (const ex of kripke.examples) {
    if (!ex.model || ex.satisfied === undefined) continue;
    it(`${ex.slug}: engine matches hand-authored satisfied=${ex.satisfied}`, () => {
      const designated = ex.model!.designated ?? ex.model!.worlds[0]!.id;
      const f = parse(ex.dsl);
      expect(satisfies(f, ex.model!, designated)).toBe(ex.satisfied);
    });
  }
});
