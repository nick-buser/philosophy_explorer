import { describe, expect, it } from 'vitest';
import { findLogicSystem } from '../../data/logic-systems';
import { parseEpistemic } from '../epistemic-parser';
import { satisfiesE } from '../epistemic-eval';

describe('LOGIC_SYSTEMS — epistemic entry', () => {
  const sys = findLogicSystem('epistemic');

  it('exists and is registered', () => {
    expect(sys).toBeDefined();
  });
  if (!sys) return;

  it('is available, not a stub', () => {
    expect(sys.status).toBe('available');
  });

  it('has at least 5 examples', () => {
    expect(sys.examples.length).toBeGreaterThanOrEqual(5);
  });

  for (const ex of sys.examples) {
    describe(`example ${ex.slug}`, () => {
      it('parses', () => {
        const r = parseEpistemic(ex.dsl);
        expect(r.ok, `parse error: ${!r.ok && r.error.message}`).toBe(true);
      });

      it('attaches an epistemicModel with declared agents', () => {
        expect(ex.epistemicModel).toBeDefined();
        if (!ex.epistemicModel) return;
        expect(ex.epistemicModel.agents.length).toBeGreaterThan(0);
      });

      it('every edge references a declared agent and known world', () => {
        if (!ex.epistemicModel) return;
        const ids = new Set(ex.epistemicModel.worlds.map(w => w.id));
        const agents = new Set(ex.epistemicModel.agents);
        for (const e of ex.epistemicModel.edges) {
          expect(ids.has(e.from), `unknown 'from' world ${e.from}`).toBe(true);
          expect(ids.has(e.to), `unknown 'to' world ${e.to}`).toBe(true);
          expect(agents.has(e.agent), `unknown agent ${e.agent}`).toBe(true);
        }
      });

      it('engine matches hand-authored satisfied at the designated world', () => {
        if (!ex.epistemicModel || ex.satisfied === undefined) return;
        const designated = ex.epistemicModel.designated ?? ex.epistemicModel.worlds[0]!.id;
        const r = parseEpistemic(ex.dsl);
        if (!r.ok) throw new Error(`parse failed: ${r.error.message}`);
        expect(satisfiesE(r.formula, ex.epistemicModel, designated)).toBe(ex.satisfied);
      });
    });
  }
});
