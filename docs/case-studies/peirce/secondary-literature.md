# Peirce — Secondary Literature

**Status:** Draft — first-pass notes, 2026-04-16

Curated secondary literature on Peirce, organized by purpose:
orientation, interpretive depth, reference.

EG-revival scholarship is *adjacent* but deserves its own treatment
— see [`existential-graph-scholarship.md`](./existential-graph-scholarship.md).

---

## How to use this list

Tier by purpose:

- **Orientation** — read one of these early. They frame the field.
- **Interpretive monographs** — deeper treatment of specific threads
  (semiotics, pragmatism, logic). Pick by interest.
- **Reference works** — bookmark; consult as needed.
- **Essay collections** — good when you want to sample specialists on
  a given topic.

Where entries land in seed data, each becomes a `notes.json` record
of `noteType: "bibliography"` — see
[`README.md`](./README.md) § "Schema question".

---

## Orientation / introductions

### Hookway, *Peirce* (Routledge, 1985)

The classic short introduction, part of the Routledge "Arguments of
the Philosophers" series. Balances logic, epistemology, and
metaphysics. Still the best single-volume entry point after 40 years.

### Hookway, *The Pragmatic Maxim: Essays on Peirce and Pragmatism* (Oxford, 2012)

Mature treatment of the central Peircean concept, drawing on
Hookway's decades of engagement. Assumes some familiarity; read
after one of the introductions above.

### de Waal, *Peirce: A Guide for the Perplexed* (Continuum, 2013)

Newer introduction; explicitly pedagogical. Good alternative to
Hookway (1985) for a fresh treatment, slightly lighter on logic.

### Misak, *The American Pragmatists* (Oxford, 2013)

Places Peirce in the historical development of pragmatism. Short
chapters; good for understanding the Peirce–James–Dewey–Mead lineage.

### Misak, *Cambridge Pragmatism: From Peirce and James to Ramsey and Wittgenstein* (Oxford, 2016)

Traces the transmission of pragmatist ideas from Peirce through
Ramsey to Cambridge analytic philosophy. The best single source for
understanding Peirce's influence on 20th-century analytic philosophy
— especially Ramsey's engagement with Peirce's *Chance, Love, and Logic*.

---

## Interpretive monographs

### Short, *Peirce's Theory of Signs* (Cambridge, 2007)

The deep, definitive modern treatment of Peircean semiotics. Argues
strongly for a developmental reading — the late semiotic is not what
the early semiotic was. Technical in places. If you care about
semiotics, this is the book.

### Liszka, *A General Introduction to the Semeiotic of Charles Sanders Peirce* (Indiana, 1996)

Systematic exposition of the semiotic theory. More descriptive, less
argumentative than Short; complementary.

### Bergman, *Peirce's Philosophy of Communication* (Continuum, 2009)

Applies Peircean semiotics to communication theory. Narrower focus
than Short or Liszka but useful if you're coming at Peirce from
media / rhetoric / communication studies.

### Boler, *Charles Peirce and Scholastic Realism* (Washington, 1963)

Older but foundational — the standard source on Peirce's relationship
to Duns Scotus and the medieval realist tradition. Cited throughout
the `influences-and-context.md` entry for Scotus.

### Apel, *Charles S. Peirce: From Pragmatism to Pragmaticism* (Massachusetts, 1981, German original 1967–75)

The seminal German-language interpretation, translated into English.
The bridge from Peirce into German philosophy (Habermas, Apel's own
transcendental pragmatics). Reads Peirce philosophically rather than
technically; good complement to Anglophone interpretations.

### Kevelson, *Charles S. Peirce's Method of Methods* (John Benjamins, 1987)

Methodological focus — how Peirce's philosophy of inquiry structures
the whole system. Specialized.

---

## Reference works

### Stanford Encyclopedia of Philosophy

The SEP has multiple entries relevant to Peirce. Each is
authoritative, peer-reviewed, regularly updated, and free:

- *Charles Sanders Peirce* — the main entry.
- *Peirce's Theory of Signs* — semiotics.
- *Peirce's Logic* — logic of relatives, quantification, EGs.
- *Pragmatism* — Peirce in the broader movement.
- *Diagrams* — includes substantial treatment of Peirce's EGs.
- *Abduction* — Peirce's third mode of inference.

Usually the best place to start for any specific topic; cites the
primary and secondary literature exhaustively.

### Internet Encyclopedia of Philosophy (IEP)

*Peirce, C.S.* entry. Shorter than SEP but still solid. Alternative
starting point.

### Commens Dictionary (commens.org)

Online dictionary of Peirce's terminology, with each term indexed to
primary-source citations. Invaluable when reading the primary texts
— search any unfamiliar term and get Peirce's own definitions in
their original context.

### Peirce Edition Project (Indiana University Purdue University Indianapolis)

The institutional home of Peirce scholarship. Maintains the
*Chronological Edition*, the manuscript catalog (Robin numbers),
and an array of scholarly resources. Website: peirce.indianapolis.iu.edu.

---

## Essay collections

### Misak (ed.), *The Cambridge Companion to Peirce* (Cambridge, 2004)

Broad-scope collection; chapters by specialists on logic, semiotics,
pragmatism, metaphysics, philosophy of science. Good way to sample
before committing to a monograph.

### Houser, Roberts, & Van Evra (eds.), *Studies in the Logic of Charles Sanders Peirce* (Indiana, 1997)

Logic-focused essays. Essential if you're working on the logic path.
Includes contributions from the main EG scholars of the period.

### Ketner (ed.), *Peirce and Contemporary Thought: Philosophical Inquiries* (Fordham, 1995)

Older; broadly thematic. Useful for specific essays but less
systematic than Misak (2004).

---

## Biographical

### Brent, *Charles Sanders Peirce: A Life* (Indiana, rev. ed. 1998)

The standard biography. Controversial at publication — Brent is
frank about Peirce's personal difficulties (the reason Peirce was
driven out of academic life). Not a substitute for reading the
philosophy but useful context for why the writings are scattered
and unfinished.

### Menand, *The Metaphysical Club: A Story of Ideas in America* (Farrar, 2001)

Broader intellectual history of the early pragmatists (Peirce,
James, Holmes, Dewey). Non-specialist, readable; good for
atmosphere rather than philosophical depth. Pulitzer-winning.

---

## How this list maps to the detail page

Each entry above becomes a `notes.json` record of
`noteType: "bibliography"` associated with `philosopher:charles-peirce`.
Body is the blurb; `sourceType` captures whether it's a monograph,
reference, essay collection, or biography.

The detail page's existing "Secondary Literature" section already
renders these; no detail-page change needed for this list. The
Concepts & Ideas section and the Influence Graph section, planned
in [`README.md`](./README.md), are separate work.
