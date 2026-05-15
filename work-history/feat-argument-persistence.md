# FEAT — Argument persistence (schema, seed, API, inline render)

**Branch:** `feat/argument-persistence`
**Merged:** (pending)

## What changed

### Data model (F#)
- `Domain/Types.fs` — DB row types: `ArgumentRow`, `ArgumentClauseRow`,
  `ArgumentFormalizationRow`, `ArgumentAssessmentRow`, `ArgumentReviewerNoteRow`.
- `Domain/Dtos.fs` — wire DTOs: `ArgumentSummaryDto`, `ArgumentDetailDto`,
  `ArgumentClauseDto`, `ArgumentFormalizationDto`, `ArgumentAssessmentDto`,
  `ArgumentSourceSpanDto`. The formalization `ast` field is a `JsonNode` —
  opaque to F#, parsed on the web side with the existing Logic Lab AST types.
- `Db/Seed.fs` — five new tables (`arguments`, `argument_clauses`,
  `argument_formalizations`, `argument_formalism_assessments`,
  `argument_reviewer_notes`) + an idempotent loader that reads
  `data/seed/arguments.json` if present.
- `Db/Queries.fs` — list/detail/by-work queries for arguments and their
  child rows.
- `Routes/ArgumentRoutes.fs` — `GET /api/arguments` (optional `?workSlug=`),
  `GET /api/arguments/{*id}` (catch-all — ids carry slashes),
  `GET /api/works/{slug}/arguments`. Registered in `Program.fs` + `.fsproj`.

### Seed pipeline
- `scripts/build-arguments-seed.mjs` — converts claim_extractor extractions
  (`../claim_extractor/extractions/**/*.json`) into `data/seed/arguments.json`.
  Structural conversion only; AST payloads pass through verbatim.
- `package.json` — new `arguments:build` script.

### Web
- `packages/web/src/lib/argument-types.ts` — hand-mirrored wire types +
  `clauseFormula()` (positional clause↔AST alignment).
- `packages/web/src/components/ArgumentCard.tsx` — verbal | symbolic clause
  table, formalization switcher, collapsible source/notes/assessments,
  dialogical move-list view.
- `routes/works.$slug.tsx` — new "Arguments" section under the description.

### Tests
- `PhilosophyExplorer.Tests/ArgumentTests.fs` — 7 integration tests (seed +
  query path against a throwaway SQLite db).
- `packages/web/src/components/__tests__/ArgumentCard.test.tsx` — 4 component
  tests (fol / nd / dialogical fixtures + auto-render fallback + context).

### Incidental fixes
- `packages/web/package.json` — `gen:types` pointed at the stale
  `../api/specs/openapi.json`; corrected to `../specs/openapi.json` (the path
  `gen:spec` actually writes and CLAUDE.md documents).

## Why

First slice of the larger goal: persist extracted argument structure so an
argument can be pulled up in "standard form" with its formalization(s), and
eventually inlined into study materials / opened in the Logic Lab / freely
manipulated. claim_extractor produces formalized extractions but nothing
durable consumed them. This ticket establishes the schema and proves the
seed→map→render path end to end with the 5 existing extractions (2 fol,
2 nd, 1 dialogical).

Design decisions (confirmed with the user before implementation):
- **Schema home: F# DTOs.** claim_extractor's `Extraction` is the inbound
  format; we convert at seed time. F# is canonical for wire + DB shape.
- **Whole-AST formalizations, position-aligned.** Each formalization stores
  the full AST; clauses align to it positionally (`clause.position` indexes
  `argument.premises`, `role='conclusion'` → `argument.conclusion`). No
  per-clause sub-AST in v1.
- **Verbal text v1 = auto-render.** `verbal_text` is nullable; when null the
  web renders the formula via the existing renderers and tags it `auto`.
- **Argument lifts above the formalism.** An `Argument` is a verbal clause
  sequence + N formalizations. Today's `Extraction` becomes one Argument with
  one primary formalization; `secondary_assessments` become fit-score-only
  rows in `argument_formalism_assessments` (no AST — they were never built).

## Notes for future work

- **Meno is not in `works.json`.** The 3 Meno extractions seed with
  `work_id = NULL` (the seed script warns). They won't show on any work page
  until Meno is added to the works seed. Add it, re-run `db:seed` — the
  arguments will link on next seed (loader is keyed on `extraction_id`).
- **`verbal_text` is null for every seeded clause.** Real per-clause English
  needs either (a) extending claim_extractor's `Extraction` wrapper with
  `clause_verbalizations` and re-extracting, or (b) a verbalization pass.
  Until then the UI auto-renders. This was a deliberate v1 cut.
- **`xunit` + F# module init.** xunit invokes `[<Fact>]`s by reflection, which
  does not reliably run a module's static `do` binding. `ArgumentTests` uses a
  `lazy` setup forced by `ensureSeeded ()` at the top of each test. Same class
  of issue is why `Queries.configureDapper ()` is an explicit call from each
  entry point (web host, seeder, test setup) rather than a bare module `do` —
  a `Queries`-module `do` was *not* reliably running, which would silently
  leave `MatchNamesWithUnderscores` unset and map every snake_case column to
  null. Worth auditing whether the pre-existing `do` ever ran in the web host.
- **OpenAPI spec is response-shape-only.** No route in this project uses
  `.Produces<T>()`, so `gen:types` produces `content?: never` for every
  response. Web response types are hand-written (this ticket follows that
  pattern). If type coherence via codegen is wanted for real, add `.Produces`
  annotations across all routes — a separate cross-cutting ticket.
- **Catch-all route.** `GET /api/arguments/{*id}` — argument ids are the
  verbatim `extraction_id` (`author/work/slug`), which contains slashes.
- **Dialogical clauses.** A dialogical argument seeds as one synthetic
  `composite` clause; the UI renders the move list from the AST. If/when
  dialogical gets a real Logic Lab AST, revisit whether moves should be
  first-class clauses.
- **Next slices:** open-in-Logic-Lab handoff; editing / free manipulation;
  per-clause sub-AST mapping; Postgres migrations (still SQLite-dev only).
