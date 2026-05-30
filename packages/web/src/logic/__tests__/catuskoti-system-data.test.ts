import { describe, expect, it } from 'vitest';
import { LOGIC_SYSTEMS } from '../../data/logic-systems';
import { parseCatuskoti } from '../catuskoti-parser';
import { evaluateCatuskoti } from '../catuskoti-engine';
import type { Reading } from '../catuskoti-types';

const system = LOGIC_SYSTEMS.find(s => s.slug === 'catuskoti')!;

// The koṭi and reading each seed example is built to reach — keyed by
// slug, following the saptabhangi-system-data.test.ts precedent.
const EXPECTED: Record<string, { koti: number; reading: Reading }> = {
  'dharmas-affirmation': { koti: 1, reading: 'affirming' },
  'dharmas-negation':    { koti: 2, reading: 'affirming' },
  'dharmas-both':        { koti: 3, reading: 'affirming' },
  'dharmas-neither':     { koti: 4, reading: 'affirming' },
  'tathagata-affirmation': { koti: 1, reading: 'prasanga' },
  'tathagata-negation':    { koti: 2, reading: 'prasanga' },
  'tathagata-both':        { koti: 3, reading: 'prasanga' },
  'tathagata-neither':     { koti: 4, reading: 'prasanga' },
};

describe('catuskoti system descriptor', () => {
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
      const r = parseCatuskoti(ex.dsl);
      expect(r.ok, `parse failed for ${ex.slug}: ${!r.ok ? r.error.message : ''}`).toBe(true);
    }
  });

  it('each example reaches the koṭi and reading its slug claims', () => {
    for (const ex of system.examples) {
      const r = parseCatuskoti(ex.dsl);
      if (!r.ok) throw new Error(`parse failed for ${ex.slug}`);
      const want = EXPECTED[ex.slug];
      expect(want, `${ex.slug} not covered by the test`).toBeDefined();
      const e = evaluateCatuskoti(r.proposition);
      expect(e.koti.n, `${ex.slug} should reach koṭi ${want.koti}`).toBe(want.koti);
      expect(e.reading, `${ex.slug} should use the ${want.reading} reading`).toBe(want.reading);
    }
  });

  it('the examples reach all four koṭis', () => {
    const reached = new Set<number>();
    for (const ex of system.examples) {
      const r = parseCatuskoti(ex.dsl);
      if (r.ok) reached.add(evaluateCatuskoti(r.proposition).koti.n);
    }
    expect([...reached].sort((a, b) => a - b)).toEqual([1, 2, 3, 4]);
  });

  it('the examples cover both readings', () => {
    const readings = new Set<Reading>();
    for (const ex of system.examples) {
      const r = parseCatuskoti(ex.dsl);
      if (r.ok) readings.add(r.proposition.reading);
    }
    expect([...readings].sort()).toEqual(['affirming', 'prasanga']);
  });
});
