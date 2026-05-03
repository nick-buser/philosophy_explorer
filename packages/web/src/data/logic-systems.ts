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
      'Peano / Russell-style linear symbolic notation. \u2200 \u2203 \u00ac \u2227 \u2228 \u2192 with functions and relations.',
    era: '1889 \u2192',
    keyPrimitive: 'quantifier + connective',
    status: 'stub',
    thinkerSlug: null,
    history: '',
    primitives: [],
    examples: [],
    readingPointers: [],
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