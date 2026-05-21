# World Logic Traditions — Candidate Systems

**Status:** Survey, 2026-05-20 — first-pass notes on formalizable
non-Western logic traditions not yet in the Lab. Tickets opened
2026-05-20 for Navya-Nyāya, Jain saptabhaṅgī, Avicennan logic, and the
`indian-buddhist` hetu-cakra extension, each with a companion design
doc (see the per-candidate pointers below). Catuṣkoṭi and Mohist
disputation remain un-ticketed.
**Builds on:** `lab-roadmap.md` (§"Indian / Buddhist logic" ships the
first such system) and `work-history/feat-logic-lab-indian-buddhist.md`
(deferral notes).

---

## Why this doc

The Lab has one non-Western system: `indian-buddhist`. Per
`indian-types.ts` it covers exactly the **Nyāya** five-membered
inference (*pratijñā · hetu · udāharaṇa · upanaya · nigamana*),
**Dignāga's *hetu-cakra*** (the nine-cell wheel of reason), and
**trairūpya** (the three marks of a valid *hetu*). That is the whole
of it — Nyāya and Dignāga, nothing later, nothing from China, Korea,
or Japan.

This doc surveys what *else* in the world's logical traditions is
**formalizable, verifiable, and AST-renderable** to the standard the
Lab already holds its Western systems to. It is a scoping survey, not
a spec; per-candidate detail belongs in a `docs/formal-logic/<system>.md`
once a ticket opens.

The selection criterion is deliberately narrow. A tradition earns a
slot here only if it has (a) a decidable validity / classification
criterion an engine can compute, and (b) a structure worth drawing.
Rich *philosophy* with no such core — most of Confucianism, Daoism,
the Kyoto School — is out of scope by construction; that material
belongs in the philosopher / school graph, not the Lab.

---

## The honest landscape

The formalizable non-Western logic is **concentrated in South Asia,
not East Asia.** This matters for sequencing, so state it plainly:

- **South Asia** produced sustained formal logic across three
  schools — Nyāya, Buddhist, Jain — over two millennia, with explicit
  validity criteria, a recognised fallacy taxonomy, and (in
  Navya-Nyāya) a regimented quasi-symbolic technical language. Four
  of the five candidates below are South Asian.
- **East Asia** (China, Korean peninsula, Japan) produced deep
  philosophy but little *formal* logic. Its one indigenous candidate
  is **Mohist disputation**, and its formalizability is genuinely
  contested in the scholarship. The "Buddhist logic" that circulated
  in China and Japan as *yīnmíng / inmyō* (因明) is **Dignāga's
  Indian system in transmission** — not a separate invention, and
  largely already covered by `indian-buddhist`.

So the China/Korea/Japan question has an uncomfortable answer: there
is one East Asian candidate, it is the weakest on the list, and the
highest-value work is *deepening the South Asian seam* the Lab
already opened.

---

## Candidate systems — South Asia

### 1. Navya-Nyāya (`feat/logic-lab-navya-nyaya`) — recommended first

**Ticketed:** `.tickets/feat-logic-lab-navya-nyaya.md` · design doc
`navya-nyaya.md`.

Gaṅgeśa's 14th-century reformation of Nyāya into a formal apparatus.
Already flagged in `work-history/feat-logic-lab-indian-buddhist.md`
as meriting its own system slug ("different system, not extension of
the current one").

- **Why.** This is the single most formalizable system in the
  non-Western corpus. Navya-Nyāya developed a regimented technical
  Sanskrit — a near-symbolic language built from relational abstracts
  (*-tva / -tā* nominalizations), *avacchedaka* (limitors),
  *vyāpti* (pervasion / invariable concomitance), and *paryāpti*
  (a numerical-completion relation). Logicians from Ingalls onward
  have shown the expressions parse as nested qualificand–qualifier–
  relation triples. It was, in effect, designed to have an AST.
- **Build.** Parser for the relational-abstract DSL; an engine that
  checks *vyāpti* between the structured terms (no over-extension
  *anvaya* / no counter-instance *vyabhicāra*); a renderer that draws
  the qualificand → relation → qualifier nesting as a dependency
  tree. The tree view is a new visualization the Lab does not have.
- **Size.** M–L. Mostly a parser plus a tree renderer; the engine
  itself is a structural check, not proof search.

### 2. Catuṣkoṭi — the tetralemma (`feat/logic-lab-catuskoti`)

Nāgārjuna's four-cornered logic: for a proposition A, the four
"corners" are A, ¬A, A∧¬A, and ¬(A∨¬A). Madhyamaka uses it both to
assert and (in the *prasaṅga* mode) to reject all four.

- **Why.** A genuinely non-classical structure with a tiny, exact
  state space — four corners, each affirmable or deniable. It
  formalizes cleanly as a four-valued / paraconsistent scheme
  (Priest & Garfield's reconstruction is the standard reference,
  with the scholarly dispute over consistency worth surfacing in
  the doc itself). Crucially it is a **diagrammatic foil to the
  square of opposition** — the Lab already renders that for the
  Aristotelian system, so a four-corner diagram slots into an
  existing visualization family and invites a future compare-view
  pairing.
- **Build.** Small fixed evaluator over the four corners; a
  four-corner SVG diagram; a toggle between the affirming
  (Buddhist logic) and rejecting (*prasaṅga*) readings.
- **Size.** S. Cheapest item here; high pedagogical contrast.

### 3. Jain saptabhaṅgī / syādvāda (`feat/logic-lab-saptabhangi`)

**Ticketed:** `.tickets/feat-logic-lab-saptabhangi.md` · design doc
`saptabhangi.md`.

The Jain doctrine of sevenfold conditional predication: from the
three basic modes — *asti* (is), *nāsti* (is not), *avaktavya*
(inexpressible) — exactly seven combinations are generated, each
prefixed by *syāt* ("in some respect").

- **Why.** A fixed seven-element predication scheme — a genuine
  many-valued logic with a closed, enumerable structure. It pairs
  naturally with the roadmap's existing **many-valued logic**
  item (`feat/logic-lab-many-valued`): build the *n*-valued
  truth-table machinery once, and saptabhaṅgī is the historical,
  non-Western instance of it. Renders as a seven-cell table or a
  lattice/cube of the modes — the algebraic/tabular family.
- **Build.** Enumerator for the seven *bhaṅgas*; a table or lattice
  renderer; honest framing of the Priest / Ganeri debate over
  whether it is truth-functional. Best done *after* or *alongside*
  many-valued logic so the truth-value substrate is shared.
- **Size.** S–M.

### Extensions to the existing `indian-buddhist` system (not new slugs)

**Ticketed together** as one extension:
`.tickets/feat-logic-lab-indian-buddhist-hetucakra.md` · design doc
`indian-buddhist.md` (which also serves as the retroactive system doc
for the shipped phase 1). The two items below ship inside that ticket,
bundled with the Nyāyapraveśa 33-fault taxonomy.

Two items belong *inside* the current system, per its work-history,
and should not get their own tickets:

- **Dharmakīrti's three hetu types** (*svabhāva* / *kārya* /
  *anupalabdhi*) — a structural classifier that runs after a valid
  *trairūpya* verdict. A half-day add; a second column of badges.
- **Apoha** — Dignāga's exclusion semantics for property terms. Not
  an inference engine; if surfaced, it is a side panel commenting on
  what *sādhya* means, not a classifier.

---

## Candidate systems — East Asia

### 4. Mohist disputation (`feat/logic-lab-mohist`) — speculative

The Later Mohist Canon (*Mojing*) and the *Xiao Qu* ("Lesser Pick")
chapter: a theory of names (*ming*), disputation (*biàn*), and the
parallel-inference forms — most notably *móu* ("parallelizing": an
inference licensed by two sentences sharing a form).

- **Why.** The only indigenous East Asian formal-logic candidate. It
  is **argument-schema based**, not truth-functional, and has no
  notion of deductive completeness. Whether it is "formal" at all is
  contested — read Chris Fraser and Christoph Harbsmeier before
  committing. What *is* tractable: the parallel-sentence templates
  have explicit structure and render as an aligned-pair view, in the
  same step-by-step-textual family as the Indian five-step.
- **Build.** Parser for the parallel-sentence templates; a checker
  for the *móu* form (shared structure → transferred inference,
  with the Mohists' own noted exceptions); an aligned-pair renderer.
  Content-heavy and partly interpretive.
- **Size.** M, with real scoping risk. Lower confidence than
  anything in the South Asia section — flag the interpretive
  uncertainty in the ticket.

### Yīnmíng / inmyō (因明) — not a separate system

The Buddhist logic transmitted to China (by Xuanzang / Kuiji) and
Japan is Dignāga's *hetuvidyā*, already the core of `indian-buddhist`.
The only genuinely additive material is the East Asian *commentarial*
layer — Kuiji's systematization of the 33-fault scheme of the
*Nyāyapraveśa*. That is a content extension to the existing system's
fallacy taxonomy, not a new lab. Low priority.

---

## Beyond the two regions — for completeness

### Arabic / Avicennan logic (`feat/logic-lab-avicennan`)

**Ticketed:** `.tickets/feat-logic-lab-avicennan.md` · design doc
`avicennan.md`.

Not East or South Asian, but the highest-rigor non-Western option
after Navya-Nyāya, and currently the subject of active formalization
(Wilfrid Hodges, Tony Street, Saloua Chatti). Avicenna's modal and
**temporal** syllogistic, plus the hypothetical (conditional /
disjunctive) syllogism, go well beyond the Aristotelian core. It
would render as modal-syllogism tables and pairs with the Lab's
existing modal infrastructure. Size M–L. Noted here so the survey is
honest about where the rigor actually is; sequence it by appetite.

---

## Suggested sequencing

Not a commitment — leverage order, in the roadmap's style.

1. **Catuṣkoṭi** — smallest, reuses the square-of-opposition
   visualization family, sharpest classical/non-classical contrast.
2. **Navya-Nyāya** — highest payoff: the most formalizable system in
   the corpus and a new dependency-tree visualization. The natural
   "deepen the seam the Lab already opened" move.
3. **Saptabhaṅgī** — best done in the slipstream of the roadmap's
   many-valued logic ticket, sharing the *n*-valued substrate.
4. **Mohist disputation** — only after the South Asian items, and
   only if the interpretive risk is accepted; it is the weakest
   formal candidate and the one most likely to re-scope mid-build.

The Dharmakīrti and apoha items are not on this list — they fold
into `indian-buddhist` whenever something else touches that system.

---

## Visualization-family payoff

Per `lab-roadmap.md` §"system × visualization matrix" — prefer
systems that ship a visualization with them:

| Candidate | Visualization family | New to the Lab? |
|---|---|---|
| Catuṣkoṭi | Diagrammatic semantic (four-corner diagram) | Extends the square-of-opposition family |
| Navya-Nyāya | Tree/graph (relational-abstract dependency tree) | New rendering within the family |
| Saptabhaṅgī | Algebraic/tabular (seven-cell table / lattice) | Shares many-valued substrate |
| Mohist | Step-by-step textual (aligned parallel pair) | Shares the Indian five-step family |

---

## References

- Per-system precedent: `work-history/feat-logic-lab-indian-buddhist.md`
  (the Navya-Nyāya / Dharmakīrti / apoha deferral notes this doc
  expands on)
- Roadmap context: `lab-roadmap.md` §"Indian / Buddhist logic",
  §"Many-valued logic", §"system × visualization matrix"
- Scholarship to read before opening any ticket here:
  - Navya-Nyāya — D.H.H. Ingalls, *Materials for the Study of
    Navya-Nyāya Logic*; J. Ganeri, *Philosophy in Classical India*
  - Catuṣkoṭi — G. Priest & J. Garfield, "Nāgārjuna and the
    Limits of Thought"
  - Saptabhaṅgī — J. Ganeri, "Jaina Logic and the Philosophical
    Basis of Pluralism"
  - Mohist logic — C. Fraser, *The Essential Mòzǐ*; C. Harbsmeier,
    *Science and Civilisation in China* vol. 7.1 (Language and Logic)
  - Avicennan logic — W. Hodges & T. Street, work on Avicenna's
    modal syllogistic
