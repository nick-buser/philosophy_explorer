# Agent Working Guide — philosophy-explorer

Conventions for AI-assisted development on this project. Read this alongside `CLAUDE.md`.

## Before starting any work

1. Check GitHub Issues for the ticket this work belongs to. If one doesn't exist, ask before proceeding.
2. Confirm you're on a branch — not main. Branch naming: `type/PREFIX-###-short-description`.
3. Read the relevant route, schema, or component files before suggesting changes.

## Commit discipline

- **No direct commits to main.** All commits go on a feature branch.
- Commit messages: `type: description [PREFIX-###]`
  - `feat: add thinker endpoint [FEAT-005]`
  - `fix: handle null concept links [BUG-002]`
- Keep commits coherent — one logical change per commit. Don't bundle schema changes with unrelated UI work.

## Before merging a branch

Create `work-history/PREFIX-###.md` for the ticket. The template is in `work-history/README.md`.
The **why** and **notes for future work** sections are the most valuable parts — don't skip them.

## API changes always require

1. Update or add route in `packages/api/src/routes/`
2. Add or update test in `packages/api/tests/routes/`
3. Run `npm run gen:spec` (API must be running), then `npm run gen:types`
4. Commit the updated `specs/openapi.json` and `src/lib/api-types.ts` alongside the route

Never leave the spec and generated types out of sync with the actual routes.

## Schema changes always require

1. Edit `packages/api/src/db/schema.ts`
2. Run `npm run db:generate` to produce a migration file in `drizzle/`
3. Commit the migration file — never edit existing migrations
4. Update seed if new required data is needed

## Testing expectations

- Every new API route gets a test in `packages/api/tests/routes/`
- Mock `src/db/index.js` via `vi.mock()` for unit-speed route tests
- Run `npm test` before declaring work complete

## Things to avoid

- Committing `.env` files
- Adding packages without a clear reason tied to the current ticket
- Leaving `TODO` comments without a corresponding GitHub Issue number
- Regenerating types and not committing them
- Merging without a `work-history/` entry
