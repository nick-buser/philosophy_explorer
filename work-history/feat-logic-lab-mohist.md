# feat — Logic Lab: Mohist Disputation (Móu / Parallel Inference)

**Branch:** `feat/logic-lab-mohist`
**Merged:** TBD

Implements `.tickets/feat-logic-lab-mohist.md` against the design doc
`docs/formal-logic/mohist.md`. The fourth and final world-logic system,
landing after `feat/logic-lab-catuskoti` and reusing its system shape.
Mohist disputation was the last un-ticketed candidate in
`docs/formal-logic/world-logic-traditions.md` (§4); its ticket and
design doc were written as the opening commit of this branch, in the
same pattern as Catuṣkoṭi.

## What changed

- New Logic Lab system at `/logic/mohist`. A *móu* argument is an
  accepted base pair `X | Y` ("X is Y" — the 是), an `operator`
  applied uniformly to both terms, and a declared *Xiao Qu* outcome:
  one of 是而然 / 是而不然 / 一周而一不周 / 一是而一非.
- Types `mohist-types.ts` — `MouCategory`, the `FOUR_CATEGORIES`
  constant (each category with Chinese, pinyin, English, whether it
  `transfers`, its failure `flag`, gloss, and a canonical *Xiao Qu*
  example), `MouFlag` (`opacity | scope | sortal`), `FLAG_OUTCOME` /
  `outcomeForFlag`, `MouArgument`, and the `applyOperator` /
  `formatArgument` helpers. `FOUR_CATEGORIES` is to this system what
  `FOUR_KOTIS` is to catuṣkoṭi: a constant encoding the closed
  structure.
- Parser `mohist-parser.ts` — line-based `key: value` in the
  `catuskoti-parser.ts` idiom: `base:` (split on a single `|`),
  `operator:`, `outcome:`, optional `flag:`, optional `gloss:`.
  Outcome aliases (Chinese names, short forms, `1`–`4`) and flag
  aliases accepted. `--` / `#` comments stripped. Duplicate lines,
  unknown keys/values, and a malformed `base:` (no bar / two bars /
  empty term) are parse errors.
- Engine `mohist-engine.ts` — `evaluateMou`: total and structural.
  - **Form-check:** the móu schema is well-formed iff the operator is
    non-empty and the two base terms are non-empty and distinct.
  - **Cross-check:** the declared `outcome` is compared against the
    outcome the declared `flag` implies (`outcomeForFlag`); a mismatch
    is reported as an inconsistency, never silently corrected.
  - Constructs the parallel pair (operator prefixed to each term) and
    reads a `verdict` in priority order: `ill-formed` → `inconsistent`
    → `transfers` / `fails`.
- UI:
  - `MohistDiagram.tsx` — the aligned-pair view: the base pair and the
    operator-applied parallel pair on two aligned rows (base marked
    是 · granted, parallel marked 然 / 不然), plus the four-outcome
    *Xiao Qu* taxonomy strip with the current outcome ringed. HTML/
    flex rather than SVG — the step-by-step-textual rendering family,
    not the diagrammatic one.
  - `MohistEditor.tsx` wraps `LogicCmEditor`; `mohist-commands.ts`
    supplies slash commands for the four outcomes, a skeleton, and the
    seed examples.
  - `labs/MohistLab.tsx` — header / history / primitives /
    further-reading in the shared shape; editor + evaluation panel
    (base, declared outcome, the cross-check result, form issues,
    verdict badge); the aligned-pair view. No reading toggle — móu has
    no affirm/reject duality the way catuṣkoṭi does.
- Seed entry in `data/logic-systems.ts` — 7 examples: two 是而然
  (white-horse, Huo), three 是而不然 (brother/handsome-man,
  boat/wood, robber/person), one 一周而一不周 (riding-horses under
  negation), one 一是而一非 (brother's ghost). `thinkerSlug: null` —
  the *Mojing* is a collective text.
- Route wiring in `routes/logic.$system.lazy.tsx` — the `mohist` slug
  routes to a lazy-loaded `MohistLab` chunk.
- `docs/formal-logic/world-logic-traditions.md` updated — §4 marked
  ticketed; the intro now records that all survey candidates are
  ticketed.
- Tests: `mohist-parser.test.ts` (well-formed input + aliases +
  errors), `mohist-engine.test.ts` (16 — the four-category invariant,
  the flag↔outcome bijection, the form-check, the cross-check, and
  verdict priority), `mohist-system-data.test.ts` (6 — registered,
  every example parses well-formed and consistent, all four outcomes
  reached).

## Why

`world-logic-traditions.md` §4 flagged Mohist disputation as the
weakest world-logic candidate and the highest interpretive risk — the
one most likely to re-scope mid-build. Two facts drove every design
decision, and the build met them head-on rather than hiding them:

1. **Which *Xiao Qu* category a parallel falls into is not
   mechanically decidable.** It turns on facts about classical Chinese
   semantics the Mohists settled by inspection. So the engine carries
   the outcome as a *declared* field and only cross-checks it against
   a declared failure flag — it never infers it. This is the same
   "report, don't adjudicate" stance as the catuṣkoṭi engine, and the
   modelling approach was confirmed with the user before any code was
   written (the form-check + declared-outcome option, over a
   tag-driven classifier or a *biàn* framing).
2. **Only categories 1 and 2 share móu's "one operator, two terms"
   shape.** The DSL is shaped to móu proper; categories 3 and 4 are
   represented within it as faithfully as the schema allows, with the
   strain stated plainly in the design doc and in the seed `note`s.

Móu earns the slot for being the one Lab system that is
argument-schema based rather than truth-functional, with no notion of
deductive completeness — and the *Xiao Qu* supplies its own
four-category taxonomy of when parallelizing fails, so the Lab renders
a historical taxonomy rather than inventing one.

Closes the Mohist item of `world-logic-traditions.md` §4 — the last
candidate in the survey. All four world-logic systems (saptabhaṅgī,
Avicennan, catuṣkoṭi, Mohist) are now shipped.

## Notes for future work

- **Categories 3 and 4 strain the one-operator schema.** *Yī zhōu ér
  yī bù zhōu* is about a single predicate scoped two ways; *yī shì ér
  yī fēi* is about kind-preservation differing across terms. Neither
  is natively "one operator applied to two terms of one base pair."
  The seeds for them are framed within the móu DSL as best they fit,
  each with a candid `note`. A DSL that fits all four natively is
  phase-2 work — see `mohist.md` §"Phase 2+" 1 and §"Open questions" 2.
- **The engine never infers an outcome.** Phase 1 deliberately stops
  at form-check + cross-check. The phase-2 step is *not* a
  natural-language decision procedure (that does not exist) but a
  classifier over more declared semantic structure — let the DSL
  declare the operator's opacity, the scope of each side, a
  kind-shift marker, and have the engine derive the category. The
  interpretation still lives in the declared structure.
- **Móu is the only *Xiao Qu* form built.** *Pì* (illustrating),
  *yuán* (adducing), *tuī* (inferring/extending), and a *biàn*
  (two-party disputation) mode are all deferred — `mohist.md`
  §"Phase 2+" 2–3.
- **"Is this logic?" is left to the history text.** The Graham /
  Harbsmeier / Fraser dispute over whether Mohist disputation is
  formal at all is cited, not adjudicated — consistent with the
  catuṣkoṭi precedent.
- **Verification** was `vitest` (1212/1212 passing) + `tsc --noEmit`
  + `npm run build`. No browser / interaction pass — consistent with
  `lab-status.md` §4, the standing gap across all Lab tickets.
