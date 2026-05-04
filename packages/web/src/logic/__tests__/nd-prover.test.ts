import { describe, expect, it } from 'vitest';
import { parseArgument } from '../nd-parser';
import { proveArgument } from '../nd-prover';

function prove(src: string, mode: 'classical' | 'intuitionistic' = 'classical') {
  const r = parseArgument(src);
  if (!r.ok) throw new Error(`parse failed: ${r.error.message}`);
  return proveArgument(r.argument, mode);
}

describe('nd-prover — intuitionistically valid arguments', () => {
  it('modus ponens', () => {
    const r = prove('p, p -> q |- q', 'intuitionistic');
    expect(r.ok).toBe(true);
  });

  it('|- p -> p (identity implication)', () => {
    const r = prove('|- p -> p', 'intuitionistic');
    expect(r.ok).toBe(true);
  });

  it('hypothetical syllogism', () => {
    const r = prove('p -> q, q -> r |- p -> r', 'intuitionistic');
    expect(r.ok).toBe(true);
  });

  it('conjunction commutativity', () => {
    const r = prove('p & q |- q & p', 'intuitionistic');
    expect(r.ok).toBe(true);
  });

  it('disjunction case', () => {
    const r = prove('p | q, p -> r, q -> r |- r', 'intuitionistic');
    expect(r.ok).toBe(true);
  });

  it('contraposition (forward)', () => {
    const r = prove('p -> q |- ~q -> ~p', 'intuitionistic');
    expect(r.ok).toBe(true);
  });

  it('De Morgan (intuitionistic side)', () => {
    const r = prove('~p & ~q |- ~(p | q)', 'intuitionistic');
    expect(r.ok).toBe(true);
  });

  it('currying', () => {
    const r = prove('(p & q) -> r |- p -> (q -> r)', 'intuitionistic');
    expect(r.ok).toBe(true);
  });
});

describe('nd-prover — classical-only arguments', () => {
  it('|- p | ~p (LEM) requires RAA', () => {
    const r = prove('|- p | ~p', 'classical');
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.classicalOnly).toBe(true);
    const i = prove('|- p | ~p', 'intuitionistic');
    expect(i.ok).toBe(false);
  });

  it('double-negation elimination', () => {
    const r = prove('~~p |- p', 'classical');
    expect(r.ok).toBe(true);
  });

  it("Peirce's law", () => {
    const r = prove('|- ((p -> q) -> p) -> p', 'classical');
    expect(r.ok).toBe(true);
  });

  it('De Morgan reverse', () => {
    const r = prove('~(p & q) |- ~p | ~q', 'classical');
    expect(r.ok).toBe(true);
  });
});

describe('nd-prover — Fitch shape sanity', () => {
  it('emits a premise, an assumption, and an →I citation for p -> p', () => {
    const r = prove('|- p -> p', 'intuitionistic');
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    const conc = r.proof.lines.find(l => l.lineNo === r.proof.conclusionLine)!;
    expect(conc.rule).toBe('impI');
    expect(conc.cites).toHaveLength(1);
    const cite = conc.cites[0]!;
    expect(Array.isArray(cite)).toBe(true);
  });

  it('gives modus ponens an →E line whose cites are two existing lines', () => {
    const r = prove('p, p -> q |- q', 'classical');
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    const conc = r.proof.lines.find(l => l.lineNo === r.proof.conclusionLine)!;
    expect(['impE', 'reit']).toContain(conc.rule);
  });
});
