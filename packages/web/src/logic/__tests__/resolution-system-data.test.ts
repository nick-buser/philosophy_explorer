import { describe, expect, it } from 'vitest';
import { LOGIC_SYSTEMS } from '../../data/logic-systems';
import { parseProgram } from '../resolution-parser';
import { classify } from '../resolution-engine';

const system = LOGIC_SYSTEMS.find(s => s.slug === 'resolution')!;

describe('resolution seed data', () => {
  it('is registered as available', () => {
    expect(system).toBeDefined();
    expect(system.status).toBe('available');
  });

  it('every example parses', () => {
    for (const ex of system.examples) {
      const r = parseProgram(ex.dsl);
      expect(r.ok, `example ${ex.slug} should parse: ${!r.ok ? r.error.message : ''}`).toBe(true);
    }
  });

  it('every example produces an engine output', () => {
    for (const ex of system.examples) {
      const p = parseProgram(ex.dsl);
      if (!p.ok) throw new Error(`parse failed for ${ex.slug}`);
      const out = classify(p.program);
      expect(out.kind).toMatch(/^(clauses|horn|datalog)$/);
    }
  });

  it('each example produces the verdict its slug claims', () => {
    type Want =
      | { kind: 'clauses'; outcome: 'refuted' | 'saturated' | 'budget' }
      | { kind: 'horn';    outcome: 'success' | 'failure' | 'budget' }
      | { kind: 'datalog'; minFacts: number };

    const expected: Record<string, Want> = {
      'modus-ponens-refutation':      { kind: 'clauses', outcome: 'refuted' },
      'unsat-three-clauses':          { kind: 'clauses', outcome: 'refuted' },
      'transitivity-fol':             { kind: 'clauses', outcome: 'refuted' },
      'ancestor-sld':                 { kind: 'horn',    outcome: 'success' },
      'append-sld':                   { kind: 'horn',    outcome: 'success' },
      'transitive-closure-datalog':   { kind: 'datalog', minFacts: 14 },   // 4 edges + 10 tc
      'same-generation-datalog':      { kind: 'datalog', minFacts: 13 },   // 6 parent + 7 person + sg facts
      'reachability-with-query':      { kind: 'horn',    outcome: 'success' },
    };

    for (const ex of system.examples) {
      const want = expected[ex.slug];
      expect(want, `${ex.slug} not covered by the test`).toBeDefined();
      const p = parseProgram(ex.dsl);
      if (!p.ok) throw new Error(`parse failed for ${ex.slug}`);
      const out = classify(p.program);
      expect(out.kind, `${ex.slug} mode`).toBe(want!.kind);
      if (out.kind === 'clauses' && want!.kind === 'clauses') {
        expect(out.result.outcome, `${ex.slug} clause outcome`).toBe(want.outcome);
      }
      if (out.kind === 'horn' && want!.kind === 'horn') {
        expect(out.result.outcome, `${ex.slug} horn outcome`).toBe(want.outcome);
      }
      if (out.kind === 'datalog' && want!.kind === 'datalog') {
        expect(out.result.totalFacts, `${ex.slug} datalog fact count`).toBeGreaterThanOrEqual(want.minFacts);
      }
    }
  });
});
