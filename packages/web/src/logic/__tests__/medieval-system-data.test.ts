import { describe, expect, it } from 'vitest';
import { LOGIC_SYSTEMS } from '../../data/logic-systems';
import { parseMedieval } from '../medieval-parser';

const med = LOGIC_SYSTEMS.find(s => s.slug === 'medieval')!;

describe('medieval system descriptor', () => {
  it('is marked available', () => {
    expect(med.status).toBe('available');
  });

  it('exposes a non-empty primitives list', () => {
    expect(med.primitives.length).toBeGreaterThan(0);
  });

  it('exposes a non-empty history string', () => {
    expect(med.history.length).toBeGreaterThan(0);
  });

  it('declares a non-empty examples list', () => {
    expect(med.examples.length).toBeGreaterThan(0);
  });

  it('has unique example slugs', () => {
    const slugs = med.examples.map(e => e.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it('parses every example DSL string without error', () => {
    for (const ex of med.examples) {
      const r = parseMedieval(ex.dsl);
      expect(r.ok, `parse failed for ${ex.slug}: ${ex.dsl}`).toBe(true);
    }
  });

  it('points at Buridan as the thinker', () => {
    expect(med.thinkerSlug).toBe('john-buridan');
  });
});
