import type { FolFormula, FolTerm } from './fol-types';
import { substitute } from './fol-types';
import { renderUnicode, renderTermUnicode } from './fol-render';

// Smullyan-style semantic tableau, **with the proof tree retained**.
//
// The original `fol-validity.ts:checkTableau` discarded the tree
// structure as it ran — it only kept a verdict and (for invalid) the
// first open branch's literals. This module rebuilds the same algorithm
// in a tree-producing form so the lab can render the proof.
//
// One node = one rule application. The root carries the negated input
// formula. α-rules produce one child with one or more introduced
// formulas; β-rules produce two children, each with the disjunct it
// took; γ-rules produce one child with the instantiated body and the
// term used; δ-rules produce one child with a fresh constant
// witnessing the existential.
//
// Verdict is derived from the tree: every leaf closed → valid; any
// open leaf → invalid (countermodel from the first open leaf, matching
// the legacy `checkValidity` first-found behavior); else any budget
// leaf → unknown.

// ─── Public types ────────────────────────────────────────────────────

export type TableauRule =
  | 'root'
  | 'alpha-not-not'
  | 'alpha-and'
  | 'alpha-not-or'
  | 'alpha-not-implies'
  | 'beta-or'
  | 'beta-implies'
  | 'beta-iff'
  | 'beta-not-and'
  | 'beta-not-iff'
  | 'gamma-forall'
  | 'gamma-not-exists'
  | 'delta-exists'
  | 'delta-not-forall';

export type TableauStatus = 'closed' | 'open' | 'budget';

export type ClosureWitness =
  | { kind: 'bot' }
  | { kind: 'not-top' }
  | { kind: 'eq-self'; term: string }
  | { kind: 'pred-clash'; positive: string; negative: string };

export type TableauCountermodel = {
  domain: string[];
  positiveFacts: string[];
  negativeFacts: string[];
  equalities: string[];
  inequalities: string[];
};

export type TableauNode = {
  id: number;
  parentId: number | null;
  depth: number;
  rule: TableauRule;
  // Formula being expanded from the parent's accumulated branch. null
  // only on the root.
  source: FolFormula | null;
  // Formulas added at this node. For root: the negated input.
  introduced: FolFormula[];
  // For γ rules: which term was used to instantiate.
  gammaTerm?: string;
  // For β children: which disjunct this branch took.
  branchSide?: 'left' | 'right';
  children: TableauNode[];
  status?: TableauStatus;
  closure?: ClosureWitness;
  countermodel?: TableauCountermodel;
};

export type TableauTree = {
  root: TableauNode;
  verdict: 'valid' | 'invalid' | 'unknown';
  countermodel?: TableauCountermodel;   // populated on 'invalid'
  budget: number;
  steps: number;
};

export type TableauOptions = {
  budget?: number;          // expansion-step ceiling (default 200)
  maxConstants?: number;    // δ-introduced constant cap (default 6)
};

const DEFAULT_BUDGET = 200;
const DEFAULT_MAX_CONSTANTS = 6;

// Display helpers for renderers. Co-located so rule labelling stays
// consistent with the algorithm's classification.
export function ruleLabel(r: TableauRule): string {
  switch (r) {
    case 'root':              return 'root';
    case 'alpha-not-not':     return '¬¬';
    case 'alpha-and':         return '∧';
    case 'alpha-not-or':      return '¬∨';
    case 'alpha-not-implies': return '¬→';
    case 'beta-or':           return '∨';
    case 'beta-implies':      return '→';
    case 'beta-iff':          return '↔';
    case 'beta-not-and':      return '¬∧';
    case 'beta-not-iff':      return '¬↔';
    case 'gamma-forall':      return '∀';
    case 'gamma-not-exists':  return '¬∃';
    case 'delta-exists':      return '∃';
    case 'delta-not-forall':  return '¬∀';
  }
}

export function ruleClass(r: TableauRule): 'root' | 'alpha' | 'beta' | 'gamma' | 'delta' {
  if (r === 'root') return 'root';
  if (r.startsWith('alpha')) return 'alpha';
  if (r.startsWith('beta'))  return 'beta';
  if (r.startsWith('gamma')) return 'gamma';
  return 'delta';
}

// ─── Build entry point ───────────────────────────────────────────────

export function buildTableauTree(formula: FolFormula, opts: TableauOptions = {}): TableauTree {
  const budget = opts.budget ?? DEFAULT_BUDGET;
  const maxConstants = opts.maxConstants ?? DEFAULT_MAX_CONSTANTS;
  const negated: FolFormula = { kind: 'not', body: formula };
  const initialConstants = collectGroundConstants(negated);
  if (initialConstants.size === 0) initialConstants.add('a');

  const idGen = { n: 0 };
  const fresh = { n: 0 };
  const stepsRef = { n: 0 };

  const root: TableauNode = {
    id: idGen.n++,
    parentId: null,
    depth: 0,
    rule: 'root',
    source: null,
    introduced: [negated],
    children: [],
  };

  const initialBranch: Branch = {
    formulas: [negated],
    formulaKeys: new Set([keyOf(negated)]),
    processed: new Set(),
    gammaSeen: new Map(),
    constants: initialConstants,
    freshCounter: fresh,
  };

  buildSubtree(initialBranch, root, { budget, maxConstants, idGen, stepsRef });

  return finalize(root, budget, stepsRef.n);
}

// ─── Recursive build ─────────────────────────────────────────────────

type BuildCtx = {
  budget: number;
  maxConstants: number;
  idGen: { n: number };
  stepsRef: { n: number };
};

function buildSubtree(branch: Branch, parent: TableauNode, ctx: BuildCtx): void {
  // 1) Closure check first — a node may close before any further work.
  const closure = closureWitness(branch);
  if (closure) {
    parent.status = 'closed';
    parent.closure = closure;
    return;
  }

  // 2) Saturation check.
  const work = pickWork(branch, ctx.maxConstants);
  if (!work) {
    parent.status = 'open';
    parent.countermodel = extractCountermodel(branch);
    return;
  }

  // 3) Budget check.
  if (ctx.stepsRef.n >= ctx.budget) {
    parent.status = 'budget';
    return;
  }
  ctx.stepsRef.n++;

  // 4) Expand and recurse on each resulting branch.
  const expansions = expand(branch, work);
  for (const e of expansions) {
    const child: TableauNode = {
      id: ctx.idGen.n++,
      parentId: parent.id,
      depth: parent.depth + 1,
      rule: e.rule,
      source: e.source,
      introduced: e.introduced,
      gammaTerm: e.gammaTerm,
      branchSide: e.branchSide,
      children: [],
    };
    parent.children.push(child);
    buildSubtree(e.branch, child, ctx);
  }
}

function finalize(root: TableauNode, budget: number, steps: number): TableauTree {
  // Walk the tree, classify by leaves.
  let anyOpen: TableauCountermodel | null = null;
  let anyBudget = false;
  let anyClosed = false;
  visit(root);

  let verdict: TableauTree['verdict'];
  if (anyOpen) verdict = 'invalid';
  else if (anyBudget) verdict = 'unknown';
  else if (anyClosed) verdict = 'valid';
  else verdict = 'valid';   // root closed without expansion: still valid

  const tree: TableauTree = { root, verdict, budget, steps };
  if (anyOpen) tree.countermodel = anyOpen;
  return tree;

  function visit(n: TableauNode): void {
    if (n.children.length === 0) {
      if (n.status === 'open' && n.countermodel && !anyOpen) anyOpen = n.countermodel;
      if (n.status === 'budget') anyBudget = true;
      if (n.status === 'closed') anyClosed = true;
      return;
    }
    for (const c of n.children) visit(c);
  }
}

// ─── Branch state ────────────────────────────────────────────────────
// Mirrors the `Branch` in fol-validity.ts. Kept module-private here so
// the two engines can evolve independently if needed; if drift becomes
// a maintenance issue, fold one into the other.

type Branch = {
  formulas: FolFormula[];
  formulaKeys: Set<string>;
  processed: Set<number>;
  gammaSeen: Map<number, Set<string>>;
  constants: Set<string>;
  freshCounter: { n: number };
};

function keyOf(f: FolFormula): string { return renderUnicode(f); }

function termKey(t: FolTerm): string {
  switch (t.kind) {
    case 'var':   return `v:${t.name}`;
    case 'const': return `c:${t.name}`;
    case 'fn':    return `${t.name}(${t.args.map(termKey).join(',')})`;
  }
}

function addFormula(branch: Branch, f: FolFormula): boolean {
  const k = keyOf(f);
  if (branch.formulaKeys.has(k)) return false;
  branch.formulas.push(f);
  branch.formulaKeys.add(k);
  for (const c of collectGroundConstants(f)) branch.constants.add(c);
  return true;
}

function cloneBranch(b: Branch): Branch {
  return {
    formulas: [...b.formulas],
    formulaKeys: new Set(b.formulaKeys),
    processed: new Set(b.processed),
    gammaSeen: new Map([...b.gammaSeen.entries()].map(([k, v]) => [k, new Set(v)])),
    constants: new Set(b.constants),
    freshCounter: b.freshCounter,
  };
}

function freshConst(branch: Branch): FolTerm {
  branch.freshCounter.n++;
  let name = `c${branch.freshCounter.n}`;
  while (branch.constants.has(name)) {
    branch.freshCounter.n++;
    name = `c${branch.freshCounter.n}`;
  }
  branch.constants.add(name);
  return { kind: 'const', name };
}

// ─── Closure ─────────────────────────────────────────────────────────

function closureWitness(branch: Branch): ClosureWitness | null {
  for (const f of branch.formulas) {
    if (f.kind === 'bot') return { kind: 'bot' };
    if (f.kind === 'not' && f.body.kind === 'top') return { kind: 'not-top' };
  }
  const uf = new UnionFind();
  for (const f of branch.formulas) {
    if (f.kind === 'eq') uf.union(termKey(f.left), termKey(f.right));
  }
  for (const f of branch.formulas) {
    if (f.kind === 'not' && f.body.kind === 'eq') {
      const lk = termKey(f.body.left), rk = termKey(f.body.right);
      if (uf.equiv(lk, rk)) {
        // The most informative term to surface is whichever side reads
        // closer to the literal user input — left is fine.
        return { kind: 'eq-self', term: renderTermUnicode(f.body.left) };
      }
    }
  }
  const positives: { f: FolFormula; argKeys: string[] }[] = [];
  const negatives: { f: FolFormula; argKeys: string[] }[] = [];
  for (const f of branch.formulas) {
    if (f.kind === 'pred') {
      positives.push({ f, argKeys: f.args.map(termKey) });
    } else if (f.kind === 'not' && f.body.kind === 'pred') {
      negatives.push({ f: f.body, argKeys: f.body.args.map(termKey) });
    }
  }
  for (const p of positives) {
    for (const n of negatives) {
      if (p.f.kind !== 'pred' || n.f.kind !== 'pred') continue;
      if (p.f.name !== n.f.name) continue;
      if (p.argKeys.length !== n.argKeys.length) continue;
      let allEq = true;
      for (let i = 0; i < p.argKeys.length; i++) {
        if (!uf.equiv(p.argKeys[i], n.argKeys[i])) { allEq = false; break; }
      }
      if (allEq) {
        return {
          kind: 'pred-clash',
          positive: renderUnicode(p.f),
          negative: `¬${renderUnicode(n.f)}`,
        };
      }
    }
  }
  return null;
}

class UnionFind {
  parent = new Map<string, string>();
  find(k: string): string {
    if (!this.parent.has(k)) { this.parent.set(k, k); return k; }
    let p = this.parent.get(k)!;
    while (p !== this.parent.get(p)!) {
      const gp = this.parent.get(p)!;
      this.parent.set(p, this.parent.get(gp)!);
      p = this.parent.get(p)!;
    }
    return p;
  }
  union(a: string, b: string): void {
    const ra = this.find(a), rb = this.find(b);
    if (ra !== rb) this.parent.set(ra, rb);
  }
  equiv(a: string, b: string): boolean { return this.find(a) === this.find(b); }
}

// ─── Work selection ──────────────────────────────────────────────────

type Work =
  | { kind: 'expand'; index: number; formula: FolFormula }
  | { kind: 'gamma';  index: number; formula: FolFormula; term: FolTerm };

function pickWork(branch: Branch, maxConstants: number): Work | null {
  const order: Array<'alpha' | 'delta' | 'beta' | 'gamma'> = ['alpha', 'delta', 'beta', 'gamma'];
  for (const phase of order) {
    for (let i = 0; i < branch.formulas.length; i++) {
      const f = branch.formulas[i];
      if (phase !== 'gamma' && branch.processed.has(i)) continue;
      const cls = classify(f);
      if (cls !== phase) continue;
      if (phase === 'gamma') {
        const seen = branch.gammaSeen.get(i) ?? new Set<string>();
        const cands = [...branch.constants].slice(0, maxConstants);
        for (const cName of cands) {
          if (seen.has(cName)) continue;
          return { kind: 'gamma', index: i, formula: f, term: { kind: 'const', name: cName } };
        }
      } else {
        return { kind: 'expand', index: i, formula: f };
      }
    }
  }
  return null;
}

function classify(f: FolFormula): 'alpha' | 'beta' | 'gamma' | 'delta' | 'literal' {
  switch (f.kind) {
    case 'top': case 'bot': case 'pred': case 'eq': return 'literal';
    case 'and':     return 'alpha';
    case 'or':      return 'beta';
    case 'implies': return 'beta';
    case 'iff':     return 'beta';
    case 'forall':  return 'gamma';
    case 'exists':  return 'delta';
    case 'not': {
      const b = f.body;
      switch (b.kind) {
        case 'top': case 'bot': case 'pred': case 'eq': return 'literal';
        case 'not':     return 'alpha';
        case 'and':     return 'beta';
        case 'or':      return 'alpha';
        case 'implies': return 'alpha';
        case 'iff':     return 'beta';
        case 'forall':  return 'delta';
        case 'exists':  return 'gamma';
      }
    }
  }
}

// ─── Expansion ───────────────────────────────────────────────────────

type Expansion = {
  rule: TableauRule;
  source: FolFormula;
  introduced: FolFormula[];
  gammaTerm?: string;
  branchSide?: 'left' | 'right';
  branch: Branch;
};

function expand(branch: Branch, work: Work): Expansion[] {
  if (work.kind === 'gamma') {
    const f = work.formula;
    const next = cloneBranch(branch);
    const seen = next.gammaSeen.get(work.index) ?? new Set<string>();
    seen.add((work.term as { name: string }).name);
    next.gammaSeen.set(work.index, seen);

    if (f.kind === 'forall') {
      const inst = substitute(f.body, f.variable, work.term);
      addFormula(next, inst);
      return [{
        rule: 'gamma-forall',
        source: f,
        introduced: [inst],
        gammaTerm: renderTermUnicode(work.term),
        branch: next,
      }];
    }
    if (f.kind === 'not' && f.body.kind === 'exists') {
      const inst: FolFormula = { kind: 'not', body: substitute(f.body.body, f.body.variable, work.term) };
      addFormula(next, inst);
      return [{
        rule: 'gamma-not-exists',
        source: f,
        introduced: [inst],
        gammaTerm: renderTermUnicode(work.term),
        branch: next,
      }];
    }
    return [];
  }

  const f = work.formula;
  const idx = work.index;

  switch (f.kind) {
    case 'and': {
      const next = cloneBranch(branch);
      next.processed.add(idx);
      addFormula(next, f.left); addFormula(next, f.right);
      return [{ rule: 'alpha-and', source: f, introduced: [f.left, f.right], branch: next }];
    }
    case 'or': {
      const left = cloneBranch(branch), right = cloneBranch(branch);
      left.processed.add(idx); right.processed.add(idx);
      addFormula(left, f.left); addFormula(right, f.right);
      return [
        { rule: 'beta-or', source: f, introduced: [f.left],  branchSide: 'left',  branch: left },
        { rule: 'beta-or', source: f, introduced: [f.right], branchSide: 'right', branch: right },
      ];
    }
    case 'implies': {
      const left = cloneBranch(branch), right = cloneBranch(branch);
      left.processed.add(idx); right.processed.add(idx);
      const negLeft: FolFormula = { kind: 'not', body: f.left };
      addFormula(left, negLeft); addFormula(right, f.right);
      return [
        { rule: 'beta-implies', source: f, introduced: [negLeft], branchSide: 'left',  branch: left },
        { rule: 'beta-implies', source: f, introduced: [f.right], branchSide: 'right', branch: right },
      ];
    }
    case 'iff': {
      const left = cloneBranch(branch), right = cloneBranch(branch);
      left.processed.add(idx); right.processed.add(idx);
      addFormula(left, f.left); addFormula(left, f.right);
      const nl: FolFormula = { kind: 'not', body: f.left };
      const nr: FolFormula = { kind: 'not', body: f.right };
      addFormula(right, nl); addFormula(right, nr);
      return [
        { rule: 'beta-iff', source: f, introduced: [f.left, f.right], branchSide: 'left',  branch: left },
        { rule: 'beta-iff', source: f, introduced: [nl, nr],          branchSide: 'right', branch: right },
      ];
    }
    case 'exists': {
      const next = cloneBranch(branch);
      next.processed.add(idx);
      const c = freshConst(next);
      const inst = substitute(f.body, f.variable, c);
      addFormula(next, inst);
      return [{
        rule: 'delta-exists',
        source: f,
        introduced: [inst],
        gammaTerm: renderTermUnicode(c),
        branch: next,
      }];
    }
    case 'not': {
      const b = f.body;
      switch (b.kind) {
        case 'not': {
          const next = cloneBranch(branch);
          next.processed.add(idx);
          addFormula(next, b.body);
          return [{ rule: 'alpha-not-not', source: f, introduced: [b.body], branch: next }];
        }
        case 'or': {
          const next = cloneBranch(branch);
          next.processed.add(idx);
          const nl: FolFormula = { kind: 'not', body: b.left };
          const nr: FolFormula = { kind: 'not', body: b.right };
          addFormula(next, nl); addFormula(next, nr);
          return [{ rule: 'alpha-not-or', source: f, introduced: [nl, nr], branch: next }];
        }
        case 'implies': {
          const next = cloneBranch(branch);
          next.processed.add(idx);
          const nr: FolFormula = { kind: 'not', body: b.right };
          addFormula(next, b.left); addFormula(next, nr);
          return [{ rule: 'alpha-not-implies', source: f, introduced: [b.left, nr], branch: next }];
        }
        case 'and': {
          const left = cloneBranch(branch), right = cloneBranch(branch);
          left.processed.add(idx); right.processed.add(idx);
          const nl: FolFormula = { kind: 'not', body: b.left };
          const nr: FolFormula = { kind: 'not', body: b.right };
          addFormula(left, nl); addFormula(right, nr);
          return [
            { rule: 'beta-not-and', source: f, introduced: [nl], branchSide: 'left',  branch: left },
            { rule: 'beta-not-and', source: f, introduced: [nr], branchSide: 'right', branch: right },
          ];
        }
        case 'iff': {
          const left = cloneBranch(branch), right = cloneBranch(branch);
          left.processed.add(idx); right.processed.add(idx);
          const nr: FolFormula = { kind: 'not', body: b.right };
          const nl: FolFormula = { kind: 'not', body: b.left };
          addFormula(left, b.left); addFormula(left, nr);
          addFormula(right, nl);    addFormula(right, b.right);
          return [
            { rule: 'beta-not-iff', source: f, introduced: [b.left, nr], branchSide: 'left',  branch: left },
            { rule: 'beta-not-iff', source: f, introduced: [nl, b.right], branchSide: 'right', branch: right },
          ];
        }
        case 'forall': {
          const next = cloneBranch(branch);
          next.processed.add(idx);
          const c = freshConst(next);
          const inst: FolFormula = { kind: 'not', body: substitute(b.body, b.variable, c) };
          addFormula(next, inst);
          return [{
            rule: 'delta-not-forall',
            source: f,
            introduced: [inst],
            gammaTerm: renderTermUnicode(c),
            branch: next,
          }];
        }
        case 'exists':
          // γ-class — handled by pickWork's gamma branch.
          return [];
        default:
          return [];
      }
    }
    default:
      return [];
  }
}

// ─── Constants harvest / countermodel extraction ─────────────────────

function collectGroundConstants(f: FolFormula): Set<string> {
  const out = new Set<string>();
  walk(f);
  return out;
  function walk(g: FolFormula): void {
    switch (g.kind) {
      case 'top': case 'bot': return;
      case 'pred': for (const t of g.args) walkT(t); return;
      case 'eq': walkT(g.left); walkT(g.right); return;
      case 'not': walk(g.body); return;
      case 'and': case 'or': case 'implies': case 'iff':
        walk(g.left); walk(g.right); return;
      case 'forall': case 'exists': walk(g.body); return;
    }
  }
  function walkT(t: FolTerm): void {
    switch (t.kind) {
      case 'var': return;
      case 'const': out.add(t.name); return;
      case 'fn': for (const a of t.args) walkT(a); return;
    }
  }
}

function isLiteral(f: FolFormula): boolean {
  if (f.kind === 'pred' || f.kind === 'eq' || f.kind === 'top' || f.kind === 'bot') return true;
  if (f.kind === 'not') {
    const b = f.body;
    return b.kind === 'pred' || b.kind === 'eq' || b.kind === 'top' || b.kind === 'bot';
  }
  return false;
}

function extractCountermodel(branch: Branch): TableauCountermodel {
  const positiveFacts: string[] = [];
  const negativeFacts: string[] = [];
  const equalities: string[] = [];
  const inequalities: string[] = [];
  for (const f of branch.formulas) {
    if (!isLiteral(f)) continue;
    if (f.kind === 'pred')      positiveFacts.push(renderUnicode(f));
    else if (f.kind === 'eq')   equalities.push(renderUnicode(f));
    else if (f.kind === 'not') {
      const b = f.body;
      if (b.kind === 'pred')    negativeFacts.push(renderUnicode(b));
      else if (b.kind === 'eq') inequalities.push(`${renderTermUnicode(b.left)} ≠ ${renderTermUnicode(b.right)}`);
    }
  }
  return {
    domain: [...branch.constants].sort(),
    positiveFacts: dedupe(positiveFacts),
    negativeFacts: dedupe(negativeFacts),
    equalities:   dedupe(equalities),
    inequalities: dedupe(inequalities),
  };
}

function dedupe(xs: string[]): string[] { return [...new Set(xs)]; }
