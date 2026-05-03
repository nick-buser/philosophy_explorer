# INFRA-004 — Route-level code-splitting for the Logic Lab

**Branch:** `infra/INFRA-002-route-code-splitting`
**Merged:** 2026-05-03

## What changed

- **Stripped `routes/logic.$system.tsx`** from 2175 lines to 7 lines.
  The file now contains only the route definition with a `.lazy()` call;
  all component code is gone.

- **New `routes/logic.$system.lazy.tsx`** — the TanStack Router lazy
  counterpart using `createLazyRoute('/logic/$system')`. Declares one
  `React.lazy(...)` import per system and dispatches to the correct lab
  in `LogicSystemPage` based on the `$system` slug. The stub / unknown
  system guard lives here too. A `LabLoadingShell` provides the
  `Suspense` fallback.

- **New `logic/labs/` directory** — one self-contained file per system:

  | File | Lab |
  |---|---|
  | `PeirceEgLab.tsx` | Peirce Existential Graphs (alpha) |
  | `KripkeLab.tsx` | Kripke modal logic |
  | `FregeBsLab.tsx` | Frege Begriffsschrift |
  | `AristotelianLab.tsx` | Aristotelian syllogistic |
  | `MedievalLab.tsx` | Medieval modal syllogistic + sorites |
  | `ModernFolLab.tsx` | Modern first-order logic (truth table + tableau) |
  | `shared.tsx` | `SectionHeading` + `ImportToggle` (used by Aristotelian and Medieval) |

  Each file is a standalone module: its own imports, its own local
  helpers. Nothing is shared between files except via `shared.tsx`.
  Each exports a single default component with signature
  `({ system: LogicSystem }) => ReactElement`.

## Why

By FEAT-012 the web build was ~1.37 MB pre-gzip / ~418 kB gzipped, with
all six Logic Lab systems' parsers, renderers, validity engines, KaTeX
rendering code, and layout algorithms bundled into the initial JS
payload for every route — including the philosopher graph, school pages,
and curricula, which have nothing to do with the Lab.

The fix is the two-level split described in `lab-status.md` §3:

1. **Route-level** (TanStack Router `.lazy()` + `createLazyRoute`): the
   entire Logic Lab chunk is deferred until the user navigates to
   `/logic/$system`. Other routes pay zero cost.
2. **Per-system** (`React.lazy` inside the lazy route): visiting
   `/logic/kripke` loads only the Kripke lab chunk; the five other
   systems' modules never download.

## Notes for future work

- **Adding a new lab system** follows a three-step pattern that requires
  no changes to the router:
  1. Create `src/logic/labs/YourLab.tsx` with a default export
     `({ system: LogicSystem }) => ReactElement`.
  2. Add `const YourLab = lazy(() => import('../logic/labs/YourLab'))`
     to `logic.$system.lazy.tsx`.
  3. Add a slug branch to the ternary in `LogicSystemPage`.

- **The compare view (FEAT-013 candidate)** — `logic-explorer-tab.md`
  sketches a `/logic/compare` route. If built, that route should follow
  the same `.lazy()` / `createLazyRoute` pattern. The two renderer
  imports it needs (Frege + FOL) are now in isolated chunks, so it can
  import them directly without re-bundling all six systems.

- **Bundle numbers not re-measured here.** The pre-split baseline was
  ~1.37 MB pre-gzip per FEAT-012. A `npm run build` after this change
  will show the reduction. The expectation is that the main chunk
  shrinks substantially (losing all logic module imports) and six new
  smaller chunks appear under `/assets/`.

- **No test changes were needed.** The logic algorithm files
  (`fol-validity.ts`, `aristotelian-validity.ts`, etc.) are unchanged;
  only the route/component boundary moved. Existing 406/406 vitest suite
  covers algorithm correctness; route structure is verified by `tsc
  --noEmit` + `npm run build`.
