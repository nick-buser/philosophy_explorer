import { describe, expect, it } from 'vitest';
import { LOGIC_SYSTEMS } from '../../data/logic-systems';
import { parseSaptabhangi } from '../saptabhangi-parser';
import { classifyBhanga } from '../saptabhangi-engine';

const system = LOGIC_SYSTEMS.find(s => s.slug === 'saptabhangi')!;

// The bhaṅga each seed example is built to reach — keyed by slug,
// following the indian-system-data.test.ts precedent.
const EXPECTED_BHANGA: Record<string, number> = {
  'pot-permanent': 7,
  'pot-substance': 1,
  'pot-shape': 2,
  'soul-existence': 3,
  'pot-inexpressible': 4,
  'lamp-asti-avaktavya': 5,
  'lamp-nasti-avaktavya': 6,
};

describe('saptabhangi system descriptor', () => {
  it('is registered as available', () => {
    expect(system).toBeDefined();
    expect(system.status).toBe('available');
  });

  it('exposes non-empty history and primitives', () => {
    expect(system.history.length).toBeGreaterThan(0);
    expect(system.primitives.length).toBeGreaterThan(0);
  });

  it('declares 6-8 examples with unique slugs', () => {
    expect(system.examples.length).toBeGreaterThanOrEqual(6);
    expect(system.examples.length).toBeLessThanOrEqual(8);
    const slugs = system.examples.map(e => e.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it('parses every example DSL without error', () => {
    for (const ex of system.examples) {
      const r = parseSaptabhangi(ex.dsl);
      expect(r.ok, `parse failed for ${ex.slug}: ${!r.ok ? r.error.message : ''}`).toBe(true);
    }
  });

  it('each example classifies into the bhaṅga its slug claims', () => {
    for (const ex of system.examples) {
      const r = parseSaptabhangi(ex.dsl);
      if (!r.ok) throw new Error(`parse failed for ${ex.slug}`);
      const want = EXPECTED_BHANGA[ex.slug];
      expect(want, `${ex.slug} not covered by the test`).toBeDefined();
      expect(classifyBhanga(r.predication).bhanga.n, `${ex.slug} should reach bhaṅga ${want}`)
        .toBe(want);
    }
  });

  it('the examples reach all seven bhaṅgas', () => {
    const reached = new Set<number>();
    for (const ex of system.examples) {
      const r = parseSaptabhangi(ex.dsl);
      if (r.ok) reached.add(classifyBhanga(r.predication).bhanga.n);
    }
    expect([...reached].sort((a, b) => a - b)).toEqual([1, 2, 3, 4, 5, 6, 7]);
  });
});
