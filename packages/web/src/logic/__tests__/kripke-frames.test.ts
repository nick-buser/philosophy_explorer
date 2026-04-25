import { describe, expect, it } from 'vitest';
import { ALL_FRAMES, FRAMES, FRAME_ORDER, findFrame } from '../kripke-frames';
import { parseModal } from '../kripke-parser';
import { renderUnicode } from '../kripke-render';
import type { FrameClassSlug } from '../kripke-types';

describe('FRAMES — coverage and lookup', () => {
  it('defines K, T, S4, S5', () => {
    const slugs: FrameClassSlug[] = ['K', 'T', 'S4', 'S5'];
    for (const s of slugs) {
      expect(FRAMES[s]).toBeDefined();
      expect(FRAMES[s].slug).toBe(s);
    }
  });

  it('FRAME_ORDER and ALL_FRAMES match FRAMES', () => {
    expect(FRAME_ORDER).toHaveLength(Object.keys(FRAMES).length);
    expect(ALL_FRAMES.map(f => f.slug)).toEqual(FRAME_ORDER);
  });

  it('findFrame returns the same instance', () => {
    expect(findFrame('S5')).toBe(FRAMES.S5);
  });
});

describe('FRAMES — constraint sets', () => {
  it('K has no constraints', () => {
    expect(FRAMES.K.constraints).toEqual([]);
  });

  it('T includes reflexive', () => {
    expect(FRAMES.T.constraints).toContain('reflexive');
  });

  it('S4 includes reflexive and transitive', () => {
    expect(FRAMES.S4.constraints).toEqual(expect.arrayContaining(['reflexive', 'transitive']));
  });

  it('S5 is an equivalence relation (reflexive, symmetric, transitive)', () => {
    expect(FRAMES.S5.constraints).toEqual(
      expect.arrayContaining(['reflexive', 'symmetric', 'transitive']),
    );
  });
});

describe('FRAMES — characteristic axioms parse and round-trip', () => {
  for (const slug of FRAME_ORDER) {
    const f = FRAMES[slug];
    it(`${slug}: dsl parses and renders to declared unicode`, () => {
      const r = parseModal(f.characteristicAxiom.dsl);
      expect(r.ok).toBe(true);
      if (!r.ok) return;
      expect(renderUnicode(r.formula)).toBe(f.characteristicAxiom.unicode);
    });
  }
});
