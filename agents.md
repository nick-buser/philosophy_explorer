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

1. Update or add DTO types in `packages/api-fsharp/.../Domain/Dtos.fs`
2. Update or add route module in `packages/api-fsharp/.../Routes/`
3. Register in `Program.fs` and add to `.fsproj` compile order
4. Run `npm run gen:spec` (API must be running), then `npm run gen:types`
5. Commit the updated `packages/specs/openapi.json` and `packages/web/src/lib/api-types.ts`

Never leave the spec and generated types out of sync with the actual routes.

## Schema changes always require

1. Update the CREATE TABLE statements in `Db/Seed.fs`
2. Update the corresponding domain types in `Domain/Types.fs`
3. Update DTOs in `Domain/Dtos.fs` if the change affects API responses
4. Re-run `npm run db:seed` to recreate the dev database
5. Update seed JSON files in `data/seed/` if new data is needed

## F# project conventions

- **Compilation order matters.** Files in `.fsproj` must be listed in dependency order.
  Types before queries, queries before routes, routes before Program.fs.
- **CLIMutable attribute** is required on all types that Dapper deserializes.
- **JsonPropertyName** attributes on DTO fields ensure camelCase JSON output matching
  the original TypeScript API exactly.
- **Nullable<int>** for optional integer columns (SQLite returns these as nullable).
- **Option.ofObj** to convert nullable strings from Dapper to F# options in DTOs.

## Testing expectations

- Integration tests should hit the running API server and verify response shapes
- Web tests use vitest + jsdom + testing-library
- Run `npm test` before declaring work complete

## Things to avoid

- Committing `.env` files
- Adding NuGet packages without a clear reason tied to the current ticket
- Leaving `TODO` comments without a corresponding GitHub Issue number
- Regenerating types and not committing them
- Merging without a `work-history/` entry
- Breaking the F# compilation order in `.fsproj`
