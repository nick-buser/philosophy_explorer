import { describe, expect, it } from 'vitest';
import { parseFol } from '../fol-parser';
import { buildTruthTable } from '../fol-truth-table';
import { renderUnicode } from '../fol-render';

function table(s: string) {
  const r = parseFol(s);
  if (!r.ok) throw new Error(`parse failed: ${r.error.message}`);
  const t = buildTruthTable(r.formula);
  if (!t) throw new Error(`not propositional: ${s}`);
  return t;
}

describe('fol-truth-table — basic shape', () => {
  it('returns null for first-order formulas', () => {
    const r = parseFol('forall x. P(x)');
    if (!r.ok) throw new Error('parse failed');
    expect(buildTruthTable(r.formula)).toBeNull();
  });

  it('atoms are sorted', () => {
    const t = table('q & p -> r');
    expect(t.atoms).toEqual(['p', 'q', 'r']);
  });

  it('row count is 2^|atoms|', () => {
    expect(table('p').rows.length).toBe(2);
    expect(table('p & q').rows.length).toBe(4);
    expect(table('p & q & r').rows.length).toBe(8);
    expect(table('(p | q) & (r | s)').rows.length).toBe(16);
  });

  it('handles a constant formula (no atoms)', () => {
    const t = table('true');
    expect(t.atoms).toEqual([]);
    expect(t.rows.length).toBe(1);
    expect(t.rows[0].mainValue).toBe(true);
    expect(t.status).toBe('tautology');
  });

  it('the rightmost subformula is always the input formula', () => {
    const t = table('(p -> q) & p -> q');
    const last = t.subformulas[t.subformulas.length - 1];
    expect(renderUnicode(last)).toBe(renderUnicode((parseFol('(p -> q) & p -> q') as any).formula));
  });
});

describe('fol-truth-table — verdicts', () => {
  it('classifies modus ponens as a tautology', () => {
    const t = table('(p -> q) & p -> q');
    expect(t.status).toBe('tautology');
    expect(t.rows.every(r => r.mainValue)).toBe(true);
  });

  it('classifies p ∧ ¬p as a contradiction', () => {
    const t = table('p & ~p');
    expect(t.status).toBe('contradiction');
    expect(t.rows.every(r => !r.mainValue)).toBe(true);
  });

  it('classifies p → q as contingent', () => {
    const t = table('p -> q');
    expect(t.status).toBe('contingent');
    // Exactly one row falsifies it: p=T, q=F.
    const falsifying = t.rows.filter(r => !r.mainValue);
    expect(falsifying.length).toBe(1);
    expect(falsifying[0].valuation.p).toBe(true);
    expect(falsifying[0].valuation.q).toBe(false);
  });

  it('agrees with truth-table validity on De Morgan', () => {
    const t = table('~(p | q) <-> (~p & ~q)');
    expect(t.status).toBe('tautology');
  });
});

describe('fol-truth-table — subformula columns', () => {
  it('puts atoms before compound subformulas', () => {
    const t = table('p & q');
    // Order should be: p, q, p ∧ q (no duplicates, atoms first).
    const labels = t.subformulas.map(renderUnicode);
    expect(labels.indexOf('p')).toBeLessThan(labels.indexOf('p ∧ q'));
    expect(labels.indexOf('q')).toBeLessThan(labels.indexOf('p ∧ q'));
  });

  it('deduplicates repeated subformulas', () => {
    // `p ∧ p` shares the `p` subformula on both sides — only one column.
    const t = table('p & p');
    const labels = t.subformulas.map(renderUnicode);
    expect(labels.filter(l => l === 'p').length).toBe(1);
  });
});
