import { describe, expect, it } from 'vitest';
import {
  buildSquareLayout,
  cornerFor,
  deriveTruths,
  type CornerRole,
} from '../aristotelian-square';

describe('square layout', () => {
  it('has four corners A, E, I, O', () => {
    const layout = buildSquareLayout('traditional');
    expect(layout.corners.map(c => c.role).sort()).toEqual(['A', 'E', 'I', 'O']);
  });

  it('A and E are at the top, I and O at the bottom', () => {
    const layout = buildSquareLayout('traditional');
    expect(cornerFor('A', layout).cy).toBeLessThan(cornerFor('I', layout).cy);
    expect(cornerFor('E', layout).cy).toBeLessThan(cornerFor('O', layout).cy);
    expect(cornerFor('A', layout).cy).toBe(cornerFor('E', layout).cy);
    expect(cornerFor('I', layout).cy).toBe(cornerFor('O', layout).cy);
  });

  it('A and I are on the left, E and O on the right', () => {
    const layout = buildSquareLayout('traditional');
    expect(cornerFor('A', layout).cx).toBeLessThan(cornerFor('E', layout).cx);
    expect(cornerFor('A', layout).cx).toBe(cornerFor('I', layout).cx);
    expect(cornerFor('E', layout).cx).toBe(cornerFor('O', layout).cx);
  });

  it('always has 6 edges', () => {
    expect(buildSquareLayout('traditional').edges.length).toBe(6);
    expect(buildSquareLayout('boolean').edges.length).toBe(6);
  });

  it('contradictory diagonals are always active', () => {
    for (const setting of ['traditional', 'boolean'] as const) {
      const diag = buildSquareLayout(setting).edges.filter(e => e.kind === 'contradictory');
      expect(diag.length).toBe(2);
      for (const e of diag) expect(e.active).toBe(true);
    }
  });

  it('contrary, subcontrary, subalternation are active under traditional only', () => {
    const trad = buildSquareLayout('traditional').edges;
    const bool = buildSquareLayout('boolean').edges;

    const importDependent = ['contrary', 'subcontrary', 'subalternation'] as const;
    for (const kind of importDependent) {
      for (const e of trad.filter(e => e.kind === kind)) expect(e.active).toBe(true);
      for (const e of bool.filter(e => e.kind === kind)) expect(e.active).toBe(false);
    }
  });
});

describe('deriveTruths — traditional reading', () => {
  it('A true ⇒ E false, I true, O false', () => {
    expect(deriveTruths('A', 'traditional')).toEqual({
      A: 'true', E: 'false', I: 'true', O: 'false',
    });
  });

  it('E true ⇒ A false, I false, O true', () => {
    expect(deriveTruths('E', 'traditional')).toEqual({
      A: 'false', E: 'true', I: 'false', O: 'true',
    });
  });

  it('I true ⇒ E false (contradictory), A unknown, O unknown', () => {
    expect(deriveTruths('I', 'traditional')).toEqual({
      A: 'unknown', E: 'false', I: 'true', O: 'unknown',
    });
  });

  it('O true ⇒ A false (contradictory), E unknown, I unknown', () => {
    expect(deriveTruths('O', 'traditional')).toEqual({
      A: 'false', E: 'unknown', I: 'unknown', O: 'true',
    });
  });
});

describe('deriveTruths — boolean reading', () => {
  it.each<[CornerRole, CornerRole]>([
    ['A', 'O'],
    ['E', 'I'],
    ['I', 'E'],
    ['O', 'A'],
  ])('only the contradictory of %s flips false (boolean), the other two stay unknown', (focused, contra) => {
    const t = deriveTruths(focused, 'boolean');
    expect(t[focused]).toBe('true');
    expect(t[contra]).toBe('false');
    const others = (['A', 'E', 'I', 'O'] as CornerRole[]).filter(r => r !== focused && r !== contra);
    for (const r of others) expect(t[r]).toBe('unknown');
  });
});
