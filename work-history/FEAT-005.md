# FEAT-005 — Logic Lab (phase 1: Peirce Existential Graphs)

**Branch:** `feat/FEAT-005-logic-lab-peirce-eg`
**Merged:** <unmerged>

## What changed

- Added a new top-level `/logic` surface to the web app (the "Logic Lab").
  - `packages/web/src/routes/logic.tsx` — index listing available and
    coming-soon systems.
  - `packages/web/src/routes/logic.$system.tsx` — per-system page. For
    `peirce-eg` it renders the interactive lab (editor + live SVG
    renderer + primitives + history + reading pointers). Other slugs
    land on a stub placeholder.
  - Registered both routes in `packages/web/src/router.tsx`.
  - Added a "Logic Lab" link in the global header
    (`packages/web/src/routes/__root.tsx`).
- Implemented the alpha-EG pipeline:
  - `packages/web/src/logic/eg-ast.ts` — discriminated-union AST
    (sheet / cut / atom). Beta (lines of identity) is future work.
  - `packages/web/src/logic/eg-parser.ts` — recursive-descent parser
    for the short-form DSL (`P Q`, `(P)`, `(A (B))`).
  - `packages/web/src/logic/eg-layout.ts` — two-pass bottom-up sizing
    + top-down positioning, producing a rectangle tree.
  - `packages/web/src/logic/EgRenderer.tsx` — SVG renderer. Cuts are
    rounded rectangles with depth-alternating tints; atoms are
    italicised glyphs, matching the visual conventions in Shin 2002.
  - `packages/web/src/logic/eg-commands.ts` — command registry shared
    by the toolbar and the editor autocomplete. Structural commands
    (`/cut`, `/double-cut`, `/scroll`, `/conjunction`) plus
    `/example.*` slugs generated from the system's example list.
  - `packages/web/src/logic/EgEditor.tsx` — CodeMirror 6 host with
    history, bracket matching, line numbers, and a slash-command
    autocomplete source keyed off `eg-commands`.
  - `packages/web/src/logic/__tests__/eg-parser.test.ts` — vitest
    coverage for atoms, juxtaposition, cuts, the scroll, whitespace,
    and error cases.
- Added the system/example data:
  - `packages/web/src/data/logic-systems.ts` — client-side seed for
    phase 1. Includes one fully-populated system (`peirce-eg`) and
    three stubs (Frege BS, Aristotelian, Modern FOL) so the scope is
    visible in the index.
- Augmented the Peirce detail page:
  - `packages/web/src/routes/philosophers.$slug.tsx` — added a
    `LogicLabCta` block that renders only when a logic system lists
    the philosopher as its `thinkerSlug`. Generic, so future thinkers
    can opt in by pointing a system at them.
- Installed CodeMirror 6 web deps: `@codemirror/state`, `view`,
  `commands`, `language`, `autocomplete`, `@lezer/highlight`.

## Why

Kicks off the logic-systems initiative scoped in
`docs/formal-logic/logic-explorer-tab.md`. Peirce's existential graphs
are the natural first populated system (see
`docs/case-studies/peirce/README.md` §"Logic-systems explorer
integration"): they exercise the full SVG pipeline with simpler
geometry than Frege's Begriffsschrift, and the Peirce case study
already supplies history, primitives, and example formulas.

The goal of *this* ticket is the bones, not a finished lab:

- A working end-to-end path from a tiny DSL through a parser, AST,
  layout, and SVG renderer.
- A CodeMirror editor wired up with history, bracket matching, and a
  slash-command pattern that can grow.
- A place the rest of the logic-lab threads (Frege BS, compare view,
  Lean verification) can plug into without moving furniture.

## Notes for future work

- **Storage location.** `logic-systems` lives as a client-side TS module
  (`packages/web/src/data/logic-systems.ts`) rather than a `data/seed/`
  JSON file served by F#. The design doc calls for the latter; I
  deferred that migration until we have a second populated system so
  we don't commit to a wire shape prematurely. Migration path: move to
  `data/seed/logic-systems.json`, add a `LogicSystemDto` in
  `Domain/Dtos.fs`, expose `GET /api/logic/systems` + `/{slug}`, and
  drive the page with `useQuery`.
- **Beta (first-order) EGs.** The AST only models alpha. Beta needs
  "lines of identity" shared across atoms; the renderer will need to
  compute line endpoints across the layout tree. Likely a separate
  pass after layout, using hit-tested connection points.
- **Command palette surface.** Slash commands currently trigger only
  from the editor. A keyboard-driven palette (Cmd+K style) over the
  full page is a natural next step and should share `EG_COMMANDS` as
  the source of truth.
- **Syntax highlighting.** The CodeMirror editor deliberately has no
  language server or grammar yet; the DSL is too small to justify
  Lezer tooling at this phase. Revisit when beta lands.
- **Toolbar behaviour.** Clicking a toolbar command currently replaces
  the document; slash-triggered completions insert at the cursor. This
  split is pragmatic for phase 1 but will want unifying once the
  structural editor arrives (`docs/formal-logic/editor-and-ir.md` §2.4).
- **Peirce detail-page augmentations remaining** (from
  `docs/case-studies/peirce/README.md` §"Detail-page UX plan"):
  Concepts & Ideas, Influence Graph, Structured Reading Order. All
  depend on seed-data expansion (the future `DB-###-seed-peirce`
  ticket) and/or component extraction (a REFAC ticket).
- **Bundle size.** The web build is now 974 kB (pre-gzip). CodeMirror
  is most of the new weight. Route-level code-splitting for `/logic`
  is a low-risk follow-up.
- **No live browser test.** The CLAUDE.md rule is to verify UI in a
  browser before claiming done. I verified via TypeScript
  (`tsc --noEmit`), production build (`npm run build`), and unit
  tests (`npm test`). A human browser check should happen before
  merge.

Closes #<issue-tbd>