import { describe, expect, it } from 'vitest';
import { LOGIC_SYSTEMS } from '../../data/logic-systems';
import { parseFol } from '../fol-parser';
import { checkValidity } from '../fol-validity';

const fol = LOGIC_SYSTEMS.find(s => s.slug === 'modern-fol')!;

describe('modern-fol system descriptor', () => {
  it('is marked available', () => {
    expect(fol.status).toBe('available');
  });

  it('exposes a non-empty primitives list', () => {
    expect(fol.primitives.length).toBeGreaterThan(0);
  });

  it('exposes a non-empty history string', () => {
    expect(fol.history.length).toBeGreaterThan(0);
  });

  it('declares a non-empty examples list', () => {
    expect(fol.examples.length).toBeGreaterThan(0);
  });

  it('has unique example slugs', () => {
    const slugs = fol.examples.map(e => e.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it('parses every example DSL string without error', () => {
    for (const ex of fol.examples) {
      const r = parseFol(ex.dsl);
      expect(r.ok, `parse failed for ${ex.slug}: ${ex.dsl}`).toBe(true);
    }
  });

  it('the example named "invalid-…" actually checks invalid', () => {
    const invalidExamples = fol.examples.filter(e => e.slug.startsWith('invalid-'));
    expect(invalidExamples.length).toBeGreaterThan(0);
    for (const ex of invalidExamples) {
      const r = parseFol(ex.dsl);
      if (!r.ok) throw new Error(`parse failed for ${ex.slug}`);
      const v = checkValidity(r.formula);
      expect(v.kind === 'invalid' || v.kind === 'unknown', `${ex.slug}: expected invalid/unknown, got ${v.kind}`).toBe(true);
    }
  });

  it('all non-"invalid-…" examples are reported valid by the checker', () => {
    const validExamples = fol.examples.filter(e => !e.slug.startsWith('invalid-'));
    for (const ex of validExamples) {
      const r = parseFol(ex.dsl);
      if (!r.ok) throw new Error(`parse failed for ${ex.slug}`);
      const v = checkValidity(r.formula);
      expect(v.kind, `${ex.slug}: expected valid, got ${v.kind}`).toBe('valid');
    }
  });
});
