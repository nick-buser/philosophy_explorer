import type { EgHook, EgNode } from './eg-ast';
import type { FolFormula, FolTerm } from './fol-types';

// Translate an existential graph (alpha+beta) to a first-order formula.
//
// The semantics, following Shin (2002) §4.1 and Roberts (1973) §4:
//
//   sheet            ⇒ conjunction of children, with ∃-binders inserted
//                       for every line of identity whose outermost
//                       reference area is the sheet
//   cut              ⇒ negation of the (recursively translated) inner
//                       area, again with ∃-binders inserted for lines
//                       whose outermost reference area is *this* cut
//   atom (predicate) ⇒ Pred(x₁, …, xₙ); each hook becomes a variable
//                       reference to its line of identity
//   identity (=)     ⇒ x = y
//
// Binder placement is the LCA of the cut-tree areas in which the line
// is referenced. A line that appears anywhere on the sheet is bound by
// an outermost ∃; a line confined to a single cut is bound *inside*
// that cut, which under negation becomes ∀ in the equivalent linear
// form (`(P(x))` ⇒ ¬∃x.P(x) ≡ ∀x.¬P(x)).

type Area = {
  kind: 'sheet' | 'cut';
  node: Extract<EgNode, { kind: 'sheet' | 'cut' }>;
  parent: Area | null;
  depth: number;
};

export function egToFol(tree: EgNode): FolFormula {
  if (tree.kind !== 'sheet') {
    // The parser always produces a sheet at the top, so this branch is
    // defensive only.
    return { kind: 'top' };
  }

  const refs = new Map<EgHook, Area[]>();         // name → areas that mention it
  const areaOfCutNode = new Map<EgNode, Area>();  // node → its area record

  const sheet: Area = { kind: 'sheet', node: tree, parent: null, depth: 0 };
  areaOfCutNode.set(tree, sheet);
  visit(tree, sheet, refs, areaOfCutNode);

  // LCA per line of identity, then group by binder area.
  const bindersAt = new Map<Area, string[]>();
  for (const [name, areas] of refs) {
    const lca = lcaOfAreas(areas);
    if (!bindersAt.has(lca)) bindersAt.set(lca, []);
    bindersAt.get(lca)!.push(name);
  }
  for (const arr of bindersAt.values()) arr.sort();

  return translateArea(sheet, bindersAt, areaOfCutNode);
}

// ── Pass 1: build area tree and reference index. ─────────────────────

function visit(
  node: EgNode,
  area: Area,
  refs: Map<EgHook, Area[]>,
  areaOfCutNode: Map<EgNode, Area>,
): void {
  if (node.kind === 'atom') {
    for (const h of node.hooks) addRef(refs, h, area);
    return;
  }
  if (node.kind === 'eq') {
    addRef(refs, node.left, area);
    addRef(refs, node.right, area);
    return;
  }
  if (node.kind === 'cut') {
    const child: Area = { kind: 'cut', node, parent: area, depth: area.depth + 1 };
    areaOfCutNode.set(node, child);
    for (const c of node.children) visit(c, child, refs, areaOfCutNode);
    return;
  }
  // sheet — only valid at the top, handled by the caller; but if a
  // nested sheet ever appears, walk it as if transparent.
  for (const c of node.children) visit(c, area, refs, areaOfCutNode);
}

function addRef(refs: Map<EgHook, Area[]>, name: EgHook, area: Area): void {
  if (!refs.has(name)) refs.set(name, []);
  refs.get(name)!.push(area);
}

// ── LCA in the cut-tree. ─────────────────────────────────────────────

function lcaOfAreas(areas: Area[]): Area {
  let cursors = areas.slice();
  // Equalise depths.
  const minDepth = Math.min(...cursors.map(a => a.depth));
  cursors = cursors.map(a => climbTo(a, minDepth));
  // Walk up jointly until everyone matches.
  while (!allSame(cursors)) {
    cursors = cursors.map(a => a.parent!);
  }
  return cursors[0];
}

function climbTo(a: Area, depth: number): Area {
  let cur = a;
  while (cur.depth > depth) cur = cur.parent!;
  return cur;
}

function allSame(areas: Area[]): boolean {
  for (let i = 1; i < areas.length; i++) {
    if (areas[i] !== areas[0]) return false;
  }
  return true;
}

// ── Pass 2: build the FOL formula. ───────────────────────────────────

function translateArea(
  area: Area,
  bindersAt: Map<Area, string[]>,
  areaOfCutNode: Map<EgNode, Area>,
): FolFormula {
  const childForms: FolFormula[] = [];
  for (const c of area.node.children) {
    childForms.push(translateChild(c, bindersAt, areaOfCutNode));
  }
  let body = conjoinAll(childForms);
  const binders = bindersAt.get(area);
  if (binders) {
    // Innermost binder closest to the body — reverse so the final list
    // reads ∃x.∃y.… in declaration order.
    for (let i = binders.length - 1; i >= 0; i--) {
      body = { kind: 'exists', variable: binders[i], body };
    }
  }
  if (area.kind === 'cut') body = { kind: 'not', body };
  return body;
}

function translateChild(
  node: EgNode,
  bindersAt: Map<Area, string[]>,
  areaOfCutNode: Map<EgNode, Area>,
): FolFormula {
  if (node.kind === 'atom') return atomToFol(node);
  if (node.kind === 'eq') {
    return {
      kind: 'eq',
      left:  varTerm(node.left),
      right: varTerm(node.right),
    };
  }
  if (node.kind === 'cut') {
    const area = areaOfCutNode.get(node)!;
    return translateArea(area, bindersAt, areaOfCutNode);
  }
  // Defensive — sheet should only appear at top level.
  return { kind: 'top' };
}

function atomToFol(node: Extract<EgNode, { kind: 'atom' }>): FolFormula {
  const args: FolTerm[] = node.hooks.map(varTerm);
  return { kind: 'pred', name: node.name, args };
}

function varTerm(name: string): FolTerm {
  return { kind: 'var', name };
}

function conjoinAll(forms: FolFormula[]): FolFormula {
  if (forms.length === 0) return { kind: 'top' };
  let acc = forms[0];
  for (let i = 1; i < forms.length; i++) {
    acc = { kind: 'and', left: acc, right: forms[i] };
  }
  return acc;
}
