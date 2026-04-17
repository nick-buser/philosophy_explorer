# Existential Graph Scholarship — Modern Revival

**Status:** Draft — first-pass notes, 2026-04-16

Peirce's existential graphs (EGs) sat largely dormant for half a
century after his death. Since the 1960s, and with a clear
acceleration since the 2000s, they have become an active research
area at the intersection of formal logic, diagrammatic reasoning,
and the philosophy of logic. This file captures the key figures and
works in that revival.

It's separated from [`secondary-literature.md`](./secondary-literature.md)
because the EG literature is *specialist* and because — unusually
for a 19th-century system — the foundational manuscript edition
(*Logic of the Future*) is still being published. This is **active
research, not settled history**.

This file is the primary reference source for the `peirce-eg`
system in the logic-systems explorer; see
[`../../formal-logic/logic-explorer-tab.md`](../../formal-logic/logic-explorer-tab.md).

---

## Foundational rediscovery (1960s–1970s)

### Zeman, *The Graphical Logic of C.S. Peirce* (University of Chicago PhD dissertation, 1964)

The modern rediscovery. Zeman gave the first systematic modern
treatment of EG proof rules and established their soundness and
completeness with respect to classical propositional and
first-order logic. Available through the Peirce Edition Project
and as a scan online (Zeman's personal site).

Not book-published, but cited as the starting point of the revival.

### Roberts, *The Existential Graphs of Charles S. Peirce* (Mouton, 1973)

The foundational monograph of the modern era. Roberts:

- Establishes the textual basis (which manuscripts contain which
  systems).
- Presents alpha (propositional), beta (first-order), and gamma
  (modal / higher-order) with careful formal treatment.
- Demonstrates that EGs are not merely a notational variant but
  offer a distinctive proof strategy.

Still cited everywhere. Out of print for decades; reprinted by De
Gruyter Mouton 2009.

---

## Definitive modern treatments

### Shin, *The Iconic Logic of Peirce's Graphs* (MIT Press, 2002)

The definitive modern technical treatment of alpha and beta.
Sun-Joo Shin argues that EGs are a fully rigorous, genuinely
*iconic* logic — their visual structure is not decorative but
carries logical content. Key contributions:

- Formal syntax and semantics for alpha and beta, clarified and
  made modern.
- Proof of soundness and completeness with respect to classical
  propositional and first-order logic.
- Argument that the iconic dimension is philosophically significant:
  some inferential moves are easier or more natural in the EG
  notation than in the symbolic.

This is the book to build a visual-syntax renderer against. Shin
specifies the visual primitives (the cut as a simple closed curve
defining a nested negation context; juxtaposition as conjunction;
identity lines in beta) with enough precision for implementation.

### Stjernfelt, *Diagrammatology: An Investigation on the Borderlines of Phenomenology, Ontology, and Semiotics* (Springer, 2007)

Philosophical framing of diagrammatic reasoning in Peircean terms.
Stjernfelt argues that diagrams are *thinking* — not illustrations
of thought but constitutive of it. Peirce's semiotics and EGs are
central examples.

Less a formal treatment than a philosophical one; pair with Shin
for the logic and with Stjernfelt for the interpretation.

### Stjernfelt, *Natural Propositions: The Actuality of Peirce's Doctrine of Dicisigns* (Docent, 2014)

Successor to *Diagrammatology*. Focus on propositional content and
the dicisign (Peirce's term for the sign-type that carries
propositional content). Connects EG-style diagrammatic thinking
to recent work on propositional content in philosophy of mind
and language.

---

## Proof-theoretic and formal-semantics work (2000s–present)

### Pietarinen, *Signs of Logic: Peircean Themes on the Philosophy of Language, Games, and Communication* (Springer, 2006)

Broad treatment of Peircean logic, with substantial EG content.
Introduces game-theoretic semantics for EGs. One of the first book-
length modern Peirce-logic treatments after Shin.

### Pietarinen and collaborators

Ahti-Veikko Pietarinen has built the most active Peirce-logic
research community of the past two decades. With Bellucci, Ma,
Chiffi, Sorbi, and others:

- Proof systems for gamma-graphs (modal EGs).
- Tautology-checking algorithms.
- Relationships between EG proof rules and modern natural
  deduction / sequent calculi.
- Historical reconstructions of Peirce's manuscript development.

Output is primarily in journal articles and conference proceedings
(particularly the *Diagrams* conference, see below). The flagship
output is the *Logic of the Future* editions (below).

### Dau, *The Logic System of Concept Graphs with Negation and Its Relationship to Predicate Logic* (Springer LNAI vol. 2892, 2003)

Formal semantics for EG-style systems using mathematical
category theory. Dau's work connects EGs to Sowa's "conceptual
graphs" (a 1970s/80s cognitive-science formalism descended in
part from Peirce) and provides rigorous semantics for the whole
family.

More formally demanding than Shin; best read after Shin for the
mathematical depth.

### Oostra

Arnold Oostra has developed constructive / intuitionistic
variants of EGs. Less-published than Pietarinen but an
interesting direction — shows that the EG proof rules don't
commit one to classical logic.

---

## The *Logic of the Future* editions

### Bellucci & Pietarinen (eds.), *Logic of the Future: Writings on Existential Graphs*, vols. 1–3+ (De Gruyter, 2019–)

This is a **transformational** project for EG scholarship. For the
first time, Peirce's extensive EG manuscripts — including many
never before published in any form — are being put into systematic
print with scholarly apparatus.

- **Volume 1** (2019) — *History and Applications*. Covers Peirce's
  development of the EGs and their applications.
- **Volume 2** (2020) — *The Logic of the Future: The 1903 Lowell
  Lectures*. Full text with apparatus.
- **Volume 3** (2021) — manuscripts on the gamma system.
- Further volumes planned.

Anyone doing serious work on Peirce's EGs should know this edition
exists; it supersedes older compilations for manuscript-level
accuracy.

---

## Adjacent work in diagrammatic reasoning

EGs sit in a broader diagrammatic-reasoning research community.
Peirce is a touchstone but not the only subject.

### Barwise & Etchemendy, *Hyperproof* (CSLI, 1994)

Not Peircean, but part of the same diagrammatic-logic revival.
Combines sentences and diagrams in a single proof system. Shares
the motivation: diagrams are logical, not illustrative.

### Shin & Lemon, "Diagrams" (SEP entry, ongoing)

Up-to-date survey of the whole diagrammatic-reasoning field,
including EGs.

### *Diagrams* conference series (Springer LNCS, biennial since 2000)

The main venue for diagrammatic-reasoning research. Regular EG
papers from Pietarinen's group and others. Proceedings are
published in the Springer LNCS series; open-access preprints
usually available through author websites.

### Sowa's Conceptual Graphs

John Sowa developed "conceptual graphs" in the 1970s–80s as a
knowledge-representation formalism with Peircean influences.
Descended from EGs but with different goals (KR, not proof
theory). Dau's work connects the two.

---

## Open research directions

Active questions, as of 2026:

- **Proof search over EGs.** Automated theorem proving in the EG
  notation; interesting because the visual structure suggests
  different heuristics than symbolic provers.
- **Pedagogical tools.** There is ongoing work on using EGs to
  teach propositional and first-order logic, motivated by the
  iconic-readability argument (Shin 2002).
- **Semantics for gamma-graphs.** The modal / higher-order system
  is less settled than alpha and beta; multiple semantic proposals
  compete.
- **Connections to homotopy type theory and proof-relevant logic.**
  Speculative but genuinely active; the "proofs as shapes" motif
  in HoTT has drawn some interest in EG-style iconic semantics.
- **Digital editions and renderers.** The EG community has
  repeatedly built software renderers (from Zeman's early tools
  to modern web-based ones). Our logic-explorer tab is a
  contribution in this space.

---

## How this informs the logic-explorer tab

When the `/logic/peirce-eg` page lands (see
[`../../formal-logic/logic-explorer-tab.md`](../../formal-logic/logic-explorer-tab.md)),
its content draws on:

- **Visual syntax specification** → Shin (2002). Shin specifies the
  primitives precisely enough to implement: cuts, juxtaposition,
  lines of identity.
- **Proof rules** → Roberts (1973), Shin (2002), Pietarinen (2006
  and later papers). For any in-browser proof-checking, these give
  the rule set.
- **Example formulas** → Roberts (1973) has worked examples;
  *Logic of the Future* vol. 1 gives Peirce's own.
- **Further reading** → the orientation paragraph for the page links
  to SEP "Diagrams" and this scholarship file.

The phase-1 implementation does not need a full renderer or proof-
checker; static pre-rendered SVGs of a few canonical alpha-system
formulas are enough to populate the page meaningfully. Full
interactive rendering is a later phase.
