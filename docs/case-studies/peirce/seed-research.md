# Peirce — Seed Research Compilation

**Status:** Research-ready, 2026-04-17
**Purpose:** Concrete inputs for the future `DB-001-seed-peirce` ticket.
Consolidates dates, slugs, blurbs, edge citations, and concept summaries
into a form the seeder can lift directly into `data/seed/*.json`.

Upstream: [`README.md`](./README.md) §"Data plan",
[`reading-dag.md`](./reading-dag.md),
[`influences-and-context.md`](./influences-and-context.md),
[`secondary-literature.md`](./secondary-literature.md),
[`existential-graph-scholarship.md`](./existential-graph-scholarship.md).

Scope of verification: dates/slugs confirmed from Stanford Encyclopedia
of Philosophy, Wikipedia, MacTutor, and De Gruyter / IU Press catalogs
on 2026-04-17. Scholarship-status claims (LoF publication state, new
monographs) updated to 2026-04-17.

---

## 1. Scholarship-status updates (vs. existing case-study docs)

Findings the existing `docs/case-studies/peirce/` files do not yet
reflect. Incorporate when the seed ticket lands, and mirror into the
relevant case-study docs as part of that ticket.

### 1.1 *Logic of the Future* edition — current state

The existing docs cite "vols. 1–3 published." As of 2026-04-17 the
actual published state (De Gruyter, *Peirceana* series) is **five books
across three volumes**, published 2020–2025:

| Identifier | Subtitle | Year |
|---|---|---|
| Volume 1 | History and Applications | 2020 |
| Volume 2/1 | The Logical Tracts | 2021 |
| Volume 2/2 | The 1903 Lowell Lectures | 2021 |
| Volume 3/1 | Pragmaticism | 2024 |
| Volume 3/2 | Correspondence (1898–1913) | 2025 |

General editor: Ahti-Veikko Pietarinen. *Peirceana* series co-edited
with Francesco Bellucci.

Source: De Gruyter Brill, *Logic of the Future* multi-volume listing
and *Peirceana* series listing.

### 1.2 New Peirce monographs since DOCS-004

- **Stjernfelt, Frederik.** *Sheets, Diagrams, and Realism in Peirce.*
  *Peirceana* vol. 6. Berlin: De Gruyter, 2022. ISBN 9783110793581.
  Central treatment of Peirce's realism, the dicisign / proposition
  theory, and diagram-as-sign. Add to
  `existential-graph-scholarship.md` and include in the seed bibliography.
- **Bellucci, Francesco & Pietarinen, Ahti-Veikko.** "Existential
  Graphs: History and Interpretation." In C. de Waal (ed.),
  *The Oxford Handbook of Charles S. Peirce*, ch. 14, pp. 240–260.
  Oxford University Press, 2024. ISBN 9780197548561. Canonical current
  survey chapter; best single secondary-source entry for someone
  coming to EGs in 2026.
- **Vogel, Jérôme.** *Peirce's Logic of Information.* *Peirceana*
  series. Berlin: De Gruyter, 2026. A newly published monograph in
  the active series; worth flagging as "recent scholarship" but not
  yet absorbed into secondary-literature lists.

### 1.3 *Writings of Charles S. Peirce* chronological edition

- Volume 8 (1890–1892) is the most recently published (IU Press,
  2010; eBook 2020). The existing README says "~vol. 8, through 1892"
  which is still accurate.
- Volume 9 (1892–1893) is listed as **forthcoming** in Cornelis de
  Waal's 2025 IU-Indianapolis faculty page. No year given. Flag as
  "expected" rather than "published" in the seed data and editions
  table.

### 1.4 Oxford Handbook of Peirce (2024)

Cornelis de Waal (ed.), *The Oxford Handbook of Charles S. Peirce*,
OUP 2024. Broad-scope reference with chapters by current specialists.
Should displace or complement Misak (2004) as the default recent
essay-collection entry for the seed bibliography.

---

## 2. `philosophers.json` — new and updated records

All ages verified against SEP / Wikipedia on 2026-04-17. Fields match
the existing schema (see `heraclitus` entry as pattern). Bios are
3–4 sentences to match the case-study density Peirce needs.

### 2.1 Updated: `charles-peirce`

Replace the existing entry. Expanded bio, `alsoKnownAs` added.

```json
{
  "slug": "charles-peirce",
  "name": "Charles Sanders Peirce",
  "alsoKnownAs": "C. S. Peirce",
  "bornYear": 1839,
  "bornCertainty": "exact",
  "diedYear": 1914,
  "diedCertainty": "exact",
  "nationality": "American",
  "bioShort": "American polymath who founded pragmatism (later renamed pragmaticism to distinguish it from William James's version) and modern semiotics (the sign / object / interpretant triad). Independently of Frege, developed a fully general theory of quantification (1885); his logic of relatives is the direct ancestor of modern relational algebra. Introduced abduction as a third mode of inference alongside deduction and induction, and argued for fallibilism as the epistemic stance of science. Worked in relative isolation from academic philosophy; most of his vast manuscript corpus was unpublished in his lifetime and is still being edited."
}
```

### 2.2 New philosophers required by the Peirce expansion

Needed because the full influence edge list in
`influences-and-context.md` references them and they are not yet in
`data/seed/philosophers.json` (verified by grep on 2026-04-17).

Short bios below are intentionally short (1–2 sentences) — just
enough for them to render as influence-list nodes. These are supporting
cast for the Peirce case study, not themselves case-study subjects.

| New slug | Name | Born | Died | Nationality |
|---|---|---|---|---|
| `duns-scotus` | John Duns Scotus | 1265 (`circa`) | 1308 (`exact`) | Scottish |
| `george-boole` | George Boole | 1815 (`exact`) | 1864 (`exact`) | English |
| `augustus-de-morgan` | Augustus De Morgan | 1806 (`exact`) | 1871 (`exact`) | British |
| `william-whewell` | William Whewell | 1794 (`exact`) | 1866 (`exact`) | English |
| `charles-darwin` | Charles Darwin | 1809 (`exact`) | 1882 (`exact`) | English |
| `ernst-schroder` | Ernst Schröder | 1841 (`exact`) | 1902 (`exact`) | German |
| `josiah-royce` | Josiah Royce | 1855 (`exact`) | 1916 (`exact`) | American |
| `frank-ramsey` | Frank Ramsey | 1903 (`exact`) | 1930 (`exact`) | English |
| `karl-otto-apel` | Karl-Otto Apel | 1922 (`exact`) | 2017 (`exact`) | German |
| `umberto-eco` | Umberto Eco | 1932 (`exact`) | 2016 (`exact`) | Italian |
| `thomas-sebeok` | Thomas Sebeok | 1920 (`exact`) | 2001 (`exact`) | American (Hungarian-born) |
| `richard-dedekind` | Richard Dedekind | 1831 (`exact`) | 1916 (`exact`) | German |
| `georg-cantor` | Georg Cantor | 1845 (`exact`) | 1918 (`exact`) | German |

Minimal `bioShort` drafts (one line each, expand during seeding if
another case study later promotes any of these):

- **Duns Scotus** — Scottish Franciscan, one of the three great
  High-Medieval scholastics (with Aquinas and Ockham). "The Subtle
  Doctor." Known for the univocity of being, formal distinction, and
  haecceity; the canonical scholastic realist against whom later
  nominalism defined itself.
- **George Boole** — English mathematician and logician. His
  *Mathematical Analysis of Logic* (1847) and *Investigation of the
  Laws of Thought* (1854) founded the algebra of logic, supplying
  Peirce and Schröder with their starting point.
- **Augustus De Morgan** — British mathematician and logician. Peirce
  called him "the greatest formal logician that ever lived." *On the
  Syllogism IV* (1860) founded the calculus of binary relations, the
  direct ancestor of Peirce's logic of relatives.
- **William Whewell** — English polymath (philosophy, history and
  philosophy of science, mineralogy). Coined "scientist" and
  "consilience." His philosophy of scientific inference shaped Peirce
  and (via different routes) J. S. Mill.
- **Charles Darwin** — English naturalist whose *Origin of Species*
  (1859) supplied the template for evolutionary thinking that Peirce
  extended into cosmology (tychism, agapism).
- **Ernst Schröder** — German mathematician and logician. *Vorlesungen
  über die Algebra der Logik* (1890–1905) synthesized the Boolean
  tradition with Peirce's logic of relatives; the main conduit by which
  Peirce's logic reached Löwenheim, Skolem, and early Hilbert.
- **Josiah Royce** — American idealist philosopher, Harvard colleague
  of Peirce and James. His late logical writings engage Peircean
  material seriously despite an otherwise absolute-idealist frame.
- **Frank Ramsey** — English mathematician, logician, and
  philosopher. Read *Chance, Love, and Logic* carefully; his
  decision-theoretic pragmatism and work on truth and probability are
  substantively Peircean. Died at 26.
- **Karl-Otto Apel** — German philosopher. His *Charles S. Peirce:
  From Pragmatism to Pragmaticism* (1967–75) is the seminal
  German-language interpretation; his own transcendental pragmatics
  carries Peircean themes into Frankfurt-School discourse ethics.
- **Umberto Eco** — Italian semiotician, philosopher, and novelist.
  *A Theory of Semiotics* (1976) developed the Peircean sign-triad as
  an alternative to Saussurean signifier/signified semiology.
- **Thomas Sebeok** — American linguist and semiotician
  (Hungarian-born). Founded biosemiotics on Peircean foundations; major
  institutional builder of modern semiotics.
- **Richard Dedekind** — German mathematician. Contemporary of
  Peirce; independent work on continuity (*Stetigkeit und irrationale
  Zahlen*, 1872) and the foundations of the natural numbers
  (*Was sind und was sollen die Zahlen?*, 1888).
- **Georg Cantor** — German mathematician. Founded set theory and
  the theory of transfinite numbers. Peirce's synechism is a
  distinctive alternative account of continuity in conversation with
  Cantor's.

---

## 3. `works.json` — Peirce primary-source entries

Consolidated from `reading-dag.md`. Existing: `how-to-make-our-ideas-clear`.
Add the following. Slug pattern matches existing convention
(kebab-case title, append discriminator where needed). Works without
a concrete English translation year use `composedCertainty: "exact"`
on first-publication year.

| Slug | Title | Year | Type | Notes |
|---|---|---|---|---|
| `new-list-of-categories` | On a New List of Categories | 1867 | essay | Proc. Amer. Acad. Arts & Sci. 7: 287–298 |
| `notation-logic-of-relatives` | Description of a Notation for the Logic of Relatives | 1870 | essay | Mem. Amer. Acad. Arts & Sci.; subtitled "resulting from an amplification of the conceptions of Boole's calculus of logic" |
| `fixation-of-belief` | The Fixation of Belief | 1877 | essay | *Popular Science Monthly* 12: 1–15 |
| `doctrine-of-chances` | The Doctrine of Chances | 1878 | essay | PSM 12; part of the 1877–1878 "Illustrations of the Logic of Science" series |
| `probability-of-induction` | The Probability of Induction | 1878 | essay | PSM 12; same series |
| `order-of-nature` | The Order of Nature | 1878 | essay | PSM 13; same series |
| `deduction-induction-hypothesis` | Deduction, Induction, and Hypothesis | 1878 | essay | PSM 13; first statement of abduction as a third mode |
| `algebra-of-logic-1880` | On the Algebra of Logic | 1880 | essay | *American Journal of Mathematics* 3: 15–57 |
| `algebra-of-logic-1885` | On the Algebra of Logic: A Contribution to the Philosophy of Notation | 1885 | essay | *American Journal of Mathematics* 7: 180–202. The quantification paper |
| `architecture-of-theories` | The Architecture of Theories | 1891 | essay | *The Monist* 1; start of the 1891–1893 metaphysical series |
| `doctrine-of-necessity-examined` | The Doctrine of Necessity Examined | 1892 | essay | *The Monist* 2; critique of mechanistic determinism |
| `law-of-mind` | The Law of Mind | 1892 | essay | *The Monist* 2; synechism |
| `mans-glassy-essence` | Man's Glassy Essence | 1892 | essay | *The Monist* 3; physical continuity |
| `evolutionary-love` | Evolutionary Love | 1893 | essay | *The Monist* 3; agapism |
| `harvard-lectures-pragmatism` | Harvard Lectures on Pragmatism | 1903 | lectures | Seven lectures; best reading in *Essential Peirce* vol. 2 |
| `lowell-lectures-1903` | Lowell Lectures | 1903 | lectures | Eight lectures; IV–V introduce EGs for a general audience |
| `what-pragmatism-is` | What Pragmatism Is | 1905 | essay | *The Monist* 15: 161–181. Introduces "pragmaticism" |
| `issues-of-pragmaticism` | Issues of Pragmaticism | 1905 | essay | *The Monist* 15: 481–499 |
| `prolegomena-apology-pragmaticism` | Prolegomena to an Apology for Pragmaticism | 1906 | essay | *The Monist* 16: 492–546. The published EG statement |

`descriptionShort` drafts for each entry are in
[`reading-dag.md`](./reading-dag.md) at the corresponding section —
seed the `descriptionShort` by condensing the blurb to two sentences.
Composed-year certainty is `"exact"` for all.

`originalLanguage: "English"` for all.
`philosopherSlug: "charles-peirce"` for all.

---

## 4. `philosopher-influences.json` — new edges

All edges use `influencerSlug` / `influencedSlug` / `influenceType` /
`description` (schema matches existing entries). Target philosopher
slugs assume §2 has been seeded.

### 4.1 Incoming (who shaped Peirce)

| Influencer | Type | Description |
|---|---|---|
| `immanuel-kant` | direct | Peirce claimed to have memorized the *Critique of Pure Reason* as a young man. His 1867 *New List of Categories* is an explicit revision of Kant's table of categories (into Firstness, Secondness, Thirdness), and Kantian influence propagates into every later part of the system. |
| `duns-scotus` | direct | Scholastic realism — universals are mind-independently real — is central to Peirce's mature metaphysics against nominalism. Boler, *Charles Peirce and Scholastic Realism* (1963) is the standard source. |
| `aristotle` | direct | Peirce frames abduction as a recovery of Aristotle's *apagoge* (reduction / hypothesis), making an explicit continuity claim with the *Prior* and *Posterior Analytics*. |
| `george-boole` | direct | *The Laws of Thought* (1854) is the starting point for Peirce's algebraic logic; his 1870 paper is explicitly "an amplification of the conceptions of Boole's calculus of logic." |
| `augustus-de-morgan` | direct | *On the Syllogism IV* (1860) founded the calculus of binary relations. Peirce built directly on this; arguably more important than Boole for Peirce's specific technical achievement. |
| `william-whewell` | direct | Whewell's philosophy of science — consilience of inductions, the structured character of scientific inference — shapes Peirce's philosophy of science through the 1870s–80s. |
| `hegel` | indirect | Limited in Peirce's early work; more acknowledged late. Peirce said his late philosophy ended up resembling Hegel's more than he expected, while insisting on his independent route via Kant and the categories. |
| `charles-darwin` | direct | Evolutionary thinking shapes Peirce's cosmology: tychism (chance as a formative principle) and agapism (evolutionary love as cosmological driver). The impact is philosophical-methodological more than biological. |

### 4.2 Outgoing additions (who Peirce shaped)

Existing outgoing edges retained: `charles-peirce → william-james` and
`charles-peirce → ci-lewis`.

| Influenced | Type | Description |
|---|---|---|
| `john-dewey` | direct | Dewey took pragmatism in a social, educational, and political direction. Acknowledged Peirce's priority throughout. |
| `josiah-royce` | direct | Royce's late logical writings draw substantially on Peircean material despite his absolute-idealist frame. |
| `frank-ramsey` | direct | Ramsey read *Chance, Love, and Logic* (1923, Cohen ed.) carefully; his decision-theoretic pragmatism is substantively Peircean. Cite Misak, *Cambridge Pragmatism* (2016) ch. 2. |
| `wvo-quine` | direct | Quine adopted Peirce's logic of relatives as the technical basis for modern predicate logic in *Methods of Logic* (1950). Dismissive of existential graphs specifically, but conceded Peirce's importance for the logic of relations. |
| `hilary-putnam` | direct | Putnam revived Peircean themes in semantic externalism and in his 1970s–80s realist arguments. Cite "Peirce the Logician" (1982). |
| `karl-otto-apel` | direct | Apel's *Charles S. Peirce: From Pragmatism to Pragmaticism* (1967–75) is the major German interpretation of Peirce; his own transcendental pragmatics is explicitly Peircean. |
| `jurgen-habermas` | indirect | Habermas's theory of communicative action inherits Peircean elements through Apel — the "indefinite community of inquiry" as a regulative ideal is Peirce via Apel's reading. |
| `umberto-eco` | direct | Eco's *A Theory of Semiotics* (1976) works with the Peircean sign / object / interpretant triad rather than the Saussurean signifier/signified pair. |
| `thomas-sebeok` | direct | Sebeok founded biosemiotics on Peircean foundations; major institutional builder of modern semiotics. |

### 4.3 Contemporary / parallel-development edges

**Decision (2026-04-17):** Encode contemporary / parallel-development
relationships as `influenceType: "indirect"` with a `description`
that makes clear it is parallel/contextual rather than causal. No new
`influenceType` value is introduced for this ticket; revisit if a later
case study accumulates enough contemporary edges to justify the schema
change.

**Frege ↔ Peirce:** seed **both directions** as `indirect`, with
symmetric descriptions. The parallel development is genuinely mutual
and both directions should render in each philosopher's influence
section.

| Influencer | Influenced | Type | Description |
|---|---|---|---|
| `gottlob-frege` | `charles-peirce` | indirect | Parallel development of quantification: Frege's *Begriffsschrift* (1879) and Peirce's *On the Algebra of Logic* (1885) each arrived at a fully general theory of quantification independently and from different directions. No known direct contact between them. The single cleanest contrast point in late-19th-century logic. |
| `charles-peirce` | `gottlob-frege` | indirect | Parallel development of quantification: Peirce's *On the Algebra of Logic* (1885) arrived at a fully general theory of quantification independently of Frege's *Begriffsschrift* (1879), from a relational rather than function-argument conception. No known direct contact between them. |
| `ernst-schroder` | `charles-peirce` | indirect | Contemporary; Schröder read Peirce extensively and built on him in *Vorlesungen über die Algebra der Logik* (1890–1905) — the main conduit for Peirce's technical logic to reach Löwenheim, Skolem, and early Hilbert. Relation is contemporary-plus-transmission rather than a direct influence on Peirce. |

Dedekind and Cantor edges are omitted from the seed on purpose: the
connection is real but narrow (synechism vs. Cantorian continuity);
keep them as philosopher records without an edge until a future
ticket does Peirce's philosophy of mathematics.

---

## 5. `philosopher-schools.json` — Peirce

Existing: `charles-peirce → pragmatism (founder)`. No change.

Scholastic realism is not currently in `schools.json` (verified
2026-04-17). Per `README.md` §"Open questions specific to Peirce,"
leave this unadded for the seed ticket; revisit when another
medieval-realism-adjacent case study lands.

---

## 6. `notes.json` — Peirce concept summaries and bibliography

Per `README.md` §"Schema question" the chosen path is Option A: encode
concept summaries as `notes.json` entries, not as a new DTO field. The
existing schema uses `philosopherSlug` + `noteType` + `content` +
optional `sourceName`. Introduce `noteType: "concept_summary"` as a
new value (no F# change needed — `noteType` is a string in current
seed). Bibliography entries use the existing `noteType: "bibliography"`.

### 6.1 Concept summaries (eight entries)

Each entry:

```json
{
  "philosopherSlug": "charles-peirce",
  "noteType": "concept_summary",
  "sourceName": "Curator",
  "content": "<body below>"
}
```

Bodies, draft copy (2–4 paragraphs each — matches the density of the
existing `hegel` curator-authored notes in `notes.json`):

**Pragmatic maxim / pragmaticism.** Title: *Pragmatic Maxim*. Body:
The pragmatic maxim holds that the meaning of a concept is the sum of
its conceivable practical consequences: "Consider what effects, that
might conceivably have practical bearings, we conceive the object of
our conception to have. Then, our conception of these effects is the
whole of our conception of the object." (*How to Make Our Ideas Clear*,
1878.) The maxim is a method for clarifying concepts, not a theory of
truth or utility.

Peirce renamed his view "pragmaticism" in 1905 — "a word ugly enough
to be safe from kidnappers" — to distinguish it from William James's
more psychological and utility-oriented popularization. For Peirce the
maxim is about the inferential, public, and long-run consequences of
holding a concept, not about individual satisfaction or success.

**Abduction.** Title: *Abduction*. Body: Peirce's name for the third
mode of inference, alongside deduction and induction. Where deduction
concludes the particular from the general and induction concludes the
general from the particular, abduction infers a hypothesis that
would, if true, explain a surprising phenomenon: "The surprising fact,
C, is observed; but if A were true, C would be a matter of course;
hence, there is reason to suspect that A is true."

Peirce originally called this inference-to-a-hypothesis "hypothesis"
(1878, *Deduction, Induction, and Hypothesis*), and later "abduction"
or "retroduction," framing it as a recovery of Aristotle's *apagoge*.
The concept is foundational for the philosophy of science and has had
an extended second life in cognitive science, artificial intelligence,
and diagnostic reasoning.

**Fallibilism.** Title: *Fallibilism*. Body: The epistemic stance that
any of our beliefs — including our best-confirmed scientific beliefs
— may in principle be false. Fallibilism is not skepticism; Peirce is
emphatic that fallibility is compatible with genuine knowledge and
with cumulative progress. What it rules out is infallibilist
foundations and the quest for certainty.

Fallibilism underwrites Peirce's conception of inquiry as a
self-correcting community process: truth is what inquiry would
converge on in the long run, and any particular finding is provisional.
This connects to the pragmatic maxim (meaning depends on what
practical-inferential consequences we would commit ourselves to) and
to the ideal of the "indefinite community of inquiry" that runs
through Apel and Habermas.

**Logic of relatives.** Title: *Logic of Relatives*. Body: Peirce's
generalization of Boolean algebra from monadic predicates (property of
an object) to relations (property of pairs, triples, and n-tuples of
objects). Introduced in *Description of a Notation for the Logic of
Relatives* (1870) as an "amplification of the conceptions of Boole's
calculus of logic," building directly on De Morgan's 1860 paper on the
logic of relations.

In the 1885 *On the Algebra of Logic: A Contribution to the Philosophy
of Notation*, Peirce introduced a fully general theory of quantification
— independently of Frege's 1879 *Begriffsschrift*. Schröder
systematized Peirce's logic of relatives in his *Vorlesungen über die
Algebra der Logik* (1890–1905); through Schröder it reached
Löwenheim, Skolem, and early Hilbert, where it became the substrate
of modern model theory. The logic of relatives is the direct ancestor
of modern relational algebra.

**Existential graphs.** Title: *Existential Graphs*. Body: A
two-dimensional diagrammatic logic Peirce developed from the late
1880s onward, which he regarded as his greatest contribution. The
alpha system handles propositional logic; beta handles first-order
predicate logic with quantification and identity; the (unfinished)
gamma system handles modal and higher-order features. Assertions are
written on a "sheet of assertion"; negation is scribed as a cut
(enclosure); existential quantification uses "lines of identity"
running between and across cuts.

EGs are the richest diagrammatic foil to Frege's *Begriffsschrift* —
another notation motivated by making logical structure visible,
arriving at a completely different visual language. The *Logic of the
Future* critical edition (Bellucci & Pietarinen, 2020–) has put
thousands of previously-unpublished EG manuscript pages into print.
See the project's Logic Lab for an interactive alpha system.

**Semiotics: sign / object / interpretant.** Title: *Semiotics*. Body:
Peirce founded modern semiotics on a triadic conception of the sign.
Every sign relates a *sign vehicle* (the sign itself), an *object*
(what the sign refers to or stands for), and an *interpretant* (the
further sign produced in the mind of an interpreter, or more
generally in any sign-interpreting system). The interpretant is
itself a sign, which has its own interpretant — signification
unfolds as an open-ended process.

Peirce's triad contrasts with Saussure's dyadic signifier/signified
scheme: Peirce insists on the object as a real third term, and on the
interpretant as a further sign rather than a psychological meaning.
Sebeok's biosemiotics, Eco's general semiotics, and (via Apel)
Habermas's communicative pragmatics all take Peirce rather than
Saussure as their foundation. For the deep modern treatment see Short,
*Peirce's Theory of Signs* (2007).

**Tychism.** Title: *Tychism*. Body: The cosmological doctrine that
absolute chance is a real, formative principle in the universe, not
merely apparent disorder reducible to hidden determinism. Introduced
in *The Doctrine of Necessity Examined* (1892) as a rejection of the
mechanistic determinism dominant in late-19th-century physics. Tychism
is part of an evolutionary cosmology that also includes synechism
(continuity) and agapism (evolutionary love).

**Synechism.** Title: *Synechism*. Body: The doctrine that continuity
is a real and fundamental feature of reality — of space, time, and
mind alike. Developed in *The Law of Mind* (1892) and *Man's Glassy
Essence* (1892) as part of the *Monist* metaphysical series. Peirce's
account of continuity is a distinctive alternative to Cantor's: where
Cantor analyzes a continuum as a set of discrete points of specific
cardinality, Peirce holds that genuine continuity cannot be reduced
to a collection of atomic points. The position bears on his
philosophy of mathematics, his account of the interpretant (semiotic
continuity of sign-interpretation), and his late logic of the gamma
graphs.

**Agapism.** Title: *Agapism*. Body: The cosmological doctrine that
evolutionary love — agapē — is a formative principle in the
universe, in addition to mechanical necessity and chance. Introduced
in *Evolutionary Love* (1893). Peirce contrasts three modes of
evolution: tychastic (by chance variation alone), anancastic (by
mechanical necessity alone), and agapastic (by a creative, directed
sympathy between parts). Speculative and rarely discussed without
embarrassment even by sympathetic commentators, but structurally
necessary to the cosmology: without agapism, tychism plus synechism
cannot explain directed cosmic development.

### 6.2 Bibliography entries

Per `secondary-literature.md` — encode each entry as
`noteType: "bibliography"` with `philosopherSlug: "charles-peirce"`.
Match the existing `hegel` bibliography-note format: a single
`content` body that lists titles with a short blurb, rather than one
DB row per book. (That format is what the detail page already renders.)

Sections to include, drawn from `secondary-literature.md`:

- **Orientation / introductions** — Hookway 1985; Hookway 2012; de
  Waal 2013; Misak 2013; Misak 2016.
- **Interpretive monographs** — Short 2007; Liszka 1996; Bergman
  2009; Boler 1963; Apel 1967–75 (Eng 1981); Kevelson 1987.
- **Reference works** — SEP entries; IEP; Commens Dictionary; Peirce
  Edition Project.
- **Essay collections** — Misak (ed.) *Cambridge Companion to Peirce*
  (2004); de Waal (ed.) *Oxford Handbook of Peirce* (2024);
  Houser, Roberts, & Van Evra (1997); Ketner (1995).
- **Biographical** — Brent 1998; Menand 2001.
- **EG-specific** (from `existential-graph-scholarship.md`) — Zeman
  1964; Roberts 1973; Shin 2002; Stjernfelt 2022; Bellucci &
  Pietarinen 2024 (Oxford Handbook ch. 14); Pietarinen (ed.)
  *Logic of the Future* 2020–2025.

Draft body copy per `secondary-literature.md` — a future agent should
lift the blurbs verbatim rather than re-compose them.

### 6.3 Reading-order note

Per `README.md` §"Detail-page UX plan" item 3, the structured-DAG
Reading Order is deferred. For the seed ticket: encode the DAG as a
single free-text `noteType: "context"` note with `sourceName: "Curator"`,
titled "Reading Peirce — A Suggested Order." Body: adapt
`reading-dag.md` entry-points / paths / editions structure. Once a
structured-DAG schema lands, migrate.

---

## 7. Sanity-check matrix

Run these after `npm run db:seed` completes, before the seed ticket
merges:

- [ ] `GET /api/philosophers/charles-peirce` returns expanded bio +
  `alsoKnownAs`.
- [ ] `GET /api/philosophers/charles-peirce` response's `works[]`
  contains all ~19 primary sources from §3.
- [ ] Response's `notes[]` contains 8 concept-summary notes and 1
  bibliography note and 1 reading-order note (§6).
- [ ] Response's incoming `influences[]` contains Kant, Duns Scotus,
  Aristotle, Boole, De Morgan, Whewell, Hegel, Darwin (§4.1) + the
  two incoming parallel-development edges Frege and Schröder (§4.3).
- [ ] Response's outgoing `influences[]` contains James (existing),
  Dewey, Royce, Lewis (existing), Ramsey, Quine, Putnam, Apel,
  Habermas, Eco, Sebeok (§4.2) + the outgoing Peirce → Frege
  parallel-development edge (§4.3).
- [ ] `GET /api/philosophers/gottlob-frege` response's `influences[]`
  contains Peirce (incoming parallel-development) — confirms the
  symmetric edge renders on both sides.
- [ ] `GET /api/graph/influence/charles-peirce?depth=2` returns a
  non-trivial subgraph (≥ 15 nodes) suitable for the
  `FEAT-philosopher-influence-graph-section` ticket.
- [ ] New philosopher slugs (§2.2) all resolve via
  `GET /api/philosophers/{slug}` without 404.
- [ ] Integration tests still pass (`npm run test:api`).
- [ ] Seed is idempotent: re-running `npm run db:seed` doesn't
  duplicate.

---

## 8. Out of scope for the seed ticket

Flagged here so the seed ticket doesn't grow:

- **Structured reading DAG DTO / route.** Deferred per
  `README.md` §"Schema question" Option A. Revisit after two or
  three more case studies.
- **Structured bibliography DTO / route.** Same deferral.
- **`influenceType: "contemporary"` as a new schema value.** Deferred;
  §4.3 reuses `indirect` with descriptive text. Revisit if a later
  case study accumulates enough parallel-development edges to justify
  the schema change.
- **New school `scholastic-realism`.** Deferred per
  `README.md` §"Open questions."
- **Dedekind / Cantor influence edges on Peirce.** Deferred; omit the
  edge for now, keep the philosopher records so later philosophy-of-
  mathematics work can wire them.
- **Peirce's scientific / mathematical / biographical work.** Per
  `README.md` §"Scope of this case study."
- **Logic-explorer link from detail page.** Depends on
  `FEAT-logic-explorer` existence; tracked separately.

---

## 9. Updates to propagate back into `docs/case-studies/peirce/`

The seed ticket should also carry these doc updates (§1 above):

- `existential-graph-scholarship.md` — add Stjernfelt 2022; Bellucci
  & Pietarinen 2024 (Oxford Handbook ch. 14).
- `secondary-literature.md` — add de Waal (ed.) *Oxford Handbook of
  Peirce* (2024).
- `reading-dag.md` editions table — *Logic of the Future* status
  update (5 books / 3 volumes, 2020–2025; completeness note).
- `README.md` §"Current seed-data state" — update once the seed ticket
  lands.

---

## 10. Suggested ticket sequencing

Confirming DOCS-004 §"Next tickets in the implied sequence":

1. **`DB-001-seed-peirce`** — this file is its spec. Expands
   `philosophers.json`, `works.json`, `philosopher-influences.json`,
   `notes.json` per §§2–6. Also updates case-study docs per §9.
2. **`REFAC-001-extract-detail-page-components`** — extract
   `WorkCard`, `PhilosopherLink`, `NoteBlock`, `SectionHeading` from
   `packages/web/src/routes/philosophers.$slug.tsx`. No behavior
   change. Prerequisite for the next two.
3. **`FEAT-006-philosopher-concepts-section`** — new "Concepts &
   Ideas" section rendering `noteType: "concept_summary"` entries as
   cards. Covered by §6.1 seed data.
4. **`FEAT-007-philosopher-influence-graph-section`** — new
   Influence Graph section using `@xyflow/react` +
   `@dagrejs/dagre`, fetching from
   `GET /api/graph/influence/{slug}?depth=2`. Data density provided
   by §§4 seed edges.
5. **`FEAT-008-structured-reading-order`** — still notes-encoded
   initially (per §6.3); structured DTO deferred.

Ticket numbers above (`DB-001`, `REFAC-001`, `FEAT-006`–`FEAT-008`)
are the next available in each prefix's sequence as of 2026-04-17.
If any of them shifts by the time a ticket actually opens, use the
then-current next number and leave this section as-is — it's a
sequencing sketch, not a registry.
