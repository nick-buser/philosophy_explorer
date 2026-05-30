/-- Propositional natural-deduction formulas — the deep-embedding syntax.

Mirrors the propositional fragment of `fol-types.ts` `FolFormula`: `atom`
stands for a nullary predicate (a propositional variable); `top`/`bot` are
the constants; the rest are the connectives. First-order constructs
(equality, quantifiers, predicates over terms) are out of scope — see the
Milestone 1 ticket. -/
inductive NDFormula where
  | atom : String → NDFormula
  | top  : NDFormula
  | bot  : NDFormula
  | neg  : NDFormula → NDFormula
  | and  : NDFormula → NDFormula → NDFormula
  | or   : NDFormula → NDFormula → NDFormula
  | imp  : NDFormula → NDFormula → NDFormula
  | iff  : NDFormula → NDFormula → NDFormula
deriving DecidableEq, Repr
