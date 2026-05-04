// Boolean-algebra AST. Pure propositional — variables range over {0, 1}
// and there are no quantifiers, terms, or predicates with arguments.
// Kept structurally close to the propositional fragment of FolFormula so
// the K-map / Hasse / truth-table views can reuse the FOL truth-table
// builder by translating a Boolean AST into the equivalent FolFormula.

export type BoolFormula =
  | { kind: 'zero' }
  | { kind: 'one' }
  | { kind: 'var'; name: string }
  | { kind: 'not'; body: BoolFormula }
  | { kind: 'and'; left: BoolFormula; right: BoolFormula }
  | { kind: 'or';  left: BoolFormula; right: BoolFormula }
  | { kind: 'xor'; left: BoolFormula; right: BoolFormula }
  | { kind: 'imp'; left: BoolFormula; right: BoolFormula }
  | { kind: 'iff'; left: BoolFormula; right: BoolFormula };

// Variables in canonical (sorted) order. Used to label K-map axes,
// Hasse-cube coordinates, and truth-table columns.
export function collectVariables(f: BoolFormula): string[] {
  const set = new Set<string>();
  walk(f);
  return [...set].sort();
  function walk(g: BoolFormula): void {
    switch (g.kind) {
      case 'zero': case 'one': return;
      case 'var': set.add(g.name); return;
      case 'not': walk(g.body); return;
      case 'and': case 'or': case 'xor': case 'imp': case 'iff':
        walk(g.left); walk(g.right); return;
    }
  }
}

// Pure evaluator. Atom values come from the env; missing atoms default
// to false so the Lab tolerates editor mid-types.
export function evalBool(f: BoolFormula, env: Record<string, boolean>): boolean {
  switch (f.kind) {
    case 'zero': return false;
    case 'one':  return true;
    case 'var':  return env[f.name] ?? false;
    case 'not':  return !evalBool(f.body, env);
    case 'and':  return evalBool(f.left, env) && evalBool(f.right, env);
    case 'or':   return evalBool(f.left, env) || evalBool(f.right, env);
    case 'xor':  return evalBool(f.left, env) !== evalBool(f.right, env);
    case 'imp':  return !evalBool(f.left, env) || evalBool(f.right, env);
    case 'iff':  return evalBool(f.left, env) === evalBool(f.right, env);
  }
}

// Structural equality up to associativity and commutativity is *not*
// implemented here — the simplifier handles canonical forms. This is
// strict shape equality, used by simplification rules to detect
// fixed points.
export function structuralEq(a: BoolFormula, b: BoolFormula): boolean {
  if (a.kind !== b.kind) return false;
  switch (a.kind) {
    case 'zero': case 'one': return true;
    case 'var': return a.name === (b as typeof a).name;
    case 'not': return structuralEq(a.body, (b as typeof a).body);
    case 'and': case 'or': case 'xor': case 'imp': case 'iff': {
      const bb = b as typeof a;
      return structuralEq(a.left, bb.left) && structuralEq(a.right, bb.right);
    }
  }
}

// Bind tightly — only used for tests and for the simplifier's argument
// deduplication. Order is irrelevant; output is a sorted unicode-ish
// signature that's stable per AST shape.
export function canonicalKey(f: BoolFormula): string {
  switch (f.kind) {
    case 'zero': return '0';
    case 'one':  return '1';
    case 'var':  return f.name;
    case 'not':  return `~${canonicalKey(f.body)}`;
    case 'and':  return `(${canonicalKey(f.left)}·${canonicalKey(f.right)})`;
    case 'or':   return `(${canonicalKey(f.left)}+${canonicalKey(f.right)})`;
    case 'xor':  return `(${canonicalKey(f.left)}^${canonicalKey(f.right)})`;
    case 'imp':  return `(${canonicalKey(f.left)}→${canonicalKey(f.right)})`;
    case 'iff':  return `(${canonicalKey(f.left)}↔${canonicalKey(f.right)})`;
  }
}