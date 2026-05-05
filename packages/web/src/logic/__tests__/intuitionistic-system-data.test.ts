import { describe, expect, it } from 'vitest';
import { findLogicSystem } from '../../data/logic-systems';
import { parseModal } from '../kripke-parser';
import { forces } from '../intuitionistic-eval';
import { intuitionisticDiagnostics } from '../intuitionistic-frames';

describe('LOGIC_SYSTEMS — intuitionistic entry', () => {
  const sys = findLogicSystem('intuitionistic');

  it('exists and is registered', () => {
    expect(sys).toBeDefined();
  });
  if (!sys) return;

  it('is available, not a stub', () => {
    expect(sys.status).toBe('available');
  });

  it('has at least 6 examples', () => {
    expect(sys.examples.length).toBeGreaterThanOrEqual(6);
  });

  for (const ex of sys.examples) {
    describe(`example ${ex.slug}`, () => {
      it('parses', () => {
        const r = parseModal(ex.dsl);
        expect(r.ok, `parse error: ${!r.ok && r.error.message}`).toBe(true);
      });

      it('attaches a model and a designated world that exists', () => {
        expect(ex.model).toBeDefined();
        if (!ex.model) return;
        const ids = new Set(ex.model.worlds.map(w => w.id));
        if (ex.model.designated) {
          expect(ids.has(ex.model.designated)).toBe(true);
        }
      });

      it('every model is a valid intuitionistic frame (pre-order + monotone V)', () => {
        if (!ex.model) return;
        const d = intuitionisticDiagnostics(ex.model);
        expect(d.isValidFrame, `frame violations on ${ex.slug}: ${JSON.stringify(d)}`).toBe(true);
      });

      it('declares a satisfied truth-value', () => {
        expect(typeof ex.satisfied).toBe('boolean');
      });

      it('engine matches hand-authored satisfied at the designated world', () => {
        if (!ex.model || ex.satisfied === undefined) return;
        const designated = ex.model.designated ?? ex.model.worlds[0]!.id;
        const r = parseModal(ex.dsl);
        if (!r.ok) throw new Error(`parse failed: ${r.error.message}`);
        expect(forces(r.formula, ex.model, designated)).toBe(ex.satisfied);
      });
    });
  }
});
