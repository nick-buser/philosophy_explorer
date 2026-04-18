# DOCS-005 — Peirce seed research compilation

**Branch:** `docs/DOCS-005-peirce-seed-research`
**Merged:** 2026-04-18

## What changed

- Added `docs/case-studies/peirce/seed-research.md` — concrete, seed-ready
  compilation for the future `DB-001-seed-peirce` ticket: philosopher slugs
  and bios, `works.json` table, `philosopher-influences.json` edge list with
  descriptions, `notes.json` concept-summary and bibliography drafts,
  scholarship-status updates (Logic of the Future 2020–2025, Stjernfelt 2022,
  Oxford Handbook chapter 2024, Vogel 2026), sanity-check matrix, and
  suggested follow-on ticket sequencing.
- Updated `docs/case-studies/peirce/README.md` sibling-documents table with a
  pointer to `seed-research.md`.
- Decisions recorded in the research doc: parallel-development edges use
  existing `influenceType: "indirect"`; Frege ↔ Peirce seeded in both
  directions; ticket numbers are next-available suggestions as of the branch
  date.

No changes to `data/seed/*.json` — implementation remains on the future DB
ticket.

## Why

DOCS-004 implied a `DB-###-seed-peirce` expansion but left the case-study
narrative in prose form. This ticket pulls investigative work (including web
verification of editions and publication dates) into a single spec the seed
ticket can execute without re-deriving slugs, edge copy, or concept bodies.

## Notes for future work

- Run `npm run db:seed` before merging any branch that touches seed JSON;
  this branch verified the current seed path still completes (warnings for
  pre-existing unknown slugs in `philosopher-schools`, `philosopher-influences`,
  and `works` remain unchanged).
- Implement `DB-001-seed-peirce` using `seed-research.md` as the source of
  truth; propagate §9 doc updates back into other Peirce case-study files
  when that lands.
- If GitHub Issue numbers diverge from `DB-001` / `FEAT-006`–`008` in
  `seed-research.md` §10, update the doc in the DB ticket or leave the sketch
  as-is per that section's note.
