import { describe, expect, it } from 'vitest';
import { LOGIC_SYSTEMS } from '../../data/logic-systems';
import { parseFrege } from '../frege-parser';

const frege = LOGIC_SYSTEMS.find(s => s.slug === 'frege-bs')!;

describe('frege-bs system descriptor', () => {
  it('is marked available', () => {
    expect(frege.status).toBe('available');
  });

  it('exposes a non-empty primitives list', () => {
    expect(frege.primitives.length).toBeGreaterThan(0);
  });

  it('exposes a non-empty history string', () => {
    expect(frege.history.length).toBeGreaterThan(0);
  });

  it('declares a non-empty examples list', () => {
    expect(frege.examples.length).toBeGreaterThan(0);
  });

  it('has unique example slugs', () => {
    const slugs = frege.examples.map(e => e.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it('parses every example DSL string without error', () => {
    for (const ex of frege.examples) {
      const r = parseFrege(ex.dsl);
      expect(r.ok, `parse failed for ${ex.slug}: ${ex.dsl}`).toBe(true);
    }
  });
});
