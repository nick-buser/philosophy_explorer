import { describe, expect, it } from 'vitest';
import { LOGIC_SYSTEMS } from '../../data/logic-systems';
import { parseBool } from '../boolean-parser';

const boolean = LOGIC_SYSTEMS.find(s => s.slug === 'boolean')!;

describe('boolean system descriptor', () => {
  it('is registered', () => {
    expect(boolean).toBeDefined();
  });

  it('is marked available', () => {
    expect(boolean.status).toBe('available');
  });

  it('exposes a non-empty primitives list', () => {
    expect(boolean.primitives.length).toBeGreaterThan(0);
  });

  it('exposes a non-empty history string', () => {
    expect(boolean.history.length).toBeGreaterThan(0);
  });

  it('declares a non-empty examples list', () => {
    expect(boolean.examples.length).toBeGreaterThan(0);
  });

  it('has unique example slugs', () => {
    const slugs = boolean.examples.map(e => e.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it('parses every example DSL string without error', () => {
    for (const ex of boolean.examples) {
      const r = parseBool(ex.dsl);
      expect(r.ok, `parse failed for ${ex.slug}: ${ex.dsl}`).toBe(true);
    }
  });
});
