import { describe, expect, it } from 'vitest';
import { LOGIC_SYSTEMS } from '../../data/logic-systems';
import { parseAristotelian } from '../aristotelian-parser';

const arist = LOGIC_SYSTEMS.find(s => s.slug === 'aristotelian')!;

describe('aristotelian system descriptor', () => {
  it('is marked available', () => {
    expect(arist.status).toBe('available');
  });

  it('exposes a non-empty primitives list', () => {
    expect(arist.primitives.length).toBeGreaterThan(0);
  });

  it('exposes a non-empty history string', () => {
    expect(arist.history.length).toBeGreaterThan(0);
  });

  it('declares a non-empty examples list', () => {
    expect(arist.examples.length).toBeGreaterThan(0);
  });

  it('has unique example slugs', () => {
    const slugs = arist.examples.map(e => e.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it('parses every example DSL string without error', () => {
    for (const ex of arist.examples) {
      const r = parseAristotelian(ex.dsl);
      expect(r.ok, `parse failed for ${ex.slug}: ${ex.dsl}`).toBe(true);
    }
  });

  it('points at Aristotle as the thinker', () => {
    expect(arist.thinkerSlug).toBe('aristotle');
  });
});
