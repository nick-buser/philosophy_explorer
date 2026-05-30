# Mohist Disputation — System Design

**Status:** Phase 1 implemented on `feat/logic-lab-mohist` (ticket
`.tickets/feat-logic-lab-mohist.md`). Phase 2 scope below remains open.
**Builds on:** the candidate survey
[`world-logic-traditions.md`](./world-logic-traditions.md) §4 — the
last and weakest world-logic candidate — and the step-by-step-textual
rendering family of the Indian five-step (`indian-buddhist`). Design
context: [`logic-explorer-tab.md`](./logic-explorer-tab.md),
[`catuskoti.md`](./catuskoti.md) (the sibling "report, don't
adjudicate" engine stance).

---

## Purpose

The Later Mohists — the authors of the *Mojing* (the Mohist Canon) and
the *Xiao Qu* 小取 ("Lesser Pick") chapter, c. 3rd century BCE — built
the one indigenous East Asian formal-logic tradition: a theory of
*names* (*míng* 名), of *disputation* (*biàn* 辯), and of the
*parallel-inference* forms.

The form with explicit structure, and the one this Lab models, is
*móu* 侔 — "parallelizing." Móu compares two sentences that share a
grammatical form and lets an inference run along the parallel: from an
accepted sentence, apply the same operation to each of its terms, and
the resulting sentence is *tentatively* asserted too. The stock case:

> 白馬，馬也；乘白馬，乘馬也。
> A white horse is a horse; therefore riding a white horse is riding a
> horse.

The base sentence "a white horse is a horse" is granted (是, *shì* —
"this", "it is the case"). The operator "ride" is applied to each
term. Móu's move: the parallel sentence is also 然 (*rán* — "so").

The Mohists' discovery — and the reason móu earns a Lab slot — is that
**this move is not reliable**, and the *Xiao Qu* says so explicitly,
enumerating *four* ways a structurally-parallel pair behaves:

> 夫物或乃是而然，或是而不然，或一周而一不周，或一是而一非也。
> A thing may be *this-and-so*, or *this-but-not-so*, or *in-one-
> respect-comprehensive-and-in-one-not*, or *in-one-respect-so-and-in-
> one-not*.

Móu is licensed only in the first. The four are the closed structure
of the system, exactly as the seven *bhaṅgas* are for saptabhaṅgī and
the four *koṭis* for catuṣkoṭi.

It earns a Lab slot because:

- **It is an argument-schema system, not a truth-functional one.**
  Every other classificatory Lab system (Aristotelian, saptabhaṅgī,
  catuṣkoṭi) turns on truth values. Móu turns on whether a *form*
  carries — a different kind of logic, and the only one in the Lab
  with no notion of deductive completeness.
- **The tradition supplies its own taxonomy of failure.** The four
  *Xiao Qu* categories are not a modern imposition; they are the
  Mohists' own enumeration of when parallelizing breaks. A Lab can
  render that taxonomy honestly without having to invent it.
- **It is the one indigenous East Asian formal-logic candidate.** The
  "Buddhist logic" that circulated in China and Japan as *yīnmíng*
  因明 is Dignāga's Indian system in transmission, already covered by
  `indian-buddhist`. Mohist disputation is the genuine alternative.

---

## The interpretive risk — stated up front

`world-logic-traditions.md` §4 flags Mohist disputation as the weakest
world-logic candidate and the one most likely to re-scope mid-build.
Two facts shape every design decision below, and the Lab states them
to the user rather than papering over them:

1. **Which of the four categories a parallel falls into is not
   mechanically decidable.** It depends on facts about classical
   Chinese semantics — whether an operator creates an opaque context,
   whether a predicate scopes universally or existentially — that the
   Mohists settled by inspection. There is no decision procedure. The
   engine therefore **carries the outcome as a declared field** and
   only *cross-checks* it; it never infers it.
2. **Only the first two categories share móu's "one operator, two
   terms" shape.** *Shì ér rán* and *shì ér bù rán* are about a single
   operator applied to the two terms of one base pair. *Yī zhōu ér yī
   bù zhōu* is about one predicate scoped two ways; *yī shì ér yī fēi*
   is about kind-preservation differing across two terms. The DSL is
   shaped to móu proper; categories 3 and 4 are represented within it
   as faithfully as the schema allows, and §"Open questions" 2 says
   where it strains.

This is the same stance as [`catuskoti.md`](./catuskoti.md): the
engine reports structural facts; the Lab's history and notes carry the
interpretation; the scholarship is cited, not adjudicated.

---

## The four outcomes

The closed structure. Each is one of the *Xiao Qu*'s four categories.

| # | Chinese | Pinyin | English | Transfers? | Flag |
|---|---|---|---|---|---|
| 1 | 是而然 | *shì ér rán* | this, and so | yes | — |
| 2 | 是而不然 | *shì ér bù rán* | this, but not so | no | `opacity` |
| 3 | 一周而一不周 | *yī zhōu ér yī bù zhōu* | one comprehensive, one not | no | `scope` |
| 4 | 一是而一非 | *yī shì ér yī fēi* | one so, one not | no | `sortal` |

- **是而然** — the parallel carries. *White horse is a horse; riding a
  white horse is riding a horse.* Móu is licensed.
- **是而不然** — identical wording, yet the parallel fails, because the
  operator reads its object *under a description*: an intensional /
  referentially-opaque context. *Her younger brother is a handsome
  man; but loving one's brother is not loving a handsome man.* The
  ethically-loaded Mohist case lives here: *a robber is a person, but
  killing a robber is not killing a person.*
- **一周而一不周** — the predicate scopes over *all* on one side and
  over *some* on the other. *Riding horses* needs only one horse;
  *not riding horses* needs every horse refused.
- **一是而一非** — the operator preserves kind for one term but not the
  other. *A brother's ghost is a brother; a person's ghost is not a
  person.*

`FOUR_CATEGORIES` is to this system what `FOUR_KOTIS` is to catuṣkoṭi
and `SEVEN_BHANGAS` to saptabhaṅgī: a constant encoding the closed
structure, with an invariant test (`mohist-engine.test.ts` asserts
exactly four, exactly one of which transfers, and a bijection between
the three non-transferring categories and the three flags).

---

## The engine — a móu-form checker

`evaluateMou` is total and structural — no proof search. It does two
things, and neither is "decide the outcome":

### 1. Form-check (decidable)

The móu schema is **well-formed** iff:

- the `operator` is non-empty, and
- the two `base` terms are non-empty and *distinct* (a parallel needs
  two different terms — "X is X" licenses nothing).

A degenerate input is reported as ill-formed, with the reason. This is
the one genuinely decidable, structural claim the engine makes — and
it is exactly what `world-logic-traditions.md` §4's build sketch calls
"a checker for the móu form."

### 2. Cross-check (consistency, not inference)

The input declares an `outcome` (one of the four) and may declare a
`flag` (`opacity` | `scope` | `sortal`). The flag names the *failure
mode*. The engine computes the outcome the flag *implies* —

```
no flag  → 是而然        (shì ér rán)
opacity  → 是而不然      (shì ér bù rán)
scope    → 一周而一不周   (yī zhōu ér yī bù zhōu)
sortal   → 一是而一非     (yī shì ér yī fēi)
```

— and compares it to the declared `outcome`. If they agree the
evaluation is **consistent**; if not, the engine reports an
**inconsistency** ("declares 是而然 but names the failure mode
`opacity`"). The mismatch is surfaced, never silently corrected — the
author has said two things that do not fit, and a logic Lab should
show that.

The engine constructs the **parallel pair** (the operator prepended to
each base term) so the renderer can align it under the base pair. The
**verdict** is read off in priority order: `ill-formed` → `inconsistent`
→ then the declared outcome's `transfers` flag gives `transfers` (然)
or `fails` (不然).

---

## Out of scope (phase 1)

- **No outcome inference.** The engine never decides which category a
  parallel "really" belongs to. See §"Purpose" and §"Open questions" 1.
- **No theory of names, no disputation calculus.** *Biàn* as the
  two-party contest in which exactly one of a contradictory pair
  prevails, and the three kinds of names (*dá* 達 unrestricted, *lèi*
  類 classifying, *sī* 私 private), are glossed in the history text,
  not modelled.
- **No `pì` / `yuán` / `tuī`** — the *Xiao Qu*'s other argument forms
  (illustrating, adducing, inferring/extending). Móu is the one with
  explicit parallel structure.
- **No Lean integration, no compare view, no `LogicIR` migration** —
  same calls as the other world-logic systems.

---

## What ships in phase 1

A new system at `/logic/mohist` with the shared Lab surface:

1. **DSL editor** — `LogicCmEditor` host with Mohist commands.
2. **Parser** — line-based `key: value`: `base` (split on `|`),
   `operator`, `outcome`, optional `flag`, optional `gloss`.
3. **Engine** — `evaluateMou`: form-check + flag/outcome cross-check;
   constructs the parallel pair. Total, structural.
4. **Aligned-pair view** — `MohistDiagram`: the base pair and the
   operator-applied parallel pair on two aligned rows, marked 是 and
   然 / 不然; plus the four-outcome taxonomy strip with the current
   outcome ringed.
5. **Primitives panel** — the base pair, the operator, the four
   outcomes, the failure flag.
6. **6–8 seed examples** — see §"Seed examples".

`thinkerSlug: null` — no Mohist node is seeded (the *Mojing* is a
collective text; same call as saptabhaṅgī and catuṣkoṭi).

---

## DSL grammar (phase 1)

One authoring surface: an accepted base pair, the operator that builds
the parallel, the declared outcome, and an optional failure flag.

```
mohist    := base-line operator-line outcome-line flag-line? gloss-line?
base      := "base" ":" term "|" term
operator  := "operator" ":" text
outcome   := "outcome" ":" category
flag      := "flag" ":" ("opacity" | "scope" | "sortal")
gloss     := "gloss" ":" text
category  := "shi-er-ran" | "shi-er-bu-ran"
           | "yi-zhou-yi-bu-zhou" | "yi-shi-yi-fei"   (+ aliases)
```

```
base:     a white horse | a horse
operator: ride
outcome:  shi-er-ran
```

```
base:     her younger brother | a handsome man
operator: love
outcome:  shi-er-bu-ran
flag:     opacity
gloss:    loving is opaque — it reads its object under a description
```

`outcome` aliases: `shi-er-ran` ↔ `是而然` ↔ `transfers` ↔ `1`;
`shi-er-bu-ran` ↔ `是而不然` ↔ `2`; `yi-zhou-yi-bu-zhou` ↔ `一周而一不周`
↔ `zhou` ↔ `3`; `yi-shi-yi-fei` ↔ `一是而一非` ↔ `4`. `flag` aliases:
`opacity` ↔ `opaque` ↔ `intensional`; `scope` ↔ `quantifier` ↔
`zhou`; `sortal` ↔ `kind` ↔ `part`. A missing `flag:` line means "no
failure mode named" — consistent only with `shi-er-ran`. `--` / `#`
comments and blank lines are skipped; duplicate keys and unknown
keys/values are parse errors.

---

## Data shapes

```ts
type CategoryId =
  | 'shi-er-ran' | 'shi-er-bu-ran'
  | 'yi-zhou-yi-bu-zhou' | 'yi-shi-yi-fei';

type MouFlag = 'opacity' | 'scope' | 'sortal';

type MouCategory = {
  id: CategoryId;
  n: 1 | 2 | 3 | 4;
  chinese: string;          // 是而然
  pinyin: string;           // shì ér rán
  english: string;          // this, and so
  transfers: boolean;       // true only for shi-er-ran
  flag: MouFlag | null;     // the failure flag — null for shi-er-ran
  gloss: string;
  canonicalExample: string; // a stock Xiao Qu case
};

// All four, in Xiao Qu order. The fixed structure of the system.
const FOUR_CATEGORIES: MouCategory[];

type MouArgument = {
  base: { subject: string; predicate: string };  // the accepted 是
  operator: string;
  outcome: CategoryId;       // declared — never inferred
  flag: MouFlag | null;      // declared failure mode, if any
  gloss: string | null;
};

// evaluateMou(arg): form-check the schema; construct the parallel
// pair; cross-check `outcome` against the outcome implied by `flag`.
```

---

## File layout

New files in `packages/web/src/logic/` (prefix `mohist`):

| File | Purpose |
|---|---|
| `mohist-types.ts` | `MouCategory`, `FOUR_CATEGORIES`, `MouFlag`, `MouArgument`, helpers. |
| `mohist-parser.ts` | Line-based `base` / `operator` / `outcome` / `flag` / `gloss` parser. |
| `mohist-engine.ts` | `evaluateMou` — form-check + cross-check. |
| `mohist-commands.ts` | Slash commands: the four outcomes, a skeleton, the seed examples. |
| `MohistEditor.tsx` | `LogicCmEditor` wrapper. |
| `MohistDiagram.tsx` | Aligned-pair view + four-outcome taxonomy strip. |
| `labs/MohistLab.tsx` | Lab page. |
| `__tests__/mohist-parser.test.ts` | base split, outcomes, flags, aliases, errors. |
| `__tests__/mohist-engine.test.ts` | the 4-category invariant; flag→outcome map; cross-check; form-check. |
| `__tests__/mohist-system-data.test.ts` | Registered; every example parses; all four outcomes reached. |

Route: a `mohist` branch in `routes/logic.$system.lazy.tsx`. Data: a
`mohist` entry in `LOGIC_SYSTEMS` (`logic-systems.ts`). No new optional
field on `LogicExample` is needed.

---

## Seed examples

Seven, covering all four outcomes:

- **是而然** (×2) — *白馬* (a white horse / a horse, operator "ride")
  and *獲* (Huo, a servant / a person, operator "love"): the parallel
  carries.
- **是而不然** (×3) — *其弟* (her brother / a handsome man, "love"),
  *船* (a boat / wood, "enter"), and the ethically-loaded *盜人* (a
  robber / a person, "kill"): identical form, transfer fails.
- **一周而一不周** (×1) — *乘馬* framed as riding one horse / riding
  horses under the operator "not": the negated predicate turns
  comprehensive.
- **一是而一非** (×1) — *兄之鬼* (one's brother / a person, operator
  "the ghost of"): a brother is a person, but the operator preserves
  kind for the brother and not for the person.

The `system-data` test maps each example slug to the outcome and flag
it claims, parses every DSL, and asserts the seed set reaches all four
outcomes. The category-3 and category-4 seeds carry a candid `note`
that they exhibit a failure the strict one-operator schema only
approximates (see §"Open questions" 2).

---

## Implementation order

1. Types + `FOUR_CATEGORIES` constant; the four-category invariant test.
2. Parser. `mohist-parser.ts`, parser tests.
3. Engine. `evaluateMou` (form-check + cross-check), engine tests.
4. Seed examples (data only) — inert, not yet routed.
5. Aligned-pair view. `MohistDiagram.tsx`.
6. Editor + commands.
7. Page wiring — `logic.$system.lazy.tsx`; verdict badge.
8. Polish + work-history doc.

---

## Phase 2+ scope

In rough priority order:

1. **An outcome classifier over declared semantic structure.** Not a
   natural-language decision procedure — that does not exist — but a
   step up from a bare declared `outcome`: let the DSL declare more of
   the operator's semantics (opacity, the scope of each side, a
   kind-shift marker) and have the engine *derive* the category from
   them. The interpretation still lives in the declared structure;
   the engine does more of the bookkeeping. This is the natural home
   of the work categories 3 and 4 need to fit cleanly.
2. **The other *Xiao Qu* forms** — *pì* 辟 (illustrating), *yuán* 援
   (adducing), *tuī* 推 (inferring / extending). Móu is phase 1
   because it alone has explicit parallel structure.
3. **A *biàn* (disputation) mode** — the two-party contest in which,
   the Canon holds, exactly one of a contradictory pair prevails. A
   different surface from móu; a sibling system, not an extension.
4. **Lean integration**, once any system gets Lean.

---

## Open questions

### 1. Is Mohist disputation "formal" at all?

The live scholarly dispute. Graham (1978) reconstructs the *Mojing*
as a proto-logic with real rigour; Harbsmeier (1998) is more cautious
about reading a calculus into it; Fraser treats the parallelizing
forms as defeasible argument schemata, not a deductive system. Phase 1
takes no side: it models the one thing that *is* uncontroversially
structural — the móu *form* and the *Xiao Qu*'s own four-category
taxonomy — and leaves "is this logic?" to the Lab's history text.
This is why the engine form-checks and cross-checks but never infers
an outcome.

### 2. Categories 3 and 4 do not fit the one-operator schema

*Shì ér rán* and *shì ér bù rán* are genuinely "one operator applied
to the two terms of one base pair." *Yī zhōu ér yī bù zhōu* is about a
single predicate taking universal force in one frame and existential
in another; *yī shì ér yī fēi* is about kind-preservation differing
across terms. The DSL is shaped to móu proper. The category-3 and
category-4 seeds are framed within it as faithfully as possible — and
each carries a `note` saying so. A DSL that fit all four natively is
phase-2 work (§"Phase 2+" 1). This is the "real scoping risk"
`world-logic-traditions.md` §4 predicted, met head-on rather than
hidden.

### 3. AST authority — TS-only

Same call as the other world-logic systems (see
[`catuskoti.md`](./catuskoti.md) §"Open questions" 3). Parser, engine,
renderer are TS-only and browser-side; no forcing function has fired.

---

## Relationship to existing docs

- [`world-logic-traditions.md`](./world-logic-traditions.md) §4 — the
  scoping survey this doc expands; Mohist disputation was its last
  un-ticketed candidate.
- [`catuskoti.md`](./catuskoti.md) — the sibling world-logic system
  whose "report, don't adjudicate" engine stance and parser idiom this
  reuses.
- [`saptabhangi.md`](./saptabhangi.md) — the closed-structure constant
  pattern (`SEVEN_BHANGAS` → `FOUR_CATEGORIES`).
- [`lab-roadmap.md`](./lab-roadmap.md) §"system × visualization
  matrix" — the step-by-step-textual row gains Mohist when this ships.
