# feat: Logic Lab Frege Grundgesetze profile — value-ranges, Basic Law V, definite description, function abstraction

**Branch slug:** `feat/logic-lab-frege-grundgesetze`
**Status:** queued
**Size:** L
**Depends on:** `feat/logic-lab-frege-higher-order` (shipped 2026-05-08)

## Why

Begriffsschrift Part III gave us identity-of-content + higher-order
quantification but stops well short of Frege's mature 1893–1903
*Grundgesetze der Arithmetik*. The Grundgesetze adds four constructs
that fundamentally change what the system can express:

- **Value-ranges** (`ε̱φ(ε)` / `ὲφ(ὲ)`) — Frege's "course of values"
  operator, treating functions extensionally as sets of input/output
  pairs. The basis of his attempted reduction of arithmetic to logic.
- **Basic Law V** — the abstraction principle that
  `(ε̱f(ε) = ὰg(α)) ↔ ∀x. f(x) = g(x)`. Notoriously inconsistent;
  Russell's paradox follows by instantiation in two steps. The Lab
  becomes a working demonstration of *why* the inconsistency is
  inescapable rather than a verbal description.
- **Definite description** (`\F`, the smooth-breathing operator) —
  "the F", denotes the unique object satisfying F when one exists,
  the value-range itself otherwise.
- **Function abstraction** — explicit `λ`-style binders in the
  object language; Begriffsschrift had argument-position placeholders
  but not first-class functional terms.

Without these, `frege-bs` is "early Frege" only. The Grundgesetze
profile completes the Frege corpus and gives the Lab its first
*demonstration of a logical paradox via the system itself*.

## Scope

**In:**

- AST extensions:
  - `vrange { variable: string; body: FregeContent }` — value-range
    of `λvariable. body`.
  - `descript { variable: string; body: FregeContent }` — `\` for
    "the unique x such that body".
  - `abstract { variable: string; body: FregeContent }` — explicit
    function abstraction.
- `notationProfile: 'begriffsschrift-1879' | 'grundgesetze-1893'`
  field on `FregeFormula`. Drives renderer glyph choice.
- Layout primitives: smooth-breathing for value-ranges, slash mark
  `\` for description, abstraction binder.
- Renderer: profile-aware. Begriffsschrift profile keeps the existing
  visual style; Grundgesetze profile renders the new Grundgesetze
  glyphs (and, optionally, switches the conditional from
  T-junction-with-consequent-on-top to Frege's later horizontal-
  stroke variant).
- Frege → modern translation extensions:
  - Value-range → set comprehension `{ x | F(x) }` (KaTeX).
  - Description → Hilbert-ε or definite description (`ι`).
  - Abstraction → `λ`.
- 8–12 new examples covering each construct in isolation, plus:
  - **The Russell-paradox demo.** A flagged "this derivation
    produces a contradiction" example showing how Basic Law V +
    higher-order comprehension yields `R ∈ R ↔ ¬(R ∈ R)`. Gets a
    distinct visual treatment in the Lab (warning chip, "this is
    the inconsistency Frege didn't see") so users can't accidentally
    treat it as a valid formula.
- Lab page: profile dropdown next to the `Begriffsschrift 1879 · Part III`
  strap-line. Switching profile updates renderer glyphs and may
  affect parser keywords.

**Out (captured separately):**

- Inference chains within Grundgesetze proofs →
  `feat-logic-lab-frege-inference-chains.md`.
- Higher-order validity verdicts under either profile →
  `feat-logic-lab-frege-hol-validity.md`.
- gfnotation export including Grundgesetze glyphs →
  `feat-logic-lab-frege-gfnotation.md` covers Begriffsschrift first;
  Grundgesetze export follows.

## Build sketch

- Extend `frege-types.ts` with the three new `FregeContent` variants
  plus the profile field. Update `orderOf` (value-ranges and
  description bind variables but don't promote order; abstraction
  is HO-flavoured but not strictly higher-order quantification).
- Parser: new keywords `vrange`, `descript`, `fn` (or `lambda`).
  Profile field defaults to `begriffsschrift-1879`; the
  Grundgesetze-only constructs may be parser-warned under the
  Begriffsschrift profile.
- Layout: new sized-tree variants. Smooth-breathing is a small
  spiral glyph drawn over the bound variable's letter; description
  is a leading slash. Abstraction renders like the existing
  concavity but with a different bracket style.
- Renderer: profile-aware fill colours and glyph choice. Add
  `vrangeMark`, `descriptMark`, `abstractMark` primitives.
- Translator: `frege-fol.ts` extended for the new constructs.
  Russell-paradox example surfaces a `paradox: 'russell-via-bl5'`
  flag for the Lab's UI to consume.
- F# round-trip (optional): new DTO fields for the profile and
  new node kinds; OpenAPI regenerate.

## References

- Frege, *Grundgesetze der Arithmetik* (vol. I 1893, vol. II 1903),
  trans. Ebert + Rossberg (Oxford 2013).
- Heck, *Frege's Theorem* (Oxford 2011) — modern reconstruction
  isolating the consistent fragment (HP + second-order).
- Boolos, *The Consistency of Frege's "Foundations of Arithmetic"*
  (1987) — survey of which sub-theories survive Russell.
- Sperberg-McQueen 2023 (Balisage) — keyboarding considerations for
  Grundgesetze beyond Begriffsschrift Part I.
- Wermuth `gfnotation` — supports both profiles; consult its
  symbolic representation when designing the layout primitives.
- Russell's 1902 letter to Frege (in van Heijenoort,
  *From Frege to Gödel*) — the original derivation, useful for the
  paradox-demo example.
