# feat: Logic Lab Navya-Nyāya — relational-abstract DSL, vyāpti engine, dependency-tree view

**Branch slug:** `feat/logic-lab-navya-nyaya`
**Status:** queued
**Size:** M–L
**Depends on:** `none`

## Why

The Lab's one South Asian system, `indian-buddhist`, stops at Dignāga
(6th c.): the Nyāya five-step, trairūpya, and the hetu-cakra. It does
not touch the tradition's formal high-water mark — Gaṅgeśa's
14th-century Navya-Nyāya, which reformed Nyāya into a regimented,
quasi-symbolic technical language built from relational abstracts
(`-tva`/`-tā` nominalizations), *avacchedaka* (limitors), and an
explicit qualificand–qualifier–relation analysis of every cognition.
`work-history/feat-logic-lab-indian-buddhist.md` already flagged this
as "a different system, not an extension of the current one." It is
the single most formalizable system in the non-Western corpus —
Ingalls onward have shown its expressions parse as nested triples —
and it brings a visualization the Lab lacks: a relational-abstract
dependency tree. `world-logic-traditions.md` §1 ranks it the highest-
payoff candidate after the cheap Catuṣkoṭi pick.

## Scope

**In:**

- New Logic Lab system at `/logic/navya-nyaya`.
- Parser for the relational-abstract DSL: a nesting `entity [ relation:
  expr {limitor: expr} ]` grammar plus a `vyapti … end` judgment block
  with a finite locus domain. IAST aliases accepted as in
  `indian-parser.ts`.
- Engine: `checkVyapti` decides invariable concomitance over the locus
  domain — reports *vyabhicāra* (deviation) witnesses, and scans the
  domain's property set for an *upādhi* (vitiating condition). Verdict
  is a structural check, not proof search.
- Renderer: `NavyaParseTree` draws the qualificand → relation →
  qualifier nesting (with limitor branches) as a hierarchical tree —
  a new rendering within the Tree/graph family.
- Lab page in the shared shape: editor left; vyāpti verdict + trairūpya-
  style condition panel and the parse tree right.
- 6–8 seed examples: the textbook smoke/fire vyāpti, a deviating
  (sāvyabhicāra) reason, an upādhi-spoiled concomitance, and 2–3 pure
  relational-abstract expressions (qualified cognition, an absence with
  its counterpositive-limitor) exercising the tree.

**Out (captured separately):**

- Gaṅgeśa's competing vyāpti definitions (the *siddhānta-lakṣaṇa* and
  the five *pūrvapakṣa* definitions) as selectable engines — phase 2 of
  `docs/formal-logic/navya-nyaya.md`.
- Dharmakīrti's three structural hetu types and apoha — fold into
  `indian-buddhist`, see `feat-logic-lab-indian-buddhist-hetucakra.md`.
- Lean integration — cross-cutting, per `formal-verification.md`.
- Compare-view bridge to `indian-buddhist` / Aristotelian — pollinator
  ticket, not this one.

## Build sketch

- `navya-types.ts` — `NavyaExpr` (entity | abstract | absence, each with
  optional `quals: { relation; target: NavyaExpr; limitor?: NavyaExpr }[]`),
  `Vyapti` (pervaded, pervader, `loci: { name; properties: string[] }[]`),
  verdict ADT.
- `navya-parser.ts` — recursive-descent for the bracket-nesting
  expression grammar; line-based `key: value` for the `vyapti` block,
  reusing the `indian-parser.ts` alias approach.
- `navya-engine.ts` — `checkVyapti`: ∀ locus, pervaded ⇒ pervader;
  collect deviation witnesses; `findUpadhi`: a property U with
  (S ⇒ U) holding but (H ⇒ U) failing.
- `navya-render.ts` — `NavyaExpr` → layout tree (qualificand at root).
- `NavyaParseTree.tsx` — hierarchical SVG/CSS tree in the `GentzenTree`
  idiom (strict tree, no DAG → no xyflow needed).
- `NavyaEditor.tsx` + `navya-commands.ts`; `labs/NavyaNyayaLab.tsx`;
  register the `navya-nyaya` slug in `routes/logic.$system.lazy.tsx`
  and the system entry in `data/logic-systems.ts`.
- Tests: `navya-parser.test.ts`, `navya-engine.test.ts`,
  `navya-system-data.test.ts` (mirrors the `indian-*` test trio).

## References

- Design doc: `docs/formal-logic/navya-nyaya.md` (this ticket's
  companion — full DSL grammar, data shapes, phases).
- `work-history/feat-logic-lab-indian-buddhist.md` §"Notes for future
  work" — the Navya-Nyāya deferral this ticket acts on.
- `docs/formal-logic/world-logic-traditions.md` §1.
- D.H.H. Ingalls, *Materials for the Study of Navya-Nyāya Logic*
  (1951) — the relational-abstract-as-AST argument.
- J. Ganeri, *Philosophy in Classical India* (2001), ch. on
  Navya-Nyāya; J.L. Shaw, papers on *vyāpti* and *avacchedaka*.
