# REFAC-001 — Shared LogicCmEditor for Logic Lab DSLs

**Branch:** `refac/REFAC-001-shared-logic-cm-editor`
**Merged:** 2026-05-03

## What changed

- Added `packages/web/src/logic/LogicCmEditor.tsx` — shared CodeMirror 6 host owning the extension list (`lineNumbers`, `history`, `bracketMatching`, `autocompletion`, default keymap), dark theme, mount-once-and-sync lifecycle, and the slash-command autocomplete factory. Exports a single `SlashCommand` type (`slug`, `label`, `detail?`, `insert`, `cursorOffset?`).
- Added an optional `extraExtensions?: readonly Extension[]` prop on `LogicCmEditor` as the escape hatch for any future system that needs to diverge from the shared CodeMirror config without forking the file.
- Slimmed `EgEditor.tsx`, `KripkeFormulaEditor.tsx`, `FregeEditor.tsx` from ~120 lines each to 11 lines — each now just imports its command list and delegates to `LogicCmEditor`. Public prop shape (`value`, `onChange`, `className`) is unchanged, so `routes/logic.$system.tsx` needed no edits.
- Replaced the three identical `EgCommand` / `KripkeCommand` / `FregeCommand` type definitions in `eg-commands.ts`, `kripke-commands.ts`, `frege-commands.ts` with `import type { SlashCommand } from './LogicCmEditor'`. Array exports (`EG_COMMANDS`, `KRIPKE_COMMANDS`, `FREGE_COMMANDS`) and lookup helpers keep their existing names and per-system content.

Net diff: ~370 lines removed, ~145 added across 7 files.

## Why

Three editor files (Peirce EG, Kripke, Frege) were byte-for-byte identical except for their `*_COMMANDS` import. The author of the second and third had already left `// REFAC ticket` comments anticipating this extraction, and the project plans ~10–20 more logic systems. Continuing to copy-paste the CodeMirror plumbing would have made any future change to the editor host (theme tweak, new extension, behavior fix) an N-way edit instead of a one-line change.

The refactor was deliberately scoped narrow: only the truly identical CodeMirror plumbing moved into the shared file. Per-system parsing, validation, rendering, command lists, toolbar wiring, and example data all stay in their own files because those are where the systems actually diverge and where future divergence is expected.

Closes #(no GH issue cut yet — first REFAC ticket; create one if backfilling)

## Notes for future work

- **`extraExtensions` is unused at merge time.** It exists to preserve the option of per-system divergence (different bracket matching, syntax highlighting, custom keymap, linter integration) without forking the shared file. If a real divergence appears, prefer threading it through `extraExtensions` over copying `LogicCmEditor` — only fork if the shared component itself needs structural changes.
- **`commands` and `extraExtensions` are mount-only.** They are captured by the mount-once `useEffect` and changes after mount are not picked up. No current caller mutates them; if a future system needs hot-swappable commands (e.g. a "lesson mode" that filters the autocomplete list), the editor's `useEffect` deps and dispatch logic will need updating.
- **Adding the next logic system's editor is now ~10 lines** — write `<System>Editor.tsx` as a thin wrapper over `LogicCmEditor` plus a `<system>-commands.ts` file using `SlashCommand`. No CodeMirror imports needed in the per-system file.
- **`findCommand` (in `eg-commands.ts`) was kept un-renamed** to avoid touching `routes/logic.$system.tsx`. If a future REFAC consolidates the three lookup helpers, rename Eg's to `findEgCommand` for consistency with the others.
- **No new tests.** The shared file is pure plumbing exercised by every existing Logic Lab page; the existing 141-test suite passes unchanged. A dedicated `LogicCmEditor.test.tsx` (mounting + slash-command insertion) would be worthwhile if `extraExtensions` ever sees real use.
- **Verification at merge:** `tsc --noEmit` clean, vitest 141/141, all three Logic Lab routes serve 200 in vite dev, and a manual browser smoke confirmed slash-command autocomplete and example-button insertion still work in all three labs.