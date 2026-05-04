// Logic-systems seed data — client-side for phase 1. Will migrate to
// data/seed/logic-systems.json + F# API when a second system ships.
// See docs/formal-logic/logic-explorer-tab.md §Storage.

import type { FrameClass, FrameClassSlug, KripkeModel } from '../logic/kripke-types';
import { ALL_FRAMES } from '../logic/kripke-frames';

export type LogicSystemStatus = 'available' | 'stub';

export type LogicExample = {
  slug: string;
  natural: string;       // plain-English gloss
  dsl: string;           // short-form DSL
  note?: string;         // lossiness / commentary
  // FEAT-006 — optional fields populated by the modal-logic system.
  // Other systems leave them undefined.
  model?: KripkeModel;
  satisfied?: boolean;   // truth at the designated world (hand-authored in phase 1)
  frameClass?: FrameClassSlug;
};

export type LogicPrimitive = {
  name: string;
  syntax: string;
  description: string;
};

export type LogicSystem = {
  slug: string;
  name: string;
  shortDescription: string;
  era: string;
  keyPrimitive: string;
  status: LogicSystemStatus;
  thinkerSlug: string | null;
  history: string;
  primitives: LogicPrimitive[];
  examples: LogicExample[];
  readingPointers: { title: string; href: string; kind: 'case-study' | 'doc' | 'external' }[];
  // FEAT-006 — frame-class metadata for parameterized-semantics systems
  // (modal logic). Other systems leave this undefined.
  frameClasses?: FrameClass[];
};

export const LOGIC_SYSTEMS: LogicSystem[] = [
  {
    slug: 'peirce-eg',
    name: 'Peirce\u2019s Existential Graphs (Alpha)',
    shortDescription:
      'A 2D diagrammatic propositional logic. Writing a proposition asserts it; enclosing it in an oval (a "cut") negates it; nesting handles implication.',
    era: '1880s\u20131900s',
    keyPrimitive: 'cut + juxtaposition',
    status: 'available',
    thinkerSlug: 'charles-peirce',
    history:
      'Peirce developed the existential graphs in manuscript form across the 1880s\u20131900s, publishing the first systematic statement in the 1906 Monist paper "Prolegomena to an Apology for Pragmaticism." The system was motivated by the same goal as Frege\u2019s Begriffsschrift \u2014 making logical structure visible \u2014 but arrived at an entirely different visual language built on simple closed curves and juxtaposition rather than hierarchical strokes. The modern revival runs Zeman (1964) \u2192 Roberts (1973) \u2192 Shin (2002) \u2192 Pietarinen and collaborators, culminating in the ongoing Logic of the Future edition (Bellucci & Pietarinen 2019\u2013).',
    primitives: [
      {
        name: 'Sheet of assertion',
        syntax: 'top-level area',
        description: 'Whatever is written on the sheet is asserted. The sheet itself carries no negation.',
      },
      {
        name: 'Atom',
        syntax: 'P',
        description: 'A propositional letter. Rendered as an italic glyph on the sheet or inside a cut.',
      },
      {
        name: 'Juxtaposition',
        syntax: 'P Q',
        description: 'Placing graphs side by side on the same area asserts their conjunction.',
      },
      {
        name: 'Cut',
        syntax: '(P)',
        description: 'A simple closed curve around a graph negates it. Cuts can nest to any depth.',
      },
      {
        name: 'Scroll (implication)',
        syntax: '(P (Q))',
        description: 'A cut containing P and an inner cut containing Q encodes "if P then Q". Peirce called this the scroll.',
      },
      {
        name: 'Double cut (identity)',
        syntax: '((P))',
        description: 'Two nested cuts around the same graph are an identity transform: the double-cut rule lets you add or remove them freely.',
      },
    ],
    examples: [
      {
        slug: 'atom',
        natural: 'P',
        dsl: 'P',
      },
      {
        slug: 'negation',
        natural: 'not P',
        dsl: '(P)',
      },
      {
        slug: 'conjunction',
        natural: 'P and Q',
        dsl: 'P Q',
      },
      {
        slug: 'implication',
        natural: 'if P then Q (Peirce\u2019s scroll)',
        dsl: '(P (Q))',
      },
      {
        slug: 'modus-ponens',
        natural: 'P, and if P then Q \u2014 therefore Q (the conjunction on the sheet)',
        dsl: 'P (P (Q))',
        note: 'The iteration/deiteration rules are what let this collapse to just Q.',
      },
      {
        slug: 'double-cut',
        natural: 'double-negation \u2014 equivalent to the inner graph',
        dsl: '((P Q))',
        note: 'Alpha\u2019s double-cut rule: ((G)) \u2194 G. A canonical didactic example.',
      },
      {
        slug: 'demorgan',
        natural: 'not (P and Q) \u2014 De Morgan shape in Peirce notation',
        dsl: '(P Q)',
      },
    ],
    readingPointers: [
      { title: 'Peirce case study', href: '/philosophers/charles-peirce', kind: 'case-study' },
      {
        title: 'Existential-graph scholarship (docs)',
        href: 'https://github.com/',
        kind: 'doc',
      },
      {
        title: 'Shin, The Iconic Logic of Peirce\u2019s Graphs (MIT Press, 2002)',
        href: 'https://mitpress.mit.edu/9780262194709/',
        kind: 'external',
      },
    ],
  },
  {
    slug: 'kripke',
    name: 'Kripke Modal Logic',
    shortDescription:
      'Propositional modal logic with Kripke (possible-worlds) semantics. Necessity (□) and possibility (◇) get truth conditions from a directed accessibility relation across worlds; different constraints on that relation yield different modal logics (K, T, S4, S5, …).',
    era: '1959 →',
    keyPrimitive: '□ / ◇ over an accessibility relation',
    status: 'available',
    thinkerSlug: null,
    history:
      'Saul Kripke introduced possible-worlds semantics for modal logic in a sequence of papers in the late 1950s and early 1960s — most influentially "A Completeness Theorem in Modal Logic" (1959) and "Semantical Considerations on Modal Logic" (1963). The framework had antecedents in Carnap, Hintikka, and Stig Kanger, but Kripke’s formulation gave modal logic a tractable model theory and a uniform completeness story across the standard axiom systems (K, T, S4, S5, …). It is now the default semantics for modal, temporal, deontic, epistemic, and dynamic logics across philosophy, linguistics, computer science, and AI.',
    primitives: [
      {
        name: 'Atomic proposition',
        syntax: 'p, q, r, …',
        description: 'A propositional letter. Each world independently assigns it true or false via the valuation V.',
      },
      {
        name: 'Necessity',
        syntax: '[]p  (□p)',
        description: 'True at world w iff p is true at every world v with R(w, v). "In every world we can see from here, p holds."',
      },
      {
        name: 'Possibility',
        syntax: '<>p  (◇p)',
        description: 'True at world w iff p is true at some world v with R(w, v). Dual of necessity: ◇p ≡ ¬□¬p.',
      },
      {
        name: 'Frame',
        syntax: '(W, R)',
        description: 'A set of worlds W with a directed accessibility relation R ⊆ W × W. Constraints on R determine which axiom system the frame validates.',
      },
      {
        name: 'Model',
        syntax: '(W, R, V)',
        description: 'A frame plus a valuation V mapping each world to the set of atoms true there. Truth of a formula is defined inductively at each world.',
      },
      {
        name: 'Frame class',
        syntax: 'K, T, S4, S5, …',
        description: 'A class of frames whose accessibility relation satisfies a particular set of constraints (none, reflexive, reflexive+transitive, equivalence, …). Each class corresponds to an axiom system via standard completeness results.',
      },
    ],
    examples: KRIPKE_EXAMPLES(),
    readingPointers: [
      {
        title: 'Stanford Encyclopedia of Philosophy: Modal Logic',
        href: 'https://plato.stanford.edu/entries/logic-modal/',
        kind: 'external',
      },
      {
        title: 'Hughes & Cresswell, A New Introduction to Modal Logic (Routledge, 1996)',
        href: 'https://www.routledge.com/A-New-Introduction-to-Modal-Logic/Hughes-Cresswell/p/book/9780415125994',
        kind: 'external',
      },
      {
        title: 'Blackburn, de Rijke & Venema, Modal Logic (Cambridge, 2001)',
        href: 'https://www.cambridge.org/core/books/modal-logic/F7CDB0A265026819A24073A52CB23066',
        kind: 'external',
      },
    ],
    frameClasses: ALL_FRAMES,
  },
  {
    slug: 'frege-bs',
    name: 'Frege\u2019s Begriffsschrift',
    shortDescription:
      'The 1879 concept-script. 2D judgment-and-content strokes with condition strokes for implication and concavities for generality.',
    era: '1879',
    keyPrimitive: 'judgment + content stroke',
    status: 'available',
    thinkerSlug: null,
    history:
      'Gottlob Frege published the *Begriffsschrift* (\u201cconcept-script\u201d) in 1879 as a 2D notation \u201cmodelled on that of arithmetic\u201d for capturing logical structure directly. Frege took the universal quantifier as primitive (a concavity in the content stroke containing a Gothic letter) and built propositional structure from a horizontal content stroke, an attached vertical judgment stroke for assertion, a downward tick for negation, and a vertical condition stroke joining a consequent (top) to an antecedent (bottom). The notation was barely read for two decades \u2014 Russell rediscovered it in 1902 \u2014 and then mostly displaced by the linear Peano\u2013Russell style. Modern revivals trace Wermuth\u2019s `gfnotation` plain-TeX package (TUGboat 2015) and Sperberg-McQueen\u2019s 2023 Balisage paper on keyboarding Frege.',
    primitives: [
      {
        name: 'Content stroke',
        syntax: '\u2500\u2500 A',
        description: 'A horizontal stroke binds the symbols that follow into a single conceptual content. Every formula is built around at least one content stroke; nothing else attaches to anything except via this stroke.',
      },
      {
        name: 'Judgment stroke',
        syntax: '|- A',
        description: 'A vertical stroke at the left end of the content stroke. Asserts the content as a fact. Without it you have a mere thought; with it, a judgment. The modern turnstile \u22a2 descends from this mark.',
      },
      {
        name: 'Negation tick',
        syntax: '~A',
        description: 'A short vertical tick attached to the underside of the content stroke. \u201cThe content does not obtain.\u201d The stroke continues unbroken through the tick.',
      },
      {
        name: 'Condition stroke',
        syntax: 'A -> B',
        description: 'A vertical stroke joining two content strokes: the consequent on top, the antecedent below. Encodes material implication, negating only \u201cantecedent holds yet consequent fails.\u201d Nesting handles all propositional structure.',
      },
      {
        name: 'Generality (concavity)',
        syntax: 'all x. F(x)',
        description: 'A small concave dip in the content stroke containing a Gothic letter. Universal quantification over the bound variable. Frege took the universal as primitive and derived the existential as \u00ac\u2200\u00ac.',
      },
    ],
    examples: [
      {
        slug: 'atom',
        natural: 'judgment of the atom p',
        dsl: '|- p',
      },
      {
        slug: 'negation',
        natural: 'not p',
        dsl: '|- ~p',
      },
      {
        slug: 'conditional',
        natural: 'if p then q',
        dsl: '|- p -> q',
        note: 'Frege places the consequent on top of the T-junction and the antecedent below \u2014 reading \u201cif (bottom) then (top).\u201d',
      },
      {
        slug: 'double-negation',
        natural: 'if not-not-p then p (Frege\u2019s axiom 41)',
        dsl: '|- ~~p -> p',
        note: 'One half of double-negation elimination, an axiom in Frege\u2019s 1879 system.',
      },
      {
        slug: 'positive-paradox',
        natural: 'p implies (q implies p) \u2014 Frege\u2019s axiom 1',
        dsl: '|- p -> (q -> p)',
        note: 'The first axiom of the *Begriffsschrift*: a true content can be conditionally appended to anything.',
      },
      {
        slug: 'universal-instantiation',
        natural: 'if F holds for all x, then F holds of a',
        dsl: '|- (all x. F(x)) -> F(a)',
        note: 'The standard universal-instantiation pattern, drawn with a concavity dipping into the content stroke.',
      },
      {
        slug: 'transitivity-of-conditional',
        natural: 'if (p \u2192 q) and (q \u2192 r) then (p \u2192 r), under universal F/G/H',
        dsl: '|- (all x. F(x) -> G(x)) -> (all x. G(x) -> H(x)) -> (all x. F(x) -> H(x))',
        note: 'A nested conditional under three concavities \u2014 the kind of layout the Begriffsschrift renders very legibly and the linear notation does not.',
      },
    ],
    readingPointers: [
      {
        title: 'Stanford Encyclopedia of Philosophy: Frege\u2019s Logic',
        href: 'https://plato.stanford.edu/entries/frege-logic/',
        kind: 'external',
      },
      {
        title: 'Wermuth, Typesetting the Begriffsschrift in plain TeX (TUGboat 2015)',
        href: 'https://www.tug.org/TUGboat/tb36-3/tb114wermuth.pdf',
        kind: 'external',
      },
      {
        title: 'Schlimm, On Frege\u2019s Begriffsschrift notation for propositional logic',
        href: 'https://www.cs.mcgill.ca/~dirk/schlimm2017-begriffsschrift-prefinal.pdf',
        kind: 'external',
      },
      {
        title: 'Frege, Begriffsschrift (1879, English translation, Information Philosopher)',
        href: 'https://www.informationphilosopher.com/solutions/philosophers/frege/Frege_Begriffsschrift.pdf',
        kind: 'external',
      },
    ],
  },
  {
    slug: 'aristotelian',
    name: 'Aristotelian Syllogistic',
    shortDescription:
      'Term logic with four categorical forms (A/E/I/O) and fixed syllogism patterns (Barbara, Celarent, \u2026).',
    era: '~350 BCE \u2192',
    keyPrimitive: 'categorical proposition',
    status: 'available',
    thinkerSlug: 'aristotle',
    history:
      'Aristotle systematised term logic in the Prior Analytics (~350 BCE), distinguishing the four categorical proposition forms \u2014 universal affirmative (A), universal negative (E), particular affirmative (I), particular negative (O) \u2014 and the syllogism: two premises sharing a middle term, yielding a conclusion. Aristotle worked out the first three figures; the fourth figure was added later, traditionally credited to Galen and the Peripatetics. Medieval logicians (Boethius, Peter of Spain, the 13th\u201314th-century scholastics) refined the system, codified the 24 valid moods with their mnemonic names (Barbara, Celarent, Darii, Ferio, \u2026), and developed the doctrines of suppositio and consequentia. Term logic remained the standard logic curriculum from antiquity through the early 19th century before being superseded by the Frege \u2192 Russell \u2192 Hilbert tradition of quantified predicate logic.',
    primitives: [
      {
        name: 'Universal affirmative (A)',
        syntax: 'All S is P',
        description: 'Every S is also a P. Shaded as: the region of S outside P is empty.',
      },
      {
        name: 'Universal negative (E)',
        syntax: 'No S is P',
        description: 'No S is a P. Shaded as: the overlap of S and P is empty.',
      },
      {
        name: 'Particular affirmative (I)',
        syntax: 'Some S is P',
        description: 'At least one S is a P. Marked with \u00d7 in the overlap of S and P.',
      },
      {
        name: 'Particular negative (O)',
        syntax: 'Some S is not P',
        description: 'At least one S is not a P. Marked with \u00d7 in the part of S outside P.',
      },
      {
        name: 'Syllogism',
        syntax: 'major / minor / conclusion',
        description: 'Two premises sharing a middle term M and producing a conclusion that links the remaining terms S and P. The figure (1\u20134) is determined by where M sits in each premise; the mood is the three-letter form sequence (e.g. AAA = Barbara).',
      },
    ],
    examples: [
      {
        slug: 'barbara',
        natural: 'Barbara (AAA-1) \u2014 All men are Mortal; all Greeks are men; therefore all Greeks are Mortal.',
        dsl: 'All men are Mortal\nAll Greeks are men\nTherefore all Greeks are Mortal',
        note: 'The textbook syllogism. Both premises universal affirmative (A); conclusion universal affirmative.',
      },
      {
        slug: 'celarent',
        natural: 'Celarent (EAE-1) \u2014 No fish is Mammal; all trout is fish; therefore no trout is Mammal.',
        dsl: 'No fish is Mammal\nAll trout is fish\nTherefore no trout is Mammal',
        note: 'Universal-negative major. Shading shows fish\u2229Mammal and (since trout\u2286fish) trout\u2229Mammal both empty.',
      },
      {
        slug: 'darii',
        natural: 'Darii (AII-1) \u2014 All philosophers are Wise; some Greeks are philosophers; therefore some Greeks are Wise.',
        dsl: 'All philosophers are Wise\nSome Greeks are philosophers\nTherefore some Greeks are Wise',
        note: 'Particular conclusion from one universal and one particular premise. The \u00d7 in the diagram lands at the centre region (S\u2229M\u2229P).',
      },
      {
        slug: 'ferio',
        natural: 'Ferio (EIO-1) \u2014 No bird is Mammal; some pet is bird; therefore some pet is not Mammal.',
        dsl: 'No bird is Mammal\nSome pet is bird\nTherefore some pet is not Mammal',
        note: 'The fourth perfect (Figure-1) syllogism. Universal negative + particular affirmative \u21d2 particular negative.',
      },
      {
        slug: 'cesare',
        natural: 'Cesare (EAE-2) \u2014 No Mammal is Reptile; all snake is Reptile; therefore no snake is Mammal.',
        dsl: 'No Mammal is Reptile\nAll snake is Reptile\nTherefore no snake is Mammal',
        note: 'Figure 2: middle term (Reptile) is predicate of both premises. Reduces to Celarent by converting the major.',
      },
      {
        slug: 'bocardo',
        natural: 'Bocardo (OAO-3) \u2014 Some cats are not Tame; all cats are Mammal; therefore some Mammal is not Tame.',
        dsl: 'Some cats are not Tame\nAll cats are Mammal\nTherefore some Mammal is not Tame',
        note: 'Figure 3: middle term (cats) is subject of both premises. The O-premise is the major \u2014 unusual in textbook ordering, but parser figures out major/minor from term content.',
      },
      {
        slug: 'undistributed-middle',
        natural: 'Invalid (AAA-2) \u2014 All cats are Mammal; all dogs are Mammal; therefore all dogs are cats.',
        dsl: 'All cats are Mammal\nAll dogs are Mammal\nTherefore all dogs are cats',
        note: 'The classic undistributed-middle fallacy. The middle term (Mammal) is never distributed (never used universally) so there\u2019s no guaranteed link between cats and dogs. Diagram shows the conclusion is not forced.',
      },
      {
        slug: 'compact-barbara',
        natural: 'Compact form \u2014 Barbara as AAA-1 / Greeks, men, Mortal.',
        dsl: 'AAA-1/Greeks,men,Mortal',
        note: 'The dense one-line form: mood-figure / S, M, P. Equivalent to the long-form Barbara above. Useful when scanning many syllogisms or generating them programmatically.',
      },
    ],
    readingPointers: [
      {
        title: 'Aristotle, Prior Analytics (Stanford Encyclopedia of Philosophy)',
        href: 'https://plato.stanford.edu/entries/aristotle-logic/',
        kind: 'external',
      },
      {
        title: 'Square of opposition (SEP)',
        href: 'https://plato.stanford.edu/entries/square/',
        kind: 'external',
      },
      {
        title: 'Medieval theories of the syllogism (SEP)',
        href: 'https://plato.stanford.edu/entries/medieval-syllogism/',
        kind: 'external',
      },
      {
        title: 'Aristotelian syllogistic \u2014 system design notes',
        href: 'https://plato.stanford.edu/entries/aristotle-logic/#Syllogistic',
        kind: 'doc',
      },
    ],
  },
  {
    slug: 'medieval',
    name: 'Medieval Modal Syllogistic',
    shortDescription:
      'Aristotle\u2019s assertoric term logic extended with necessity (\u25a1) and possibility (\u25c7). The medievals built de re vs de dicto, the modal mood-figure tables, sorites chains, and the theory of consequences on this base.',
    era: '13th\u201314th c.',
    keyPrimitive: 'modal proposition',
    status: 'available',
    thinkerSlug: 'john-buridan',
    history:
      'Aristotle treated modal syllogistic in Prior Analytics I.8\u201322, mixing necessity, possibility, and assertoric premises across the four figures \u2014 but his treatment is famously inconsistent on which mixed moods are valid. Aquinas, Robert Kilwardby, and Albert the Great worked through the material in the 13th century; the 14th-century logicians (Ockham, Buridan, Albert of Saxony) produced the most consolidated medieval accounts. Buridan\u2019s Tractatus de consequentiis (c. 1335) and Summulae de dialectica (c. 1340) systematise modal syllogistic, the theory of consequences (formal vs material), and supposition theory. The de re / de dicto distinction \u2014 in sensu diviso vs in sensu composito \u2014 is the key conceptual move: a modal operator can bind the predicate inside the proposition (de re) or the proposition as a whole (de dicto), and the validity of mixed-mode moods turns on which reading is in force.',
    primitives: [
      {
        name: 'Necessity (de dicto)',
        syntax: 'Necessarily, all S is P',
        description: 'The whole proposition is necessary. \u25a1\u2200x(Sx \u2192 Px) in modern notation.',
      },
      {
        name: 'Necessity (de re)',
        syntax: 'All S is necessarily P',
        description: 'Each S is necessarily P. \u2200x(Sx \u2192 \u25a1Px) in modern notation. Distinct from de dicto in modal contexts where the assignment of necessity matters.',
      },
      {
        name: 'Possibility (de dicto)',
        syntax: 'Possibly, some S is P',
        description: 'It is possible that some S is P. \u25c7\u2203x(Sx \u2227 Px).',
      },
      {
        name: 'Possibility (de re)',
        syntax: 'Some S is possibly P',
        description: 'There is some S that is possibly P. \u2203x(Sx \u2227 \u25c7Px).',
      },
      {
        name: 'Modal mood',
        syntax: 'L X L \u00b7 figure 1',
        description: 'A 3-letter pattern over {X assertoric, L necessity, M possibility} \u2014 one letter per (major, minor, conclusion). Validity depends on the underlying assertoric mood, the figure, and the modal reading. The contested case Barbara LXL-1 is valid de re (Aristotle) but invalid de dicto (Buridan).',
      },
      {
        name: 'Sorites',
        syntax: 'A \u2192 B \u2192 C \u2192 D',
        description: 'A multi-step term-logic chain where each adjacent pair is a syllogism (canonically Barbara). Aristotelian sorites threads predicate \u2192 next subject; Goclenian sorites threads subject \u2192 next predicate (premise order reversed).',
      },
    ],
    examples: [
      {
        slug: 'necessity-barbara',
        natural: 'Necessity Barbara (LLL-1) \u2014 Necessarily, all M is P; necessarily, all S is M; therefore necessarily all S is P.',
        dsl: 'Necessarily, all M is P\nNecessarily, all S is M\nTherefore necessarily all S is P',
        note: 'All-necessity moods are valid in any figure where the underlying assertoric mood is valid. Both readings agree.',
      },
      {
        slug: 'lxl-de-re',
        natural: 'Barbara LXL-1 (de re reading) \u2014 Necessarily, all M is P; all S is M; therefore necessarily all S is P.',
        dsl: 'Necessarily, all M is P\nAll S is M\nTherefore necessarily all S is P',
        note: 'Aristotle\u2019s contested mixed mood. Valid de re (the necessity flows from the major to the conclusion). Invalid de dicto \u2014 Buridan and Theophrastus held the conclusion follows the weaker premise (peiorem semper sequitur conclusio).',
      },
      {
        slug: 'lxx-de-dicto',
        natural: 'Barbara LXX-1 (de dicto reading) \u2014 the same premises but with an assertoric conclusion.',
        dsl: 'Necessarily, all M is P\nAll S is M\nTherefore all S is P',
        note: 'Theophrastus / Buridan\u2019s reading: with one assertoric premise the conclusion can only be assertoric. Valid de dicto, invalid under the de re rule (which would force a necessity conclusion).',
      },
      {
        slug: 'possibility-celarent',
        natural: 'Possibility Celarent (MMM-1) \u2014 Possibly, no M is P; possibly, all S is M; therefore possibly no S is P.',
        dsl: 'Possibly, no M is P\nPossibly, all S is M\nTherefore possibly no S is P',
        note: 'All-possibility moods are valid wherever the assertoric mood is valid; the modal layer just propagates.',
      },
      {
        slug: 'aristotelian-sorites',
        natural: 'Aristotelian sorites \u2014 four Barbara steps chained.',
        dsl: 'All A is B\nAll B is C\nAll C is D\nAll D is E\nTherefore all A is E',
        note: 'Each adjacent pair shares a term in the subject\u2192predicate pattern. Decomposes into 3 Barbara steps; valid iff every step is.',
      },
      {
        slug: 'goclenian-sorites',
        natural: 'Goclenian sorites \u2014 same chain walked tail-to-head.',
        dsl: 'All D is E\nAll C is D\nAll B is C\nAll A is B\nTherefore all A is E',
        note: 'Goclenian premise order: each line\u2019s predicate matches the previous line\u2019s subject. Same fused conclusion as the Aristotelian form, just walked in reverse.',
      },
      {
        slug: 'invalid-modal-figure-2',
        natural: 'Invalid (LXL-2 de re) \u2014 mixed-mode mood outside figure 1.',
        dsl: 'Necessarily, all P is M\nAll S is M\nTherefore necessarily all S is P',
        note: 'Phase 1 cuts mixed-mode moods to figure 1 only. Buridan would say the conclusion does not follow even there \u2014 the necessity does not transmit through figure 2 reliably. Marked invalid (pattern-not-supported).',
      },
      {
        slug: 'compact-modal-barbara',
        natural: 'Compact modal Barbara \u2014 LLL-1 / de-re / S, M, P.',
        dsl: 'LLL-1/de-re/S,M,P',
        note: 'Compact form. Mode letters X (assertoric) / L (necessity) / M (possibility) per premise/conclusion, then figure, reading suffix, and S,M,P term assignment.',
      },
    ],
    readingPointers: [
      {
        title: 'Medieval theories of the syllogism (SEP)',
        href: 'https://plato.stanford.edu/entries/medieval-syllogism/',
        kind: 'external',
      },
      {
        title: 'John Buridan (SEP)',
        href: 'https://plato.stanford.edu/entries/buridan/',
        kind: 'external',
      },
      {
        title: 'Medieval theories of modality (SEP)',
        href: 'https://plato.stanford.edu/entries/modality-medieval/',
        kind: 'external',
      },
      {
        title: 'De re / de dicto (SEP)',
        href: 'https://plato.stanford.edu/entries/prop-attitude-reports/dere.html',
        kind: 'external',
      },
    ],
  },
  {
    slug: 'modern-fol',
    name: 'Modern First-Order Logic',
    shortDescription:
      'Peano / Russell-style linear symbolic notation. \u2200 \u2203 \u00ac \u2227 \u2228 \u2192 \u2194 with predicates, functions, and identity. The default working notation of mathematics and analytic philosophy since the early 20th century.',
    era: '1889 \u2192',
    keyPrimitive: 'quantifier + connective',
    status: 'available',
    thinkerSlug: null,
    history:
      'Giuseppe Peano introduced the modern linear symbolism in his 1889 *Arithmetices principia, nova methodo exposita* \u2014 the small-caps \u2283 for implication, \u2208 for membership, the inverted-A and reversed-E for the quantifiers a few years later. Frege had already given a complete predicate logic (the *Begriffsschrift* 1879) but in a 2D notation that almost no one read; Peano\u2019s linear style spread through Russell and Whitehead\u2019s *Principia Mathematica* (1910\u20131913) and Hilbert\u2019s G\u00f6ttingen school. The metatheoretic story \u2014 G\u00f6del\u2019s 1929 completeness theorem, the 1930 incompleteness theorems, Skolem and Herbrand on substitution, Gentzen on natural deduction and sequent calculus (1934\u20131935), Tarski on truth and definability \u2014 turned classical FOL into the canonical setting for mathematical logic. The semantic-tableau / truth-tree method this lab uses for validity checking traces back to Beth (1955) and Smullyan\u2019s *First-Order Logic* (1968).',
    primitives: [
      {
        name: 'Universal quantifier',
        syntax: 'forall x. P(x)  (\u2200x.\u00a0P(x))',
        description: 'Asserts that the body holds for every element of the domain. Wide-scope by default \u2014 `forall x. P(x) -> Q(x)` reads as \u2200x.(P(x)\u2192Q(x)). Use parentheses to force narrow scope.',
      },
      {
        name: 'Existential quantifier',
        syntax: 'exists x. P(x)  (\u2203x.\u00a0P(x))',
        description: 'Asserts that the body holds for at least one element. Defined as \u00ac\u2200x.\u00acP(x) classically; in this lab the two are interderivable but kept primitive for readability.',
      },
      {
        name: 'Predicate atom',
        syntax: 'P(t1, ..., tn)',
        description: 'A relation or property applied to terms. Zero-arg predicates are propositional letters: `P` is the same shape as `P()`. Argument-free predicates fall in the propositional fragment.',
      },
      {
        name: 'Identity',
        syntax: 't = u   /   t != u',
        description: 'First-class equality on terms. The validity checker propagates equality via union-find on the open branch, so symmetry, transitivity, and Leibniz substitution on atomic predicates are handled automatically.',
      },
      {
        name: 'Connectives',
        syntax: '\u00ac \u2227 \u2228 \u2192 \u2194  (~ & | -> <->)',
        description: 'The standard truth-functional connectives. Precedence (tightest first): \u00ac, \u2227, \u2228, \u2192 (right-assoc), \u2194 (left-assoc). All examples here are classical \u2014 LEM and double-negation elimination both hold.',
      },
      {
        name: 'Function term',
        syntax: 'f(t1, ..., tn)',
        description: 'A function symbol applied to argument terms. Used in the term language alongside variables and constants. Quantifiers bind only first-order variables; `f` is treated as a function name even if it shadows a quantified variable.',
      },
    ],
    examples: [
      {
        slug: 'modus-ponens',
        natural: 'Modus ponens \u2014 (p \u2192 q) \u2227 p \u2192 q',
        dsl: '(p -> q) & p -> q',
        note: 'The textbook propositional tautology. Decided by truth-table since it has no quantifiers or predicates with arguments.',
      },
      {
        slug: 'contraposition',
        natural: 'Contraposition \u2014 (p \u2192 q) \u2194 (\u00acq \u2192 \u00acp)',
        dsl: '(p -> q) <-> (~q -> ~p)',
        note: 'A propositional tautology. The classical equivalence; in intuitionistic logic only one direction holds.',
      },
      {
        slug: 'demorgan',
        natural: 'De Morgan \u2014 \u00ac(p \u2228 q) \u2194 (\u00acp \u2227 \u00acq)',
        dsl: '~(p | q) <-> (~p & ~q)',
      },
      {
        slug: 'universal-instantiation',
        natural: 'Universal instantiation \u2014 (\u2200x. P(x)) \u2192 P(a)',
        dsl: '(forall x. P(x)) -> P(a)',
        note: 'The basic \u2200-elimination rule, expressed as a tautology. Note the parentheses around the quantifier \u2014 without them, the wide-scope reading would absorb `-> P(a)` into the body.',
      },
      {
        slug: 'existential-generalization',
        natural: 'Existential generalization \u2014 P(a) \u2192 \u2203x. P(x)',
        dsl: 'P(a) -> exists x. P(x)',
      },
      {
        slug: 'forall-exists-vs-exists-forall',
        natural: '(\u2203x.\u2200y.\u00a0R(x,y)) \u2192 (\u2200y.\u2203x.\u00a0R(x,y)) \u2014 quantifier order matters',
        dsl: '(exists x. forall y. R(x, y)) -> (forall y. exists x. R(x, y))',
        note: 'The valid direction of quantifier swap. The converse (\u2200y.\u2203x.\u00a0R \u2192 \u2203x.\u2200y.\u00a0R) is *not* valid \u2014 try negating the conclusion to see why.',
      },
      {
        slug: 'drinker-paradox',
        natural: 'Drinker\u2019s paradox \u2014 \u2203x. (P(x) \u2192 \u2200y. P(y))',
        dsl: 'exists x. (P(x) -> forall y. P(y))',
        note: 'Smullyan\u2019s "in every pub, there is someone such that, if they are drinking, everyone is drinking." Classically valid (depends on LEM); fails intuitionistically. Tableau closes via case-analysis on whether \u2200y. P(y) holds.',
      },
      {
        slug: 'identity-reflexivity',
        natural: 'Reflexivity of identity \u2014 \u2200x. x = x',
        dsl: 'forall x. x = x',
        note: 'The defining axiom of identity. Tableau closes it instantly: \u00ac\u2200x.x=x introduces a fresh c with \u00ac(c=c), which closes by reflexivity.',
      },
      {
        slug: 'identity-symmetry',
        natural: 'Symmetry of identity \u2014 \u2200x \u2200y. (x = y \u2192 y = x)',
        dsl: 'forall x. forall y. (x = y -> y = x)',
        note: 'Validated via the union-find equality propagator: from c1 = c2 the closure check derives c2 = c1 automatically.',
      },
      {
        slug: 'invalid-converse-quantifier-swap',
        natural: 'Invalid \u2014 (\u2200y.\u2203x.\u00a0R(x,y)) \u2192 (\u2203x.\u2200y.\u00a0R(x,y))',
        dsl: '(forall y. exists x. R(x, y)) -> (exists x. forall y. R(x, y))',
        note: 'The wrong direction of quantifier swap. Tableau saturates with two distinct skolem witnesses and reports a countermodel \u2014 e.g. the "every person has a mother" / "there is a universal mother" gap.',
      },
    ],
    readingPointers: [
      {
        title: 'Stanford Encyclopedia of Philosophy: Classical Logic',
        href: 'https://plato.stanford.edu/entries/logic-classical/',
        kind: 'external',
      },
      {
        title: 'Stanford Encyclopedia of Philosophy: First-order Model Theory',
        href: 'https://plato.stanford.edu/entries/modeltheory-fo/',
        kind: 'external',
      },
      {
        title: 'Smullyan, First-Order Logic (Springer, 1968 / Dover reprint)',
        href: 'https://store.doverpublications.com/0486683702.html',
        kind: 'external',
      },
      {
        title: 'Peano, Arithmetices principia, nova methodo exposita (1889)',
        href: 'https://archive.org/details/arithmeticespri00peangoog',
        kind: 'external',
      },
    ],
  },
  {
    slug: 'boolean',
    name: 'Boolean Algebra',
    shortDescription:
      'The algebraic-logic lineage: Boole → De Morgan → Jevons → Schröder. Propositions as algebra over {0, 1} with · (AND), + (OR), and complement. Truth-table, Karnaugh-map, and lattice (Hasse) views together exhibit the same content as algebra, geography, and order.',
    era: '1847–1890s',
    keyPrimitive: 'algebra over {0, 1}',
    status: 'available',
    thinkerSlug: null,
    history:
      'George Boole’s *Mathematical Analysis of Logic* (1847) and *Laws of Thought* (1854) recast term logic as algebra over classes (or, dually, propositions): · for intersection / conjunction, + for union / disjunction, and 1 − x for complement, with x·x = x and x + x = x as the laws that distinguish it from ordinary arithmetic. Augustus De Morgan’s *Formal Logic* (1847) supplied the dualisation laws ¬(x·y) = ¬x + ¬y and ¬(x + y) = ¬x · ¬y. William Stanley Jevons’s logic piano (1869) and *Principles of Science* (1874) mechanised the calculus and added the inclusive-or convention. Charles Sanders Peirce contributed the truth-table-style analysis and connectives (1880, 1885); Ernst Schröder’s three-volume *Vorlesungen über die Algebra der Logik* (1890–1905) was the mature synthesis the early model theorists (Löwenheim, Skolem) actually read. The 20th-century reframing as the algebra of two-element lattices and the equivalence with switching circuits (Shannon 1937) made Boolean algebra the working notation of digital logic; the Karnaugh map (1953) and Quine–McCluskey procedure (1952–1956) added the canonical visualisation and minimisation algorithm. Frege’s *Begriffsschrift* (1879) was, by the way, the *competing* notation — his specific complaint against the Boolean tradition was that it obscures quantification.',
    primitives: [
      {
        name: 'Constants',
        syntax: '0, 1',
        description: 'The two truth values — false / empty class and true / universal class. Often written ⊥ / ⊤ in logical contexts.',
      },
      {
        name: 'Variables',
        syntax: 'x, y, z, …',
        description: 'Single-letter atoms. Each ranges over {0, 1}.',
      },
      {
        name: 'Conjunction (AND)',
        syntax: 'x · y, xy',
        description: 'Algebraic notation uses the dot or juxtaposition; the lab also accepts &, ∧, *. Idempotent (x·x = x), commutative, associative.',
      },
      {
        name: 'Disjunction (OR)',
        syntax: 'x + y',
        description: 'Algebraic + binds looser than juxtaposition. The lab also accepts |, ∨. Idempotent, commutative, associative.',
      },
      {
        name: 'Complement (NOT)',
        syntax: '¬x, x′',
        description: 'Postfix prime is the canonical Boolean-algebra spelling; the lab also accepts ~x, !x, ¬x. Involutive: (x′)′ = x.',
      },
      {
        name: 'Implication',
        syntax: 'x -> y',
        description: 'Definable as x′ + y; included so propositional examples render naturally.',
      },
      {
        name: 'Biconditional',
        syntax: 'x <-> y',
        description: 'Definable as x·y + x′·y′. Useful as a top-level operator when comparing two formulas.',
      },
    ],
    examples: [
      {
        slug: 'and',
        natural: 'x and y',
        dsl: 'x y',
        note: 'Juxtaposition is conjunction. Equivalent to x·y or x & y.',
      },
      {
        slug: 'or',
        natural: 'x or y',
        dsl: 'x + y',
      },
      {
        slug: 'demorgan',
        natural: 'De Morgan: ¬(x·y) = ¬x + ¬y',
        dsl: '~(x y) <-> ~x + ~y',
        note: 'A tautology; the truth-table view shows every row evaluates to 1 and the K-map shows the whole grid filled.',
      },
      {
        slug: 'absorption',
        natural: 'absorption: x + x·y = x',
        dsl: 'x + x y <-> x',
      },
      {
        slug: 'distributivity',
        natural: 'distributivity: x·(y + z) = x·y + x·z',
        dsl: 'x (y + z) <-> x y + x z',
      },
      {
        slug: 'consensus',
        natural: 'consensus: x·y + ¬x·z + y·z = x·y + ¬x·z',
        dsl: 'x y + ~x z + y z <-> x y + ~x z',
        note: 'The y·z term is redundant. The K-map shows the y·z group entirely covered by the other two prime implicants.',
      },
      {
        slug: 'majority',
        natural: 'majority of three: at least two of x, y, z',
        dsl: 'x y + x z + y z',
        note: 'Classic three-variable function; the K-map view exhibits three overlapping pairs.',
      },
      {
        slug: 'parity-3',
        natural: 'odd-parity of three: x XOR y XOR z',
        dsl: '(x ^ y) ^ z',
        note: 'XOR is associative; on the K-map the four 1-cells form a checkerboard with no adjacencies, the canonical "irreducible" pattern.',
      },
      {
        slug: 'four-var',
        natural: 'four-variable example with reducible groups',
        dsl: 'a b c + a b ~c + a ~b c d',
        note: 'Reduces to a·b + a·c·d after K-map minimisation. The Hasse view colours the upper set of all 16-cube vertices satisfying the formula.',
      },
      {
        slug: 'tautology',
        natural: 'excluded middle: x + ¬x',
        dsl: 'x + ~x',
        note: 'A constant: every K-map cell is 1, the truth column is all 1s, the Hasse view is the whole lattice.',
      },
      {
        slug: 'contradiction',
        natural: 'non-contradiction: x · ¬x',
        dsl: 'x ~x',
        note: 'A constant: every K-map cell is 0, the truth column is all 0s, the Hasse view is empty.',
      },
    ],
    readingPointers: [
      {
        title: 'Stanford Encyclopedia of Philosophy: The Algebra of Logic Tradition',
        href: 'https://plato.stanford.edu/entries/algebra-logic-tradition/',
        kind: 'external',
      },
      {
        title: 'Stanford Encyclopedia of Philosophy: George Boole',
        href: 'https://plato.stanford.edu/entries/boole/',
        kind: 'external',
      },
      {
        title: 'Boole, An Investigation of the Laws of Thought (1854)',
        href: 'https://www.gutenberg.org/ebooks/15114',
        kind: 'external',
      },
      {
        title: 'Stanford Encyclopedia of Philosophy: Boolean Algebra',
        href: 'https://plato.stanford.edu/entries/boolalg-math/',
        kind: 'external',
      },
    ],
  },
  {
    slug: 'natural-deduction',
    name: 'Natural Deduction',
    shortDescription:
      'Gentzen / Jaśkowski natural deduction for propositional logic. Premises ⊢ conclusion; the prover produces a Fitch-style numbered proof and the same derivation as a Gentzen-style tree. A classical / intuitionistic toggle controls whether RAA (proof by contradiction) is permitted.',
    era: '1934 →',
    keyPrimitive: 'introduction + elimination rules',
    status: 'available',
    thinkerSlug: null,
    history:
      'Gerhard Gentzen and Stanisław Jaśkowski independently introduced natural deduction in 1934. Gentzen’s "Untersuchungen über das logische Schließen" (1934–1935) gave the now-canonical pair of *introduction* and *elimination* rules for each connective and proved the cut-elimination / *Hauptsatz* theorem that justifies the system’s structural cleanliness; Jaśkowski’s 1934 paper "On the Rules of Suppositions in Formal Logic" introduced the alternative *flag* / linear presentation that Frederic Fitch popularised in 1952 with the box / vertical-bar layout familiar from undergraduate textbooks. The two presentations agree extensionally — a proof in one converts mechanically into a proof in the other — but read very differently: Fitch makes the assumption / discharge structure visible as nested boxes, Gentzen as a tree whose leaves are premises (or discharged assumptions in brackets) and whose root is the conclusion. The classical / intuitionistic split lives inside the rule set: drop RAA (and its cousin double-negation elimination), and the system collapses to intuitionistic propositional logic, which Heyting had axiomatised in 1930. Curry and Howard’s 1958–1980 correspondence between intuitionistic ND proofs and simply-typed lambda terms made the system the working notation of programming-language theory.',
    primitives: [
      {
        name: 'Introduction rules',
        syntax: '∧I, ∨I, →I, ¬I, ↔I',
        description: 'Each connective has a rule that *constructs* a formula of that shape. →I and ¬I open a subproof: assume the antecedent, derive the consequent (or ⊥), discharge.',
      },
      {
        name: 'Elimination rules',
        syntax: '∧E, ∨E, →E, ¬E, ↔E',
        description: 'Each connective has a rule that *uses* a formula of that shape. →E is modus ponens; ∨E is the case-analysis rule that consumes a disjunction by proving the goal in two parallel subproofs.',
      },
      {
        name: 'Reiteration',
        syntax: 'Reit',
        description: 'Copies a formula already on the branch into a deeper subproof. Required when an introduction rule needs a parent-scope formula in the body of its assumption box.',
      },
      {
        name: '⊥E (ex falso)',
        syntax: '⊥ ⊢ φ',
        description: 'From a contradiction, anything follows. Held in both classical and intuitionistic systems; together with ¬I it encodes constructive negation.',
      },
      {
        name: 'RAA (proof by contradiction)',
        syntax: 'classical only',
        description: 'Assume ¬φ, derive ⊥, conclude φ. The single rule that distinguishes classical from intuitionistic propositional logic in this Lab. Toggling it off makes LEM, double-negation elimination, and Peirce’s law underivable.',
      },
      {
        name: 'Argument / turnstile',
        syntax: 'φ1, φ2 ⊢ ψ',
        description: 'The Lab’s input is an argument: a comma-separated list of premises, a turnstile (⊢ or |-), and a conclusion. The prover searches for a derivation of the conclusion from the premises.',
      },
    ],
    examples: [
      {
        slug: 'modus-ponens',
        natural: 'Modus ponens — p, p → q ⊢ q',
        dsl: 'p, p -> q |- q',
        note: 'The textbook →E rule, with the elimination applied directly to the premises.',
      },
      {
        slug: 'self-implication',
        natural: 'p → p (intuitionistically valid, no premises)',
        dsl: '|- p -> p',
        note: 'A one-step →I: assume p, conclude p, discharge the assumption.',
      },
      {
        slug: 'hypothetical-syllogism',
        natural: 'Hypothetical syllogism — p → q, q → r ⊢ p → r',
        dsl: 'p -> q, q -> r |- p -> r',
      },
      {
        slug: 'and-commutativity',
        natural: 'Conjunction commutativity — p ∧ q ⊢ q ∧ p',
        dsl: 'p & q |- q & p',
        note: 'Three lines: ∧EL, ∧ER, ∧I.',
      },
      {
        slug: 'currying',
        natural: 'Currying — (p ∧ q) → r ⊢ p → (q → r)',
        dsl: '(p & q) -> r |- p -> (q -> r)',
        note: 'Two nested →I subproofs, then ∧I + →E in the inner box.',
      },
      {
        slug: 'disjunction-cases',
        natural: 'Disjunction elimination — p ∨ q, p → r, q → r ⊢ r',
        dsl: 'p | q, p -> r, q -> r |- r',
        note: 'The ∨E rule: case analysis with two parallel subproof boxes.',
      },
      {
        slug: 'contraposition',
        natural: 'Contraposition (one direction) — p → q ⊢ ¬q → ¬p',
        dsl: 'p -> q |- ~q -> ~p',
        note: 'Intuitionistically valid. The reverse direction is classical-only — it shows up as a separate example.',
      },
      {
        slug: 'demorgan-intuitionistic',
        natural: 'De Morgan (intuitionistic side) — ¬p ∧ ¬q ⊢ ¬(p ∨ q)',
        dsl: '~p & ~q |- ~(p | q)',
        note: '¬I on the goal opens a subproof; ∨E inside it splits on the disjunction; each side closes via ¬E.',
      },
      {
        slug: 'lem',
        natural: 'Excluded middle — ⊢ p ∨ ¬p (classical only)',
        dsl: '|- p | ~p',
        note: 'The classic indirect proof. Switch the toggle to "intuitionistic" to see it fail.',
      },
      {
        slug: 'double-negation-elim',
        natural: 'Double-negation elimination — ¬¬p ⊢ p (classical only)',
        dsl: '~~p |- p',
        note: 'A one-step RAA: assume ¬p, derive ⊥ from ¬¬p, conclude p.',
      },
      {
        slug: 'peirce',
        natural: 'Peirce’s law — ⊢ ((p → q) → p) → p (classical only)',
        dsl: '|- ((p -> q) -> p) -> p',
        note: 'Famous for being a *purely implicational* tautology that fails intuitionistically. The proof needs RAA to invent the antecedent p → q.',
      },
      {
        slug: 'demorgan-reverse',
        natural: 'De Morgan reverse — ¬(p ∧ q) ⊢ ¬p ∨ ¬q (classical only)',
        dsl: '~(p & q) |- ~p | ~q',
        note: 'The classical direction of De Morgan. The forward direction (¬p ∨ ¬q ⊢ ¬(p ∧ q)) goes through intuitionistically.',
      },
      {
        slug: 'contraposition-reverse',
        natural: 'Reverse contraposition — ¬q → ¬p ⊢ p → q (classical only)',
        dsl: '~q -> ~p |- p -> q',
        note: 'Pairs with the intuitionistically-valid forward direction. Together they exhibit the asymmetry RAA introduces.',
      },
    ],
    readingPointers: [
      {
        title: 'Stanford Encyclopedia of Philosophy: Proof Theory',
        href: 'https://plato.stanford.edu/entries/proof-theory/',
        kind: 'external',
      },
      {
        title: 'Stanford Encyclopedia of Philosophy: The Development of Proof Theory',
        href: 'https://plato.stanford.edu/entries/proof-theory-development/',
        kind: 'external',
      },
      {
        title: 'Open Logic Project — Natural Deduction',
        href: 'https://openlogicproject.org/',
        kind: 'external',
      },
      {
        title: 'Frederic Fitch, Symbolic Logic: An Introduction (1952)',
        href: 'https://archive.org/details/symboliclogicint0000fitc',
        kind: 'external',
      },
    ],
  },
];

export function findLogicSystem(slug: string): LogicSystem | undefined {
  return LOGIC_SYSTEMS.find(s => s.slug === slug);
}

// ─────────────────────────────────────────────────────────────────────
// Kripke examples — hand-authored. Each pairs a formula with a small
// model and the truth value at the designated world. The `satisfied`
// field will become computed once the recursive evaluator lands; for
// phase 1 it's hand-asserted.
//
// Convention: w0 is the designated (actual) world unless stated.

function K_REFLEXIVE(world: string): { from: string; to: string } {
  return { from: world, to: world };
}

function KRIPKE_EXAMPLES(): LogicExample[] {
  return [
    {
      slug: 'box-basic',
      natural: 'Necessarily P (□P)',
      dsl: '[]p',
      frameClass: 'K',
      model: {
        worlds: [
          { id: 'w0', atoms: [] },
          { id: 'w1', atoms: ['p'] },
          { id: 'w2', atoms: ['p'] },
        ],
        edges: [
          { from: 'w0', to: 'w1' },
          { from: 'w0', to: 'w2' },
        ],
        designated: 'w0',
      },
      satisfied: true,
      note: 'Every world reachable from w0 satisfies p, so □p holds at w0. Note that p is false at w0 itself — irrelevant on a K-frame.',
    },
    {
      slug: 'dia-basic',
      natural: 'Possibly P (◇P)',
      dsl: '<>p',
      frameClass: 'K',
      model: {
        worlds: [
          { id: 'w0', atoms: [] },
          { id: 'w1', atoms: ['p'] },
          { id: 'w2', atoms: [] },
        ],
        edges: [
          { from: 'w0', to: 'w1' },
          { from: 'w0', to: 'w2' },
        ],
        designated: 'w0',
      },
      satisfied: true,
      note: 'At least one reachable world (w1) satisfies p, so ◇p holds at w0.',
    },
    {
      slug: 'k-axiom',
      natural: 'K axiom: distribution of necessity over implication',
      dsl: '[](p -> q) -> ([]p -> []q)',
      frameClass: 'K',
      model: {
        worlds: [
          { id: 'w0', atoms: [] },
          { id: 'w1', atoms: ['p', 'q'] },
          { id: 'w2', atoms: ['p', 'q'] },
        ],
        edges: [
          { from: 'w0', to: 'w1' },
          { from: 'w0', to: 'w2' },
        ],
        designated: 'w0',
      },
      satisfied: true,
      note: 'The K axiom is valid in every Kripke model — this example just exhibits one. p and q both hold at every reachable world, so □(p→q), □p, and □q are all true at w0.',
    },
    {
      slug: 't-axiom-on-t',
      natural: 'T axiom on a reflexive frame: necessity entails actuality',
      dsl: '[]p -> p',
      frameClass: 'T',
      model: {
        worlds: [
          { id: 'w0', atoms: ['p'] },
          { id: 'w1', atoms: ['p'] },
        ],
        edges: [
          K_REFLEXIVE('w0'),
          { from: 'w0', to: 'w1' },
          K_REFLEXIVE('w1'),
        ],
        designated: 'w0',
      },
      satisfied: true,
      note: 'Reflexivity at w0 forces p at w0 whenever □p holds at w0 — that is exactly the T axiom.',
    },
    {
      slug: 't-fails-on-k',
      natural: 'T fails on a non-reflexive K-frame',
      dsl: '[]p -> p',
      frameClass: 'K',
      model: {
        worlds: [
          { id: 'w0', atoms: [] },
          { id: 'w1', atoms: ['p'] },
        ],
        edges: [
          { from: 'w0', to: 'w1' },
        ],
        designated: 'w0',
      },
      satisfied: false,
      note: 'Counterexample: w0 sees only w1 (and crucially not itself), and w1 has p, so □p is true at w0. But p is false at w0, so □p → p fails. This is exactly why T requires reflexivity.',
    },
    {
      slug: 'four-axiom',
      natural: '4-axiom on S4: what is necessary is necessarily necessary',
      dsl: '[]p -> [][]p',
      frameClass: 'S4',
      model: {
        worlds: [
          { id: 'w0', atoms: ['p'] },
          { id: 'w1', atoms: ['p'] },
        ],
        edges: [
          K_REFLEXIVE('w0'),
          { from: 'w0', to: 'w1' },
          K_REFLEXIVE('w1'),
        ],
        designated: 'w0',
      },
      satisfied: true,
      note: 'Reflexive + transitive (w1 has no outgoing edge other than itself, so transitivity is trivial). □p holds at every world; therefore □□p holds at w0.',
    },
    {
      slug: 'five-axiom',
      natural: '5-axiom on S5: what is possible is necessarily possible',
      dsl: '<>p -> []<>p',
      frameClass: 'S5',
      model: {
        worlds: [
          { id: 'w0', atoms: [] },
          { id: 'w1', atoms: ['p'] },
          { id: 'w2', atoms: [] },
        ],
        edges: [
          K_REFLEXIVE('w0'), K_REFLEXIVE('w1'), K_REFLEXIVE('w2'),
          { from: 'w0', to: 'w1' }, { from: 'w1', to: 'w0' },
          { from: 'w0', to: 'w2' }, { from: 'w2', to: 'w0' },
          { from: 'w1', to: 'w2' }, { from: 'w2', to: 'w1' },
        ],
        designated: 'w0',
      },
      satisfied: true,
      note: 'All three worlds form one equivalence class. ◇p holds at every world (w1 carries p and is reachable from each), so □◇p holds at w0.',
    },
  ];
}