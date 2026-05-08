// Frege Begriffsschrift (1879) AST.
//
// Phase 1: propositional fragment + universal quantifier (concavity).
// Phase 2 (current): identity-of-content (Part III ≡), existential
// quantifier (Frege drew this as ¬∀¬ but we represent it explicitly so
// the layout pass can render the derived shape in one place), and a
// `sort` field on quantifiers that distinguishes individual variables
// (lowercase) from predicate variables (uppercase) — Frege's
// higher-order quantification.
//
// Out of phase 2: Grundgesetze profile (value-ranges, definite
// description, function abstraction, Basic Law V), inference chains,
// substitution forms, formula numbers, gfnotation export.
//
// Design split per docs/formal-logic/frege-begriffsschrift.md §4:
// the judgment marker is a wrapper outside the content, not just
// another connective inside it. "This content is asserted" is a
// different category from "this content has a certain truth-functional
// shape."
//
// Linear ASCII DSL — see frege-parser.ts for the grammar:
//   |- p                      judgment of an atom
//   |- ~p                     negation
//   |- p -> q                 conditional (antecedent first; rendered with
//                             consequent on TOP per Frege's convention)
//   |- p == q                 identity-of-content (≡), Part III
//   |- all x. F(x)            universal generality (concavity, individual)
//   |- exists x. F(x)         existential generality (drawn as ¬∀¬)
//   |- all F. F(a)            higher-order universal (predicate variable)
//   |- exists F. F(a)         higher-order existential (predicate variable)
//   F(x, y)                   atom with arguments

// ---------- Quantifier sort ----------

// Lowercase bound letter = individual; uppercase bound letter =
// predicate (Frege's "second-level" concept). This is a typographic
// convention that mirrors Frege's own use of Gothic letters for
// individuals and capital Greek for predicate variables.
export type QuantifierSort = 'individual' | 'predicate';

export function inferQuantifierSort(variable: string): QuantifierSort {
  const head = variable[0] ?? '';
  return head === head.toUpperCase() && head !== head.toLowerCase()
    ? 'predicate'
    : 'individual';
}

// ---------- Content ----------

export type FregeContent =
  | { kind: 'atom';   name: string; args: string[] }
  | { kind: 'not';    body: FregeContent }
  | { kind: 'cond';   antecedent: FregeContent; consequent: FregeContent }
  | { kind: 'iden';   left: FregeContent; right: FregeContent }
  | { kind: 'forall'; variable: string; sort: QuantifierSort; body: FregeContent }
  | { kind: 'exists'; variable: string; sort: QuantifierSort; body: FregeContent };

// ---------- Top-level wrapper ----------

export type FregeFormula =
  | { kind: 'judgment'; body: FregeContent }
  | { kind: 'content';  body: FregeContent };

// ---------- Helpers ----------

export function bodyOf(f: FregeFormula): FregeContent {
  return f.body;
}

// Order of a Frege content: propositional (no quantifiers, no
// predicate-variable atoms), first-order (individual-quantified, no
// predicate quantifiers), or higher-order (any predicate-quantified
// quantifier). Used for the order chip in the Lab UI.
export type FregeOrder = 'propositional' | 'first-order' | 'higher-order';

export function orderOf(formula: FregeFormula): FregeOrder {
  let hasIndiv = false;
  let hasPred  = false;
  function walk(c: FregeContent): void {
    switch (c.kind) {
      case 'atom':   return;
      case 'not':    walk(c.body); return;
      case 'cond':   walk(c.antecedent); walk(c.consequent); return;
      case 'iden':   walk(c.left); walk(c.right); return;
      case 'forall':
      case 'exists':
        if (c.sort === 'predicate') hasPred = true;
        else                         hasIndiv = true;
        walk(c.body);
        return;
    }
  }
  walk(formula.body);
  if (hasPred)  return 'higher-order';
  if (hasIndiv) return 'first-order';
  return 'propositional';
}
