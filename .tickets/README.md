# Tickets

Local on-disk ticket store. One file per planned future ticket, named
after the branch slug it would land on. Lower friction than a remote
issue tracker — searchable with `grep`, diffable across commits, and
available offline.

## File naming

`<branch-slug-with-type-prefix>.md` — same form as the
`work-history/` filenames once the ticket merges.

Examples:
- `.tickets/feat-logic-lab-dl-shiq.md` → branch `feat/logic-lab-dl-shiq`
- `.tickets/infra-playwright-smoke.md` → branch `infra/playwright-smoke`

When the ticket is started, branch off main with the matching slug;
the ticket file moves to `work-history/` (with the same name) when
the branch merges.

## File format

Keep it tight — these are queue entries, not design docs.

```markdown
# <type>: <one-line title matching the eventual PR>

**Branch slug:** `feat/...`
**Status:** queued | in-progress | merged
**Size:** S | M | L | XL
**Depends on:** (other ticket slugs, or `none`)

## Why
One paragraph. Motivation; what gap this closes.

## Scope
**In:**
- bullet list of in-scope items

**Out (captured separately):**
- bullet list, each linking the ticket file the deferral lives in

## Build sketch
Three-to-six-bullet rough plan. Just enough that the ticket can be
picked up cold without re-deriving the approach.

## References
Pointers to relevant docs / papers / existing code.
```

## Lifecycle

1. **Queued** — the file exists; no branch yet.
2. **In-progress** — branch open; PR may or may not exist.
3. **Merged** — file moves to `work-history/` and is rewritten in
   the work-history format (see `work-history/README.md`).

## Relationship to `lab-roadmap.md`

`docs/formal-logic/lab-roadmap.md` remains the *curated overview* of
where the Lab is heading — it groups tickets by theme and explains
the leverage argument across the matrix. `.tickets/` is the *queue*:
one file per concrete piece of work, sized and ready to pick up.

If a ticket is in `.tickets/`, the roadmap should mention it by slug;
if a roadmap entry has a slug but no ticket file yet, the next person
to plan that work should land the ticket file first.

## What does *not* belong here

- Bug reports without a fix plan — those are notes to self; put them
  in the relevant work-history doc or in `docs/formal-logic/open-questions.md`.
- Design exploration — that lives in `docs/`.
- Far-future "wouldn't it be nice if" lists — those stay in
  `lab-roadmap.md` §Optional / lower-priority until they have a real
  scope sketch.
