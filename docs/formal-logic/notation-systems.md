# Notation Systems

**Status:** Draft — first-pass notes, 2026-04-16

Rendering historical and modern logical notation in the browser. The
Frege thread is the hard one; most of the rest is easy by comparison.

---

## 1. Frege's Begriffsschrift

### 1.1 The reference

The best modern typesetting of Begriffsschrift is the `gfnotation` package:

> Udo Wermuth, "Typesetting the 'Begriffsschrift' by Gottlob Frege in
> plain TeX." *TUGboat* **36**(3), 2015, pp. 243–ff.

`gfnotation` is **plain TeX**, not LaTeX. It is not a drop-in for MathJax
or KaTeX. What it *is* useful as: a precise geometric specification of
how the diagrams should look — stroke lengths, spacing, how the judgment
stroke composes with the condition stroke, how generality concavities
interact with Gothic letters. Treat the paper as a spec, not a runtime
dependency.

### 1.2 Rendering strategies

| Strategy | How | Tradeoffs |
|---|---|---|
| **Server-side TeX → SVG** | F# backend runs plain TeX with `gfnotation`, converts via `dvisvgm` / `pdf2svg`, caches by content hash, serves as static assets. | Most reliable. Zero interactivity. Slow cold-render. Adds a TeX toolchain to the server. |
| **AST → SVG port** (recommended) | React component tree takes a formula AST and recursively lays out strokes. Primitives: judgment stroke (vertical), content stroke (horizontal), condition stroke (branching downward), negation (short vertical tick on content), generality (concavity with Gothic letter). | Interactive: click a subformula, hover for readings, edit in place. More work upfront; gfnotation paper does the spacing math for us. |
| **WASM TeX** | Run plain TeX in the browser via SwiftLaTeX / TeX.js. | Overkill for rendering. Reasonable only if live-authoring in `gfnotation` short form is a first-class goal. Skip unless that's the feature. |

**Recommendation:** AST → SVG. This lines up with the existing React /
TypeScript stack, plays well with the planned structured editor (see
`editor-and-ir.md`), and gives interactivity that server-rendered SVGs
can't match without heavy postprocessing.

### 1.3 Begriffsschrift primitives

Minimum viable primitive set for an initial renderer:

- **Judgment stroke** — vertical bar left of content stroke; turns a
  content into an asserted judgment.
- **Content stroke** — horizontal line; carries a proposition.
- **Condition stroke** — vertical stroke branching the content stroke
  downward to a subordinate content; encodes material implication.
- **Negation stroke** — short vertical tick on the content stroke.
- **Generality** — concavity in the content stroke containing a Gothic
  letter; encodes universal quantification over that letter.
- **Identity of content** `≡` — used in Part III; see
  `formal-verification.md` §Note on Grundgesetze for caveats.

---

## 2. Pre-Fregean systems — what Frege was countering

Frege's most direct target is not Aristotle. It is the **Boolean
algebraic tradition** that dominated late-19th-century logic: Boole,
De Morgan, Jevons, Peirce, Venn, Schröder. He thought they had the
wrong picture of the relationship between logic and mathematics.
Aristotle he largely respected.

### 2.1 Aristotelian syllogistic

Term logic, originating in the *Prior Analytics*, refined heavily by
medieval logicians.

- Four categorical proposition forms: A (universal affirmative), E
  (universal negative), I (particular affirmative), O (particular
  negative).
- Inference via syllogisms: two premises + conclusion, fixed patterns
  (Barbara, Celarent, Darii, Ferio, …).
- Typographically trivial: prose or letter schemas like "All S is P."

### 2.2 Scholastic refinements

13th–14th century work on *suppositio* (reference), *consequentia*
(inference), and modal logic (Ockham, Buridan). Semantically
sophisticated, notationally still prose. Belongs in prose notes with
occasional schema diagrams.

### 2.3 Stoic propositional logic

Chrysippus and the early Stoa. Operates on whole propositions rather
than terms; anticipates modern propositional logic:

```
If A then B.
A.
Therefore B.
```

Unifying both strands (Stoic propositional + Aristotelian term) under
one system is one of Frege's achievements — though the direct Stoic
influence on Frege is unclear.

### 2.4 Leibniz's calculus ratiocinator

Frege cites Leibniz in the Begriffsschrift preface. Leibniz sketched
an algebraic logic — arithmetizing concepts via prime factorizations,
symbolic combination rules — that never reached a worked-out published
form. Typographically: algebraic, linear.

### 2.5 Boole and the algebraic tradition

Boole (1847, 1854) recast logic as algebra over classes (or
propositions):

```
x · y     (AND / class intersection)
x + y     (OR / class union, sometimes with disjointness caveats)
1 − x     (NOT)
x(1 − y) = 0    ("All x are y")
```

Extended and generalized by De Morgan, Jevons, Peirce, and Schröder.
Frege's specific critique: this obscures the logical structure of
*quantification* (generality) and makes logic parasitic on arithmetic
when it should be the other way round.

Typographically: plain algebra. KaTeX renders it trivially.

### 2.6 Peirce existential graphs

Peirce's EG systems (alpha / beta / gamma, 1880s–1900s) are the richest
2D-diagrammatic foil to Frege. **Also** motivated by making logical
structure visible, **also** 2D, but they arrive at a completely different
visual language:

- **Alpha** — propositional. Writing a proposition asserts it; enclosing
  it in an oval ("cut") negates it. Nesting handles implication.
- **Beta** — first-order. Adds "lines of identity" connecting juxtaposed
  predicates.
- **Gamma** — modal and higher-order; less worked-out.

Geometry is simpler than Frege's — ovals and lines. A natural second
notation to support once the SVG infrastructure exists.

For the modern EG revival and a detailed treatment of visual syntax
and proof rules, see
[`../case-studies/peirce/existential-graph-scholarship.md`](../case-studies/peirce/existential-graph-scholarship.md).

### 2.7 Venn diagrams

Popular visualization of Boolean class logic (1880). Overlapping circles;
shading for emptiness; marks for non-emptiness. Easy SVG target. Useful
pedagogically as the midpoint between prose term-logic and algebraic
Boolean logic.

### 2.8 Schröder

Schröder's *Vorlesungen über die Algebra der Logik* (1890–1905) is the
mature synthesis of the Boolean tradition and the extended relational
algebra. Heavily used by Löwenheim and early Hilbert. This is what
Frege was up against in terms of *actual adoption* — the Begriffsschrift
was barely read until Russell.

---

## 3. Comparison matrix

| System | Era | Notation style | Key primitive | Render approach |
|---|---|---|---|---|
| Aristotelian syllogistic | ~350 BCE → | Prose + letter schemas | Categorical proposition | Prose |
| Scholastic (suppositio) | 13th–14th c. | Latin prose | Term reference | Prose |
| Leibniz | 17th c. | Algebraic sketches | Concept combination | KaTeX |
| Stoic (Chrysippus) | 3rd c. BCE | Prose | Whole-proposition inference | Prose |
| Boole | 1847–1854 | Algebraic | Class / proposition algebra | KaTeX |
| Venn | 1880 | 2D diagrammatic | Region overlap | SVG (easy) |
| Peirce EG | 1880s–1900s | 2D diagrammatic | Cut + line of identity | SVG (moderate) |
| Schröder | 1890–1905 | Algebraic (extended) | Relational algebra | KaTeX |
| Frege (Begriffsschrift) | 1879 | 2D diagrammatic | Judgment + content stroke | SVG (hard) / gfnotation |
| Modern (Peano / Russell →) | 1889 → | Linear symbolic | ∀ ∃ ¬ ∧ ∨ → | KaTeX (trivial) |

---

## 4. What Frege is actually upending

The Begriffsschrift is not just a new notation — it's a reconception
of what logic *is*. A compact way to state the shifts:

| Old assumption | Frege's move |
|---|---|
| Logic is about terms | Logic is about functions and arguments |
| Inference is template-matching | Inference is derivation from axioms |
| Quantification is implicit in the form | Quantification is explicit and scoped |
| Structure is linear | Structure is hierarchical |
| Meaning is tied to natural language | Meaning is tied to formal structure |

The comparison UI's pedagogical payoff is showing these shifts *in
practice* — e.g. writing "everyone loves someone" and watching
Aristotelian term logic fail to express it, Venn become ambiguous,
Boolean algebra grow awkward, and Frege render it cleanly. See
`editor-and-ir.md` §Multi-representation UI.
