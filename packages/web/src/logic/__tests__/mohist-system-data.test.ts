import { describe, expect, it } from 'vitest';
import { LOGIC_SYSTEMS } from '../../data/logic-systems';
import { parseMohist } from '../mohist-parser';
import { evaluateMou } from '../mohist-engine';
import type { CategoryId, MouFlag } from '../mohist-types';

const system = LOGIC_SYSTEMS.find(s => s.slug === 'mohist')!;

// The outcome and flag each seed example is built to reach — keyed by
// slug, following the catuskoti-system-data.test.ts precedent.
const EXPECTED: Record<string, { outcome: CategoryId; flag: MouFlag | null }> = {
  'white-horse-ride':       { outcome: 'shi-er-ran', flag: null },
  'huo-love':               { outcome: 'shi-er-ran', flag: null },
  'brother-handsome-love':  { outcome: 'shi-er-bu-ran', flag: 'opacity' },
  'boat-wood-enter':        { outcome: 'shi-er-bu-ran', flag: 'opacity' },
  'robber-person-kill':     { outcome: 'shi-er-bu-ran', flag: 'opacity' },
  'riding-horses-negation': { outcome: 'yi-zhou-yi-bu-zhou', flag: 'scope' },
  'brother-ghost':          { outcome: 'yi-shi-yi-fei', flag: 'sortal' },
};

describe('mohist system descriptor', () => {
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
      const r = parseMohist(ex.dsl);
      expect(r.ok, `parse failed for ${ex.slug}: ${!r.ok ? r.error.message : ''}`).toBe(true);
    }
  });

  it('each example reaches the outcome and flag its slug claims, well-formed and consistent', () => {
    for (const ex of system.examples) {
      const r = parseMohist(ex.dsl);
      if (!r.ok) throw new Error(`parse failed for ${ex.slug}`);
      const want = EXPECTED[ex.slug];
      expect(want, `${ex.slug} not covered by the test`).toBeDefined();
      expect(r.argument.outcome, `${ex.slug} outcome`).toBe(want.outcome);
      expect(r.argument.flag, `${ex.slug} flag`).toBe(want.flag);
      const e = evaluateMou(r.argument);
      expect(e.wellFormed, `${ex.slug} should be a well-formed móu schema`).toBe(true);
      expect(e.consistent, `${ex.slug} outcome should agree with its flag`).toBe(true);
    }
  });

  it('the examples reach all four Xiao Qu outcomes', () => {
    const reached = new Set<CategoryId>();
    for (const ex of system.examples) {
      const r = parseMohist(ex.dsl);
      if (r.ok) reached.add(r.argument.outcome);
    }
    expect([...reached].sort()).toEqual(
      ['shi-er-bu-ran', 'shi-er-ran', 'yi-shi-yi-fei', 'yi-zhou-yi-bu-zhou'],
    );
  });
});
