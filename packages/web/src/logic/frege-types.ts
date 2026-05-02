// Frege Begriffsschrift (1879) AST.
//
// Phase 1: propositional fragment + universal quantifier (concavity).
// Out of phase 1: identity-of-content (Part III ≡), inference chains,
// substitution forms, formula numbers, Grundgesetze profile.
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
//   |- all x. F(x)            universal quantification (concavity + Gothic letter)
//   F(x, y)                   atom with arguments

// ---------- Content ----------

export type FregeContent =
  | { kind: 'atom';   name: string; args: string[] }
  | { kind: 'not';    body: FregeContent }
  | { kind: 'cond';   antecedent: FregeContent; consequent: FregeContent }
  | { kind: 'forall'; variable: string; body: FregeContent };

// ---------- Top-level wrapper ----------

export type FregeFormula =
  | { kind: 'judgment'; body: FregeContent }
  | { kind: 'content';  body: FregeContent };

// ---------- Helpers ----------

export function bodyOf(f: FregeFormula): FregeContent {
  return f.body;
}