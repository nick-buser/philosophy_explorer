# feat: Logic Lab Description Logic — EL / OWL 2 EL profile

**Branch slug:** `feat/logic-lab-dl-el-profile`
**Status:** queued
**Size:** S–M
**Depends on:** `feat/logic-lab-description-logic` (ALC base; the EL
profile shares the AST but uses a different reasoner)

## Why

EL is the polynomial-time fragment of description logic and the
substrate of OWL 2 EL. SNOMED CT — the world's largest formal
medical ontology, ~350 000 concepts — is written in EL precisely
because tableau-based reasoning doesn't scale to that size but the
EL consequence-based algorithm does. Adding the EL profile to the
Lab lets us demonstrate why ontology engineers split into "ALC
people" (small expressive ontologies) and "EL people" (huge
ontologies that still classify in seconds).

## Scope

**In:**
- **EL syntax restriction.** Concepts limited to: `⊤`, `A`, `C ⊓ D`,
  `∃R.C`. No `¬`, `⊔`, `∀R.C`, no nominals. The Lab needs a flag
  to enforce this at parse time so users see "this is not EL"
  messages early.
- **EL+ extensions.** The ELH+ / EL++ extensions used by OWL 2 EL:
  role hierarchies, role chains, transitivity, role-domain /
  range axioms, reflexivity. (Datatypes from
  `feat-logic-lab-dl-datatypes.md` if shipped.)
- **Consequence-based reasoner.** The Baader/Brandt/Lutz CEL
  algorithm: classify by saturating a set of *completion rules*
  over the normalised TBox. Polynomial in the size of the TBox.
- **Output**: the same concept-hierarchy DAG the ALC ticket
  produces, but built bottom-up by the consequence-based
  saturation rather than pairwise tableau calls.
- ~3 examples — a hand-authored mini-SNOMED fragment (anatomy +
  diseases), a role-chain example, and an "EL doesn't admit ¬"
  failure case showing the surfaced error.

**Out (captured separately):**
- **Full SNOMED CT import.** Needs the OWL-import ticket
  (`feat-logic-lab-dl-owl-import.md`) and a streaming parser; the
  EL reasoner itself can handle SNOMED-scale TBoxes but the
  importer must not load 350 000 axioms into a single React
  render.
- **EL + datatypes.** When `feat-logic-lab-dl-datatypes.md` lands,
  cross-pollinate; not a blocker.

## Build sketch

- `dl-el-normalize.ts` — normal-form preprocessing (CR0–CR3 from
  Baader/Brandt/Lutz 2005): every axiom rewritten to one of
  `A ⊑ B`, `A₁ ⊓ A₂ ⊑ B`, `A ⊑ ∃r.B`, `∃r.A ⊑ B`.
- `dl-el-reasoner.ts` — fixed-point saturation of completion rules
  over `S(A)` (subsumers of `A`) and `R(A, B)` (witnessed roles).
- `dl-profile-check.ts` — given a KB, classify it as falling in
  EL / SHIQ / SROIQ / SROIQ(D); used by the Lab to suggest "this
  KB is in EL — try the EL reasoner for ~10× speedup".
- Lab UI: a profile-detector chip on the KB header; an
  "EL reasoner" toggle when the KB is EL-eligible.

## References

- Baader, Brandt, Lutz, *Pushing the EL Envelope* (IJCAI 2005) —
  the foundational paper.
- Suntisrivaraporn, *Polynomial-Time Reasoning Support for
  Design and Maintenance of Large-Scale Biomedical Ontologies*
  (PhD thesis, TU Dresden, 2009) — practical CEL implementation.
- W3C OWL 2 EL profile —
  https://www.w3.org/TR/owl2-profiles/#OWL_2_EL.
