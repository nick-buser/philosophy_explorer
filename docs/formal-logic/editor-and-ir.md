# Editor & Intermediate Representation

**Status:** Draft — first-pass notes, 2026-04-16

How users author formulas, and how multiple logic systems share a
common representation so the app can translate between them.

---

## 1. Shared intermediate representation

A `LogicIR` union type sits below all renderers. Each system owns its
subset; translation functions move between them where translation is
possible.

```ts
type LogicIR =
  | { kind: "TermInclusion";   /* Aristotelian: A, E, I, O with term names */ }
  | { kind: "RegionRelation";  /* Euler / Venn: set relations over regions */ }
  | { kind: "BooleanExpr";     /* Boole / Schröder: ·, +, complement */ }
  | { kind: "PropLogic";       /* Stoic-propositional / modern: ∧, ∨, →, ¬ */ }
  | { kind: "PredicateLogic";  /* Frege / modern: ∀, ∃, functions, relations */ }
  | { kind: "PeirceEG";        /* Existential graph: cuts and lines of identity */ };
```

Translations are **partial and lossy**. That lossiness is a feature —
it's the pedagogical payoff. Concrete examples:

| Statement | Aristotelian | Venn | Boole | Frege / modern |
|---|---|---|---|---|
| "All humans are mortal" | `All H are M` | H ⊆ M | H(1−M) = 0 | `∀x. H(x) → M(x)` |
| "Everyone loves someone" | **breaks** — can't express binary relations | **ambiguous** — no standard 2D encoding | **awkward** — encoding requires arithmetization | `∀x. ∃y. loves(x, y)` |
| "No A is B" | `No A is B` (E form) | A ∩ B = ∅ | A·B = 0 | `∀x. A(x) → ¬B(x)` |

The UI surfaces this explicitly: when a user writes a proposition in
one system and asks for it in another, the app either renders the
translation or shows *why* the translation fails.

---

## 2. Editor tech — what's right and what's wrong

### 2.1 ProseMirror — wrong

ProseMirror is for rich text with block / inline structure. Begriffsschrift
is a 2D tree, not flowing text. Don't use it.

### 2.2 CodeMirror — wrong

CodeMirror is for linear text. Fine for the short-form DSL (see §3
below) but not for editing rendered 2D notation. Don't use it as the
primary editor.

### 2.3 ReactFlow / `@xyflow/react` — right place, wrong level

Already installed (`@xyflow/react` 12.10.2 + `@dagrejs/dagre` 3.0.0).
These are **right** for the *argument-level* graph — propositions as
nodes, inferences as edges, in the argument-graph view (see
`argument-graph.md`).

They are **wrong** for *intra-formula* structure. Formula structure
is strongly typed and positional (the condition stroke has a top and a
bottom, not just "two neighbors"); forcing it into a generic graph
library loses that typing and produces bad layouts.

### 2.4 Custom AST + structured editor — recommended

For formula editing:

- A typed AST per system, with a discriminated union at the top level.
- A structured editor that navigates the AST — keyboard-driven tree
  navigation, cursor as a *position in the tree*, paredit-style
  structural edits (raise, wrap, split, splice).
- SVG rendering directly from the AST, with hit-testing so clicks and
  hovers map back to AST nodes.

Think: Lisp paredit crossed with a mathematical-formula structure
editor. No off-the-shelf library does this well for our use case;
build it ourselves on React.

---

## 3. Parser combinators (short-form text input)

`gfnotation` provides a "short form" text syntax that's much easier to
type than the diagrammatic "symbolic representation." We should
support both:

- **Structural editing** as the primary mode.
- **Text DSL** as an alternative input mode, round-trippable with the
  structural view.

For parsing the DSL:

- **F# side:** [FParsec](https://www.quanttec.com/fparsec/) — mature,
  excellent error messages, works well for our existing stack.
- **TS side:** [parsimmon](https://github.com/jneen/parsimmon) or
  [peggy](https://peggyjs.org/). Parsimmon is lighter-weight;
  peggy generates faster parsers from a PEG grammar file.

Parse on both sides so the DSL can be type-checked by the server and
interactively edited on the client.

---

## 4. Current dependency state

Per `packages/web/package.json` (verified 2026-04-16):

| Installed | Version | Relevance |
|---|---|---|
| `@xyflow/react` | 12.10.2 | Argument-graph view. |
| `@dagrejs/dagre` | 3.0.0 | Graph layout. |
| `@tanstack/react-router` | 1.114+ | Routing. |
| `@tanstack/react-query` | 5.69+ | Server state. |
| `zod` | 3.24+ | Runtime validation at API boundary. |

**Not installed (would need to be added per-ticket):**

- KaTeX / MathJax — for Boolean / Schröder / modern symbolic notation.
- A parser combinator (parsimmon / peggy) — for the short-form DSL.
- A Lean toolchain integration — backend only; not a web dep.
- F# side: FParsec — for F# DSL parsing.

---

## 5. Multi-representation UI

The pedagogical feature: *same statement, different views.*

Sketch of the interaction:

```
┌─────────────────────────────────────────────────────────────┐
│  "All humans are mortal"                         [Edit AST] │
├─────────────────────────────────────────────────────────────┤
│  Aristotelian │ All H are M                                 │
│  Venn         │ [two-circle diagram with H inside M]        │
│  Boole        │ H(1 − M) = 0                                │
│  Peirce EG    │ [cut containing H without M]                │
│  Frege BS     │ [Begriffsschrift rendering]                 │
│  Modern       │ ∀x. H(x) → M(x)                             │
└─────────────────────────────────────────────────────────────┘
```

Editing any row translates and re-renders the others. Where a
translation fails, the row shows an explanation ("Aristotelian term
logic cannot express binary relations; this statement is expressible
but the relation `loves` would not be"). This is where the
*lossiness matrix* (§1) becomes UI.
