# feat: Logic Lab Mohist disputation — móu (parallel inference) and the four Xiao Qu outcomes

**Branch slug:** `feat/logic-lab-mohist`
**Status:** in-progress
**Size:** M
**Depends on:** none

## Why

The Later Mohist Canon (the *Mojing*) and the *Xiao Qu* 小取 ("Lesser
Pick") chapter are the one indigenous East Asian formal-logic
tradition — a theory of *names* (*míng* 名), of *disputation* (*biàn*
辯), and of the *parallel-inference* forms, most notably *móu* 侔
("parallelizing": comparing two sentences that share a grammatical
form and letting an inference run along the parallel).

`world-logic-traditions.md` §4 picks it as the last and weakest
world-logic candidate, and it is the last un-ticketed one. It earns a
Lab slot for what it uniquely is — an **argument-schema** system, not
a truth-functional one, with **no notion of deductive completeness** —
and the *Xiao Qu* itself supplies the tractable core: it enumerates
**four** ways a structurally-parallel sentence-pair behaves, and móu
is reliable in only the first.

**Interpretive risk — flagged, per `world-logic-traditions.md` §4.**
Whether Mohist disputation is "formal" at all is genuinely contested
in the scholarship (Graham reconstructs it as proto-logic; Harbsmeier
is more cautious; Fraser reads the parallelizing forms as defeasible
argument schemata, not a calculus). Two consequences shape the scope
below:

1. **The four outcomes are not mechanically decidable.** Which of the
   four *Xiao Qu* categories a given parallel falls into depends on
   facts about Chinese semantics the Mohists settled by inspection.
   There is no decision procedure — and a Lab that pretended otherwise
   would misrepresent the tradition.
2. **Only the first two categories share móu's "one operator, two
   terms" shape.** Categories 3 and 4 are further, differently-shaped
   warnings the *Xiao Qu* raises. They are represented, but the design
   doc §"Open questions" says plainly where the schema strains.

So the engine **checks the móu form** (a decidable, structural fact)
and **carries the outcome as a declared field**, cross-checking it for
internal consistency — it does not adjudicate. This is the same
"report, don't adjudicate" stance as `catuskoti.md`.

## Scope

**In:**

- New Logic Lab system at `/logic/mohist`.
- The four *Xiao Qu* outcomes as a closed structure (`FOUR_CATEGORIES`):
  *shì ér rán* 是而然 (this, and so), *shì ér bù rán* 是而不然 (this,
  but not so), *yī zhōu ér yī bù zhōu* 一周而一不周 (one comprehensive,
  one not), *yī shì ér yī fēi* 一是而一非 (one so, one not). Each
  carries Chinese, pinyin, an English gloss, whether the parallel
  *transfers*, the failure flag it corresponds to, and a canonical
  *Xiao Qu* example.
- DSL: a `base` pair (`X | Y`, the accepted "X is Y" — the 是), an
  `operator` applied uniformly to both terms, a declared `outcome`
  (one of the four), an optional `flag` (`opacity` | `scope` |
  `sortal`), and an optional `gloss`. Aliases accepted, including the
  Chinese names.
- Engine: `evaluateMou` — total and structural, no proof search.
  - **Form-check:** the móu schema is well-formed iff the operator is
    non-empty and the two base terms are non-empty and distinct.
  - **Cross-check:** the declared `outcome` is compared against the
    outcome *expected* from the `flag` (no flag → *shì ér rán*;
    `opacity` → *shì ér bù rán*; `scope` → *yī zhōu…*; `sortal` →
    *yī shì…*). A mismatch is reported as an inconsistency — surfaced,
    not silently corrected.
- Renderer: an **aligned-pair view** — the base pair and the
  operator-applied parallel pair on two aligned rows, in the
  step-by-step-textual family of the Indian five-step; plus the
  four-outcome taxonomy strip with the current outcome ringed.
- 6–8 seed examples — the canonical *Xiao Qu* cases, reaching all four
  outcomes.

**Out (captured separately):**

- **No outcome inference.** The engine never decides which category a
  parallel "really" falls into — see §"Why". A future classifier over
  declared semantic structure is design-doc §"Phase 2+".
- **No theory of names / disputation calculus.** *Biàn* as a
  two-party contest, the three kinds of names (*dá* / *lèi* / *sī*) —
  glossed in the history text, not built.
- **No `pì` / `yuán` / `tuī`** — the other *Xiao Qu* argument forms.
  Móu is the one with explicit parallel structure; the rest are
  phase-2.
- Lean integration; compare view — cross-cutting / pollinator.

## Build sketch

- `mohist-types.ts` — `MouCategory`, the `FOUR_CATEGORIES` constant,
  `MouFlag`, `MouArgument`, helpers.
- `mohist-parser.ts` — line-based `key: value` in the
  `catuskoti-parser.ts` idiom; `base` split on `|`; outcome / flag
  aliases.
- `mohist-engine.ts` — `evaluateMou`: form-check + flag/outcome
  cross-check; constructs the parallel pair.
- `MohistDiagram.tsx` (aligned-pair view); `MohistEditor.tsx`;
  `mohist-commands.ts`; `labs/MohistLab.tsx`; route +
  `logic-systems.ts` entry.
- Tests: `mohist-parser.test.ts`, `mohist-engine.test.ts` (the
  four-category invariant; the flag→outcome map; the cross-check
  catches a declared mismatch; the form-check rejects a degenerate
  pair), `mohist-system-data.test.ts`.

## References

- Design doc: `docs/formal-logic/mohist.md`.
- `docs/formal-logic/world-logic-traditions.md` §4.
- A. C. Graham, *Later Mohist Logic, Ethics and Science* (1978) — the
  standard reconstruction of the *Mojing* and the *Xiao Qu*; the
  four-category passage.
- C. Harbsmeier, *Science and Civilisation in China* vol. 7.1
  (*Language and Logic*, 1998).
- C. Fraser, *The Essential Mòzǐ* (2020), and the Stanford
  Encyclopedia entry "Mohism" / "School of Names" — the parallelizing
  forms as defeasible schemata.
