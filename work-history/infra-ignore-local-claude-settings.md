# INFRA — ignore local Claude Code settings, keep shared config tracked

**Branch:** `infra/ignore-local-claude-settings`
**Merged:** (pending)

`.claude/settings.json` and `.claude/settings.local.json` had accumulated as
untracked files in the working tree with no `.gitignore` entry for either.

## What changed

- `.gitignore` — added `.claude/settings.local.json`.
- `.claude/settings.json` — added to the repo (tracked), since it's a small
  shared permission allowlist with no secrets in it.
- Also removed (not part of this commit; plain filesystem cleanup, the
  directory was never tracked): a stray `.railway-config-pull-20368/`
  directory containing a placeholder `railway.ts` scaffold left over from an
  earlier Railway config pull.

## Why

`.claude/settings.local.json` is a 227-line machine-specific permission
allowlist (curl/npm/dotnet/etc. command patterns tuned to this laptop) — not
something other contributors or future clones should inherit. `settings.json`
is the opposite: a handful of shared, harmless command allowlist entries
(`tea pr list`, `ping`, etc.) that are useful to keep versioned so a fresh
clone gets the same baseline permissions.

## Notes for future work

- If `.claude/settings.local.json` ever needs a genuinely shared rule, move
  that specific entry into `.claude/settings.json` rather than tracking the
  whole local file.
