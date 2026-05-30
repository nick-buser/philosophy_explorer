import NaturalDeduction.Formula

-- Γ, φ, ψ, χ are bound automatically as implicit arguments of each
-- constructor — this file is all dependently-typed judgment shapes.
set_option autoImplicit true

/-- Which inference rules are in scope. `raa` (classical reductio) is
well-typed only under `classical`; every other rule is shared. Mirrors the
Lab's classical / intuitionistic toggle. -/
inductive RuleSet where
  | intuitionistic
  | classical
deriving DecidableEq, Repr

/-- A natural-deduction derivation of `φ` from context `Γ` under rule set
`rs`. One constructor per `nd-types.ts` `Rule`; `premise` covers both the
`premise` and `assumption` rules, since each is a lookup into `Γ` (a
discharging rule extends `Γ`, so an assumption is its head).

A well-typed `Deriv rs Γ φ` term *is* a proof of `φ` from `Γ` in the
embedded calculus — Lean's kernel checking the term *is* the verification.
The system is verified as itself, not reinterpreted into Lean's logic. -/
inductive Deriv (rs : RuleSet) : List NDFormula → NDFormula → Type where
  | premise : φ ∈ Γ → Deriv rs Γ φ
  | reit    : Deriv rs Γ φ → Deriv rs (ψ :: Γ) φ
  | andI    : Deriv rs Γ φ → Deriv rs Γ ψ → Deriv rs Γ (NDFormula.and φ ψ)
  | andEL   : Deriv rs Γ (NDFormula.and φ ψ) → Deriv rs Γ φ
  | andER   : Deriv rs Γ (NDFormula.and φ ψ) → Deriv rs Γ ψ
  | orIL    : Deriv rs Γ φ → Deriv rs Γ (NDFormula.or φ ψ)
  | orIR    : Deriv rs Γ ψ → Deriv rs Γ (NDFormula.or φ ψ)
  | orE     : Deriv rs Γ (NDFormula.or φ ψ) → Deriv rs (φ :: Γ) χ
              → Deriv rs (ψ :: Γ) χ → Deriv rs Γ χ
  | impI    : Deriv rs (φ :: Γ) ψ → Deriv rs Γ (NDFormula.imp φ ψ)
  | impE    : Deriv rs Γ (NDFormula.imp φ ψ) → Deriv rs Γ φ → Deriv rs Γ ψ
  | iffI    : Deriv rs (φ :: Γ) ψ → Deriv rs (ψ :: Γ) φ
              → Deriv rs Γ (NDFormula.iff φ ψ)
  | iffEL   : Deriv rs Γ (NDFormula.iff φ ψ) → Deriv rs Γ φ → Deriv rs Γ ψ
  | iffER   : Deriv rs Γ (NDFormula.iff φ ψ) → Deriv rs Γ ψ → Deriv rs Γ φ
  | notI    : Deriv rs (φ :: Γ) NDFormula.bot → Deriv rs Γ (NDFormula.neg φ)
  | notE    : Deriv rs Γ (NDFormula.neg φ) → Deriv rs Γ φ → Deriv rs Γ NDFormula.bot
  | botE    : Deriv rs Γ NDFormula.bot → Deriv rs Γ φ
  | raa     : Deriv rs (NDFormula.neg φ :: Γ) NDFormula.bot
              → rs = RuleSet.classical → Deriv rs Γ φ
