The main move is: **treat gfnotation as a mature typographic reference implementation and compatibility target, not as your application’s core model.** Its real value is that Wermuth already solved a large amount of hard layout work for Frege’s notation: primitive line parts, spacing, inference chains, substitutions, formula numbering, and page-break behavior. But your app should still own a typed AST, semantic transforms, editor UX, SVG layout, and F# backend model.

## 1. What gfnotation actually gives you

`gfnotation` is a plain TeX package for Frege’s notation, supporting both the 1879 *Begriffsschrift* style and the later *Grundgesetze der Arithmetik* style. CTAN lists it as version 2.9, GPLv3, included in TeX Live and MiKTeX; the package contains `GFnotation.tex`, docs, and README, and depends on AMS TeX symbols/fonts, `rotate.tex`, and optional `fge` fonts. ([CTAN][1]) ([CTAN][2])

The important part is that Wermuth built **two input languages**:

1. **Symbolic representation**: a low-level, explicit layout language. It codes the notation from uniform pieces, largely in triples, with very fine control over line segments, signs, concavities, substitutions, and alignment.
2. **Short form**: a recursive compact language that TeX expands into the symbolic representation. It is much easier to type than the symbolic representation but is still fundamentally a TeX data-entry notation for typesetting. ([TeX Users Group][3])

That is directly analogous to what you already have in the Peirce and Kripke examples: a user-facing compact notation, a parser, a typed AST, and a renderer. Your Peirce alpha system already has a tiny semantic AST of `sheet`, `cut`, and `atom`, with the short-form DSL treated as input syntax rather than as the core object model.  Your Kripke system similarly separates the modal formula AST from parsing, rendering, and frame data.

So the strong architectural conclusion is:

> **Do not make gfnotation source your internal representation. Build a Frege AST and use gfnotation as an import/export/fidelity oracle.**

## 2. Why not use gfnotation as the canonical model?

Because gfnotation is a **typesetting language**, not a semantic object model.

Wermuth explicitly designed the symbolic representation around layout constraints: all notation symbols are decomposed into uniform pieces; the `\*` macro takes three parameters; horizontal strokes, negations, condition parts, vertical condition strokes, and concavities are coded as physical line parts. ([TeX Users Group][3]) The resulting encoding is powerful, even allowing formulas that do not obey Frege’s rules, which was useful for reproducing errors in the original *Begriffsschrift*. ([TeX Users Group][3])

That is excellent for historical/typesetting fidelity, but it is the wrong center of gravity for your app. Your project is not just “render Frege in TeX”; it is “use a typed logic system with rich visualization, slash commands, custom ASTs, editor affordances, and backend semantics.” In that world, the canonical model should answer questions like:

* Is this a judgment or merely a judgeable content?
* Is this a conditional, and which part is antecedent/consequent?
* Is this a negation attached to a whole content stroke, a subformula, or a quantifier/concavity?
* Is this a universal generality over a variable?
* Is this an inference step, a substitution instance, a named formula, or a displayed theorem?
* Which pieces are semantic, which are historical notation, and which are pure layout?

The gfnotation symbolic representation answers a different question: “Which line segments should TeX place where?”

## 3. The key thing to copy from gfnotation: the two-level design

Wermuth’s best design lesson is not any single macro. It is the **tiering**:

```text
human-ish short form
      ↓
recursive expansion
      ↓
explicit symbolic representation / line-grid representation
      ↓
TeX layout
```

Your app should use a similar but modernized pipeline:

```text
CodeMirror source DSL
      ↓
parser
      ↓
canonical Frege AST
      ↓
semantic validation / transforms / F# backend
      ↓
layout IR
      ↓
SVG/React renderer
      ↓
optional gfnotation export / TeX fidelity render
```

This matches the shape of your existing code. The Peirce editor already uses CodeMirror plus slash-command autocomplete, and its parser turns a compact textual DSL into an AST.   The Peirce renderer then performs a bottom-up sizing pass and top-down positioning pass before drawing SVG.  Frege should reuse that architectural pattern, but not the same layout algorithm.

The Kripke side gives you another useful pattern: a conventional parser with precedence, a typed formula AST, and separate Unicode/KaTeX renderers.   Frege needs that same separation between **parse**, **semantic formula**, **display form**, and **export form**.

## 4. What the Frege AST should look like conceptually

You do not need to reproduce all gfnotation macros in your AST. Instead, model the logical and document structures.

A good conceptual split would be:

```ts
FregeDocument
  sections / examples / chains

FregeInferenceChain
  premises / citedFormula / substitutions / ruleLine / conclusion / formulaNumber

FregeFormula
  judgment?: boolean
  body: FregeContent

FregeContent
  Atom / MathLeaf
  Negation
  Affirmation?          // historically visible, maybe not core modern semantics
  Conditional
  Generality
  Definition
  SubstitutionForm
  SpecialTerminal       // Part III / advanced historical cases
```

The important choice is whether `judgment` belongs inside the formula or outside. I would lean toward **outside**, as a display/assertion wrapper:

```ts
type FregeFormula =
  | { kind: "content"; body: FregeContent }
  | { kind: "judgment"; body: FregeContent };
```

That keeps “this content is asserted” distinct from “this content has a certain truth-functional structure.” That matters because the judgment stroke is not just another object-language connective.

Then have a separate layout layer:

```ts
type FregeLayoutNode =
  | { kind: "row"; ... }
  | { kind: "stroke"; sign?: "none" | "negated" | "affirmed"; ... }
  | { kind: "vertical"; ... }
  | { kind: "concavity"; variable: string; ... }
  | { kind: "mathText"; tex: string; ... }
  | { kind: "formulaNumber"; ... };
```

This layout IR is where gfnotation’s triple-based symbolic representation becomes most useful. Wermuth’s symbolic representation is effectively a line-grid encoding: fixed-width chunks, vertical connectors, horizontal strokes, and special short elements for concavity/generalization. You can borrow that idea without porting TeX macro behavior directly.

## 5. Build a gfnotation compatibility layer, not a gfnotation clone

There are three practical adapters worth building.

### Adapter A: native DSL → Frege AST

This is the editor-first syntax you actually want humans to use. It can be more explicit than gfnotation short form. For example, conceptually:

```text
/judgment
  /if A
  /then /all a f(a)
```

or a denser custom syntax:

```text
judge(if: A, then: all a. f(a))
```

or a hybrid slash-command editor that inserts structured placeholders.

The exact syntax matters less than ensuring it parses cleanly into your canonical AST.

### Adapter B: gfnotation short form → Frege AST

This is useful for importing examples from Wermuth’s docs or other transcriptions. The gfnotation short form is recursive: it can add a signed content stroke, add a signed concavity, combine two formulas into a condition, or insert a previously defined subformula. The user guide formalizes those four short-form constructions and the `.` / `-` / `+` sign vocabulary. ([CTAN][4])

You can implement a subset parser first:

```text
=<sign>{formula}
<sign><sign>{formula}<sign>{formula}
*<sign><character><sign>{formula}
!\macroName args
```

Then map this into your AST. You do not need full TeX expansion on day one. In fact, avoid general TeX expansion initially. Treat macro references as explicit AST placeholders until you decide what macro system your app supports.

### Adapter C: Frege AST → gfnotation short form / symbolic form

This gives you a path to TeX/PDF export and regression testing. It also gives users a way to cross-check your rendering against a known TeX package.

Wermuth’s `\frege` command is for single formulas, while `\formula` is used for formulas in inference chains because inference formulas need an additional position parameter. Inference chains use commands such as `\outof`, `\use`, `\followswith`, `\substituting`, and `\named`. ([TeX Users Group][3]) ([CTAN][4])

So your exporter should distinguish:

```text
inline formula export
display formula export
inference chain export
full document export
```

Do not try to force all of those into one renderer.

## 6. Rendering: SVG first, TeX second

KaTeX is useful for the **leaf math**, not for the whole Frege formula. Your current `KatexFormula` wrapper renders TeX source into HTML using KaTeX.  Keep that for atoms like `f(a)`, `F(α)`, `x = y`, and so on. But the Frege notation itself should be custom SVG: horizontal strokes, vertical strokes, judgment strokes, negation ticks, concavities, formula labels, inference lines.

A good renderer architecture:

```text
Frege AST
  ↓
normalize signs / judgment / condition nesting
  ↓
measure leaf math boxes
  ↓
produce row-based layout IR
  ↓
draw SVG primitives + foreignObject/KaTeX leaves or SVG text leaves
```

The main layout difference from your Peirce renderer is that Peirce alpha graphs are basically nested regions, while Frege is closer to a **right-anchored multiline formula with a stroke network extending leftward**. Your EG layout does a bottom-up rectangle tree with child gaps and cut padding.  Frege needs a row matrix or prefix-tree layout:

```text
rows:
  row 0: stroke segments ... terminal formula
  row 1: vertical connectors ... terminal formula
  row 2: concavity/quantifier ... terminal formula
```

Wermuth rejected `\halign` partly because long inferences need page breaks; Frege did not break formulas, but page breaks could occur inside an inference after the inference line. ([TeX Users Group][3]) This matters for your web renderer too. Do not render an entire proof/inference chain as one huge SVG by default. Render formulas and inference-line blocks as separate layout units so the UI can scroll, fold, paginate, or export intelligently.

The 2023 Balisage paper reaches a similar conclusion for ebook output: SVG is natural for formulas, but long inference chains complicate things; separate SVGs plus CSS positioning may be preferable so page breaking is not destroyed. ([Balisage][5])

## 7. Use existing work as a test suite

This is where gfnotation can save serious time.

Build a small conformance corpus from:

* Wermuth’s TUGboat examples.
* The `GFnotation-doc.pdf` examples.
* The *Begriffsschrift* formula 59-style inference examples.
* Later, a few *Grundgesetze* examples if you choose to support that style.

For each example, store:

```json
{
  "id": "wermuth-formula-59",
  "gfShortForm": "...",
  "gfSymbolic": "... optional ...",
  "expectedAst": "...",
  "expectedFeatures": ["judgment", "conditional", "generality", "substitution", "formula-number"],
  "expectedRenderSnapshot": "..."
}
```

Then create three regression checks:

1. **Parser check**: gf short form parses to expected AST.
2. **Round-trip check**: AST exports back to acceptable gfnotation short form or symbolic form.
3. **Render check**: your SVG visually approximates the gfnotation-produced PDF/SVG.

Wermuth’s package can log short-form formulas as symbolic representation via `\gfbslognotationtrue`, which is useful as an intermediate oracle if you want to compare your AST-to-layout lowering against Wermuth’s own short-form expansion. ([TeX Users Group][3])

## 8. Think carefully about the user-facing DSL

The gfnotation short form is compact but not especially learnable. The Balisage paper explicitly compares Wermuth’s terse short form to a more readable keyboarding language and suggests that Wermuth’s form is shorter, but not necessarily easier to become fluent in. ([Balisage][5])

Given your project goals, I would not expose gfnotation short form as the primary editor syntax. I would expose it as:

* an import/export mode,
* an “advanced/source compatibility” mode,
* a reference view,
* a way to reproduce historical examples.

Your primary CodeMirror experience should probably use slash commands and structured snippets, because that matches your existing editor direction. Your current command registries already expose structural commands and examples through `/...` autocomplete, and the Kripke editor is mostly a duplicate of the EG editor with a different command list.   That suggests a clean next refactor:

```ts
LogicCmEditor({
  value,
  onChange,
  commands,
  languageSupport,
  theme,
})
```

Then Frege gets its own command registry:

```text
/judgment
/content
/condition
/negation
/affirmation
/generality
/definition
/substitution
/inference
/formula-number
/example.frege-59
/export.gfnotation
```

For early development, commands can insert textual snippets. Later, they can insert structured nodes directly if you move toward a ProseMirror/CodeMirror hybrid or a block-based structured editor.

## 9. F# backend: make it the semantic authority

The frontend can parse and preview, but the F# backend should own the normalized canonical model if you want this to become more than a visual toy.

Good backend responsibilities:

```text
Parse native DSL / gf subset
Validate well-formedness
Normalize formulas
Translate to a modern logical target
Store canonical AST
Emit TS DTOs / OpenAPI schemas
Emit render IR or layout-independent AST
Run equivalence / proof / inference checks later
```

The Balisage work is relevant here because it shows a pipeline from a keyboardable linear notation to structured XML, then to SVG and first-order formulas. The author notes that once formulas are in a suitable structured representation, translation to other symbolic-logic syntaxes is straightforward; automated theorem provers can also help catch transcription errors. ([Balisage][5])

For your F# design, that points to this separation:

```text
Frege.Syntax     // concrete syntax trees, parse errors, source spans
Frege.Core       // canonical AST
Frege.Layout     // layout IR independent of React
Frege.Export     // gfnotation, SVG, FOL/TPTP/Lean-ish targets
Frege.Checking   // validity / transformation / inference machinery
```

Then the TS frontend mirrors only the DTOs it needs.

## 10. Grundgesetze support should be a style/profile, not a separate system

gfnotation supports both *Begriffsschrift* and *Grundgesetze* output styles. CTAN explicitly says both output styles are supported. ([CTAN][1]) But the styles differ enough that you should not let the second one pollute your first implementation.

Represent this as a profile:

```ts
type FregeNotationProfile =
  | "begriffsschrift-1879"
  | "grundgesetze-1893";
```

Then divide differences into:

```text
semantic differences       // rare; handle carefully
glyph/layout differences   // renderer/profile
inference-line differences // renderer/profile
special symbols            // profile-specific extension nodes
```

Start with *Begriffsschrift* Part I constructs. Add Part II/III special constructs and *Grundgesetze* later. This mirrors the Balisage project, whose SVG generation covered the notation described in Part I at the time, while later complications from Parts II and III were not yet supported. ([Balisage][5])

## 11. What not to reinvent

You can avoid reinventing:

* The inventory of primitive visual signs.
* The distinction between symbolic representation and short form.
* The inference-chain command concepts.
* The fact that page-break and proof-chain layout are first-class concerns.
* The idea of using a low-level line-grid representation.
* The set of historically necessary edge cases: substitutions, formula numbers, definitions, special Part III terminal symbols, and *Grundgesetze* variants.

You should still reinvent or own:

* The canonical AST.
* The semantic model.
* The editor UX.
* The SVG renderer.
* The parser error model with source spans.
* The F# validation/translation layer.
* The app-level storage model.
* Interactive affordances: hover, select, collapse, explain, transform, compare, export.

## 12. A practical phased implementation

### Phase 1: Minimal Frege formula viewer

Implement:

```text
Atom / MathLeaf
Judgment wrapper
Conditional
Negation
Generality
```

Use SVG primitives and KaTeX leaves. No inference chains yet. Use a native DSL that is easy to parse. Add slash commands.

### Phase 2: gfnotation short-form subset

Parse enough gfnotation short form to import Wermuth’s simple examples:

```text
=<sign>{formula}
<sign><sign>{formula}<sign>{formula}
*<sign><character><sign>{formula}
```

Do not support arbitrary TeX macros yet. Treat terminal math as opaque TeX strings.

### Phase 3: Layout conformance

Add a low-level layout IR inspired by Wermuth’s triple/grid idea. Compare against gfnotation-rendered examples.

### Phase 4: Inference chains

Add formula numbers, cited formula references, substitution tables, inference rule lines, and `named` formulas. Keep each formula/inference segment separately renderable rather than one giant SVG.

### Phase 5: F# normalization and semantic export

Move canonical validation to F#. Add translation to a modern logic syntax. You do not need perfect theorem proving at first; even a partial translation gives you a better internal model.

### Phase 6: Historical breadth

Add Part III special constructs and then *Grundgesetze* profile support.

## 13. Main design warning

The danger is to copy gfnotation too literally. Its symbolic representation is an excellent **rendering IR**, but a poor **semantic IR**. Its short form is an excellent **TeX input shortcut**, but probably a poor **interactive editor language**.

For your project, the best version is:

```text
Frege AST as semantic center
gfnotation as historical/typesetting oracle
SVG as interactive rendering target
F# as validation/translation authority
CodeMirror slash commands as the user-facing construction surface
```

That gets you the benefit of Wermuth’s work without inheriting TeX’s constraints as your product architecture.

[1]: https://ctan.org/pkg/gfnotation "CTAN: Package gfnotation"
[2]: https://ctan.org/tex-archive/macros/plain/contrib/gfnotation "CTAN: /tex-archive/macros/plain/contrib/gfnotation"
[3]: https://www.tug.org/TUGboat/tb36-3/tb114wermuth.pdf "tb114wermuth.dvi"
[4]: https://mirrors.ctan.org/macros/plain/contrib/gfnotation/GFnotation-doc.pdf "GFnotation-doc.dvi"
[5]: https://www.balisage.net/Proceedings/vol28/html/Sperberg-McQueen01/BalisageVol28-Sperberg-McQueen01.html "Balisage: Keyboarding Frege’s concept writing"
