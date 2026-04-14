# Work History

One markdown file per merged branch, named after the ticket it resolves.

## File naming

`PREFIX-###.md` — matches the GitHub Issue number.

Examples: `FEAT-001.md`, `DB-003.md`, `INFRA-007.md`

## When to create it

Before merging a branch into main, create (or finalize) the file for that branch.
Commit it as part of the merge or as the last commit on the branch.

## What goes in the file

```markdown
# PREFIX-### — Short title matching the issue title

**Branch:** `type/PREFIX-###-short-description`
**Merged:** YYYY-MM-DD

## What changed

- Bullet list of actual changes (files, behavior, APIs added/removed)

## Why

The motivation. What problem this solved or what capability it adds.
Link to the GitHub Issue: Closes #NNN

## Notes for future work

Anything a future agent or developer should know: gotchas encountered,
decisions made and why, follow-up tickets to consider.
```

## What it is not

- Not a commit log (git log covers that)
- Not a design doc (live in `docs/` if needed)
- Not a changelog for the whole project (each file is scoped to one ticket)

The value is the **why** and the **notes** — context that isn't in the diff.
