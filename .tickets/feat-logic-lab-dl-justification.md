# feat: Logic Lab Description Logic — Justification / explanation

**Branch slug:** `feat/logic-lab-dl-justification`
**Status:** queued
**Size:** S
**Depends on:** `feat/logic-lab-description-logic` (ALC base)

## Why

The biggest day-to-day problem ontology engineers have is *why*:
"why does my reasoner say `Pizza ⊑ Vegetarian`?" Without
justifications, debugging a 200-axiom ontology means staring at the
axiom list and guessing. Justifications turn a verdict into a
walkthrough — "these three axioms together force this subsumption".
Pedagogically high-payoff per LOC.

## Scope

**In:**
- **Justification computation.** A *justification* for an entailed
  axiom `α` is a minimal subset `J ⊆ KB` such that `J ⊨ α`.
  Implementation: black-box approach using the reasoner from the
  base ticket — Reiter's hitting-set algorithm over single
  justification finds via pinpointing (Schlobach & Cornet 2003,
  Kalyanpur et al. 2007). All-justifications enumeration is
  optional v2.
- **Diff-style display.** Show the input KB with justifying
  axioms highlighted; click an entailment in the classification
  hierarchy to see its justification(s).
- **All-justifications panel.** When v2 is enabled, list all
  minimal justifications side by side (typical entailments have
  1–5; pathological cases can have hundreds — cap at 20 for the UI).
- Hooks for the existing classification view: every entailment
  shown there gets a "why?" affordance.

**Out (captured separately):**
- **Glass-box justification.** Mining the tableau proof itself
  for the contributing axioms is faster than black-box pinpointing
  but couples justification to the specific tableau implementation.
  Defer until the base reasoner stabilises.
- **Repair suggestions.** Given a justification for an unwanted
  entailment, suggest minimal axiom edits that break it. Whole
  separate research area; out of scope.

## Build sketch

- `dl-justification.ts`:
  - `findOneJustification(kb, α)` — single-pass minimization via
    sliding-window axiom drop.
  - `findAllJustifications(kb, α)` — Reiter hitting-set tree over
    single justifications.
- Lab UI: a popover on each classification hierarchy edge / each
  ABox instance-of badge, showing the top-1 justification with a
  "show all" expander.

## References

- Schlobach & Cornet, *Non-Standard Reasoning Services for the
  Debugging of Description Logic Terminologies* (IJCAI 2003).
- Kalyanpur, Parsia, Horridge, Sirin, *Finding All Justifications
  of OWL DL Entailments* (ISWC 2007).
- Horridge, *Justification Based Explanation in Ontologies*
  (PhD thesis, University of Manchester, 2011).
