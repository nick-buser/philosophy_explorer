# FEAT-008 — Logic Lab (phase 4: Aristotelian Syllogistic)

**Branch:** `feat/FEAT-008-logic-lab-aristotelian-syllogistic`
**Merged:** <unmerged>

## What changed

- Added the Aristotelian syllogistic pipeline under `packages/web/src/logic/`:
  - `aristotelian-types.ts` — `CategoricalProposition`, `Syllogism`,
    `PropForm` (A/E/I/O), `Mood` (3-letter template literal type),
    `Figure` (1-4), and a `AristotelianFormula` union that lets the
    same renderer dispatch between single-proposition (2-circle) and
    syllogism (3-circle) input.
  - `aristotelian-parser.ts` — recursive-descent parser for two
    surface forms. Long form: `All|No|Some <S> is|are [not] <P>`,
    with three lines plus an optional `Therefore`/`So`/`Hence`
    keyword forming a syllogism. Compact form: `AAA-1/S,M,P`. The
    long-form parser detects major-vs-minor by term content (the
    premise containing the conclusion's predicate is major), so
    user-entered premise order doesn't matter.
  - `aristotelian-validity.ts` — flat lookup table of all 24 valid
    mood-figure pairs with their traditional names (Barbara,
    Celarent, Darii, …). Each entry carries a `weakened: boolean`
    flag for the 9 moods that depend on existential import. Phase 1
    accepts the traditional reading (weakened moods are valid); the
    UI annotates them.
  - `aristotelian-layout.ts` — geometry for 2-circle and 3-circle
    Venn diagrams. 3-circle uses an equilateral-triangle layout
    (S top-left, P top-right, M bottom). Universal premises shade
    forced-empty regions; particular premises place a single × in
    the most-specific compatible non-shaded region (per the
    phase-1 simplification noted in the design doc — no
    boundary-straddling glyph yet).
  - `AristotelianRenderer.tsx` — SVG consumer of the layout. Region
    shading uses nested SVG `<mask>` elements: a region is rendered
    as the intersection of its "inside" circles minus any "outside"
    circles. The 3-circle case nests two intersection masks to
    produce S∩M∩P. Avoids computing analytic arc-intersection paths.
  - `aristotelian-commands.ts` — slash-command registry: `/a-form`,
    `/e-form`, `/i-form`, `/o-form`, `/syllogism`, `/compact`, plus
    the `example.*` slugs from the system descriptor.
  - `AristotelianEditor.tsx` — 11-line `LogicCmEditor` wrapper
    matching the FEAT-006/007 pattern after REFAC-001.
- Wired the `aristotelian` system end-to-end:
  - Flipped `LOGIC_SYSTEMS['aristotelian'].status` from `'stub'` to
    `'available'` in `packages/web/src/data/logic-systems.ts`.
    Populated `thinkerSlug: 'aristotle'` (already in seed data),
    history paragraph, five primitive descriptions, eight
    hand-authored examples (Barbara, Celarent, Darii, Ferio,
    Cesare, Bocardo, an undistributed-middle invalid case, and a
    compact-form demo), and four reading pointers (SEP entries on
    Aristotle's logic, the square of opposition, and medieval
    syllogism theory).
  - `routes/logic.$system.tsx` — added an `AristotelianLab` branch
    with the same chrome as the other three labs (header,
    primitives panel, history, reading pointers) plus a Lab body
    (toolbar, editor, live SVG renderer, parse-state badge) and a
    new `ValidityBadge` component that displays mood, figure,
    traditional name, and a colour-coded valid/invalid/weakened
    state.
- Test coverage:
  - `__tests__/aristotelian-parser.test.ts` — 26 cases covering
    all four propositional forms, both copulas, syllogism figure
    detection, conclusion-keyword variants, term-content-based
    major/minor inference, compact-form layout per figure, and 8
    error paths.
  - `__tests__/aristotelian-validity.test.ts` — 17 cases asserting
    24 valid entries / 9 weakened, the four Figure-1 perfect
    syllogisms by name, valid-example checks for Barbara /
    Celarent / Bocardo / Bramantip, invalid-example checks for the
    undistributed-middle case, and an exhaustive round-trip:
    every entry in `ALL_VALID_ENTRIES` parses + checks valid.
  - `__tests__/aristotelian-layout.test.ts` — 11 cases covering
    each AEIO form's shading/× output, syllogism shading from
    universal premises, × placement from particular premises, and
    bbox containment for circles, labels, and × marks.
  - `__tests__/aristotelian-system-data.test.ts` — 7 cases asserting
    descriptor is `available`, has non-empty history/primitives/
    examples, has unique example slugs, every example DSL parses,
    and `thinkerSlug === 'aristotle'`.
  - Total web suite: 202 tests (was 141 pre-FEAT-008); F# suite
    unchanged at 10. All passing.
- Added `docs/formal-logic/aristotelian-syllogistic.md` as the system
  design doc (no doc existed for this system before; SEP-style
  matrix in `notation-systems.md` §2.1 was the only prior reference).

Net diff: ~1771 new lines across 13 new files plus 339 added / 6
removed across 2 modified files.

## Why

Continues the Logic Lab initiative and completes the four
"foundation" systems planned in `docs/formal-logic/notation-systems.md`
— Peirce alpha (FEAT-005), Kripke modal (FEAT-006), Frege
Begriffsschrift (FEAT-007), Aristotelian syllogistic (FEAT-008).
Aristotelian is the most historically influential of the four
(longest-running formal logic curriculum in the Western tradition,
~350 BCE through the early 19th century) and the natural foil to
Frege: term logic vs function-and-argument logic, fixed templates vs
recursive composition, prose vs 2D diagrammatic.

This is the **first system in the Lab that ships a validity check**.
Peirce, Kripke, and Frege parse + render but never judge — every
formula is rendered, valid or not. Syllogism validity is what makes
this system pedagogical: the diagram is the visual *why* and the
mood-figure-name annotation is the authoritative answer.

The phase-1 cut is deliberately narrow per the design doc:
propositional categorical forms + syllogism only, no square of
opposition, no Stoic propositional, no Sorites, no medieval
suppositio refinements, no existential-import toggle. These belong to
later tickets (mostly phase 2).

Closes #<issue-tbd>

## Notes for future work

- **Validity check is the first "judging" component in the Lab.**
  The pattern that emerged — parse → check → render with an
  annotated badge — is reusable for any future system that has a
  decidable validity question (e.g. a Boolean tautology checker for
  Boole, an S5 satisfiability checker if Kripke ever grows one).
  The `ValidityBadge` component lives in `routes/logic.$system.tsx`
  alongside `TruthBadge`; if a third badge type appears, extracting
  a shared `LogicBadge` is the next REFAC.
- **Multi-word terms are deliberately not supported in phase 1.**
  "All Greek philosophers are wise" parses as an error, not as a
  proposition with subject "Greek philosophers". The TERM regex is
  `/^[A-Za-z][A-Za-z0-9_-]*$/` and the parser splits on whitespace.
  A phase-2 rework could allow multi-word terms by greedy-matching
  up to the next reserved keyword (`is`/`are`/`not`), but the
  reserved-word disambiguation gets fiddly fast (e.g. "are" appearing
  in a term name like "Hares").
- **Term-comparison is case-sensitive.** "Mortal" and "mortal" are
  distinct terms; this caught the Cesare seed example during
  development. The "fix" was to standardise the example DSL, not
  the parser, because case-insensitivity would conflict with the
  pedagogical convention of capitalising universal/predicate terms.
  Future seed contributors should expect strict equality.
- **`AristotelianLab` and `AristotelianLabBody` follow the same
  shape as Frege/Kripke/Peirce.** The primitives-panel + history +
  reading-pointers chrome is now duplicated four times in
  `routes/logic.$system.tsx`. FEAT-006 / FEAT-007 / REFAC-001
  successively flagged this as the next REFAC target after the
  CodeMirror editor extraction. The fourth duplicate is the trigger
  to actually do it — extract `LogicSystemPageChrome` (or similar)
  in a follow-up ticket.
- **3-circle Venn ×-placement is approximate.** When a particular
  premise asserts existence in a region with multiple sub-regions
  (e.g. "Some S is M" without info on P), the textbook draws a
  boundary-straddling × across the two compatible regions
  (S∩M∩¬P and S∩M∩P). Phase 1 picks ONE region — the centre
  (S∩M∩P) when unshaded — and sticks a × there. This is honest
  given the validity badge carries the authoritative answer but
  may surprise a logician familiar with the textbook convention.
  A phase-2 ticket can add the straddling × glyph; the layout
  module's `applyParticularPremise` is the single point to change.
- **Existential-import policy is hardcoded.** The 9 weakened moods
  are listed in the table with `weakened: true` and the badge
  annotates them with "weakened". A user toggle for "Boolean reading"
  (which would make those 9 invalid) is a phase-2 enhancement —
  the table already carries the metadata to support it.
- **No live browser test.** Verified via `tsc --noEmit` (clean),
  `npm run build` (clean, 1.30 MB pre-gzip / 399 kB gzipped, +5 kB
  over FEAT-007), the full vitest suite (202/202), F# `dotnet test`
  (10/10), and a Vite dev-server smoke confirming `/logic/aristotelian`
  resolves with HTTP 200 and the new modules transform without error.
  A human browser check should happen before merge — particularly
  the visual proportions of the three-circle Venn at small widths
  and the readability of the validity-badge colour states.
- **Bundle size.** Web build sits at ~1.30 MB pre-gzip (~399 kB
  gzipped), up ~5 kB over FEAT-007's 1.28 MB. The Vite >500 kB
  warning is the same one already noted as a follow-up since
  FEAT-005; route-level code-splitting for `/logic/$system` is
  still the obvious next move and gets more compelling as the Lab
  grows.
- **Aristotle philosopher node is already seeded** (slug
  `aristotle`), so the system descriptor wires `thinkerSlug:
  'aristotle'` and the deep link from the philosopher detail page
  should work out of the box (the same code path that handles
  Peirce on FEAT-005). Worth confirming during the human browser
  smoke.
