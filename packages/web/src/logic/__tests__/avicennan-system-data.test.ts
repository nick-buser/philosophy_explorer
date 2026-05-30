import { describe, expect, it } from 'vitest';
import { LOGIC_SYSTEMS } from '../../data/logic-systems';
import { parseAvicennan } from '../avicennan-parser';
import { checkSyllogism } from '../avicennan-validity';

const system = LOGIC_SYSTEMS.find(s => s.slug === 'avicennan')!;

describe('avicennan system descriptor', () => {
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
      const r = parseAvicennan(ex.dsl);
      expect(r.ok, `parse failed for ${ex.slug}: ${!r.ok ? r.error.message : ''}`).toBe(true);
    }
  });

  it('each example produces the verdict its slug claims', () => {
    const expected: Record<string, 'valid' | 'invalid'> = {
      'necessary-barbara':  'valid',
      'modal-fallacy':      'invalid',
      'weaker-conclusion':  'invalid',
    };
    for (const ex of system.examples) {
      const r = parseAvicennan(ex.dsl);
      if (!r.ok) throw new Error(`parse failed for ${ex.slug}`);
      if (r.formula.kind === 'syllogism') {
        const want = expected[ex.slug];
        expect(want, `${ex.slug} syllogism not covered by the test`).toBeDefined();
        expect(checkSyllogism(r.formula.syllogism).kind, `${ex.slug} should be ${want}`).toBe(want);
      }
    }
  });

  it('the four single-proposition examples cover all four modalities', () => {
    const modalities = new Set<string>();
    for (const ex of system.examples) {
      const r = parseAvicennan(ex.dsl);
      if (r.ok && r.formula.kind === 'proposition') {
        modalities.add(r.formula.proposition.modality);
      }
    }
    expect([...modalities].sort()).toEqual(['absolute', 'necessary', 'perpetual', 'possible']);
  });
});
