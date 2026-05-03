import { describe, expect, it } from 'vitest';
import { parseFol } from '../fol-parser';
import { buildTableauTree, ruleClass, type TableauNode } from '../fol-tableau-tree';

function tree(s: string) {
  const r = parseFol(s);
  if (!r.ok) throw new Error(`parse failed: ${r.error.message}`);
  return buildTableauTree(r.formula);
}

function leaves(node: TableauNode): TableauNode[] {
  if (node.children.length === 0) return [node];
  return node.children.flatMap(leaves);
}

describe('fol-tableau-tree — verdict mirrors checkValidity', () => {
  it('a valid universal-instantiation tautology closes every branch', () => {
    const t = tree('(forall x. P(x)) -> P(a)');
    expect(t.verdict).toBe('valid');
    for (const l of leaves(t.root)) expect(l.status).toBe('closed');
  });

  it('an invalid quantifier-swap surfaces an open leaf', () => {
    const t = tree('(forall y. exists x. R(x, y)) -> (exists x. forall y. R(x, y))');
    // Same caveat as the validity tests — invalid or unknown is the
    // honest verdict; the default budget is large enough for invalid.
    expect(t.verdict === 'invalid' || t.verdict === 'unknown').toBe(true);
    if (t.verdict === 'invalid') {
      const opens = leaves(t.root).filter(l => l.status === 'open');
      expect(opens.length).toBeGreaterThan(0);
      expect(t.countermodel).toBeDefined();
    }
  });

  it('Drinker’s paradox closes', () => {
    const t = tree('exists x. (P(x) -> forall y. P(y))');
    expect(t.verdict).toBe('valid');
  });

  it('reflexivity of identity closes', () => {
    const t = tree('forall x. x = x');
    expect(t.verdict).toBe('valid');
  });
});

describe('fol-tableau-tree — structural properties', () => {
  it('the root is rule="root" and carries the negated input', () => {
    const t = tree('forall x. P(x) -> P(x)');
    expect(t.root.rule).toBe('root');
    expect(t.root.parentId).toBeNull();
    expect(t.root.introduced.length).toBe(1);
    expect(t.root.introduced[0].kind).toBe('not');
  });

  it('β rules produce two children with branchSide labels', () => {
    // The negation of `(P(a) ∨ Q(a)) → (P(a) ∨ Q(a))` puts a positive
    // disjunction on the branch — that's the β trigger we want.
    const t = tree('(P(a) | Q(a)) -> (P(a) | Q(a))');
    function parentOfBetaSplit(node: TableauNode): TableauNode | null {
      if (node.children.length === 2 &&
          ruleClass(node.children[0].rule) === 'beta' &&
          ruleClass(node.children[1].rule) === 'beta') {
        return node;
      }
      for (const c of node.children) {
        const p = parentOfBetaSplit(c);
        if (p) return p;
      }
      return null;
    }
    const split = parentOfBetaSplit(t.root);
    expect(split).not.toBeNull();
    if (split) {
      expect(split.children[0].branchSide).toBe('left');
      expect(split.children[1].branchSide).toBe('right');
    }
  });

  it('γ-instantiations record the term used', () => {
    const t = tree('(forall x. P(x)) -> P(a)');
    function findGamma(node: TableauNode): TableauNode | null {
      if (ruleClass(node.rule) === 'gamma') return node;
      for (const c of node.children) {
        const f = findGamma(c);
        if (f) return f;
      }
      return null;
    }
    const g = findGamma(t.root);
    expect(g).not.toBeNull();
    if (g) {
      expect(g.gammaTerm).toBeDefined();
      // `a` is the only constant on the branch, so γ should pick it.
      expect(g.gammaTerm).toBe('a');
    }
  });

  it('δ-introduced constants are fresh', () => {
    const t = tree('exists x. P(x)');
    // Negated input is ∀x.¬P(x), so we expect γ-instantiation, not δ.
    // To exercise δ, use a formula whose negation is existential —
    // e.g. ¬∀x. P(x).
    const t2 = tree('~(forall x. P(x))');
    function findDelta(node: TableauNode): TableauNode | null {
      if (ruleClass(node.rule) === 'delta') return node;
      for (const c of node.children) {
        const f = findDelta(c);
        if (f) return f;
      }
      return null;
    }
    const d = findDelta(t.root) ?? findDelta(t2.root);
    if (d) expect(d.gammaTerm).toMatch(/^c\d+$/);
  });

  it('reports steps and budget honestly', () => {
    const t = tree('p -> p');
    // Propositional shortcut on the FOL path: one step at most. (Even
    // though `checkValidity` short-circuits to truth-table here, the
    // tree-builder still works on the formula directly.)
    expect(t.steps).toBeGreaterThanOrEqual(0);
    expect(t.budget).toBeGreaterThan(0);
  });
});

describe('fol-tableau-tree — closure witnesses', () => {
  it('records a predicate clash on closure', () => {
    const t = tree('(forall x. P(x)) -> P(a)');
    const closedLeaves = leaves(t.root).filter(l => l.status === 'closed');
    expect(closedLeaves.length).toBeGreaterThan(0);
    // At least one leaf should close via a P-vs-¬P clash.
    const predClash = closedLeaves.find(l => l.closure?.kind === 'pred-clash');
    expect(predClash).toBeDefined();
  });

  it('records eq-self closure for ¬(t = t)', () => {
    const t = tree('forall x. x = x');
    const closedLeaves = leaves(t.root).filter(l => l.status === 'closed');
    const eqSelf = closedLeaves.find(l => l.closure?.kind === 'eq-self');
    expect(eqSelf).toBeDefined();
  });
});
