# feat: Logic Lab Description Logic — SROIQ / OWL 2 DL features

**Branch slug:** `feat/logic-lab-dl-sroiq`
**Status:** queued
**Size:** M
**Depends on:** `feat/logic-lab-dl-shiq`

## Why

SROIQ is the description logic underlying OWL 2 DL — the version
of OWL most "real" ontologies (medical, geospatial, e-commerce
schemas) actually target. Without these features the Lab can claim
"description logic" but not "OWL 2 DL". SHIQ + SROIQ together get
us there.

## Scope

**In:**
- Nominals `{a}` — singleton concepts naming a specific individual
  (the `O` in SHOIQ / SROIQ).
- Self-restriction `∃R.Self` — the loner-reflexive operator
  (`Narcissist ≡ ∃loves.Self`).
- Role chains `R ∘ S ⊑ T` — generalized role inclusions
  (e.g. `hasParent ∘ hasParent ⊑ hasGrandparent`).
- Role properties: disjoint roles `Disjoint(R, S)`, asymmetry
  `Asym(R)`, irreflexivity `Irref(R)`, reflexivity `Ref(R)`.
- Tableau: nominal-rule (treat `{a}` as forced equality with `a`),
  Self-rule, RBox preprocessing for role chains via finite-state
  automata over composed roles.
- Regularity check on the RBox (SROIQ requires the role
  inclusion hierarchy to be regular for decidability).
- ~5 new examples — narcissist, grandparent-chain, disjoint
  role-pair illustration.

**Out (captured separately):**
- Datatype properties → `feat-logic-lab-dl-datatypes.md`.
- Real-ontology import → `feat-logic-lab-dl-owl-import.md`.

## Build sketch

- AST: add `Nominal`, `Self`, role-chain axioms, role-property
  declarations.
- Parser: `{a}` for nominals; `Self` keyword in concept position;
  `R ∘ S ⊑ T` for chains.
- Tableau:
  - Nominal expansion = equality on the named individual.
  - Self-rule = self-loop on the role edge in the completion graph.
  - Role chains preprocessed into a NFA per axiom, applied during
    `∀R.C` propagation.
- RBox regularity check (Horrocks et al. 2006).
- Reasoner: classification needs to handle the RBox's
  consequence-closure; instance retrieval pays attention to
  nominals (a nominal-bearing concept's extension is computable).

## References

- Horrocks, Kutz, Sattler, *The Even More Irresistible SROIQ*
  (KR 2006) — the SROIQ paper.
- W3C OWL 2 Direct Semantics (the SROIQ-based normative
  semantics, https://www.w3.org/TR/owl2-direct-semantics/).
