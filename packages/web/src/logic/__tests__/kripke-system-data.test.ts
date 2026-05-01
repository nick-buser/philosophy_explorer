import { describe, expect, it } from 'vitest';
import { findLogicSystem } from '../../data/logic-systems';
import { parseModal } from '../kripke-parser';
import { FRAMES } from '../kripke-frames';

describe('LOGIC_SYSTEMS — kripke entry', () => {
  const kripke = findLogicSystem('kripke');

  it('exists and is registered', () => {
    expect(kripke).toBeDefined();
  });
  if (!kripke) return;

  it('has at least 5 examples (per design doc)', () => {
    expect(kripke.examples.length).toBeGreaterThanOrEqual(5);
  });

  it('declares the four phase-1 frame classes', () => {
    expect(kripke.frameClasses?.map(f => f.slug)).toEqual(['K', 'T', 'S4', 'S5']);
  });

  for (const ex of kripke.examples) {
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

      it('attaches a Kripke model with a designated world in the world list', () => {
        expect(ex.model).toBeDefined();
        if (!ex.model) return;
        const ids = new Set(ex.model.worlds.map(w => w.id));
        if (ex.model.designated) {
          expect(ids.has(ex.model.designated)).toBe(true);
        }
      });

      it('has edges that reference only declared world ids', () => {
        if (!ex.model) return;
        const ids = new Set(ex.model.worlds.map(w => w.id));
        for (const e of ex.model.edges) {
          expect(ids.has(e.from), `unknown 'from' world ${e.from}`).toBe(true);
          expect(ids.has(e.to),   `unknown 'to' world ${e.to}`).toBe(true);
        }
      });

      it('has unique world ids', () => {
        if (!ex.model) return;
        const ids = ex.model.worlds.map(w => w.id);
        expect(new Set(ids).size).toBe(ids.length);
      });

      it('declares a satisfied truth-value', () => {
        expect(typeof ex.satisfied).toBe('boolean');
      });
    });
  }
});
