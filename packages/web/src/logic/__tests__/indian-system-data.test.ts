import { describe, expect, it } from 'vitest';
import { LOGIC_SYSTEMS } from '../../data/logic-systems';
import { parseInference } from '../indian-parser';
import { classify } from '../indian-engine';
import { fiveSteps } from '../indian-render';

const system = LOGIC_SYSTEMS.find(s => s.slug === 'indian-buddhist')!;

describe('indian-buddhist seed data', () => {
  it('is registered as available', () => {
    expect(system).toBeDefined();
    expect(system.status).toBe('available');
  });

  it('every example parses', () => {
    for (const ex of system.examples) {
      const r = parseInference(ex.dsl);
      expect(r.ok, `example ${ex.slug} should parse: ${!r.ok ? r.error.message : ''}`).toBe(true);
    }
  });

  it('every example produces five rendered steps', () => {
    for (const ex of system.examples) {
      const p = parseInference(ex.dsl);
      if (!p.ok) throw new Error(`parse failed for ${ex.slug}`);
      const steps = fiveSteps(p.inference);
      expect(steps).toHaveLength(5);
    }
  });

  it('each example produces the verdict its slug claims', () => {
    const expected: Record<string, ReturnType<typeof classify>['verdict']['kind']> = {
      'smoke-on-the-mountain': 'valid',
      'sound-impermanent':     'valid',
      'sadharana':             'inconclusive',
      'asadharana':            'inconclusive',
      'viruddha':              'contradictory',
      'partial-leak':          'inconclusive',
      'asiddha':               'unestablished',
    };
    for (const ex of system.examples) {
      const want = expected[ex.slug];
      expect(want, `${ex.slug} not covered by the test`).toBeDefined();
      const p = parseInference(ex.dsl);
      if (!p.ok) throw new Error(`parse failed for ${ex.slug}`);
      const r = classify(p.inference);
      expect(r.verdict.kind, `${ex.slug} should be ${want}`).toBe(want);
    }
  });
});
