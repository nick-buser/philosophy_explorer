import { describe, expect, it } from 'vitest';
import { layoutFormula } from '../frege-layout';
import { parseFrege } from '../frege-parser';
import type { FregeFormula } from '../frege-types';

function lay(src: string) {
  const r = parseFrege(src);
  if (!r.ok) throw new Error(`parse failed: ${r.error.message}`);
  return layoutFormula(r.formula);
}

function primitives(src: string) {
  return lay(src).primitives;
}

describe('layoutFormula — judgment + atom', () => {
  it('emits a judgment bar plus an atom row', () => {
    const ps = primitives('|- p');
    expect(ps.some(p => p.kind === 'judgmentBar')).toBe(true);
    expect(ps.some(p => p.kind === 'hstroke')).toBe(true);
    expect(ps.some(p => p.kind === 'atomText')).toBe(true);
  });

  it('does not emit a judgment bar for mere content', () => {
    const ps = primitives('p');
    expect(ps.some(p => p.kind === 'judgmentBar')).toBe(false);
  });
});

describe('layoutFormula — negation tick', () => {
  it('emits a negTick primitive for ~p', () => {
    const ps = primitives('|- ~p');
    expect(ps.some(p => p.kind === 'negTick')).toBe(true);
  });

  it('emits two negTicks for ~~p', () => {
    const ps = primitives('|- ~~p');
    const ticks = ps.filter(p => p.kind === 'negTick');
    expect(ticks).toHaveLength(2);
  });
});

describe('layoutFormula — generality concavity', () => {
  it('emits a cavity primitive carrying the bound variable', () => {
    const ps = primitives('|- all x. F(x)');
    const cavity = ps.find(p => p.kind === 'cavity');
    expect(cavity).toBeDefined();
    if (cavity?.kind !== 'cavity') return;
    expect(cavity.letter).toBe('x');
    expect(cavity.sort).toBe('individual');
  });

  it('marks an uppercase-bound cavity as predicate sort', () => {
    const ps = primitives('|- all F. F(a)');
    const cavity = ps.find(p => p.kind === 'cavity');
    expect(cavity).toBeDefined();
    if (cavity?.kind !== 'cavity') return;
    expect(cavity.letter).toBe('F');
    expect(cavity.sort).toBe('predicate');
  });
});

describe('layoutFormula — existential lowers to ¬∀¬', () => {
  it('emits a cavity plus two negation ticks for `exists x. F(x)`', () => {
    const ps = primitives('|- exists x. F(x)');
    expect(ps.filter(p => p.kind === 'cavity')).toHaveLength(1);
    expect(ps.filter(p => p.kind === 'negTick')).toHaveLength(2);
  });

  it('preserves predicate sort through the lowering', () => {
    const ps = primitives('|- exists F. F(a)');
    const cavity = ps.find(p => p.kind === 'cavity');
    expect(cavity).toBeDefined();
    if (cavity?.kind !== 'cavity') return;
    expect(cavity.sort).toBe('predicate');
  });
});

describe('layoutFormula — identity of content', () => {
  it('emits an idenSign between left and right contents', () => {
    const ps = primitives('|- p == q');
    const sign = ps.find(p => p.kind === 'idenSign');
    expect(sign).toBeDefined();
    // Two atom labels (p and q).
    expect(ps.filter(p => p.kind === 'atomText')).toHaveLength(2);
  });

  it('supports nested iden inside a conditional', () => {
    // |- (a == b) -> P(a)
    const ps = primitives('|- (a == b) -> P(a)');
    const signs = ps.filter(p => p.kind === 'idenSign');
    expect(signs).toHaveLength(1);
    // Cond contributes a vertical hub stroke.
    expect(ps.some(p => p.kind === 'vstroke')).toBe(true);
  });
});

describe('layoutFormula — conditional T-junction', () => {
  it('emits a vertical condition stroke for p -> q', () => {
    const ps = primitives('|- p -> q');
    expect(ps.some(p => p.kind === 'vstroke')).toBe(true);
  });

  it('places the consequent stub above the antecedent stub', () => {
    const ps = primitives('|- p -> q');
    const v = ps.find(p => p.kind === 'vstroke');
    expect(v).toBeDefined();
    if (v?.kind !== 'vstroke') return;
    expect(v.y2).toBeGreaterThan(v.y1);  // antecedent below consequent
  });

  it('nests two condition strokes for a -> b -> c', () => {
    const ps = primitives('|- a -> b -> c');
    const verticals = ps.filter(p => p.kind === 'vstroke');
    expect(verticals).toHaveLength(2);
  });
});

describe('layoutFormula — bbox is non-trivial', () => {
  it('width and height grow with structure', () => {
    const small = lay('|- p');
    const big = lay('|- (all x. F(x) -> G(x)) -> (F(a) -> G(a))');
    expect(big.width).toBeGreaterThan(small.width);
    expect(big.height).toBeGreaterThan(small.height);
  });

  it('every primitive lies inside the reported bbox', () => {
    const { width, height, primitives: ps } = lay(
      '|- (all x. F(x) -> G(x)) -> (all x. G(x) -> H(x)) -> (all x. F(x) -> H(x))',
    );
    for (const p of ps) {
      switch (p.kind) {
        case 'hstroke':
          expect(p.x1).toBeGreaterThanOrEqual(0);
          expect(p.x2).toBeLessThanOrEqual(width);
          expect(p.y).toBeGreaterThanOrEqual(0);
          expect(p.y).toBeLessThanOrEqual(height);
          break;
        case 'vstroke':
          expect(p.x).toBeGreaterThanOrEqual(0);
          expect(p.x).toBeLessThanOrEqual(width);
          expect(p.y1).toBeGreaterThanOrEqual(0);
          expect(p.y2).toBeLessThanOrEqual(height);
          break;
        case 'negTick':
        case 'atomText':
          expect(p.x).toBeGreaterThanOrEqual(0);
          expect(p.x).toBeLessThanOrEqual(width);
          break;
        case 'cavity':
          expect(p.x).toBeGreaterThanOrEqual(0);
          expect(p.x + p.w).toBeLessThanOrEqual(width);
          expect(p.y + p.depth).toBeLessThanOrEqual(height);
          break;
        case 'judgmentBar':
          expect(p.x).toBeGreaterThanOrEqual(0);
          expect(p.y1).toBeGreaterThanOrEqual(0);
          expect(p.y2).toBeLessThanOrEqual(height);
          break;
        case 'idenSign':
          expect(p.x).toBeGreaterThanOrEqual(0);
          expect(p.x).toBeLessThanOrEqual(width);
          expect(p.y).toBeGreaterThanOrEqual(0);
          expect(p.y).toBeLessThanOrEqual(height);
          break;
      }
    }
  });

  it('keeps an iden formula primitives inside the bbox', () => {
    const { width, height, primitives: ps } = lay(
      '|- (a == b) -> (all F. F(a) -> F(b))',
    );
    for (const p of ps) {
      if (p.kind === 'idenSign') {
        expect(p.x).toBeLessThanOrEqual(width);
        expect(p.y).toBeLessThanOrEqual(height);
      }
    }
  });
});

describe('layoutFormula — sample-formula round-trip', () => {
  it('lays out every example without throwing', async () => {
    const { LOGIC_SYSTEMS } = await import('../../data/logic-systems');
    const frege = LOGIC_SYSTEMS.find(s => s.slug === 'frege-bs');
    expect(frege).toBeDefined();
    for (const ex of frege!.examples) {
      const r = parseFrege(ex.dsl);
      expect(r.ok, `parse failed for ${ex.slug}: ${ex.dsl}`).toBe(true);
      if (!r.ok) continue;
      const out = layoutFormula(r.formula as FregeFormula);
      expect(out.width).toBeGreaterThan(0);
      expect(out.height).toBeGreaterThan(0);
      expect(out.primitives.length).toBeGreaterThan(0);
    }
  });
});
