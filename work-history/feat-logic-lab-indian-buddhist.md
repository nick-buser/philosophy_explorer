# feat — Logic Lab: Indian / Buddhist (Nyāya · Dignāga)

**Branch:** `feat/logic-lab-indian-buddhist`
**Merged:** TBD

Third work-history entry under the slug-only convention, after
`feat-boolean-algebra.md` and `feat-natural-deduction.md`. Closes
the long-term "Indian / Buddhist logic" entry in
`docs/formal-logic/lab-roadmap.md` §Long term.

## What changed

- New Logic Lab system at `/logic/indian-buddhist`. Ninth system
  overall. Introduces the **step-by-step textual** visualization
  family the roadmap matrix flagged as missing.
- DSL + parser:
  - `indian-types.ts` — `Inference` (paksha + sadhya + hetu +
    pakshaHasHetu + Example list with a `side` discriminator),
    the nine-cell `HETU_CAKRA` constant with each cell's status
    (valid / inconclusive / contradictory), Sanskrit name
    (sad-hetu, anaikāntika, viruddha, …), and English gloss.
  - `indian-parser.ts` — line-based `key: value` DSL. Required
    keys `paksha`, `sadhya`, `hetu`; optional `sapaksha`,
    `vipaksha`. IAST-flavoured spellings (`pakṣa:`, `sādhya:`)
    and English glosses (`subject:`, `reason:`, `similar:`,
    `dissimilar:`) are accepted as aliases. Examples take an
    optional `+` / `−` marker for hetu presence; defaults are
    `+` for sapakṣa and `−` for vipakṣa (the canonical case),
    so the user only marks exceptions. Continuation lines append
    to the previous key. Comment lines (`#`) and blank lines
    are skipped.
  - `formatInference` round-trips an `Inference` back to
    canonical DSL — used by tests and by future "insert example"
    UX that wants to start from a normalised template.
- Engine `indian-engine.ts` — `classify(inference)` runs the three
  trairūpya checks (pakṣa-dharmatā, sapakṣe sattvam, vipakṣe
  asattvam) and places the hetu on the wheel. The `count`
  reported by sapakṣe-sattva and vipakṣe-asattva drives the cell
  lookup directly, so both views agree by construction. Pakṣa-
  dharmatā gates the verdict: when it fails, the wheel cell is
  still computed (so the UI can show *where* the hetu would have
  landed) but the verdict is `unestablished` (asiddha).
- Five-step renderer `indian-render.ts` — `fiveSteps(inference)`
  produces the canonical pañcāvayava (pratijñā · hetu · udāharaṇa
  · upanaya · nigamana) as `Step` objects with Sanskrit name,
  English label, and prose generated from the inference's terms.
  The udāharaṇa step picks the first sapakṣa-with-hetu and the
  first vipakṣa-without-hetu as its illustrative examples.
- React renderers:
  - `HetuCakra.tsx` — 3×3 grid (rows = sapakṣa presence, cols =
    vipakṣa presence). Cells colour-coded by status; the active
    cell is ringed in blue. Sanskrit fallacy name shown inside
    each cell with the gloss in `title=`.
  - `FiveStepView.tsx` — numbered list with a Sanskrit / English
    label column on the left and rendered prose on the right.
    Stacks on narrow viewports.
- Editor + commands:
  - `IndianEditor.tsx` wraps `LogicCmEditor` with the system's
    slash command list.
  - `indian-commands.ts` — slash commands for the five DSL keys,
    `+` and `−` markers, and an example inserter sourced from
    the seed entry.
- Lab page `IndianBuddhistLab.tsx`:
  - Header / history / primitives / further-reading sections in
    the shared shape.
  - Editor on the left; verdict + trairūpya panel on the right
    showing each of the three conditions with a satisfied / fails
    indicator and a one-line reason.
  - Below: full five-step textual render, then the hetu-cakra
    grid with the active cell highlighted and the Sanskrit-name
    + gloss for it as a caption.
  - Verdict badge at the top: `valid · sad-hetu`,
    `contradictory · viruddha`, `inconclusive · anaikāntika`, or
    `asiddha · pakṣa-dharmatā fails`.
- Seed entry in `data/logic-systems.ts` — 7 examples:
  - `smoke-on-the-mountain` — the textbook valid inference
    (sap-all / vip-none).
  - `sound-impermanent` — Dignāga's own example
    (sap-some / vip-none).
  - `sadharana` — common inconclusive (sap-all / vip-all).
  - `asadharana` — uncommon inconclusive (sap-none / vip-none).
  - `viruddha` — contradictory (sap-none / vip-all).
  - `partial-leak` — anaikāntika (sap-all / vip-some).
  - `asiddha` — pakṣa-dharmatā fails; verdict bypasses the wheel.

  Together they cover six of the nine wheel cells *plus* the
  asiddha (pakṣa-dharmatā) gate — the three remaining wheel
  cells (sap-some/vip-all, sap-some/vip-some, sap-none/vip-some)
  are reachable by editing existing examples and don't earn
  their own seed slot.
  History note covers Gautama's *Nyāya-sūtra*, Dignāga's
  *Pramāṇasamuccaya* / *Nyāyamukha*, the trairūpya, the
  hetu-cakra, Dharmakīrti, Navya-Nyāya, and the 20th-century
  scholarship (Stcherbatsky, Frauwallner, Matilal). Reading
  pointers: SEP entries on Logic in Classical Indian Philosophy,
  Dignāga, Indian epistemology; Matilal's *Character of Logic
  in India*; Tucci's 1930 translation of the *Nyāyamukha*.
- Route wiring in `routes/logic.$system.lazy.tsx` — new
  `indian-buddhist` slug routes to `IndianBuddhistLab` (lazy-
  loaded chunk, ~19 kB / 5.7 kB gz).
- Tests:
  - `__tests__/indian-parser.test.ts` — 9 tests covering the
    canonical inference, +/− markers, pakṣa-negative spellings,
    error reporting, comment / blank-line handling, and the
    `formatInference` round-trip.
  - `__tests__/indian-engine.test.ts` — 10 tests covering each
    trairūpya condition independently and one example per
    classification family (valid sap-all, valid sap-some,
    sādhāraṇa, viruddha, asādhāraṇa) plus the wheel-geometry
    invariant (9 cells: 2 valid, 2 contradictory, 5 inconclusive).
  - `__tests__/indian-system-data.test.ts` — 4 tests verifying
    the system is registered, every example parses, every example
    yields five rendered steps, and each example produces the
    verdict its slug claims.

## Why

The roadmap (`lab-roadmap.md` §Long term) flagged Indian /
Buddhist logic as the system that introduces a new visualization
family — step-by-step textual presentation — and "breaks the
implicit Western-tradition frame." That gap had been pending
since the spine-completion review. This branch lands the system
in its M-sized form: the Nyāya five-step shape, Dignāga's
trairūpya verdict, and the hetu-cakra wheel — without trying to
extend into Dharmakīrti's three structural hetu types, Buddhist
apoha theory, or the Navya-Nyāya formalism.

The user explicitly de-scoped two things at branch creation:
the compare view (no cross-system bridge) and Lean integration
(this is a presentation system; verification isn't on the menu).
Both decisions hold: the lab stands alone and could be lifted
into compare scope later if the roadmap takes that turn.

Closes the entry in `docs/formal-logic/lab-roadmap.md` §Long
term — though no GitHub Issue was opened for it.

## Notes for future work

- **Sanskrit transliteration in the DSL.** The DSL accepts IAST
  spellings as key aliases (`pakṣa:` parses) but example names
  and the prose values are plain ASCII English. Switching the
  default to IAST throughout would mean: change the seed
  examples, decide on a font fallback for diacritic-bearing
  characters in the editor's monospace face, and add a
  transliteration helper for users who want to type with ASCII
  diacritic markers (`s` + combining dot under, etc.). Cheap
  to add and orthogonal to everything else; defer until someone
  asks.
- **Three uncovered wheel cells.** sap-some/vip-all,
  sap-some/vip-some, sap-none/vip-some have no dedicated seed
  example. Each is a recognised fallacy type in the
  commentaries; if the lab grows a per-cell teaching path, those
  three earn examples of their own. The wheel renderer already
  highlights any of the nine, so adding examples is purely
  content work.
- **Dharmakīrti's three hetus.** The three valid hetu types
  (svabhāva-hetu / kārya-hetu / anupalabdhi-hetu) are
  *structural* refinements of "any hetu satisfying trairūpya"
  and would be a natural follow-up. Each is a small classifier
  that runs *after* the trairūpya verdict comes back valid;
  shape would be a second column of badges next to the existing
  verdict. Roughly a half-day add.
- **Navya-Nyāya formalism.** Gaṅgeśa's 13th-century reformation
  of Nyāya into a formal apparatus around vyāpti, paryāpti, and
  the relata-sambandha calculus is sufficiently different from
  Dignāga to merit its own system slug if it ever ships — not a
  refactor of this one. Same shape note as Stoic vs Aristotelian
  in the roadmap: "different system, not extension of the
  current one."
- **Apoha.** Dignāga's exclusion-based theory of meaning
  (apoha-vāda) sits alongside the inferential framework but
  isn't part of the inference engine itself — it's a semantics
  for the property terms. Not in scope here; if someone wants
  to surface it, the natural home is a side panel that comments
  on what `sadhya` means rather than another classifier.
- **Structural overlap with Aristotelian.** Both systems share
  the basic shape "inference from class-membership patterns,"
  but the *visualization* is different (step-by-step textual vs
  Venn / square-of-opposition) and the *verdict criterion* is
  different (trairūpya + cell vs mood-figure table). The Lab
  exhibits both side-by-side without forcing a translation —
  which is the right call for now. A compare-view ticket could
  later wire them together; the Sanskrit-name / Latin-mood-name
  parallel would be the pedagogical hook.
- **`formatInference` is currently only used by tests.** It
  exists for round-trip parser tests and for a future "normalise"
  command that lets the user reformat hand-typed DSL into the
  canonical aligned-column shape. Wire that command in next time
  the editor toolbar grows; the function is already paid for.