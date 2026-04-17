# Peirce — Influences & Context

**Status:** Draft — first-pass notes, 2026-04-16

Who Peirce read, who he influenced, who his contemporaries were.
Each edge is sourced — the intent is that these become entries in
`philosopher-influences.json` with citations pointing back into this
doc or into [`secondary-literature.md`](./secondary-literature.md).

---

## Influences *in* (who shaped Peirce)

Ordered roughly by the depth of influence on Peirce's developed system.

### Kant

Peirce's most-cited influence. He claimed to have memorized the
*Critique of Pure Reason* as a young man, and the 1867 paper
*On a New List of Categories* is an explicit revision of Kant's
table of categories (into Firstness, Secondness, Thirdness).
Through the categories, Kant's influence propagates into every
later part of Peirce's system: semiotics, logic, cosmology.

Cite: Hookway, *Peirce* (1985) ch. 1; Murphey, *The Development
of Peirce's Philosophy* (1961) passim.

### Duns Scotus

The scholastic realist tradition — that universals are mind-
independently real — is central to Peirce's mature metaphysics
against nominalism. Peirce was the only major 19th-century
American philosopher engaged with medieval scholasticism as
something more than historical curiosity.

Cite: Boler, *Charles Peirce and Scholastic Realism* (Washington,
1963) — the standard source.

### Aristotle

Logic, categories, scientific method. Peirce frames *abduction* as
a recovery of Aristotle's *apagoge* (reduction / hypothesis), making
an explicit continuity claim with the *Prior* and *Posterior Analytics*.
Peirce's categories are not Aristotle's but are in conversation with
them.

### Boole

*An Investigation of the Laws of Thought* (1854) is the starting point
for Peirce's algebraic logic. His 1870 *Description of a Notation for
the Logic of Relatives* is subtitled "resulting from an amplification
of the conceptions of Boole's calculus of logic." Boole is the
explicit ancestor against whom Peirce develops the logic of relations.

### De Morgan

*On the Syllogism IV* (1860) is the pivotal influence on Peirce's
logic of relatives — De Morgan was the first to insist that logic
must handle relations (not just monadic predicates). Peirce built
directly on this foundation. Arguably more important than Boole for
Peirce's specific technical achievement.

Cite: Merrill, "Relations and Quantifications in Peirce's Logic,
1870–1885" in Houser, Roberts, & Van Evra (1997).

### Whewell

William Whewell's philosophy of science — especially the notion of
*consilience of inductions* and the structured character of
scientific inference — shapes Peirce's philosophy of science
throughout the 1870s and 1880s.

Cite: Hookway, *Peirce* (1985) ch. 7; SEP "Charles Sanders Peirce"
§5.

### Hegel

Limited in Peirce's early work; more acknowledged late. Peirce said
his late philosophy ended up resembling Hegel's more than he had
expected, while insisting on his independent route via Kant and the
categories. Read Peirce's Hegel-relation as convergence more than
direct influence.

### Darwin

Evolutionary thinking shapes Peirce's cosmology (tychism: chance as
a formative principle; agapism: evolutionary love as cosmological
driver). Darwin's impact on Peirce is philosophical-methodological
more than biological; Peirce extrapolates the evolutionary pattern
to non-biological domains.

---

## Contemporaries

People doing parallel or adjacent work, usually without direct
contact. These edges aren't "X influenced Peirce" but "X and Peirce
were doing related work at the same time and matter for the
contextualization."

### Frege

Parallel development of quantification: Frege 1879 (*Begriffsschrift*),
Peirce 1885 (*On the Algebra of Logic*). **No known direct contact
between them.** Each developed quantification from a different
direction — Frege from a function-argument conception with
2D-hierarchical notation, Peirce from a relational conception with
algebraic notation and later existential graphs.

This is the single cleanest contrast point for the formal-logic
layer of this project. See
[`../../formal-logic/notation-systems.md`](../../formal-logic/notation-systems.md)
and the planned logic-explorer comparison UI.

Cite: SEP "Charles Sanders Peirce" §3.3; Putnam, "Peirce the
Logician" (1982).

### Schröder

Ernst Schröder *did* read Peirce extensively and built on him. His
*Vorlesungen über die Algebra der Logik* (1890–1905) is a synthesis
of the Boolean tradition extended with Peirce's logic of relatives.
This is the major conduit for Peirce's technical logic to reach
Löwenheim, Skolem, and early Hilbert.

Cite: Brady, *From Peirce to Skolem* (2000) — the standard source
on this transmission.

### William James

Close personal friend; the two were Cambridge neighbors for decades.
James popularized pragmatism in his *Pragmatism: A New Name for Some
Old Ways of Thinking* (1907), and Peirce acknowledged James as his
foremost public expositor. But Peirce was uncomfortable enough with
James's version — too psychological, too focused on utility, too
permissive about what counts as pragmatic — that he renamed his own
view "pragmaticism" in 1905, famously calling the new word "ugly
enough to be safe from kidnappers."

Functions as both contemporary *and* influence-out (James is the
main public transmitter of pragmatism).

### Josiah Royce

Harvard colleague; absolute idealist who nonetheless engaged
seriously with Peirce's logic. Royce's logical writings late in his
career draw on Peircean material.

### Dedekind, Cantor

Mathematical contemporaries. Peirce's work on continuity and
infinity is in dialogue with theirs, though largely developed
independently. Peirce had his own distinctive theory of continuity
(synechism) that diverges from the Cantorian treatment — a live
point of scholarship.

Cite: Moore (ed.), *Philosophy of Mathematics: Selected Writings of
Charles S. Peirce* (Indiana, 2010).

---

## Influences *out* (who Peirce shaped)

Direct and indirect. "Direct" means the person read Peirce and
acknowledged it; "indirect" means there's a transmission chain through
intermediaries.

### John Dewey — direct

Dewey took pragmatism in a social, educational, and political
direction that Peirce mostly did not. Acknowledged Peirce's priority
throughout.

### C.I. Lewis — direct

Lewis's *Mind and the World Order* (1929) develops a "conceptual
pragmatism" that owes substantial debts to Peirce. His modal logics
draw on Peirce's (less systematic) work on the logic of possibility.
(Already in seed.)

### Josiah Royce — direct (see Contemporaries)

Overlaps with the contemporary relation — Royce takes Peircean
logical material into his late idealism.

### Frank Ramsey — direct

Ramsey read *Chance, Love, and Logic* (1923, the Cohen edition)
carefully and engaged with its pragmatist themes in his Cambridge
work of the late 1920s. Ramsey's decision-theoretic pragmatism is
genuinely Peircean.

Cite: Misak, *Cambridge Pragmatism* (2016) ch. 2 — the most
thorough treatment of this transmission.

### W.V.O. Quine — direct (ambivalent)

Quine adopted Peirce's logic of relatives as the technical basis for
modern predicate logic as taught in *Methods of Logic* (1950).
Dismissive of EGs specifically, but conceded Peirce's importance for
the logic of relations.

### Hilary Putnam — direct

Putnam revived Peircean themes in semantic externalism (the "meaning
ain't in the head" argument has Peircean antecedents) and in his
realist arguments of the 1970s and 1980s.

Cite: Putnam, "Peirce the Logician" (1982), *Realism and Reason*
(1983).

### Karl-Otto Apel — direct

Apel's *Charles S. Peirce: From Pragmatism to Pragmaticism* (1967–75)
is the major German interpretation of Peirce, and Apel's own
transcendental pragmatics is explicitly Peircean. Main conduit for
Peirce into German-speaking philosophy.

### Jürgen Habermas — indirect (via Apel)

Habermas's theory of communicative action inherits Peircean elements
through Apel: the idea of the "indefinite community of inquiry" as a
regulative ideal is unmistakably Peirce, via Apel's reading.

### Umberto Eco — direct

Eco's semiotics is substantially Peircean; *A Theory of Semiotics*
(1976) works with the Peircean sign/object/interpretant triad rather
than the Saussurean signifier/signified pair.

### Thomas Sebeok — direct

Sebeok founded biosemiotics on Peircean foundations; major
institutional builder of modern semiotics (*Zeichen/Sign* journal,
the *Encyclopedic Dictionary of Semiotics*). Direct student of the
Peircean tradition.

---

## Citation convention

Each influence edge in `philosopher-influences.json` will carry:

- `influenceType` — `direct` or `indirect` (existing schema).
- `description` — short textual claim (existing schema).
- (Option A schema — current) Reference to the secondary source best
  supporting the edge, encoded in the description or in a companion
  `notes.json` entry.
- (Option B schema — future, if adopted) A structured `citationRef`
  field pointing to a bibliography entry.

See [`README.md`](./README.md) §"Schema question".

---

## What's deliberately omitted

Some figures sometimes cited as Peirce influences / influenced that
are **not** on this list because the influence is weak or contested:

- **Emerson, Thoreau, and the American transcendentalists** — Peirce
  grew up in this milieu (his father Benjamin Peirce was a
  contemporary) but his mature philosophy doesn't engage them
  seriously.
- **Husserl** — parallel developments in phenomenology; no
  documented mutual influence. Worth noting in semiotics contexts
  but doesn't belong in the edge list.
- **Heidegger** — occasionally invoked as a contrast to Peirce but
  no genuine historical link.

If later scholarship shifts on any of these, revise.
