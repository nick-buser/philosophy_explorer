// Existential-graph AST. Covers both alpha (propositional) and beta
// (first-order with identity).
//
// Short-form DSL (Peirce's own visual conventions, transcribed in ASCII):
//
//   juxtaposition (space) ........... conjunction
//   parentheses "(...)"  ............ cut (negation)
//   empty cut "()" .................. absurdity / false
//   implication "(A (B))" ........... Peirce's scroll: A implies B
//
// Beta extensions:
//
//   P                ............. 0-ary atom (alpha — unchanged)
//   P(x)             ............. 1-ary predicate; x is a line of identity
//   R(x,y)           ............. 2-ary predicate
//   x = y            ............. identity (joins two lines)
//
// A "line of identity" is named by a hook identifier. Its scope is the
// outermost area (sheet or cut) in which the name appears anywhere — the
// translation pass binds the line by ∃ at that area.

export type EgHook = string;            // line-of-identity name

export type EgNode =
  | { kind: 'sheet'; children: EgNode[] }                       // top-level sheet
  | { kind: 'cut';   children: EgNode[] }                       // negation context
  | { kind: 'atom';  name: string; hooks: EgHook[] }            // 0-ary or n-ary predicate
  | { kind: 'eq';    left: EgHook; right: EgHook };             // identity assertion

export function isSheet(n: EgNode): n is Extract<EgNode, { kind: 'sheet' }> {
  return n.kind === 'sheet';
}

// Walk the tree and return every hook identifier referenced anywhere.
export function collectHooks(n: EgNode): EgHook[] {
  const out: EgHook[] = [];
  walk(n, out);
  return out;
}

function walk(n: EgNode, out: EgHook[]): void {
  if (n.kind === 'atom') {
    for (const h of n.hooks) out.push(h);
    return;
  }
  if (n.kind === 'eq') {
    out.push(n.left);
    out.push(n.right);
    return;
  }
  for (const c of n.children) walk(c, out);
}

// True if the graph uses any beta features (any hook anywhere, or any
// identity assertion). Used by the renderer to decide whether to draw
// lines of identity.
export function isBeta(n: EgNode): boolean {
  if (n.kind === 'atom') return n.hooks.length > 0;
  if (n.kind === 'eq') return true;
  return n.children.some(isBeta);
}
