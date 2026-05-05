import { describe, expect, it } from 'vitest';
import { findLogicSystem } from '../../data/logic-systems';
import { parseTemporal } from '../temporal-parser';
import { satisfiesT } from '../temporal-eval';
import { ltlAxiomVerdicts } from '../temporal-axioms';

describe('LOGIC_SYSTEMS — temporal-ltl entry', () => {
  const sys = findLogicSystem('temporal-ltl');

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
        const r = parseTemporal(ex.dsl);
        expect(r.ok, `parse error: ${!r.ok && r.error.message}`).toBe(true);
      });

      it('attaches a trace with valid loopBack', () => {
        expect(ex.trace).toBeDefined();
        if (!ex.trace) return;
        expect(ex.trace.loopBack).toBeGreaterThanOrEqual(0);
        expect(ex.trace.loopBack).toBeLessThan(ex.trace.states.length);
      });

      it('engine matches hand-authored satisfied at the start position', () => {
        if (!ex.trace || ex.satisfied === undefined) return;
        const r = parseTemporal(ex.dsl);
        if (!r.ok) throw new Error(`parse failed: ${r.error.message}`);
        expect(satisfiesT(r.formula, ex.trace)).toBe(ex.satisfied);
      });

      it('all canonical LTL axioms hold on the trace (regression)', () => {
        if (!ex.trace) return;
        const verdicts = ltlAxiomVerdicts(ex.trace);
        for (const v of verdicts) {
          expect(v.valid, `${v.axiom.short} unexpectedly failed on ${ex.slug}`).toBe(true);
        }
      });
    });
  }
});
