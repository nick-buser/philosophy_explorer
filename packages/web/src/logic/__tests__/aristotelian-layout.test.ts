import { describe, expect, it } from 'vitest';
import { parseAristotelian } from '../aristotelian-parser';
import { layoutProposition, layoutSyllogism } from '../aristotelian-layout';
import type { CategoricalProposition, Syllogism } from '../aristotelian-types';

function prop(src: string): CategoricalProposition {
  const r = parseAristotelian(src);
  if (!r.ok || r.formula.kind !== 'proposition') throw new Error('expected proposition');
  return r.formula.proposition;
}

function syl(src: string): Syllogism {
  const r = parseAristotelian(src);
  if (!r.ok || r.formula.kind !== 'syllogism') throw new Error('expected syllogism');
  return r.formula.syllogism;
}

describe('layoutProposition (2-circle)', () => {
  it('A shades S∖P (one shaded region inside S only)', () => {
    const layout = layoutProposition(prop('All Greeks are Mortal'));
    expect(layout.shaded).toEqual([{ inside: ['S'] }]);
    expect(layout.crosses).toHaveLength(0);
  });

  it('E shades the overlap S∩P', () => {
    const layout = layoutProposition(prop('No fish is Mammal'));
    expect(layout.shaded).toEqual([{ inside: ['S', 'P'] }]);
    expect(layout.crosses).toHaveLength(0);
  });

  it('I places one × in the overlap', () => {
    const layout = layoutProposition(prop('Some Greeks are philosophers'));
    expect(layout.shaded).toHaveLength(0);
    expect(layout.crosses).toHaveLength(1);
  });

  it('O places one × in S∖P', () => {
    const layout = layoutProposition(prop('Some swans are not white'));
    expect(layout.shaded).toHaveLength(0);
    expect(layout.crosses).toHaveLength(1);
  });

  it('emits two labelled circles regardless of form', () => {
    const layout = layoutProposition(prop('All Greeks are Mortal'));
    expect(layout.circles.map(c => c.role).sort()).toEqual(['P', 'S']);
  });
});

describe('layoutSyllogism (3-circle)', () => {
  it('emits S, M, P circles for any syllogism', () => {
    const layout = layoutSyllogism(syl('AAA-1/Greeks,men,Mortal'));
    expect(layout.circles.map(c => c.role).sort()).toEqual(['M', 'P', 'S']);
  });

  it('Barbara (AAA-1) shades regions emptied by both universal premises', () => {
    const layout = layoutSyllogism(syl('AAA-1/Greeks,men,Mortal'));
    // Both universal premises produce shading; no particulars so no ×.
    expect(layout.shaded.length).toBeGreaterThan(0);
    expect(layout.crosses).toHaveLength(0);
  });

  it('Darii (AII-1) produces both shading (from major) and a × (from minor)', () => {
    const layout = layoutSyllogism(syl('AII-1/A,B,C'));
    expect(layout.shaded.length).toBeGreaterThan(0);
    expect(layout.crosses).toHaveLength(1);
  });

  it('Bocardo (OAO-3) produces shading from A-premise and a × from O-premise', () => {
    const layout = layoutSyllogism(syl('OAO-3/A,B,C'));
    expect(layout.shaded.length).toBeGreaterThan(0);
    expect(layout.crosses).toHaveLength(1);
  });

  it('every cross-mark anchor lies inside the layout bbox', () => {
    const layout = layoutSyllogism(syl('AII-1/A,B,C'));
    for (const c of layout.crosses) {
      expect(c.cx).toBeGreaterThanOrEqual(0);
      expect(c.cx).toBeLessThanOrEqual(layout.width);
      expect(c.cy).toBeGreaterThanOrEqual(0);
      expect(c.cy).toBeLessThanOrEqual(layout.height);
    }
  });

  it('every circle and label lies inside the layout bbox', () => {
    const layout = layoutSyllogism(syl('AAA-1/Greeks,men,Mortal'));
    for (const c of layout.circles) {
      expect(c.cx - c.r).toBeGreaterThanOrEqual(0);
      expect(c.cx + c.r).toBeLessThanOrEqual(layout.width);
      expect(c.cy - c.r).toBeGreaterThanOrEqual(0);
      expect(c.cy + c.r).toBeLessThanOrEqual(layout.height);
    }
  });
});
