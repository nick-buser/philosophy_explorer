# feat — Logic Lab: Frege higher-order (Begriffsschrift Part III)

**Branch:** `feat/logic-lab-frege-higher-order`
**Merged:** TBD

Closes the `frege-bs` deferrals from `lab-status.md` §5
("Higher-order content; identity-of-content `≡`") and the "Full Frege
higher-order system" entry in `lab-roadmap.md` §"Optional /
lower-priority". Brings Frege up to higher-order logic with
identity-of-content, completing it as a serious counterpart to Modern
FOL on the 2D-structural visualisation track rather than a
propositional-plus-`all` curiosity.

## What changed

### AST
- `frege-types.ts` — three new variants:
  - `iden { left, right }` for Begriffsschrift Part III's `A ≡ B`
  - `exists { variable, sort, body }` for `∃x.body`
  - `forall` and `exists` now carry a `sort: 'individual' | 'predicate'`
    field, inferred from the variable's first-letter case
    (lowercase = individual, uppercase = predicate). `inferQuantifierSort`
    is the helper.
- New `orderOf(formula)` returns `propositional` / `first-order` /
  `higher-order` for the Lab's order chip.

### Parser
- `frege-parser.ts` — new grammar level:

  ```
  content   := condExpr ('==' content)?         right-assoc
  condExpr  := unary    ('->' condExpr)?        right-assoc
  unary     := '~' unary
             | 'all'    ident '.' content
             | 'exists' ident '.' content
             | primary
  ```

  `==` sits at the lowest precedence (looser than `->`), so
  `A -> B == C` parses as `(A -> B) == C`. `exists` is a keyword
  parallel to `all` and follows the same wide-scope convention.
  Sort inference is purely typographic — capital first letter ⇒
  predicate sort.

### Layout + renderer
- `frege-layout.ts` — `exists` lowers to `not(forall(not(body)))` in
  the sizer, so the renderer ends up emitting Frege's actual derived
  shape (outer ¬-tick, concavity, inner ¬-tick, body) rather than an
  invented `∃` glyph. The `cavity` primitive now carries `sort`; the
  new `idenSign` primitive emits the triple-bar `≡` between two
  contents on a shared row. `iden`'s subcontents lay out
  side-by-side: each emits its own leading content stroke, giving the
  visual continuity Frege's diagrams have.
- `FregeRenderer.tsx` — `idenSign` becomes a centred `≡` glyph.
  Cavity bound-letter colour shifts from gold (`QUANT_INDIV`) to cyan
  (`QUANT_PRED`) when the sort is `predicate`, with a slight font-weight
  bump. Strokes and ticks are unchanged.

### Frege → FOL/HOL translator
- `frege-fol.ts` (new) — produces a linear formula in either Unicode
  (`fregeToUnicode`) or KaTeX (`fregeToKatex`) form. Mirrors the
  precedence/parenthesization machinery in `fol-render.ts` but kept
  separate for two reasons: (a) `iden` translates to `\equiv`, not
  `\leftrightarrow` — preserving Frege's typographic distinction
  between identity-of-content and material biconditional; (b)
  predicate-sort quantifiers render with the user's capital letter as
  given, letting the bound-variable case carry the higher-order
  signal without an extra annotation. The Lab's order chip surfaces
  the prop / FO / HO classification independently.

### System data
- `data/logic-systems.ts` — `frege-bs` row updated. Added three new
  primitives (Existential (derived), Identity of content,
  Higher-order generality). Eight new examples covering the Part III
  surface:
  - `existential-basic` — `|- exists x. F(x)`
  - `existential-as-derived` — `|- exists x. F(x) == ~all x. ~F(x)`
  - `iden-reflexive` — `|- a == a` (Frege axiom 54)
  - `iden-substitution` — `|- (a == b) -> P(a) -> P(b)` (axiom 52)
  - `leibniz-indiscernibility` — `|- (a == b) -> all F. F(a) -> F(b)`
  - `ho-trivial-identity` — `|- all F. F(a) -> F(a)`
  - `ho-comprehension` — `|- all x. exists F. F(x)`
  - `ho-universal-property` — `|- exists F. all x. F(x)`
  - `iden-contraposition` — `|- (p -> q) == (~q -> ~p)`
- Renamed `keyPrimitive` to `judgment · content stroke · concavity · ≡`.
- History string extended with a sentence on Part III.

### Commands
- `frege-commands.ts` — three new slash commands `/exists`, `/iden`,
  `/forall-pred` insert the canonical templates.

### Lab page
- `labs/FregeBsLab.tsx` — added an "Equivalent linear formula" panel
  (KaTeX) below the renderer and an order chip (propositional /
  first-order / higher-order, colour-coded grey/amber/cyan to match
  the cavity colours) on the rendering panel. Default example
  switched from `conditional` to `leibniz-indiscernibility` so a
  fresh visitor sees the new higher-order capability immediately.
  Footer hint extended to mention `==`, `exists`, and the
  capital-letter convention.

### Tests
- `__tests__/frege-parser.test.ts` — 17 new cases covering `exists`,
  `==` precedence + right-associativity, predicate-sort inference,
  and updated existing cases for the new `sort` field on `forall`.
- `__tests__/frege-layout.test.ts` — 6 new cases: predicate-sort
  cavity, `exists` lowering to ¬∀¬ (one cavity + two ticks), the
  `idenSign` primitive, mixed iden-under-conditional shape, bbox
  containment for an iden formula.
- `__tests__/frege-fol.test.ts` (new) — 21 cases covering the
  translation of all new constructs in both Unicode and KaTeX,
  precedence/parenthesization round-trips, and the higher-order shapes.
- `__tests__/frege-system-data.test.ts` — extended to lay out and
  translate every example; asserts the example library covers all
  three orders (prop / FO / HO) and the new primitive list.

Test count after this ticket: **1044/1044 passing.** New tests: 45
(17 parser + 6 layout + 21 fol + 1 net layout-bbox + 2 system-data
including the order-coverage check). `npx tsc --noEmit` is clean and
`npm run build` succeeds; the `FregeBsLab` chunk grew from `~7 kB`
(propositional + ∀) to `16.58 kB / 5.61 kB gzip`.

## Why

The roadmap entry is direct: with Peirce Beta closed, the next
visible gap on the 2D-structural row of the system × visualisation
matrix was Frege's own higher-order extensions. Without identity-of-
content the system reads as an incomplete predicate logic; without
predicate-variable quantification it reads as first-order, which
misses the historically important point that Frege is the *first*
higher-order logic.

The shape of this ticket fits the same "extend an existing system to
its mature form" arc as Peirce Beta — same DSL, same renderer
substrate, more primitives, more examples, plus a translation panel
that pairs the diagrammatic surface against linear FOL/HOL. The
higher-order side gives the Lab a notion of *order* it didn't surface
before; the order chip externalises that classification per formula
so the user can see when a quantifier promotes to predicate scope.

Higher-order is a natural pollinator for a future `/logic/compare`
view: Frege ↔ Modern FOL is the obvious first pair (already mentioned
in `lab-roadmap.md` §Short term · Compare view), and now Modern FOL
gains a *higher-order* counterpart in Frege rather than just a
notational variant of the same FO content.

## Notes for future work

### Open follow-ups

- **HOL validity engine.** Out of scope for this ticket per design.
  A bounded Henkin-style finite-model checker (domain size 1–3,
  enumerate predicate-variable interpretations) would give verdicts
  + countermodels for higher-order formulas. Validity is undecidable
  in HOL so this is necessarily incomplete; the bound is what makes
  it tractable. Sized at ~M.
- **Grundgesetze profile.** Begriffsschrift Part III is now in. The
  full Grundgesetze adds value-ranges (`ε̱φ(ε)` / `ὲφ(ὲ)`), Basic
  Law V (notoriously inconsistent — Russell's paradox follows
  immediately), definite description (`\F`), and explicit function
  abstraction. A `notationProfile: 'begriffsschrift-1879' |
  'grundgesetze-1893'` field on `FregeFormula` plus a Lab
  profile-toggle would slot in cleanly. The Russell-paradox
  demonstration is its own pedagogical hook.
- **Predicate-variable arity discipline.** A bound predicate
  variable used inconsistently (e.g. `all F. F(a) -> F(a, b)`) is
  currently accepted by the parser. A post-parse arity-coherence
  check would surface this as a soft warning. ~30 LOC.
- **Greek capital glyphs in cavities.** The renderer keeps the user's
  Latin capital (with cyan fill + bold) for predicate-sort cavities.
  Frege used Greek capitals (Φ for F, Ψ for G, …). A small
  Latin → Greek mapping table would be more typographically faithful;
  rejected for now because the consonants without obvious Greek
  pairs (R, S, T) would have to fall back, breaking visual
  uniformity. Cleanest path is a font-loading change rather than a
  glyph swap.
- **gfnotation export / TeX fidelity.** `frege-begriffsschrift.md`
  §5 sketches an Adapter C: `Frege AST → gfnotation short form /
  symbolic form` for TeX export. Not blocked by this ticket; the AST
  is now the canonical surface needed for that exporter.
- **Compare view (FEAT-013 candidate).** Frege ↔ Modern FOL becomes
  more interesting now that Frege carries an HO surface. The compare
  view gets to flag *which fragment* a formula sits in rather than
  treating Frege as "just another linear FOL syntax".

### Decisions made

- **`exists` is in the AST as its own node, not a parser sugar that
  produces `not(forall(not(body)))`.** Considered making `exists`
  pure parser sugar — desugar at parse time, no AST node. Rejected
  because (a) the FOL/HOL translator should produce `\exists`, not
  `\neg \forall \neg`, and recovering "is this an existential?" from
  a desugared tree is fragile; (b) future inference rules will care
  about the surface form. The *renderer* still lowers it for layout
  via `lower(c)` — that's where Frege's "no explicit ∃ glyph"
  convention is enforced. So the AST keeps semantic clarity, the
  renderer keeps Frege's faithfulness, no code path has to reconcile
  them.

- **Sort inference by capitalisation, not explicit annotation.**
  Considered an explicit syntax like `all F: pred. F(a)` or
  `forall2 F. F(a)`. Rejected because (a) it adds two keywords and
  one new operator to a parser that's deliberately compact;
  (b) Frege's typographic convention is exactly first-letter case
  in our ASCII analogue (Gothic = lowercase Latin in the DSL,
  capital Greek = uppercase Latin in the DSL); (c) the order chip
  externalises the inferred classification, so a user who misnames
  a variable can see the consequence immediately and rename.

- **`==` is identity-of-content over arbitrary contents, not split
  into `=` (terms) and `↔` (sentences).** Frege himself used a
  single `≡` for both term-level and sentence-level identity in
  *Begriffsschrift* Part III, with the substitution principle
  (axiom 52) bridging the two readings. Splitting in the DSL would
  pre-decide a typing question Frege left polymorphic. The
  translator emits `\equiv` in both cases, preserving the
  ambiguity rather than collapsing to `↔`/`=` based on a heuristic.

- **Predicate-sort cavity colour = cyan, individual = pale gold.**
  Considered using bold italic alone to distinguish the two sorts
  but found the visual contrast insufficient when the diagram has
  multiple stacked concavities. Cyan reads cleanly against the
  `STROKE_COLOR` whites and matches the existing tone palette
  established in earlier Lab tickets (Kripke designated-world badge,
  CTL state chips).

- **Order classification by AST walk, not by parser annotation.**
  `orderOf` walks the tree and returns the right answer regardless
  of which examples a user types. Pre-computing the order at parse
  time would require threading a flag through every constructor;
  the walk is O(n) and runs once per render. The chip in the Lab
  uses `useMemo` so the cost is bounded.

- **Default example set on the Lab page changed to
  `leibniz-indiscernibility`.** Previously the page opened on
  `conditional` (`|- p -> q`). The new default exercises the iden
  + higher-order surface in one formula so a fresh visitor
  immediately sees what's new. Falls back to the original index-2
  example if the slug ever moves.
