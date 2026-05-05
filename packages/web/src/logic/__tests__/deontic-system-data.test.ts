import { describe, expect, it } from 'vitest';
import { findLogicSystem } from '../../data/logic-systems';
import { parseModal } from '../kripke-parser';
import { satisfies } from '../kripke-eval';
import { FRAMES } from '../kripke-frames';

describe('LOGIC_SYSTEMS — deontic entry', () => {
  const sys = findLogicSystem('deontic');

  it('exists and is registered', () => {
    expect(sys).toBeDefined();
  });
  if (!sys) return;

  it('is available, not a stub', () => {
    expect(sys.status).toBe('available');
  });

  it('declares D as one of its frame classes', () => {
    const slugs = sys.frameClasses?.map(f => f.slug) ?? [];
    expect(slugs).toContain('D');
  });

  it('has at least 5 examples', () => {
    expect(sys.examples.length).toBeGreaterThanOrEqual(5);
  });

  for (const ex of sys.examples) {
    describe(`example ${ex.slug}`, () => {
      it('parses', () => {
        const r = parseModal(ex.dsl);
        expect(r.ok, `parse error: ${!r.ok && r.error.message}`).toBe(true);
      });

      it('declares a known frame class', () => {
        expect(ex.frameClass).toBeDefined();
        if (!ex.frameClass) return;
        expect(FRAMES[ex.frameClass]).toBeDefined();
      });

      it('has a model with a designated world that exists', () => {
        expect(ex.model).toBeDefined();
        if (!ex.model) return;
        const ids = new Set(ex.model.worlds.map(w => w.id));
        if (ex.model.designated) {
          expect(ids.has(ex.model.designated)).toBe(true);
        }
      });

      it('engine matches hand-authored satisfied at the designated world', () => {
        if (!ex.model || ex.satisfied === undefined) return;
        const designated = ex.model.designated ?? ex.model.worlds[0]!.id;
        const r = parseModal(ex.dsl);
        if (!r.ok) throw new Error(`parse failed: ${r.error.message}`);
        expect(satisfies(r.formula, ex.model, designated)).toBe(ex.satisfied);
      });
    });
  }
});

describe('FRAMES — D entry', () => {
  it('declares serial as its only constraint', () => {
    expect(FRAMES.D.constraints).toEqual(['serial']);
  });

  it('characteristic axiom is []p -> <>p', () => {
    expect(FRAMES.D.characteristicAxiom.dsl).toBe('[]p -> <>p');
  });
});
