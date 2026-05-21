# feat: Logic Lab Saptabhaṅgī — Jain sevenfold predication, standpoint engine, inclusion-lattice view

**Branch slug:** `feat/logic-lab-saptabhangi`
**Status:** queued
**Size:** S–M
**Depends on:** `feat/logic-lab-many-valued` (soft — see Build sketch)

## Why

The Jain doctrine of *syādvāda* gives logic a closed, enumerable
many-valued structure: from three basic modes of predication —
*asti* (is), *nāsti* (is not), *avaktavya* (jointly both, hence
inexpressible) — exactly **seven** *bhaṅgas* are generated, one per
non-empty combination, each prefixed by *syāt* ("in some respect").
`world-logic-traditions.md` §3 picks it as the historical, non-Western
instance of the roadmap's many-valued logic item: a genuine
many-valued logic with a fixed seven-element value space that renders
cleanly as a table or an inclusion lattice. It also adds an idea no
Lab system carries — predication **relativized to a standpoint**
(*naya*) — without leaving the algebraic/tabular visualization family.

## Scope

**In:**

- New Logic Lab system at `/logic/saptabhangi`.
- The seven *bhaṅgas* as a closed structure: each is one non-empty
  subset of `{asti, nāsti, avaktavya}`, with Sanskrit name and gloss.
- DSL: a `subject` / `predicate` plus one `standpoint <name>: asti |
  nasti | avaktavya` line per *naya*. IAST aliases accepted.
- Engine: `classifyBhanga` — aggregate the standpoint verdicts into
  the set of basic modes present; that non-empty subset *is* the
  bhaṅga (1–7). Total, structural — no proof search.
- Renderers: a **seven-cell table** (active bhaṅga highlighted) and an
  **inclusion lattice** of the seven subsets, reusing the
  `HasseDiagram` idiom from the Boolean-algebra system.
- 6–8 seed examples — at minimum one reaching each of the seven cells
  (the classic *pot: permanent* predication across substance / modal
  standpoints covers several).

**Out (captured separately):**

- Compound-statement evaluation (negation / conjunction over the
  seven values) — phase 2; this is where the shared *n*-valued
  truth-table substrate lands, see `docs/formal-logic/saptabhangi.md`.
- The full *naya* theory (the sevenfold standpoint doctrine itself) —
  out; phase 1 treats a standpoint as an opaque label.
- Lean integration; compare view — cross-cutting / pollinator.

## Build sketch

- `saptabhangi-types.ts` — `BasicMode` (`asti | nasti | avaktavya`),
  the `SEVEN_BHANGAS` constant (subset + Sanskrit + gloss),
  `Predication` (subject, predicate, `standpoints: { name; mode }[]`).
- `saptabhangi-parser.ts` — line-based `key: value`, IAST aliases, in
  the `indian-parser.ts` idiom.
- `saptabhangi-engine.ts` — `classifyBhanga`: union the standpoint
  modes → look up the matching bhaṅga.
- `SaptabhangiTable.tsx`; `SaptabhangiLattice.tsx` (reuse
  `HasseDiagram`); `SaptabhangiEditor.tsx`; `saptabhangi-commands.ts`;
  `labs/SaptabhangiLab.tsx`; route + `logic-systems.ts` entry.
- Tests: `saptabhangi-parser.test.ts`, `saptabhangi-engine.test.ts`
  (all seven cells reachable; the 7-element structure invariant),
  `saptabhangi-system-data.test.ts`.
- **Soft dependency:** phase 1 ships standalone — the seven-bhaṅga
  structure and standpoint aggregation need no truth-table machinery.
  The phase-2 compound evaluator is best built *with*
  `feat/logic-lab-many-valued` so the *n*-valued substrate is shared
  once, per `world-logic-traditions.md` §"Suggested sequencing".

## References

- Design doc: `docs/formal-logic/saptabhangi.md`.
- `docs/formal-logic/world-logic-traditions.md` §3.
- `docs/formal-logic/lab-roadmap.md` §"Many-valued logic".
- J. Ganeri, "Jaina Logic and the Philosophical Basis of Pluralism"
  (*History and Philosophy of Logic*, 2002).
- G. Priest, "Jaina Logic: A Contemporary Perspective" (2008) — the
  truth-functionality debate to surface honestly in the doc.
- B.K. Matilal, *The Central Philosophy of Jainism (Anekānta-vāda)*.
