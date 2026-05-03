// Modern first-order logic AST. Peano/Russell linear-symbolic style.
//
// Phase 1 covers: predicate atoms with term arguments, equality (=),
// the standard connectives (¬ ∧ ∨ → ↔), and both quantifiers (∀ ∃).
// Function symbols are supported in the term language so that examples
// like `forall x. f(x) = x` parse cleanly. Identity is a first-class
// AST node rather than a binary predicate so the validity checker can
// apply identity rules directly.
//
// Out of phase 1: sorted/many-sorted logic, lambda terms, second-order
// quantification, definite descriptions (Russell's `ι` operator —
// available indirectly via examples).

// ---------- Terms ----------

export type FolTerm =
  | { kind: 'var';  name: string }
  | { kind: 'const'; name: string }
  | { kind: 'fn';   name: string; args: FolTerm[] };

// ---------- Formulas ----------

export type FolFormula =
  | { kind: 'top' }
  | { kind: 'bot' }
  | { kind: 'pred';    name: string; args: FolTerm[] }
  | { kind: 'eq';      left: FolTerm; right: FolTerm }
  | { kind: 'not';     body: FolFormula }
  | { kind: 'and';     left: FolFormula; right: FolFormula }
  | { kind: 'or';      left: FolFormula; right: FolFormula }
  | { kind: 'implies'; left: FolFormula; right: FolFormula }
  | { kind: 'iff';     left: FolFormula; right: FolFormula }
  | { kind: 'forall';  variable: string; body: FolFormula }
  | { kind: 'exists';  variable: string; body: FolFormula };

// ---------- Helpers ----------

// True if the formula contains no quantifiers, no predicate atoms with
// term arguments, and no equality. The propositional fragment is the
// part where truth-table validity is exact and decidable.
export function isPropositional(f: FolFormula): boolean {
  switch (f.kind) {
    case 'top':
    case 'bot':
      return true;
    case 'pred':
      return f.args.length === 0;
    case 'eq':
      return false;
    case 'not':
      return isPropositional(f.body);
    case 'and':
    case 'or':
    case 'implies':
    case 'iff':
      return isPropositional(f.left) && isPropositional(f.right);
    case 'forall':
    case 'exists':
      return false;
  }
}

// Collect the names of free variables in a formula. Used by tests and
// by the renderer when deciding whether a quantifier is vacuous.
export function freeVars(f: FolFormula): Set<string> {
  const out = new Set<string>();
  collect(f, new Set<string>(), out);
  return out;
}

function collect(f: FolFormula, bound: Set<string>, out: Set<string>): void {
  switch (f.kind) {
    case 'top':
    case 'bot':
      return;
    case 'pred':
      for (const t of f.args) termVars(t, bound, out);
      return;
    case 'eq':
      termVars(f.left, bound, out);
      termVars(f.right, bound, out);
      return;
    case 'not':
      collect(f.body, bound, out);
      return;
    case 'and':
    case 'or':
    case 'implies':
    case 'iff':
      collect(f.left, bound, out);
      collect(f.right, bound, out);
      return;
    case 'forall':
    case 'exists': {
      const next = new Set(bound);
      next.add(f.variable);
      collect(f.body, next, out);
      return;
    }
  }
}

function termVars(t: FolTerm, bound: Set<string>, out: Set<string>): void {
  switch (t.kind) {
    case 'var':
      if (!bound.has(t.name)) out.add(t.name);
      return;
    case 'const':
      return;
    case 'fn':
      for (const a of t.args) termVars(a, bound, out);
      return;
  }
}

// Substitute a term for a free variable. Capture-avoiding only in the
// trivial case (the substituted term is closed); the validity checker
// only ever instantiates with fresh constants, so capture cannot arise
// in practice. If a future caller needs full capture-avoidance, this
// is the function to extend.
export function substitute(f: FolFormula, varName: string, replacement: FolTerm): FolFormula {
  switch (f.kind) {
    case 'top':
    case 'bot':
      return f;
    case 'pred':
      return { kind: 'pred', name: f.name, args: f.args.map(t => substTerm(t, varName, replacement)) };
    case 'eq':
      return {
        kind: 'eq',
        left:  substTerm(f.left,  varName, replacement),
        right: substTerm(f.right, varName, replacement),
      };
    case 'not':
      return { kind: 'not', body: substitute(f.body, varName, replacement) };
    case 'and':
    case 'or':
    case 'implies':
    case 'iff':
      return {
        kind: f.kind,
        left:  substitute(f.left,  varName, replacement),
        right: substitute(f.right, varName, replacement),
      };
    case 'forall':
    case 'exists':
      // Don't substitute under a binder for the same variable.
      if (f.variable === varName) return f;
      return { kind: f.kind, variable: f.variable, body: substitute(f.body, varName, replacement) };
  }
}

function substTerm(t: FolTerm, varName: string, replacement: FolTerm): FolTerm {
  switch (t.kind) {
    case 'var':
      return t.name === varName ? replacement : t;
    case 'const':
      return t;
    case 'fn':
      return { kind: 'fn', name: t.name, args: t.args.map(a => substTerm(a, varName, replacement)) };
  }
}
