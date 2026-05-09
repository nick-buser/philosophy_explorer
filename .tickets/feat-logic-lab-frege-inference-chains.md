# feat: Logic Lab Frege inference chains — formula numbers, citations, substitution tables

**Branch slug:** `feat/logic-lab-frege-inference-chains`
**Status:** queued
**Size:** M–L
**Depends on:** `feat/logic-lab-frege-higher-order` (shipped 2026-05-08)

## Why

Frege's *Begriffsschrift* is not a list of formulas — it is a
sequence of numbered theorems linked by inference rule lines, with
substitutions tabulated explicitly. The Lab can render any *formula*
Frege wrote but cannot present a *proof* the way Frege wrote it:

```
(1)  ┃─ a → (b → a)                                  axiom 1
(2)  ┃─ (c → (b → a)) → ((c → b) → (c → a))           axiom 2
       ─────────────────────────────────────
(3)  ┃─ ((d → (b → a)) → ((d → b) → (d → a)))       (1) + (2), substituting c↦d
…
```

Wermuth's `gfnotation` package treats inference chains as a first-
class layout problem (`\formula`, `\outof`, `\use`, `\followswith`,
`\substituting`, `\named`); without that machinery the Lab's `frege-bs`
system stops short of presenting Frege's actual mathematical work.

This is **layout fidelity**, not proof checking — the engine does not
verify that the cited inference is sound. Showing Frege's derivations
as he wrote them is meaningful on its own and unblocks teaching uses
that go beyond per-formula well-formedness.

## Scope

**In:**

- New `FregeProof` type:
  - `steps: FregeProofStep[]`
  - Each step: `{ number: string; formula: FregeFormula; justification: FregeJustification }`
  - Justification variants: `axiom { name: string }`,
    `derived { from: string[]; rule: 'modus-ponens' | 'generalization' | 'substitution'; substitutions?: Record<string,string> }`,
    `definition { defines: string }`, `named { label: string }`.
- DSL extension: a proof block syntax separate from a single formula.
  Sketch:

  ```
  proof barbara
    (1) |- a -> (b -> a)                       -- axiom 1
    (2) |- (c -> (b -> a)) -> ((c -> b) -> (c -> a))   -- axiom 2
    (3) |- ((d -> (b -> a)) -> ((d -> b) -> (d -> a))) -- mp (1) (2) [c -> d]
  end
  ```

- Layout: stacked formula-blocks separated by horizontal inference
  lines. Each block emits its own `LaidOut`; the proof layout is a
  vertical compose with labelled gutter columns for formula numbers
  on the left and justifications on the right.
- Renderer: `FregeProofRenderer` reusing `FregeRenderer` for
  individual formula blocks. Inference lines are wide horizontal
  rules with a substitution table rendered alongside when present.
- 5–8 example proofs from Begriffsschrift:
  - Frege's derivation of theorem (8) from (1), (2).
  - Theorem (28) (contraposition).
  - Proof of universal-instantiation as theorem (58).
  - One Part III proof using identity-of-content (axiom 52
    + Leibniz substitution).
- Lab page: proof-mode toggle on `FregeBsLab`. Existing single-
  formula view preserved; proof view is a new tab.

**Out (captured separately):**

- Proof *checking* (verifying the cited inference rule actually
  applies). Current scope is layout only; checking lives in the
  Lean integration entry of `lab-roadmap.md`.
- Grundgesetze inference chains (different rule set) →
  `feat-logic-lab-frege-grundgesetze.md` will inherit this layout
  layer once both ship.

## Build sketch

- New `frege-proof-types.ts` with `FregeProof` + `FregeProofStep` +
  justification ADT.
- Parser: a `parseFregeProof` entrypoint that recognises the
  `proof <name> ... end` block. Inside, each line is `(N) <formula>
  -- <justification>`. Justification tail uses a small grammar:
  - `axiom <name>`
  - `mp <ref> <ref>`            modus ponens
  - `gen <ref> [v]`              generalization on variable v
  - `subst <ref> [a -> b, ...]`  substitution
  - `def <name>`                 definition
- Layout: `frege-proof-layout.ts`. Top-down: lay out each formula's
  block via `layoutFormula`, then stack with inter-block padding and
  a horizontal rule between dependent steps. Compute gutter widths
  for numbers + justifications.
- Renderer: `FregeProofRenderer.tsx`. Reuses `<PrimitiveShape>` for
  per-formula rendering; adds gutter columns and inference lines.
- Lab page: tab control between "Single formula" and "Proof". Slash
  commands `/proof.barbara`, `/proof.contraposition`, etc.
- Tests: `frege-proof-parser.test.ts`, `frege-proof-layout.test.ts`.

## References

- Frege, *Begriffsschrift* §13–31 — the actual proofs.
- Wermuth, *Typesetting the Begriffsschrift in plain TeX* (TUGboat
  2015): https://www.tug.org/TUGboat/tb36-3/tb114wermuth.pdf —
  §"Inference chain commands" details `\formula`, `\outof`, `\use`,
  `\followswith`, `\substituting`, `\named`.
- Schlimm, *On Frege's Begriffsschrift notation for propositional
  logic* (2017) — modern accounting of the 9-axiom system and the
  inference rules used.
- Sperberg-McQueen, *Keyboarding Frege's concept writing* (Balisage
  2023) — discusses inference-chain layout including page-break
  behaviour.
- `docs/formal-logic/frege-begriffsschrift.md` §6, §12-Phase 4.
