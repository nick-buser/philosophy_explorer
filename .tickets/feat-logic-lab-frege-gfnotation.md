# feat: Logic Lab Frege gfnotation interop — import + export Wermuth's TeX format

**Branch slug:** `feat/logic-lab-frege-gfnotation`
**Status:** queued
**Size:** M
**Depends on:** `feat/logic-lab-frege-higher-order` (shipped 2026-05-08)

## Why

Stephan Wermuth's plain-TeX `gfnotation` package (CTAN; TeX Live;
TUGboat 36-3, 2015) is the de-facto fidelity oracle for Frege
typesetting. It supports both the 1879 Begriffsschrift style and the
1893 Grundgesetze style, with two input languages: a low-level
*symbolic representation* and a higher-level *short form*. Wermuth's
package is what every published modern reproduction of Frege's
notation actually uses for typesetting.

The design memo at `docs/formal-logic/frege-begriffsschrift.md` §5
identifies three adapters worth building:

- Adapter A: native DSL → Frege AST (this is what the Lab already
  has).
- Adapter B: gfnotation short form → Frege AST.
- Adapter C: Frege AST → gfnotation short form (and onward to TeX).

This ticket implements **B and C** in the Begriffsschrift profile.
Together they make the Lab a useful pedagogical surface for users
working from Wermuth's docs, Schlimm 2017, or Sperberg-McQueen 2023:
paste a gfnotation snippet, see it rendered + translated; or compose
in the Lab and export TeX-ready source for a paper.

Per the design memo: gfnotation is the **rendering oracle** and the
**TeX export target**, not the canonical model. Adapters only.

## Scope

**In:**

- Adapter B (gfnotation → AST):
  - Parser for the gfnotation short-form recursive grammar:

    ```
    short := =<sign>{formula}                     content stroke
           | <sign><sign>{formula}{formula}        condition
           | *<sign><character><sign>{formula}     concavity
           | !\<macroname> <args>                  named formula reference
    ```

    Signs: `.` (none), `-` (negation), `+` (judgment-bar / extra
    content stroke depending on context). Macros parse as
    placeholders pending the inference-chains ticket; raw TeX inside
    formula leaves is preserved as opaque text for the atom name
    (matching Wermuth's intent that the leaf is TeX-typeset math).
  - Mapping into the Frege AST node-by-node.
- Adapter C (AST → gfnotation):
  - Tree walk producing the corresponding short-form string.
  - For atoms with non-trivial leaf math (e.g. `f(a)`), emit the
    KaTeX-source-style fragment as the leaf.
- Round-trip test corpus:
  - 10–15 examples drawn from Wermuth's TUGboat paper +
    `GFnotation-doc.pdf`. For each one: short form → AST → renderer
    matches expected primitives; AST → short form round-trips.
  - Schlimm 2017's worked examples for axioms 1, 2, 8, 28, 31.
- Lab page: "Import gfnotation" button in the toolbar (textarea
  modal). Adds the result to the editor. "Export gfnotation" button
  copies the current formula's short form to the clipboard.
- Optional: a small "TeX preview" tab using `gfnotation`-inspired
  rendering — or simply showing the short-form source so users can
  copy it into a real TeX run.

**Out (captured separately):**

- Inference-chain commands (`\formula`, `\outof`, `\use`,
  `\followswith`, `\substituting`, `\named`) — those need the
  `FregeProof` type; covered in
  `feat-logic-lab-frege-inference-chains.md`.
- Grundgesetze profile glyph mapping — extends after
  `feat-logic-lab-frege-grundgesetze.md`. The Adapter B/C interfaces
  are profile-aware, so the Begriffsschrift base lands first and
  Grundgesetze plugs in.
- Full TeX-typesetting via an actual TeX run (server-side or
  client-side via tectonic / latex.js) — opt-in tooling, not in
  scope here.

## Build sketch

- New `frege-gf-parser.ts`: recursive-descent parser for the
  short-form grammar above. Emits the same `FregeContent` AST as
  the native DSL parser.
- New `frege-gf-emitter.ts`: tree walk producing a short-form
  string. Mirrors the precedence handling in `frege-fol.ts` —
  parenthesisation isn't a thing in gfnotation (the curly-brace
  grouping is exhaustive), but sign decisions are stateful: the
  outer sign chains downward, inner contents flip signs based on
  scroll polarity.
- Test corpus under
  `packages/web/src/logic/__tests__/fixtures/gfnotation/`. Each
  fixture is a JSON object: `{ short: string; expectedAst: ...;
  notes?: string }`.
- Toolbar buttons in `FregeBsLab` for import/export. Import opens a
  small modal; export copies to clipboard with a toast.
- Tests:
  - `frege-gf-parser.test.ts` — short-form → AST.
  - `frege-gf-emitter.test.ts` — AST → short-form, then re-parse
    round-trip.

## References

- Wermuth, *Typesetting the Begriffsschrift in plain TeX* (TUGboat
  36-3, 2015): https://www.tug.org/TUGboat/tb36-3/tb114wermuth.pdf
- `gfnotation` CTAN page: https://ctan.org/pkg/gfnotation
- `GFnotation-doc.pdf` user guide:
  https://mirrors.ctan.org/macros/plain/contrib/gfnotation/GFnotation-doc.pdf
- Sperberg-McQueen, *Keyboarding Frege's concept writing* (Balisage
  2023):
  https://www.balisage.net/Proceedings/vol28/html/Sperberg-McQueen01/BalisageVol28-Sperberg-McQueen01.html
- Schlimm, *On Frege's Begriffsschrift notation for propositional
  logic* (2017):
  https://www.cs.mcgill.ca/~dirk/schlimm2017-begriffsschrift-prefinal.pdf
- `docs/formal-logic/frege-begriffsschrift.md` §5 — design memo
  laying out the adapter strategy and the warning against using
  gfnotation as the canonical model.
