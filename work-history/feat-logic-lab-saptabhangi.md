# feat — Logic Lab: Jain Saptabhaṅgī (Syādvāda)

**Branch:** `feat/logic-lab-saptabhangi`
**Merged:** TBD

Implements `.tickets/feat-logic-lab-saptabhangi.md` against the design
doc `docs/formal-logic/saptabhangi.md`. The second of the four
world-logic systems ticketed on 2026-05-20, landing after
`feat/logic-lab-avicennan` and reusing its system shape.

## What changed

- New Logic Lab system at `/logic/saptabhangi`. A standpoint-relative
  predication is classified into one of the seven *bhaṅgas* — the
  seven non-empty subsets of `{asti, nāsti, avaktavya}`.
- Types `saptabhangi-types.ts` — `BasicMode` (asti / nasti /
  avaktavya), `BASIC_MODE_INFO`, the `SEVEN_BHANGAS` constant (subset
  + Sanskrit name + gloss, in the traditional Jain ordering),
  `Standpoint`, `Predication`, and the `modeSetKey` / `formatPredication`
  helpers. `SEVEN_BHANGAS` is to this system what `HETU_CAKRA` is to
  `indian-buddhist`: a constant encoding the closed structure.
- Parser `saptabhangi-parser.ts` — line-based `key: value` in the
  `indian-parser.ts` idiom: `subject:`, `predicate:`, and one
  `standpoint <name>: <mode>` line per *naya*. Mode aliases accepted
  (IAST `nāsti`, English `is` / `inexpressible`, and an optional
  leading `syāt` / `syād` particle). `--` and `#` line comments
  stripped. A predication with no standpoint is a parse error; a
  standpoint name declared twice is a parse error (the design doc's
  open question #2 default).
- Engine `saptabhangi-engine.ts` — `classifyBhanga`: union the modes
  asserted across the standpoints into a non-empty subset; that subset
  *is* the bhaṅga by construction. Total and structural — no proof
  search. Also reports which standpoints contributed each mode.
- UI:
  - `SaptabhangiTable.tsx` — the seven bhaṅgas as a closed table, the
    active bhaṅga's cell highlighted.
  - `SaptabhangiLattice.tsx` — the inclusion lattice of the seven
    subsets (three singletons, three pairs, the triple), edges by the
    covering relation, the active bhaṅga's node ringed.
  - `SaptabhangiEditor.tsx` wraps `LogicCmEditor`;
    `saptabhangi-commands.ts` supplies slash commands for the three
    modes, a sevenfold skeleton, and the seed examples.
  - `labs/SaptabhangiLab.tsx` — header / history / primitives /
    further-reading in the shared shape; editor + classification panel
    with a bhaṅga badge; table and lattice below.
- Seed entry in `data/logic-systems.ts` — 7 examples, one reaching
  each of the seven bhaṅgas: `pot-permanent` (the textbook sevenfold
  predication → bhaṅga 7), `soul-existence` (asti / nāsti from
  different standpoints → bhaṅga 3), and one example each for bhaṅgas
  1, 2, 4, 5, 6. `thinkerSlug: null` — no Jain logician seeded yet.
- Route wiring in `routes/logic.$system.lazy.tsx` — the `saptabhangi`
  slug routes to a lazy-loaded `SaptabhangiLab` chunk.
- Tests: `saptabhangi-parser.test.ts` (16), `saptabhangi-engine.test.ts`
  (10, including the 7-element / 3-3-1 geometry invariant and an
  all-seven-cells-reachable check), `saptabhangi-system-data.test.ts`
  (6).

## Why

`world-logic-traditions.md` §3 picks saptabhaṅgī as the historical,
non-Western instance of the roadmap's many-valued logic item: a
genuine many-valued logic with a fixed, closed, enumerable seven-value
space. It also introduces an idea no other Lab system carries —
predication **relativized to a standpoint** (*naya*) — without leaving
the algebraic/tabular visualization family. See
`docs/formal-logic/saptabhangi.md` for the full rationale. No GitHub
Issue was opened.

## Notes for future work

- **Deviation from the design doc:** the doc proposed an optional
  `predication?` field on `LogicExample` (additive like Kripke's
  `model?`). It was *not* added — following the identical call in
  `feat-logic-lab-avicennan.md`: unlike a Kripke model, a `Predication`
  is fully derivable by parsing `ex.dsl`, so the field would be
  redundant. `saptabhangi-system-data.test.ts` keys the expected
  bhaṅga by example slug instead, per the `indian-system-data.test.ts`
  precedent. `LogicExample` is untouched.
- **The lattice reuses the Hasse *idiom*, not the component.**
  `HasseDiagram.tsx` is typed against `HasseData`, which is specific to
  Boolean valuations (bitstrings, Hamming weight, a truth set).
  `SaptabhangiLattice` is a self-contained SVG that follows the same
  layered-Hasse visual idiom — nodes by subset size, covering edges,
  the active node ringed. The design doc and ticket both say "reuse
  the `HasseDiagram` idiom"; literal component reuse would have meant
  contorting `HasseData` to carry mode-sets, which is not worth it for
  a fixed 7-node figure.
- **`avaktavya` is a third primitive — a phase-1 commitment.** The
  seven bhaṅgas are the seven non-empty subsets of a 3-set (Ganeri's
  reconstruction). The rival reading treats `avaktavya` as the
  *simultaneous* joint assertion of `asti` and `nāsti`; both yield
  seven, but they differ on truth-functionality (Priest 2008). The
  History section says so; the question is flagged, not adjudicated.
- **Standpoint names are opaque free text.** The design doc's §"Out of
  scope" treats a standpoint as an opaque label, so no standpoint-name
  aliasing (`dravya ↔ substance`) was implemented despite the doc's
  §"DSL grammar" mentioning it in passing — aliasing an opaque label
  is self-contradictory. Only the *mode* tokens are aliased. The full
  *naya* doctrine (the sevenfold standpoint theory itself) is phase 2.
- **Phase 2 scope**, per the design doc: compound-statement evaluation
  (negation / conjunction / disjunction over the seven values) — best
  built alongside `feat/logic-lab-many-valued` so the *n*-valued
  truth-table substrate is shared once; the *naya* theory; interactive
  standpoint editing; and a compare view against the many-valued
  system.
- Verified via `tsc --noEmit`, the full web test suite (1133
  passing), and a production build. Not exercised interactively in a
  browser.
