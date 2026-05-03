# FEAT-010 — Logic Lab (medieval modal syllogistic + sorites)

**Branch:** `feat/FEAT-010-logic-lab-medieval-modal-sorites`
**Merged:** <unmerged>

## What changed

- Added a **new `medieval` system** to the Logic Lab at
  `/logic/medieval`, alongside Peirce EG, Kripke, Frege, and
  Aristotelian. Status flipped from absent to `available`. The
  page reuses the standard four-lab chrome (header, lab body,
  history, primitives, reading pointers) and adds two toolbar
  toggles, a modal-aware Venn renderer, and a sorites chain
  diagram.

- **Modal syllogistic pipeline:**
  - `medieval-types.ts` — `ModalProposition`, `ModalSyllogism`,
    `SoritesChain`, `MedievalFormula`, plus `ModalMode` (`X`/`L`/`M`,
    Buridan's notation: assertoric / necessity / possibility) and
    `ModalReading` (`de-re` / `de-dicto` / `assertoric`).
  - `medieval-parser.ts` — recursive-descent over three top-level
    shapes:
    - Single modal proposition (long form): `Necessarily, all S is P`
      (de dicto) or `All S is necessarily P` (de re); plain assertoric
      forms parse as mode `X`.
    - Three-line modal syllogism. The major-vs-minor inference reuses
      the term-content-based detector from FEAT-008. Mixing de re and
      de dicto across premises is a parse error; an unambiguous
      single reading is required at the syllogism level.
    - Sorites: 4+ lines, each chaining a shared term to the next.
      Auto-detects Aristotelian (subject = previous predicate) vs
      Goclenian (predicate = previous subject) shape and validates
      the conclusion matches the chain ends. Modal premises in a
      sorites are explicitly rejected — modal sorites is deferred.
    - Compact modal form: `LXL-1/de-re/S,M,P`. Mode-letter mood,
      figure, reading suffix, comma-separated terms.
  - `medieval-validity.ts` — modal validity engine:
    - All-X (`XXX`) syllogisms delegate to `checkSyllogism` from
      the Aristotelian module; the result is wrapped in the modal
      result shape so the badge can render uniformly.
    - All-L (`LLL`) and all-M (`MMM`) syllogisms are valid iff the
      underlying assertoric mood is valid (any figure, both
      readings). The `weakened` flag carries through, so Boolean
      import composes correctly with the existing
      existential-import toggle (FEAT-009).
    - Mixed L/X / X/L syllogisms: figure 1 only. Conclusion mode is
      forced to `L` under de re (Aristotle, *Prior Analytics* I.9 —
      "necessity-major dominates"), to `X` under de dicto
      (Theophrastus / Buridan — *peiorem semper sequitur conclusio*).
      So Barbara LXL-1 flips between valid and invalid as the
      reading toggle moves.
    - Mixed M/X / M/L / X/M / L/M syllogisms: figure 1, de dicto
      only, conclusion mode `M`.
    - Anything else (mixed-mode in figures 2–4, conclusion-mode
      mismatches): invalid in phase 1 with reason
      `'pattern-not-supported'`.
    - `ALL_MODAL_VALID_CASES` is a generated list (rule logic ×
      assertoric table) used by tests for round-tripping.
  - `medieval-layout.ts` — extends the 3-circle Venn from FEAT-008
    with `□`/`◇` glyphs anchored along the line connecting each
    modally-annotated premise's subject and predicate circles
    (offset outward from the triangle centre to stay legible on
    top of the existing shading + ×). Sorites chains lay out as a
    horizontal row of term-nodes (rounded rects) connected by step
    edges with `Barbara` (or the syllogism's name) as the edge
    label; failed steps turn red.
  - `MedievalRenderer.tsx` — SVG consumer for both shapes. Reuses
    the mask-based intersection technique from
    `AristotelianRenderer.tsx` rather than analytic arc paths. The
    sorites diagram has its own marker definitions for ok/fail
    arrows.
  - `medieval-commands.ts` — slash-command registry: necessity /
    possibility templates (de re + de dicto for each), modal
    syllogism scaffolds, sorites scaffold, compact-modal scaffold,
    plus `example.*` slugs from the system descriptor.
  - `MedievalEditor.tsx` — 11-line `LogicCmEditor` wrapper.

- **System descriptor** in `packages/web/src/data/logic-systems.ts`:
  status `available`, `thinkerSlug: 'john-buridan'`, era
  `13th–14th c.`, history paragraph, six primitive descriptions,
  eight hand-authored examples (necessity Barbara, the contested
  Barbara LXL-1 in both de re and de dicto readings, possibility
  Celarent, Aristotelian sorites, Goclenian sorites, an invalid
  figure-2 mixed-mode mood, compact-modal demo), and four reading
  pointers (SEP entries on medieval syllogism, Buridan, medieval
  modality, de re/de dicto).

- **Buridan seed** as part of the same ticket — see CLAUDE.md
  rationale below:
  - `data/seed/philosophers.json`: new entry `john-buridan`
    (1301–1361 circa, French, scholastic/nominalist, *Tractatus de
    consequentiis* + *Summulae de dialectica*).
  - `data/seed/philosopher-influences.json`: Ockham → Buridan
    (direct), Aristotle → Buridan (direct).
  - `data/seed/philosopher-schools.json`: Buridan as scholasticism
    member.
  - Mirrored into `packages/api/src/data/seed-data.ts` (the legacy
    TS source the graph-build script reads) so `npm run graph:build`
    picks up the new node and edges.
  - Re-seeded `dev.db` (Buridan now resolves at
    `/api/philosophers/john-buridan`) and rebuilt
    `data/graph-data.json` (275 nodes / 385 edges, +1 node and +3
    edges over the prior graph).

- **Graph-build path fix** (folded in from the deferred follow-up):
  - `packages/api/src/graph/build-graph.ts` now writes to the
    canonical `data/graph-data.json` at the repo root (the location
    the active F# server reads from via `GRAPH_DATA_PATH`) instead
    of the legacy `packages/api/src/data/graph-data.json`. Path
    changed from `../data/graph-data.json` to
    `../../../../data/graph-data.json` relative to `__dirname`.
  - `packages/api/src/graph/index.ts` (the legacy api's read path)
    updated symmetrically so it still resolves if anyone exercises
    the legacy backend for reference.
  - `packages/api/src/data/graph-data.json` deleted — it was a
    stale duplicate; the canonical lives at `data/graph-data.json`.

- **Page wiring** in `packages/web/src/routes/logic.$system.tsx`:
  new `MedievalLab` and `MedievalLabBody` components, a
  `ReadingToggle` (de re / de dicto) and the existing FEAT-009
  `ImportToggle` composed in the toolbar, a `ModalValidityBadge`
  that renders the modal mood / underlying assertoric mood /
  figure / reading and a colour-coded valid/invalid state, and a
  `SoritesValidityBadge` that reports the chain shape, length, and
  failed-step index when applicable.

- **Design doc:** `docs/formal-logic/medieval-syllogistic.md`,
  formatted to match the FEAT-008 doc — purpose, out-of-scope,
  what ships, DSL grammar (modal proposition / modal syllogism /
  sorites / compact), validity rules with references to Buridan,
  visualisation, file layout, open questions / deferred work.

### Files

| File | Change |
|------|--------|
| `packages/web/src/logic/medieval-types.ts` | new |
| `packages/web/src/logic/medieval-parser.ts` | new |
| `packages/web/src/logic/medieval-validity.ts` | new |
| `packages/web/src/logic/medieval-layout.ts` | new |
| `packages/web/src/logic/MedievalRenderer.tsx` | new |
| `packages/web/src/logic/medieval-commands.ts` | new |
| `packages/web/src/logic/MedievalEditor.tsx` | new |
| `packages/web/src/logic/__tests__/medieval-parser.test.ts` | new (24 cases) |
| `packages/web/src/logic/__tests__/medieval-validity.test.ts` | new (14 cases) |
| `packages/web/src/logic/__tests__/medieval-sorites.test.ts` | new (5 cases) |
| `packages/web/src/logic/__tests__/medieval-layout.test.ts` | new (8 cases) |
| `packages/web/src/logic/__tests__/medieval-system-data.test.ts` | new (7 cases) |
| `packages/web/src/data/logic-systems.ts` | + medieval descriptor |
| `packages/web/src/routes/logic.$system.tsx` | + MedievalLab branch + components |
| `data/seed/philosophers.json` | + john-buridan |
| `data/seed/philosopher-influences.json` | + 2 edges |
| `data/seed/philosopher-schools.json` | + Buridan/scholasticism |
| `packages/api/src/data/seed-data.ts` | mirror Buridan seed |
| `data/graph-data.json` | regenerated (275 nodes / 385 edges) |
| `packages/api/src/data/graph-data.json` | deleted (was a stale duplicate) |
| `packages/api/src/graph/build-graph.ts` | output path → canonical `data/graph-data.json` |
| `packages/api/src/graph/index.ts` | read path → canonical `data/graph-data.json` |
| `docs/formal-logic/medieval-syllogistic.md` | new |
| `work-history/FEAT-010.md` | this file |

Verified: `npm run test:web` 304/304 (was 247/247 pre-FEAT-010, +57
new); `npm run test:api` 10/10; `npm run build --workspace=packages/web`
clean (1.34 MB pre-gzip / 410 kB gzipped, +28 kB pre-gzip / +8 kB
gzipped over FEAT-009); Vite dev-server smoke confirmed
`/logic/medieval` returns HTTP 200 and the new modules transform
without error.

## Why

Phase-1 medieval logic shipping the things that are actually
medieval — i.e. things Aristotle either left underdetermined
(modal syllogistic, *Prior Analytics* I.8–22 is famously
inconsistent) or didn't address at all (sorites, the formal/
material consequence distinction). The Aristotelian Lab page
already covers assertoric term logic at full medieval fidelity
(24 moods + square of opposition + immediate inferences +
existential-import toggle); doing more *there* would be
overcrowding the page with material whose AST shape differs.

The de re / de dicto distinction is the marquee feature: the
contested Barbara LXL-1 case flips validity as the toggle moves,
which makes the conceptual difference between the two readings
visible in a way prose explanation alone never quite does.
Possibility Barbara MMM-1 and necessity-Barbara LLL-1 give the
"both readings agree" baseline; LXL-1 / LXX-1 give the "readings
disagree" wedge.

Sorites are bundled in for two reasons. First, they're a clean
extension of the existing assertoric pipeline — the validity
check is just chained Barbara — so the marginal cost is small.
Second, they pair pedagogically with modal syllogistic: both
illustrate "what does syllogistic composition do under
extension?" — modally up the operator hierarchy, or longitudinally
across more premises.

Consequentiae was deliberately deferred. Formal-vs-material
consequence is whole-proposition reasoning, structurally closer
to a propositional logic than to term logic, and bundling it
here would have produced a page with two distinct ASTs glued
together. If it ships, it ships as its own page.

Closes #<issue-tbd>

## Notes for future work

- **The double toggle is genuinely two-axis.** Reading (de re /
  de dicto) is independent of import (traditional / Boolean), and
  the four combinations have distinct semantic content. The UI
  composes them as separate radiogroups in the toolbar, which is
  visually slightly busy but is the honest representation.
  Collapsing them into a single dropdown would obscure the
  independence.

- **Modal validity table is small by design.** Phase 1 only
  validates LL, MM, and figure-1 mixed-mode moods. Figures 2–4
  with mixed modes are flagged `pattern-not-supported`. This
  matches how introductory medieval logic textbooks usually
  present the material, and it dodges the genuine medieval
  disagreement on those cases (Albert vs Buridan vs the
  Theophrastean reading) which we'd otherwise have to take an
  editorial position on. A phase-2 ticket could expand the
  table — the rule-function shape (`expectedConclusionModes`)
  makes it a localised change.

- **`modeLabel` and `readingLabel` helpers exist on
  `medieval-types.ts` but are unused by the current UI.** They're
  there for the next iteration where the badge wants a richer
  hover-card or the primitives panel wants to inline the
  Latin-flavoured names. Remove them if a phase-2 review decides
  they're dead weight.

- **The renderer duplicates ~80 lines of mask/intersection helpers
  from `AristotelianRenderer.tsx`.** These are the same
  `RegionMask`, `IntersectTwo`, `IntersectThree` components with
  identical bodies. The cost of extracting a shared
  `VennMaskRenderer` is real but the cost of duplicating once is
  also real, and FEAT-008 / FEAT-009 already flagged the broader
  Lab-chrome REFAC. Both should land together in a single REFAC
  ticket. Until then, *if you change `AristotelianRenderer`'s
  mask logic, change `MedievalRenderer`'s too*.

- **Sorites is restricted to all-A Barbara chains.** This is the
  canonical sorites form that medievals discussed (the chain
  *names* — Aristotelian / Goclenian — refer specifically to it).
  Mixed-form sorites (e.g. `All A is B; some B is C; therefore
  some A is C`) are a real generalisation but require a small
  case grid for which conclusion form drops out, and the
  validation is not just "every step is Barbara" anymore. Phase
  1 returns a clear error when premises mix forms; phase 2 can
  extend.

- **Modal sorites is deferred.** The parser explicitly rejects
  modal annotations inside a sorites. Buridan does treat modal
  consequences but doesn't give a general rule for chains
  longer than 2 steps. This is real medieval territory but not
  the scope of FEAT-010 — see the design doc §Open questions.

- **`non-X` round-tripping** flagged from FEAT-009 still applies:
  the medieval immediate-inferences panel from that ticket still
  doesn't accept `non-X` predicates as DSL input. The medieval
  page does not surface immediate inferences at all (those are
  on the Aristotelian page), so this is just an
  orthogonal-ticket reminder.

- **`MMM` examples in the seed use `Possibly, all M is P` (de
  dicto) plus the de-re infix in another example.** The system
  descriptor's example set deliberately covers both readings on
  the same modal pattern so the page isn't biased toward one.

- **No human browser check.** Verified via `tsc --noEmit`,
  `vitest`, `dotnet test`, `npm run build`, and a Vite dev-server
  smoke (`/logic/medieval` returned HTTP 200, the new modules
  transformed cleanly). A human pass should confirm: the modal
  glyph (`□`/`◇`) placement on the 3-circle Venn at narrow
  widths; the sorites chain layout for 4+ premises (the chain
  may overflow the lab body's right column at narrow widths and
  the renderer falls back to overflow-auto, which is fine but
  worth eyeballing); the toggle pair gives clear feedback on the
  flagship LXL-1 case (Barbara goes valid → invalid as the
  reading flips from de re to de dicto).

- **Bundle: +28 kB pre-gzip / +8 kB gzipped over FEAT-009.** Web
  build is now ~1.34 MB pre-gzip / ~410 kB gzipped. The
  route-level code-splitting follow-up flagged since FEAT-005
  remains the obvious next move — five Lab systems is now four
  populated systems' worth of unused code on every other route.

- **Scholarly responsibility.** The validity table cites Buridan
  as the source of truth and notes the contested cases. If a
  user with deeper medieval logic expertise wants to pick at the
  cuts (especially the figure-2/3/4 mixed-mode rejections), the
  doc and the badge messages already invite that — and the
  rule-function shape is a one-file change.
