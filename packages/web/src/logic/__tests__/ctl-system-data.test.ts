import { describe, expect, it } from 'vitest';
import { findLogicSystem } from '../../data/logic-systems';
import { parseCtl } from '../ctl-parser';
import { satisfiesC } from '../ctl-eval';
import { ctlAxiomVerdicts } from '../ctl-axioms';
import { isSerial } from '../kripke-frame-check';

describe('LOGIC_SYSTEMS — temporal-ctl entry', () => {
  const sys = findLogicSystem('temporal-ctl');

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
        const r = parseCtl(ex.dsl);
        expect(r.ok, `parse error: ${!r.ok && r.error.message}`).toBe(true);
      });

      it('attaches a model', () => {
        expect(ex.model).toBeDefined();
      });

      it('frame is serial (CTL well-definedness)', () => {
        if (!ex.model) return;
        expect(isSerial(ex.model).holds).toBe(true);
      });

      it('engine matches hand-authored satisfied at the designated state', () => {
        if (!ex.model || ex.satisfied === undefined) return;
        const designated = ex.model.designated ?? ex.model.worlds[0]!.id;
        const r = parseCtl(ex.dsl);
        if (!r.ok) throw new Error(`parse failed: ${r.error.message}`);
        expect(satisfiesC(r.formula, ex.model, designated)).toBe(ex.satisfied);
      });

      it('all CTL identities hold (regression)', () => {
        if (!ex.model) return;
        const verdicts = ctlAxiomVerdicts(ex.model);
        for (const v of verdicts) {
          expect(v.valid, `${v.axiom.short} unexpectedly failed on ${ex.slug}`).toBe(true);
        }
      });
    });
  }
});
