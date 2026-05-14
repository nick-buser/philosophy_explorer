import { describe, expect, it } from 'vitest';
import { LOGIC_SYSTEMS } from '../../data/logic-systems';
import { parseFrege } from '../frege-parser';
import { layoutFormula } from '../frege-layout';
import { fregeToKatex, fregeToUnicode } from '../frege-fol';
import { orderOf } from '../frege-types';

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

  it('parses, lays out, and translates every example without error', () => {
    for (const ex of frege.examples) {
      const r = parseFrege(ex.dsl);
      expect(r.ok, `parse failed for ${ex.slug}: ${ex.dsl}`).toBe(true);
      if (!r.ok) continue;
      const out = layoutFormula(r.formula);
      expect(out.width,  `layout w==0 for ${ex.slug}`).toBeGreaterThan(0);
      expect(out.height, `layout h==0 for ${ex.slug}`).toBeGreaterThan(0);
      // Translation panels: both Unicode and KaTeX should produce a
      // non-empty string for every example.
      expect(fregeToUnicode(r.formula).length, `unicode empty for ${ex.slug}`).toBeGreaterThan(0);
      expect(fregeToKatex(r.formula).length,   `katex empty for ${ex.slug}`).toBeGreaterThan(0);
    }
  });

  it('covers all three orders across the example library', () => {
    const orders = new Set<string>();
    for (const ex of frege.examples) {
      const r = parseFrege(ex.dsl);
      if (r.ok) orders.add(orderOf(r.formula));
    }
    expect(orders).toContain('propositional');
    expect(orders).toContain('first-order');
    expect(orders).toContain('higher-order');
  });

  it('exposes primitives covering Part III additions', () => {
    const names = frege.primitives.map(p => p.name);
    expect(names).toContain('Existential (derived)');
    expect(names).toContain('Identity of content');
    expect(names).toContain('Higher-order generality');
  });
});
