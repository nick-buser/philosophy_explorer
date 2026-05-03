import { describe, expect, it } from 'vitest';
import { parseMedieval } from '../medieval-parser';
import {
  layoutModalProposition,
  layoutModalSyllogism,
  layoutSorites,
} from '../medieval-layout';

describe('medieval layout — modal proposition', () => {
  it('emits one glyph for a modal proposition', () => {
    const r = parseMedieval('Necessarily, all S is P');
    if (!r.ok || r.formula.kind !== 'modal-proposition') throw new Error('parse');
    const layout = layoutModalProposition(r.formula.proposition);
    expect(layout.glyphs).toHaveLength(1);
    expect(layout.glyphs[0]!.symbol).toBe('□');
  });

  it('emits zero glyphs for an assertoric proposition', () => {
    const r = parseMedieval('All S is P');
    if (!r.ok || r.formula.kind !== 'modal-proposition') throw new Error('parse');
    const layout = layoutModalProposition(r.formula.proposition);
    expect(layout.glyphs).toHaveLength(0);
  });

  it('emits a diamond glyph for possibility', () => {
    const r = parseMedieval('Possibly, some S is P');
    if (!r.ok || r.formula.kind !== 'modal-proposition') throw new Error('parse');
    const layout = layoutModalProposition(r.formula.proposition);
    expect(layout.glyphs[0]!.symbol).toBe('◇');
  });
});

describe('medieval layout — modal syllogism', () => {
  it('emits per-premise glyphs', () => {
    const src =
      'Necessarily, all M is P\n' +
      'All S is M\n' +
      'Therefore necessarily all S is P';
    const r = parseMedieval(src);
    if (!r.ok || r.formula.kind !== 'modal-syllogism') throw new Error('parse');
    const layout = layoutModalSyllogism(r.formula.syllogism);
    // Major and conclusion are L; minor is X. Two glyphs.
    expect(layout.glyphs).toHaveLength(2);
    const roles = layout.glyphs.map(g => g.premiseRole).sort();
    expect(roles).toEqual(['conclusion', 'major']);
    expect(layout.glyphs.every(g => g.symbol === '□')).toBe(true);
  });

  it('reuses the 3-circle Venn (S, M, P circles)', () => {
    const src =
      'Necessarily, all M is P\n' +
      'Necessarily, all S is M\n' +
      'Therefore necessarily all S is P';
    const r = parseMedieval(src);
    if (!r.ok || r.formula.kind !== 'modal-syllogism') throw new Error('parse');
    const layout = layoutModalSyllogism(r.formula.syllogism);
    const roles = layout.circles.map(c => c.role).sort();
    expect(roles).toEqual(['M', 'P', 'S']);
  });
});

describe('medieval layout — sorites chain', () => {
  it('lays out N+1 nodes for an N-premise chain', () => {
    const r = parseMedieval(
      'All A is B\nAll B is C\nAll C is D\nTherefore all A is D',
    );
    if (!r.ok || r.formula.kind !== 'sorites') throw new Error('parse');
    const layout = layoutSorites(r.formula.chain, ['Barbara', 'Barbara', 'Barbara'], null);
    expect(layout.nodes).toHaveLength(4);
    expect(layout.edges).toHaveLength(3);
    expect(layout.nodes.map(n => n.term)).toEqual(['A', 'B', 'C', 'D']);
  });

  it('marks the failed step on the appropriate edge', () => {
    const r = parseMedieval(
      'All A is B\nAll B is C\nAll C is D\nTherefore all A is D',
    );
    if (!r.ok || r.formula.kind !== 'sorites') throw new Error('parse');
    const layout = layoutSorites(r.formula.chain, ['Barbara', 'Barbara', 'Barbara'], 1);
    expect(layout.edges[0]!.failed).toBe(false);
    expect(layout.edges[1]!.failed).toBe(true);
    expect(layout.edges[2]!.failed).toBe(false);
  });

  it('renders Goclenian as forward terms (head-to-tail) regardless of premise order', () => {
    const r = parseMedieval(
      'All C is D\nAll B is C\nAll A is B\nTherefore all A is D',
    );
    if (!r.ok || r.formula.kind !== 'sorites') throw new Error('parse');
    const layout = layoutSorites(r.formula.chain, ['Barbara', 'Barbara', 'Barbara'], null);
    expect(layout.nodes.map(n => n.term)).toEqual(['A', 'B', 'C', 'D']);
  });
});
