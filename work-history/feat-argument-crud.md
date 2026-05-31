# FEAT — Argument CRUD pipeline + dedicated view

**Branch:** `feat/argument-crud`
**Merged:** (pending)

Builds directly on `feat/argument-persistence` (schema + read-only API) and
`feat: argument attributions`. This ticket makes the argument layer a true
end-to-end CRUD pipeline with the DB as the authoritative store, and adds a
dedicated browse/detail view.

## What changed

### Importer (Phase 1)
- `scripts/build-arguments-seed.mjs` — `clausesFor`/`astFor` extended from 4 to
  **all 15 formalisms** (previously threw on `boolean`/`ctl`/`eg`/`epistemic`/
  `frege`/`indian`/`intuitionistic`/`kripke`/`medieval`/`resolution`/`temporal`).
  All 99 extractions now convert. Each record emits `origin: 'import'`.
- **Philosopher slug resolution fixed.** claim_extractor uses short author slugs
  (`russell`); the philosophers seed uses full-name slugs (`bertrand-russell`).
  New `resolvePhilosopherSlug` (exact, then a unique `-<author>` suffix) lifted
  attribution coverage **58 → 95 / 99**. Only `dasgupta` and `gotama` remain
  (genuinely absent from `philosophers.json`).

### Schema (Phase 1)
- `Db/Seed.fs` + `Domain/Types.fs` — `arguments.origin TEXT NOT NULL DEFAULT
  'import'` (`'import'` | `'user'`). Loader stays additive (`INSERT OR IGNORE`).

### Write API (Phase 3) — first mutations in the codebase
- `Domain/Dtos.fs` — `WriteArgumentDto` (+ nested `WriteClause/Formalization/
  Assessment/Attribution`). Deliberately free of F# `option`: plain refs,
  `Nullable<_>`, `JsonNode`, arrays — robust request binding.
- `Db/Queries.fs` — `knownFormalisms`, `argumentExists`, `createArgument`,
  `replaceArgument`, `deleteArgument`. Writes run in a transaction; PUT replaces
  children wholesale (delete + re-insert) rather than diffing.
- `Routes/ArgumentRoutes.fs` — `POST /api/arguments` (generates a GUID id,
  `origin='user'`), `PUT /api/arguments/{*id}`, `DELETE /api/arguments/{*id}`.
  Validation: formalism ∈ 15, ast present, exactly one primary, philosopher/work
  slugs resolve (else 400, transaction rolled back). Extracted `buildDetail`
  shared by GET/POST/PUT.

### Read view + write UI (Phases 2 & 4)
- `lib/argument-types.ts` — `Formalization` union widened to all 15 (+ generic
  `{ ast }` member); shared `ALL_FORMALISMS`, `FORMALISM_LABELS`,
  `FORMALISM_LAB_SLUG`, `formalismLabel`; `WriteArgumentInput` etc.
- `components/ArgumentCard.tsx` — `GenericFormalizationView` fallback for the 11
  not-yet-wired formalisms (formatted AST JSON + "Open in Logic Lab" deep link).
- `routes/arguments.tsx` (index: search + formalism filter), `routes/arguments.$.tsx`
  (splat detail with Edit/Delete), `routes/arguments.new.tsx` (create). Registered
  in `router.tsx`.
- `components/ArgumentEditor.tsx` — create+edit form; raw-JSON AST authoring with
  validation; philosopher/work selects; first `useMutation` (POST/PUT/DELETE) with
  query invalidation.

### Spec + tests (Phase 5)
- Regenerated `packages/specs/openapi.json` + `packages/web/src/lib/api-types.ts`
  (now include POST/PUT/DELETE + `WriteArgumentDto`).
- `PhilosophyExplorer.Tests/ArgumentTests.fs` — +4 CRUD tests (create round-trip,
  unknown-philosopher rollback, replace-wholesale, delete-cascade). 26 total.
- `components/__tests__/ArgumentEditor.test.tsx` — 4 tests (render, empty-intent
  block, invalid-AST, POST body + onSaved).

## Why

claim_extractor produces 99 formalizations but the explorer could only *read* a
seeded subset, and only 4 formalisms rendered. The user wanted to browse, create,
edit, and delete arguments in-app with the DB authoritative. This closes the loop:
the importer is now complete and additive, the DB owns edits, and there's a real
view + editor. Closes #NNN.

Confirmed decisions: true in-app CRUD (DB authoritative); dedicated browse+detail
routes; AST authored as validated raw JSON (Logic Lab editor embedding is a
fast-follow); reconciliation via additive import + `origin` flag.

## Notes for future work

- **DB authoritative ⇒ re-extractions don't propagate.** Once an `extraction_id`
  is imported, `INSERT OR IGNORE` skips it forever, so later claim_extractor edits
  to that passage never reach the DB. Accepted. `origin` distinguishes user rows;
  edits are detectable via `updated_at != created_at`. PUT does **not** flip
  `origin` (it records provenance-of-creation, not modification).
- **PUT is a wholesale replace.** The editor must round-trip *every* child section
  (clauses, formalizations, assessments, notes, attributions) or a save drops the
  omitted ones. The editor does; keep that invariant if you refactor it.
- **Catalog gap (the real one).** 53/99 arguments have null `work_id` — 26 works
  are absent from `works.json` (most plato minor dialogues, the Aristotle Organon,
  Brandom, Berkeley's Three Dialogues, etc.). Two are pure slug variants:
  `kant/groundwork` → `groundwork-of-the-metaphysics-of-morals`,
  `nietzsche/genealogy-of-morals` → `genealogy-of-morality`. Root cause: the two
  repos use different slug conventions. Backfilling `works.json` (and adding
  `dasgupta`/`gotama` to `philosophers.json`) is a `DB` ticket; re-run
  `arguments:build` + `db:seed` after. Source span (file/lines/excerpt) is always
  present, so "source" is never lost — only the normalized work link.
- **Schema change + the Postgres migration gap (now handled).** `CREATE TABLE IF
  NOT EXISTS` no-ops an existing table, so adding `origin` to an already-deployed
  store needed an explicit migration. `Db/Seed.fs` now has an idempotent
  `migrateSchema` step (Postgres `ALTER TABLE arguments ADD COLUMN IF NOT EXISTS
  origin …`) that runs on every `--seed` — the entrypoint reruns seed per
  container start, so it self-heals. SQLite stays on the recreate-dev.db workflow
  (no `ADD COLUMN IF NOT EXISTS`). The **dev** NAS Postgres
  (`philosophy_explorer_dev` @ 192.168.1.12) was migrated + seeded this way
  (arguments 5 → 99; existing rows back-filled `origin='import'`). **Prod is
  untouched** — same `--seed` will migrate it on next deploy. Future additive
  columns: add another `ADD COLUMN IF NOT EXISTS` clause to `migrateSchema`.
- **Write path is now dialect-portable.** `replaceArgument` (PUT) previously used
  SQLite-only `datetime('now')`; `updated_at` is now set from F# so PUT works on
  Postgres. POST/PUT/DELETE all verified green against dev PG.
- **15-formalism rendering is staged.** The 4 wired formalisms (fol/nd/
  aristotelian/dialogical) render fully; the other 11 fall back to AST JSON + a
  Logic Lab link. Bespoke per-formalism rendering (reusing `FregeRenderer`,
  `KripkeModelView`, `EgRenderer`, …) is a natural fast-follow.
- **AST authoring is raw JSON.** Embedding the existing Logic Lab editors
  (`FolEditor`, `NdEditor`, `LogicCmEditor`, …) into the form so formulas are
  authored graphically/textually instead of as JSON is the next UX slice.
- **No auth.** Writes are unauthenticated (project-wide `DEFAULT_USER_ID`
  placeholder). Gate POST/PUT/DELETE when auth middleware lands.
- **OpenAPI is still response-shape-only** (no `.Produces<_>`), so `gen:types`
  response bodies remain `never`; web wire types stay hand-mirrored. Request DTOs
  (`WriteArgumentDto`) *do* now appear in the spec.
