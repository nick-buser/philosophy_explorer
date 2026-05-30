import NaturalDeduction.Deriv

/-! Reference derivations. Each is written in the `let`-per-line style the
`FitchProof → Deriv` emitter produces: every line carries an explicit
`Deriv rs Γ φ` type, so the context indices stay concrete and `by decide`
can discharge the `∈` lookups. (A single nested term instead leaves the
indices of elimination rules as metavariables, which `decide` cannot read.)
Constructors not shown here are exercised by the M1 integration tests
against the `nd-prover` corpus. -/

-- premise, impI:  ⊢ p → p
example : Deriv RuleSet.intuitionistic [] (.imp (.atom "p") (.atom "p")) :=
  let l1 : Deriv RuleSet.intuitionistic [.atom "p"] (.atom "p") :=
    .premise (by decide)
  .impI l1

-- premise, andEL, andER, andI:  p ∧ q ⊢ q ∧ p
example :
    Deriv RuleSet.intuitionistic
      [.and (.atom "p") (.atom "q")] (.and (.atom "q") (.atom "p")) :=
  let l1 : Deriv RuleSet.intuitionistic
      [.and (.atom "p") (.atom "q")] (.and (.atom "p") (.atom "q")) :=
    .premise (by decide)
  let l2 : Deriv RuleSet.intuitionistic
      [.and (.atom "p") (.atom "q")] (.atom "p") := .andEL l1
  let l3 : Deriv RuleSet.intuitionistic
      [.and (.atom "p") (.atom "q")] (.atom "q") := .andER l1
  .andI l3 l2

-- premise, notE, raa, impI — a classical proof:  ⊢ ¬¬p → p
example : Deriv RuleSet.classical []
    (.imp (.neg (.neg (.atom "p"))) (.atom "p")) :=
  let l1 : Deriv RuleSet.classical
      [.neg (.atom "p"), .neg (.neg (.atom "p"))] (.neg (.neg (.atom "p"))) :=
    .premise (by decide)
  let l2 : Deriv RuleSet.classical
      [.neg (.atom "p"), .neg (.neg (.atom "p"))] (.neg (.atom "p")) :=
    .premise (by decide)
  let l3 : Deriv RuleSet.classical
      [.neg (.atom "p"), .neg (.neg (.atom "p"))] .bot := .notE l1 l2
  let l4 : Deriv RuleSet.classical [.neg (.neg (.atom "p"))] (.atom "p") :=
    .raa l3 rfl
  .impI l4
