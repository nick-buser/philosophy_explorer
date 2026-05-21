// Logic-systems seed data — client-side for phase 1. Will migrate to
// data/seed/logic-systems.json + F# API when a second system ships.
// See docs/formal-logic/logic-explorer-tab.md §Storage.

import type { FrameClass, FrameClassSlug, KripkeModel } from '../logic/kripke-types';
import type { EpistemicModel } from '../logic/epistemic-types';
import type { Trace } from '../logic/temporal-types';
import { FRAMES } from '../logic/kripke-frames';

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
  // Multi-agent epistemic systems use a different model shape (per-agent
  // accessibility relations). Other systems leave this undefined.
  epistemicModel?: EpistemicModel;
  // Linear-temporal-logic systems use a lasso trace.
  trace?: Trace;
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
    name: 'Peirce\u2019s Existential Graphs (Alpha + Beta)',
    shortDescription:
      'A 2D diagrammatic logic. Writing a proposition asserts it; enclosing it in an oval (a "cut") negates it; "lines of identity" attached to predicates stand in for variables and existential quantifiers, reaching first-order logic with identity.',
    era: '1880s\u20131900s',
    keyPrimitive: 'cut \u00b7 juxtaposition \u00b7 line of identity',
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
      {
        name: 'Line of identity',
        syntax: 'P(x)',
        description: 'A hook on a predicate names a "line of identity" \u2014 Peirce\u2019s heavy line standing in for a variable. The line is bound by an existential quantifier at the outermost area it touches.',
      },
      {
        name: 'n-ary predicate',
        syntax: 'R(x,y)',
        description: 'A predicate with several hooks fills the role of an n-ary relation. Multiple hooks bound to the same line name assert the same individual fills both spots.',
      },
      {
        name: 'Identity assertion',
        syntax: 'x = y',
        description: 'Joining two lines of identity asserts that the two individuals are the same. This makes beta a first-order logic *with* identity (= as a primitive, not a defined predicate).',
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
      {
        slug: 'beta-existential',
        natural: 'something is P \u2014 \u2203x. P(x)',
        dsl: 'P(x)',
        note: 'Beta: a single line of identity on the sheet is an outermost \u2203x.',
      },
      {
        slug: 'beta-existential-conj',
        natural: 'some man is mortal \u2014 \u2203x. Man(x) \u2227 Mortal(x)',
        dsl: 'Man(x) Mortal(x)',
        note: 'Sharing the line name x asserts the two predicates apply to the same individual.',
      },
      {
        slug: 'beta-some-non',
        natural: 'some man is not mortal \u2014 \u2203x. Man(x) \u2227 \u00acMortal(x)',
        dsl: 'Man(x) (Mortal(x))',
      },
      {
        slug: 'beta-no',
        natural: 'no philosopher is foolish \u2014 \u00ac\u2203x. Phil(x) \u2227 Fool(x)',
        dsl: '(Phil(x) Fool(x))',
        note: 'The line lives entirely inside the cut, so its \u2203 is bound under negation.',
      },
      {
        slug: 'beta-universal',
        natural: 'every man is mortal \u2014 \u2200x. Man(x) \u2192 Mortal(x)',
        dsl: '(Man(x) (Mortal(x)))',
        note: 'Peirce\u2019s scroll plus a line: \u00ac\u2203x. Man(x) \u2227 \u00acMortal(x) \u2261 \u2200x. Man(x) \u2192 Mortal(x).',
      },
      {
        slug: 'beta-relation',
        natural: 'somebody loves somebody \u2014 \u2203x. \u2203y. Loves(x,y)',
        dsl: 'Loves(x,y)',
        note: 'A 2-place predicate with two hooks. Distinct line names give distinct \u2203-binders.',
      },
      {
        slug: 'beta-relation-self',
        natural: 'somebody loves themselves \u2014 \u2203x. Loves(x,x)',
        dsl: 'Loves(x,x)',
        note: 'Re-using the same line name on two hooks of the predicate forces the two arguments to be the same individual.',
      },
      {
        slug: 'beta-identity',
        natural: 'some man is the philosopher \u2014 \u2203x. \u2203y. Man(x) \u2227 Phil(y) \u2227 x = y',
        dsl: 'Man(x) Phil(y) x = y',
      },
      {
        slug: 'beta-everyone-loves',
        natural: 'every person loves someone \u2014 \u2200x. Person(x) \u2192 \u2203y. Loves(x,y)',
        dsl: '(Person(x) (Loves(x,y)))',
        note: 'The y-line is confined to the inner cut, so \u2203y is bound there; the x-line spans both areas, so its \u2203-binder ends up at the outer cut and the negation in front of it produces \u2200x.',
      },
      {
        slug: 'beta-distinct',
        natural: 'two distinct things are P \u2014 \u2203x. \u2203y. P(x) \u2227 P(y) \u2227 \u00ac(x = y)',
        dsl: 'P(x) P(y) (x = y)',
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
    frameClasses: [FRAMES.K, FRAMES.T, FRAMES.S4, FRAMES.S5],
  },
  {
    slug: 'frege-bs',
    name: 'Frege\u2019s Begriffsschrift',
    shortDescription:
      'The 1879 concept-script. 2D judgment-and-content strokes with condition strokes for implication, concavities for generality, identity-of-content (\u2261), and higher-order quantification over predicate variables.',
    era: '1879',
    keyPrimitive: 'judgment \u00b7 content stroke \u00b7 concavity \u00b7 \u2261',
    status: 'available',
    thinkerSlug: null,
    history:
      'Gottlob Frege published the *Begriffsschrift* (\u201cconcept-script\u201d) in 1879 as a 2D notation \u201cmodelled on that of arithmetic\u201d for capturing logical structure directly. Frege took the universal quantifier as primitive (a concavity in the content stroke containing a Gothic letter) and built propositional structure from a horizontal content stroke, an attached vertical judgment stroke for assertion, a downward tick for negation, and a vertical condition stroke joining a consequent (top) to an antecedent (bottom). Part III added identity-of-content (\u2261) for sentence-level and term-level identity, the substitution principle as a primitive axiom, and quantification over predicate variables \u2014 the move that made the Begriffsschrift the first higher-order logic. The existential was always treated as derived (\u00ac\u2200\u00ac), not primitive. The notation was barely read for two decades \u2014 Russell rediscovered it in 1902 \u2014 and then mostly displaced by the linear Peano\u2013Russell style. Modern revivals trace Wermuth\u2019s `gfnotation` plain-TeX package (TUGboat 2015) and Sperberg-McQueen\u2019s 2023 Balisage paper on keyboarding Frege.',
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
      {
        name: 'Existential (derived)',
        syntax: 'exists x. F(x)',
        description: 'Frege never introduced an existential glyph; the convention "there is an x such that F(x)" is rendered as \u00ac\u2200x.\u00acF(x) \u2014 an outer negation tick, then a concavity, then an inner negation tick, then F. The DSL accepts `exists x. \u03c6` for convenience; the diagram still draws the derived shape.',
      },
      {
        name: 'Identity of content',
        syntax: 'A == B',
        description: 'A triple-bar (\u2261) joining two contents on a single content stroke. Frege used it both for term-level identity (a \u2261 b) and for sentence-level equivalence (\u03c6 \u2261 \u03c8); Part III\u2019s axiom 52 makes it interchangeable in any predicate position. The modern triple-bar \u2261 descends from this mark; later identity (=) and biconditional (\u2194) split off as separate operators.',
      },
      {
        name: 'Higher-order generality',
        syntax: 'all F. F(a)',
        description: 'A concavity binding an upper-case Greek/Latin letter \u2014 a *predicate* variable rather than an individual one. Quantifies over Frege\u2019s "second-level concepts" rather than objects. The DSL infers the sort from the variable\u2019s capitalisation: lowercase = individual (Gothic), uppercase = predicate (Greek). The cavity letter renders in cyan when its sort is predicate.',
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
      {
        slug: 'existential-basic',
        natural: 'there exists x such that F(x)',
        dsl: '|- exists x. F(x)',
        note: 'The DSL accepts an `exists` keyword, but the diagram still draws Frege\u2019s derived shape: outer negation tick, concavity, inner negation tick, body \u2014 the visible form of \u00ac\u2200x.\u00acF(x).',
      },
      {
        slug: 'existential-as-derived',
        natural: 'existential is definitionally \u00ac\u2200\u00ac',
        dsl: '|- exists x. F(x) == ~all x. ~F(x)',
        note: 'A content-identity statement: the existential and its derived form are literally the same content. In Frege\u2019s practice, an identity of content like this licenses interchange in any context.',
      },
      {
        slug: 'iden-reflexive',
        natural: 'identity of content is reflexive',
        dsl: '|- a == a',
        note: 'Frege\u2019s axiom 54: the simplest fact about identity. Same role as `a = a` in modern logic.',
      },
      {
        slug: 'iden-substitution',
        natural: 'substitution under identity (Frege\u2019s axiom 52)',
        dsl: '|- (a == b) -> P(a) -> P(b)',
        note: 'If a and b have the same content, then any predicate true of a is true of b. The substitution principle is what makes \u2261 behave like identity rather than just material equivalence.',
      },
      {
        slug: 'leibniz-indiscernibility',
        natural: 'Leibniz\u2019s law (second-order) \u2014 identity is co-extensive with sharing every property',
        dsl: '|- (a == b) -> all F. F(a) -> F(b)',
        note: 'The same shape as axiom 52 but quantified over all predicates F. Becomes a higher-order formula \u2014 note the cyan capital in the concavity, marking F as a predicate variable rather than an individual.',
      },
      {
        slug: 'ho-trivial-identity',
        natural: 'every property entails itself',
        dsl: '|- all F. F(a) -> F(a)',
        note: 'The minimal higher-order formula: the same a, the same F, the same conclusion. Trivial as logic but illustrates the diagram of a predicate-bound concavity.',
      },
      {
        slug: 'ho-comprehension',
        natural: 'every individual satisfies some property',
        dsl: '|- all x. exists F. F(x)',
        note: 'A mixed quantification: outer \u2200 over individuals (gold concavity), inner \u2203 over predicates (cyan concavity, drawn as \u00ac\u2200\u00ac). Read literally: pick any x; some property F holds of it. Trivially true: take F = (\u03bby. y == x).',
      },
      {
        slug: 'ho-universal-property',
        natural: 'there is a property held by every individual',
        dsl: '|- exists F. all x. F(x)',
        note: 'Switching the quantifier order from the previous example yields a non-trivial higher-order claim. In set-theoretic semantics this is also true (take F = the always-true predicate), but unlike comprehension it depends on the existence of a particular concept.',
      },
      {
        slug: 'iden-contraposition',
        natural: 'contraposition stated as identity-of-content',
        dsl: '|- (p -> q) == (~q -> ~p)',
        note: 'Frege used identity-of-content as a definition mechanism, not just as a binary connective: stating `(p \u2192 q) \u2261 (\u00acq \u2192 \u00acp)` says the two contents are interchangeable everywhere. Renders the propositional axiom of contraposition as a single Begriffsschrift formula joined by \u2261.',
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
    slug: 'avicennan',
    name: 'Avicennan Modal Syllogistic (Ibn Sīnā)',
    shortDescription:
      'Avicenna rebuilt the categorical syllogism as a modal-temporal system: every proposition carries one of four modalities (necessary, perpetual, absolute, possible), and the valid moods differ from the assertoric ones.',
    era: '~1020 CE →',
    keyPrimitive: 'modalized categorical proposition',
    status: 'available',
    thinkerSlug: null,
    history:
      'In the Qiyās of the Kitāb al-Shifāʾ (c. 1020s), Avicenna (Ibn Sīnā, 980–1037) reworked Aristotle’s categorical syllogistic into a modal-temporal system. An Avicennan categorical proposition is not merely “every A is B” — it carries an alethic modality and a temporal qualification: necessarily B, always B, B at some time, or possibly B, in each case “while A exists.” The valid moods of the resulting syllogistic diverge from the assertoric ones. Avicenna held the de re position — against Theophrastus’s rule that the conclusion follows the weaker premise — that in the first figure the conclusion inherits the modality of the major premise, so a necessary major with a merely-absolute minor still yields a necessary conclusion. He further developed a hypothetical (conditional and disjunctive) syllogistic with no Aristotelian counterpart. Avicennan logic dominated the Arabic tradition for centuries and is the subject of active modern formalization by Wilfrid Hodges, Tony Street, and Saloua Chatti. This Lab implements phase 1: a single enumerated modality token, mood-table validity for the categorical syllogism, and the modal square. The two-dimensional (subject-side / copula-side) modality, the hypothetical syllogistic, and a semantic model checker over individuals × times are deferred to phase 2.',
    primitives: [
      {
        name: 'Quantity',
        syntax: 'every | some',
        description: 'Universal (every) or particular (some). With the quality keyword it fixes the A/E/I/O categorical form of the proposition.',
      },
      {
        name: 'Quality',
        syntax: 'affirmative | no | not',
        description: 'Affirmative by default; “no” makes a universal negative, “some … is not” a particular negative.',
      },
      {
        name: 'Necessary (ḍarūrī)',
        syntax: 'necessary …',
        description: 'Necessarily the predicate, while the subject exists — the strongest modality.',
      },
      {
        name: 'Perpetual (dāʾima)',
        syntax: 'perpetual …',
        description: 'Always the predicate, while the subject exists — true at every time, but without alethic necessity.',
      },
      {
        name: 'Absolute (muṭlaqa ʿāmma)',
        syntax: 'absolute …',
        description: 'The predicate at some time, while the subject exists — the general absolute, Avicenna’s reading of the bare Aristotelian assertoric.',
      },
      {
        name: 'Possible (mumkina)',
        syntax: 'possible …',
        description: 'Two-sided possibility — possibly the predicate and possibly not. Not on the necessary/perpetual/absolute strength chain.',
      },
      {
        name: 'Figure',
        syntax: '1 – 4',
        description: 'Determined by where the middle term sits across the two premises. The figure selects the modality rule: figure 1 lets the conclusion follow the major; figures 2–4 (phase 1) admit only uniform-modality moods.',
      },
    ],
    examples: [
      {
        slug: 'necessary-barbara',
        natural: 'Necessity-Barbara — a necessary major and an absolute minor yield a necessary conclusion (the contested LXL syllogism).',
        dsl:
          'syllogism\n' +
          '  necessary every animal is mortal\n' +
          '  absolute  every human  is animal\n' +
          '  necessary every human  is mortal\n' +
          'end',
        note: 'Avicenna’s signature de re result: in figure 1 the conclusion inherits the major premise’s modality, so necessity carries through even though the minor is only absolute. Theophrastus would have demanded the weaker (absolute) conclusion.',
      },
      {
        slug: 'modal-fallacy',
        natural: 'Modal fallacy — assertorically a valid Barbara, but two absolute premises cannot license a necessary conclusion.',
        dsl:
          'syllogism\n' +
          '  absolute  every animal is mortal\n' +
          '  absolute  every human  is animal\n' +
          '  necessary every human  is mortal\n' +
          'end',
        note: 'The pedagogical payoff: the assertoric skeleton AAA-1 is the textbook Barbara, valid in `aristotelian`. Under Avicennan modality the verdict flips — the conclusion claims necessity, but only the absolute follows.',
      },
      {
        slug: 'weaker-conclusion',
        natural: 'Over-claimed conclusion — an absolute major caps the conclusion at absolute, even with a necessary minor.',
        dsl:
          'syllogism\n' +
          '  absolute  every animal is mortal\n' +
          '  necessary every human  is animal\n' +
          '  necessary every human  is mortal\n' +
          'end',
        note: 'In figure 1 the conclusion follows the major, not the minor. The stated necessary conclusion is too strong; only the absolute is warranted.',
      },
      {
        slug: 'necessary-proposition',
        natural: 'A necessary universal affirmative — every human is necessarily mortal.',
        dsl: 'necessary every human is mortal',
        note: 'Single proposition for the modal square. ḍarūrī: necessarily the predicate, while the subject exists. Focuses corner A.',
      },
      {
        slug: 'perpetual-proposition',
        natural: 'A perpetual universal negative — no heaven is ever at rest.',
        dsl: 'perpetual no heaven is resting',
        note: 'Single proposition for the modal square. dāʾima: always (so, never the predicate here), while the subject exists — true at every time without alethic necessity. Focuses corner E.',
      },
      {
        slug: 'absolute-proposition',
        natural: 'An absolute particular affirmative — some human is (at some time) awake.',
        dsl: 'absolute some human is awake',
        note: 'Single proposition for the modal square. muṭlaqa ʿāmma: the predicate at some time, while the subject exists. Focuses corner I.',
      },
      {
        slug: 'possible-proposition',
        natural: 'A possible particular negative — some human is possibly not writing.',
        dsl: 'possible some human is not writing',
        note: 'Single proposition for the modal square. mumkina: two-sided possibility — possibly not writing, and equally possibly writing. Focuses corner O.',
      },
    ],
    readingPointers: [
      {
        title: 'Arabic and Islamic Philosophy of Language and Logic (SEP)',
        href: 'https://plato.stanford.edu/entries/arabic-islamic-language/',
        kind: 'external',
      },
      {
        title: 'Avicenna (Ibn Sina) — SEP',
        href: 'https://plato.stanford.edu/entries/ibn-sina/',
        kind: 'external',
      },
      {
        title: 'Avicennan logic — system design notes',
        href: 'https://plato.stanford.edu/entries/arabic-islamic-language/#AviModaLogi',
        kind: 'doc',
      },
    ],
  },
  {
    slug: 'saptabhangi',
    name: 'Jain Saptabhaṅgī (Syādvāda)',
    shortDescription:
      'The Jain doctrine of sevenfold conditional predication: every assertion is qualified by syāt (“in some respect”), and from three basic modes — is, is not, inexpressible — exactly seven bhaṅgas arise, one per non-empty combination.',
    era: '~2nd–8th c. CE',
    keyPrimitive: 'standpoint-relative predication (syādvāda)',
    status: 'available',
    thinkerSlug: null,
    history:
      'Saptabhaṅgī is the logical core of Jain anekāntavāda — the doctrine of non-one-sidedness, which holds that any predication is true only relative to a standpoint (naya). Its roots are traced to Mahāvīra (6th–5th c. BCE); the sevenfold scheme itself was articulated by Samantabhadra (c. 2nd–3rd c. CE) and given its mature treatment by Akalaṅka and Vidyānandi (8th–9th c. CE). The teaching is that from three basic modes of predication — asti (is), nāsti (is not), and avaktavya (inexpressible) — exactly seven conditional assertions (bhaṅgas) can be made about any subject, each prefixed by the particle syāt, “in some respect.” The pot is permanent qua its clay substance, not permanent qua its present shape, and inexpressible when both are asserted at once in the same respect. Modern logicians read saptabhaṅgī as a genuine many-valued logic with a fixed seven-element value space: the seven non-empty subsets of a three-element set. This Lab implements phase 1: it classifies a single predication into its bhaṅga by unioning the modes asserted across its standpoints. It commits to the reading on which avaktavya is a third primitive mode (so the seven bhaṅgas are exactly the seven non-empty subsets) — the clean, enumerable reconstruction of J. Ganeri (2002). The rival reading, on which avaktavya is the simultaneous joint assertion of asti and nāsti, and the question of whether the system is truth-functional (G. Priest, 2008) are flagged but not adjudicated; compound evaluation over the seven values is deferred to phase 2.',
    primitives: [
      {
        name: 'Syāt',
        syntax: 'syāt …',
        description: 'The conditional particle — “in some respect.” Every bhaṅga is prefixed by it, marking the assertion as standpoint-relative rather than absolute.',
      },
      {
        name: 'Asti',
        syntax: 'standpoint <name>: asti',
        description: 'The affirmative mode — the predicate holds of the subject, in the respect named by the standpoint.',
      },
      {
        name: 'Nāsti',
        syntax: 'standpoint <name>: nasti',
        description: 'The negative mode — the predicate fails of the subject, in the respect named by the standpoint.',
      },
      {
        name: 'Avaktavya',
        syntax: 'standpoint <name>: avaktavya',
        description: 'The inexpressible mode — the predicate jointly holds-and-fails in the same respect, asserted at once, which no successive predication can express. Phase 1 treats it as a third primitive mode.',
      },
      {
        name: 'Standpoint (naya)',
        syntax: 'standpoint <name>: <mode>',
        description: 'A respect from which the predication is made. Phase 1 treats a standpoint as an opaque label; the full sevenfold naya doctrine is out of scope.',
      },
      {
        name: 'Bhaṅga',
        syntax: '1 – 7',
        description: 'One of the seven conditional predications — the non-empty subset of {asti, nāsti, avaktavya} formed by unioning the modes asserted across all standpoints.',
      },
    ],
    examples: [
      {
        slug: 'pot-permanent',
        natural: 'The pot is permanent qua substance, not qua its shape, and inexpressible qua its origin — the full sevenfold bhaṅga.',
        dsl:
          'subject:   the pot\n' +
          'predicate: permanent\n' +
          'standpoint substance : asti        -- qua its clay, permanent\n' +
          'standpoint mode      : nasti       -- qua its present shape, not\n' +
          'standpoint origin    : avaktavya   -- qua coming-to-be, inexpressible',
        note: 'The textbook predication. All three modes are asserted across the standpoints, so the union is {asti, nāsti, avaktavya} — bhaṅga 7, syād asti nāsti avaktavya.',
      },
      {
        slug: 'pot-substance',
        natural: 'The pot is permanent qua its clay substance — the bare affirmative bhaṅga.',
        dsl:
          'subject:   the pot\n' +
          'predicate: permanent\n' +
          'standpoint substance : asti',
        note: 'A single asti standpoint. The union is {asti} — bhaṅga 1, syād asti.',
      },
      {
        slug: 'pot-shape',
        natural: 'The pot is not permanent qua its present shape — the bare negative bhaṅga.',
        dsl:
          'subject:   the pot\n' +
          'predicate: permanent\n' +
          'standpoint present-shape : nasti',
        note: 'A single nāsti standpoint. The union is {nāsti} — bhaṅga 2, syād nāsti.',
      },
      {
        slug: 'soul-existence',
        natural: 'The soul exists qua its own substance and not qua any given body — affirmation and denial in different respects.',
        dsl:
          'subject:   the soul\n' +
          'predicate: existent\n' +
          'standpoint own-substance : asti\n' +
          'standpoint a-given-body  : nasti',
        note: 'A classic Jain example. asti and nāsti are asserted from different standpoints, so the union is {asti, nāsti} — bhaṅga 3, syād asti nāsti. This is successive predication, distinct from the same-respect joint assertion of avaktavya.',
      },
      {
        slug: 'pot-inexpressible',
        natural: 'The pot is permanent-and-impermanent in the very same respect, asserted at once — inexpressible.',
        dsl:
          'subject:   the pot\n' +
          'predicate: permanent\n' +
          'standpoint co-presentation : avaktavya',
        note: 'A single avaktavya standpoint. The union is {avaktavya} — bhaṅga 4, syād avaktavya. Phase 1 takes avaktavya as a third primitive mode, not as a derived joint of asti and nāsti.',
      },
      {
        slug: 'lamp-asti-avaktavya',
        natural: 'The lamp exists here and now, yet its coming-to-be jointly is-and-is-not — affirmation plus the inexpressible.',
        dsl:
          'subject:   the lamp\n' +
          'predicate: existent\n' +
          'standpoint here-and-now : asti\n' +
          'standpoint coming-to-be : avaktavya',
        note: 'The union is {asti, avaktavya} — bhaṅga 5, syād asti avaktavya.',
      },
      {
        slug: 'lamp-nasti-avaktavya',
        natural: 'The lamp is not eternal qua its flame, and its coming-to-be is jointly so-and-not-so — denial plus the inexpressible.',
        dsl:
          'subject:   the lamp\n' +
          'predicate: eternal\n' +
          'standpoint as-a-flame   : nasti\n' +
          'standpoint coming-to-be : avaktavya',
        note: 'The union is {nāsti, avaktavya} — bhaṅga 6, syād nāsti avaktavya.',
      },
    ],
    readingPointers: [
      {
        title: 'Stanford Encyclopedia of Philosophy: Logic in Classical Indian Philosophy',
        href: 'https://plato.stanford.edu/entries/logic-india/',
        kind: 'external',
      },
      {
        title: 'Matilal, The Character of Logic in India (SUNY, 1998)',
        href: 'https://sunypress.edu/Books/T/The-Character-of-Logic-in-India',
        kind: 'external',
      },
    ],
  },
  {
    slug: 'catuskoti',
    name: 'Catuṣkoṭi (Nāgārjuna’s Tetralemma)',
    shortDescription:
      'The “four corners” of Indian, and especially Madhyamaka Buddhist, logic: for a proposition A the four koṭis are A, ¬A, A∧¬A, and ¬(A∨¬A). The schema is used both to affirm one corner and, in the prasaṅga mode, to reject all four.',
    era: '~2nd c. CE',
    keyPrimitive: 'four-cornered predication (catuṣkoṭi)',
    status: 'available',
    thinkerSlug: null,
    history:
      'The catuṣkoṭi — “four corners” — is the tetralemma of Indian logic, attested in the early Buddhist discourses and given its sharpest use by Nāgārjuna (c. 2nd c. CE), the founder of the Madhyamaka school. For any proposition A the four koṭis are A, ¬A, both A and ¬A, and neither A nor ¬A. Nāgārjuna uses the schema in two opposite ways. In the affirming (positive) use — the Buddha’s teaching of Mūlamadhyamakakārikā 18.8, “all is real, or not real, both real and not real, neither real nor not real” — exactly one corner is asserted of the proposition. In the prasaṅga use — the Madhyamaka refutation — all four corners are denied at once: this is the treatment of the avyākṛta, the questions the Buddha set aside as not answerable, most famously whether the Tathāgata exists after death (MMK ch. 22, 25). Modern logicians reconstruct the catuṣkoṭi as a four-valued, paraconsistent scheme — the four values of First Degree Entailment (FDE): true only, false only, both (a glut), neither (a gap), which are exactly the four subsets of {true, false}. This Lab implements phase 1: it places a proposition at one of the four koṭis under one of the two readings, and evaluates each of the four corner-formulas under that valuation. It commits to the four-valued FDE reconstruction (the clean, enumerable reading that renders as a four-corner diagram). G. Priest’s argument (2010) that the prasaṅga use needs a fifth, “ineffable” value, and the dispute over whether rejecting all four corners is consistent (Priest & Garfield, 2002), are flagged but not adjudicated; compound evaluation over the four values is deferred to phase 2.',
    primitives: [
      {
        name: 'Proposition',
        syntax: 'proposition: <text>',
        description: 'The proposition A under examination. The catuṣkoṭi places it at one of four corners.',
      },
      {
        name: 'Affirmation (koṭi 1)',
        syntax: 'koti: affirmation',
        description: 'The first corner — A, “it is.” The FDE value {true}: the proposition holds and only holds.',
      },
      {
        name: 'Negation (koṭi 2)',
        syntax: 'koti: negation',
        description: 'The second corner — ¬A, “it is not.” The FDE value {false}: the proposition fails and only fails.',
      },
      {
        name: 'Both (koṭi 3)',
        syntax: 'koti: both',
        description: 'The third corner — A∧¬A, “it both is and is not.” The FDE glut {true, false}: the proposition is at once true and false.',
      },
      {
        name: 'Neither (koṭi 4)',
        syntax: 'koti: neither',
        description: 'The fourth corner — ¬(A∨¬A), “it neither is nor is not.” The FDE gap {}: the proposition is neither true nor false.',
      },
      {
        name: 'Reading',
        syntax: 'reading: affirming | prasanga',
        description: 'How the schema is used. Affirming asserts the chosen corner of the proposition; prasaṅga (the Madhyamaka refutation) denies the chosen corner and, with it, all four.',
      },
    ],
    examples: [
      {
        slug: 'dharmas-affirmation',
        natural: 'All things are real — the first lemma of MMK 18.8, asserted outright.',
        dsl:
          'proposition: all things are real\n' +
          'koti:        affirmation\n' +
          'reading:     affirming',
        note: 'The affirming (positive) catuṣkoṭi of MMK 18.8, first lemma. v(A) = {true}; of the four corner-formulas, only A is designated.',
      },
      {
        slug: 'dharmas-negation',
        natural: 'All things are not real — the second lemma, the bare negation.',
        dsl:
          'proposition: all things are real\n' +
          'koti:        negation\n' +
          'reading:     affirming',
        note: 'The second lemma. v(A) = {false}; only the ¬A corner is designated.',
      },
      {
        slug: 'dharmas-both',
        natural: 'All things are both real and not real — the third lemma, the glut.',
        dsl:
          'proposition: all things are real\n' +
          'koti:        both\n' +
          'reading:     affirming',
        note: 'The third lemma. v(A) is the glut {true, false}; under FDE all four corner-formulas come out designated at once — the structural fact the diagram surfaces.',
      },
      {
        slug: 'dharmas-neither',
        natural: 'All things are neither real nor not real — the fourth lemma, the gap.',
        dsl:
          'proposition: all things are real\n' +
          'koti:        neither\n' +
          'reading:     affirming',
        note: 'The fourth lemma. v(A) is the gap {}; no corner-formula is designated — not even ¬(A∨¬A), the formula that expresses “neither.” Phase 1 flags this consistency tension rather than resolving it.',
      },
      {
        slug: 'tathagata-affirmation',
        natural: 'The Tathāgata exists after death — the first corner, refused by the prasaṅga.',
        dsl:
          'proposition: the Tathāgata exists after death\n' +
          'koti:        affirmation\n' +
          'reading:     prasanga',
        note: 'The first of the avyākṛta — the unanswered questions (MMK ch. 22, 25). An opponent affirms the corner; the Madhyamaka prasaṅga refuses it, and with it all four.',
      },
      {
        slug: 'tathagata-negation',
        natural: 'The Tathāgata does not exist after death — the second corner, equally refused.',
        dsl:
          'proposition: the Tathāgata exists after death\n' +
          'koti:        negation\n' +
          'reading:     prasanga',
        note: 'The prasaṅga denies the second corner as well — non-existence after death is no more assertible than existence.',
      },
      {
        slug: 'tathagata-both',
        natural: 'The Tathāgata both exists and does not exist after death — the third corner, refused.',
        dsl:
          'proposition: the Tathāgata exists after death\n' +
          'koti:        both\n' +
          'reading:     prasanga',
        note: 'The third corner — the conjunction — is refused too, though under FDE the glut would designate every corner-formula. The prasaṅga rejects the position regardless.',
      },
      {
        slug: 'tathagata-neither',
        natural: 'The Tathāgata neither exists nor does not exist after death — the fourth corner, also refused.',
        dsl:
          'proposition: the Tathāgata exists after death\n' +
          'koti:        neither\n' +
          'reading:     prasanga',
        note: 'The fourth corner is refused, completing the prasaṅga: none of the four koṭis is assertible. Whether this “reject all four” is a consistent logical position or a refusal to assert is the live dispute (Priest & Garfield, 2002).',
      },
    ],
    readingPointers: [
      {
        title: 'Stanford Encyclopedia of Philosophy: Nāgārjuna',
        href: 'https://plato.stanford.edu/entries/nagarjuna/',
        kind: 'external',
      },
      {
        title: 'Priest & Garfield, Nāgārjuna and the Limits of Thought',
        href: 'https://doi.org/10.1093/acprof:oso/9780199244218.003.0011',
        kind: 'external',
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
  {
    slug: 'indian-buddhist',
    name: 'Indian / Buddhist Logic (Nyāya · Dignāga)',
    shortDescription:
      'Nyāya five-membered inference (pratijñā · hetu · udāharaṇa · upanaya · nigamana) with Dignāga’s trairūpya (three characteristics of a valid reason) and the hetu-cakra (the 3×3 wheel that classifies a hetu as valid, inconclusive, or contradictory).',
    era: '~150 BCE → 6th c. CE',
    keyPrimitive: 'inference (anumāna) with example-based concomitance',
    status: 'available',
    thinkerSlug: null,
    history:
      'Indian inferential logic — anumāna — was systematised in Gautama’s Nyāya-sūtra (c. 150 BCE) around the five-membered inference (pañcāvayava): pratijñā (thesis), hetu (reason), udāharaṇa (example with general principle), upanaya (application to the case at hand), and nigamana (conclusion). The Buddhist logician Dignāga (c. 480–540 CE) reformed the system in the *Pramāṇasamuccaya* and *Nyāyamukha*: he reduced the inference to three steps emphasising vyāpti (pervasion / concomitance), formalised the trairūpya — three characteristics every valid hetu must possess (pakṣa-dharmatā, sapakṣe sattvam, vipakṣe asattvam) — and constructed the hetu-cakra, a 3×3 grid cross-classifying the hetu against the sapakṣa (similar instances) and vipakṣa (dissimilar instances) classes. Two cells of the wheel mark valid reasons; two mark contradictory (viruddha) reasons; the remaining five are varieties of inconclusive reason (anaikāntika). Dignāga’s student Dharmakīrti (c. 600–660 CE) extended the framework with the *Pramāṇavārttika* and reduced valid hetus to three structural types (svabhāva-hetu, kārya-hetu, anupalabdhi). The tradition continued through Navya-Nyāya (Gaṅgeśa, 13th c.) into the modern era, with substantial 20th-century scholarly engagement from Stcherbatsky, Frauwallner, Matilal, and others. The Lab covers the Nyāya five-step shape, the trairūpya verdict, and the Dignāga wheel.',
    primitives: [
      {
        name: 'Pakṣa',
        syntax: 'paksha: <subject>',
        description: 'The subject of the inference — the locus where the sādhya is being established. Conventionally bears the hetu (pakṣa-dharmatā); a trailing −  marks the case where the hetu is absent from the subject (asiddha).',
      },
      {
        name: 'Sādhya',
        syntax: 'sadhya: <property>',
        description: 'The property to be proved of the pakṣa. Defines the sapakṣa class (things that have it) and the vipakṣa class (things that don’t).',
      },
      {
        name: 'Hetu',
        syntax: 'hetu: <reason>',
        description: 'The inferential mark — the property whose presence in the pakṣa licences the conclusion. Validity is decided by the trairūpya conditions and the wheel cell.',
      },
      {
        name: 'Sapakṣa',
        syntax: 'sapaksha: a, b, c',
        description: 'Similar examples — known to bear the sādhya. Default per item: hetu present (+). Append − to mark an example that bears the sādhya but lacks the hetu.',
      },
      {
        name: 'Vipakṣa',
        syntax: 'vipaksha: a, b, c',
        description: 'Dissimilar examples — known to lack the sādhya. Default per item: hetu absent (−). Append + to mark an example that lacks the sādhya yet carries the hetu (a viruddha-style violation).',
      },
      {
        name: 'Trairūpya',
        syntax: 'three characteristics',
        description: 'Dignāga’s validity test: (1) pakṣa-dharmatā — hetu in the subject; (2) sapakṣe sattvam — hetu in (some) sapakṣa; (3) vipakṣe asattvam — hetu absent from every vipakṣa. All three must hold for the inference to be valid.',
      },
      {
        name: 'Hetu-cakra',
        syntax: '3 × 3 wheel',
        description: 'Cross-classifies the hetu’s presence against sapakṣa (all / some / none) and vipakṣa (all / some / none). Two cells valid (sad-hetu); five inconclusive (anaikāntika); two contradictory (viruddha).',
      },
    ],
    examples: [
      {
        slug: 'smoke-on-the-mountain',
        natural: 'Smoke on the mountain — the canonical valid inference (sad-hetu, sap-all/vip-none).',
        dsl:
          'paksha:   the mountain\n' +
          'sadhya:   fiery\n' +
          'hetu:     smoky\n' +
          'sapaksha: kitchen, forge\n' +
          'vipaksha: lake, dewy ground',
        note: 'The textbook Nyāya inference. All sapakṣa bear the hetu; no vipakṣa does; pakṣa-dharmatā holds. Lands in the sad-hetu (anvaya-vyatireka) cell.',
      },
      {
        slug: 'sound-impermanent',
        natural: 'Sound is impermanent because it is produced — sad-hetu (eka-deśa).',
        dsl:
          'paksha:   sound\n' +
          'sadhya:   impermanent\n' +
          'hetu:     produced\n' +
          'sapaksha: pot, cloth, lamp-flame, lightning-, rainbow-\n' +
          'vipaksha: space, time',
        note: 'Dignāga’s own teaching example. Some sapakṣa bear the hetu (pot, cloth, lamp), some don’t (lightning, rainbow are impermanent but not "produced" in the strict sense Dignāga has in mind); no vipakṣa bears it. Sap-some / vip-none — still valid.',
      },
      {
        slug: 'sadharana',
        natural: 'Inconclusive (sādhāraṇa) — sound is impermanent because it is knowable.',
        dsl:
          'paksha:   sound\n' +
          'sadhya:   impermanent\n' +
          'hetu:     knowable\n' +
          'sapaksha: pot, cloth\n' +
          'vipaksha: space+, time+',
        note: 'The hetu "knowable" applies to everything — both sapakṣa (which is impermanent) and vipakṣa (which is permanent). Sap-all / vip-all = sādhāraṇa anaikāntika; the reason discriminates nothing.',
      },
      {
        slug: 'asadharana',
        natural: 'Inconclusive (asādhāraṇa) — sound is impermanent because it is audible.',
        dsl:
          'paksha:   sound\n' +
          'sadhya:   impermanent\n' +
          'hetu:     audible\n' +
          'sapaksha: pot-, cloth-, lamp-\n' +
          'vipaksha: space, time',
        note: 'Dignāga’s standard example of the uncommon inconclusive. Audibility is unique to sound — no other sapakṣa or vipakṣa carries it. Sap-none / vip-none = asādhāraṇa anaikāntika; without a positive correlate the inference cannot be grounded.',
      },
      {
        slug: 'viruddha',
        natural: 'Contradictory (viruddha) — sound is permanent because it is produced.',
        dsl:
          'paksha:   sound+\n' +
          'sadhya:   permanent\n' +
          'hetu:     produced\n' +
          'sapaksha: space-, time-\n' +
          'vipaksha: pot+, cloth+',
        note: 'Same hetu as the second example, but trying to prove the wrong sādhya. The hetu is absent from every sapakṣa (space, time aren’t produced) and present in every vipakṣa (pot, cloth are). Sap-none / vip-all = viruddha — the reason actually proves the negation.',
      },
      {
        slug: 'partial-leak',
        natural: 'Inconclusive — hetu in all sapakṣa, leaks into some vipakṣa.',
        dsl:
          'paksha:   the new species\n' +
          'sadhya:   warm-blooded\n' +
          'hetu:     four-legged\n' +
          'sapaksha: tiger, dog, mouse\n' +
          'vipaksha: lizard+, crocodile+, salamander-',
        note: 'Four-leggedness is universal among the warm-blooded examples but also appears in some vipakṣa (cold-blooded) cases. Sap-all / vip-some = anaikāntika; the hetu cannot rule out a cold-blooded subject.',
      },
      {
        slug: 'asiddha',
        natural: 'Unestablished (asiddha) — hetu fails pakṣa-dharmatā.',
        dsl:
          'paksha:   the lake -\n' +
          'sadhya:   fiery\n' +
          'hetu:     smoky\n' +
          'sapaksha: kitchen, forge\n' +
          'vipaksha: dewy ground',
        note: 'The wheel cell would have been valid (sap-all / vip-none) — but the hetu is not even present in the subject. The inference fails at the first trairūpya gate; verdict is asiddha, not valid.',
      },
    ],
    readingPointers: [
      {
        title: 'Stanford Encyclopedia of Philosophy: Logic in Classical Indian Philosophy',
        href: 'https://plato.stanford.edu/entries/logic-india/',
        kind: 'external',
      },
      {
        title: 'Stanford Encyclopedia of Philosophy: Dignāga',
        href: 'https://plato.stanford.edu/entries/dignaga/',
        kind: 'external',
      },
      {
        title: 'Stanford Encyclopedia of Philosophy: Epistemology in Classical Indian Philosophy',
        href: 'https://plato.stanford.edu/entries/epistemology-india/',
        kind: 'external',
      },
      {
        title: 'Matilal, The Character of Logic in India (SUNY, 1998)',
        href: 'https://sunypress.edu/Books/T/The-Character-of-Logic-in-India',
        kind: 'external',
      },
      {
        title: 'Tucci, The Nyāyamukha of Dignāga (1930) — first English translation',
        href: 'https://archive.org/details/in.ernet.dli.2015.149543',
        kind: 'external',
      },
    ],
  },
  {
    slug: 'resolution',
    name: 'Resolution · Horn · Datalog',
    shortDescription:
      'One DSL, three engines: binary resolution refutation on a clause set; SLD goal-directed proof search on a Horn program; semi-naïve forward chaining of a Datalog program to its minimal model.',
    era: '1965 → present',
    keyPrimitive: 'clause + unification',
    status: 'available',
    thinkerSlug: null,
    history:
      'Resolution as a uniform proof method for first-order logic was introduced by J. A. Robinson in his 1965 paper "A Machine-Oriented Logic Based on the Resolution Principle." The idea was that any two clauses with complementary literals can be combined into a new clause, and that — paired with most-general-unifier substitution — this single rule of inference is *refutation-complete* for first-order logic. The result reshaped automated reasoning. Robert Kowalski and Alain Colmerauer in 1972–73 specialised resolution to *Horn clauses* (at most one positive literal each) and combined it with leftmost selection and depth-first backtracking to produce SLD resolution — the operational core of Prolog. In parallel, the database community recognised that Horn programs without function symbols admit a tractable forward-chaining evaluation: every program has a unique least Herbrand model, computed in polynomial time by iterating the immediate-consequence operator T_P to fixpoint. This stratified-and-safe fragment became Datalog. The three viewpoints — refutation, SLD, forward chaining — are connected: each reads the same Horn program with a different proof procedure.',
    primitives: [
      {
        name: 'Term',
        syntax: 'X · alice · cons(X, Xs)',
        description: 'Variable (capital initial / underscore), constant (lowercase), or compound functor(args). Ground terms have no variables.',
      },
      {
        name: 'Atom',
        syntax: 'parent(alice, bob)',
        description: 'Predicate applied to terms. The basic unit of meaning in Horn / Datalog programs and the atom of every literal in clauses mode.',
      },
      {
        name: 'Literal',
        syntax: 'p(X)  /  ¬p(X)',
        description: 'A positive or negative atom. Negation written ¬ / ~ / "not". Used inside clauses; Horn / Datalog atoms are always positive.',
      },
      {
        name: 'Clause',
        syntax: 'p ∨ ¬q ∨ r',
        description: 'A disjunction of literals (a set, in the abstract). The empty clause ⊥ is the contradiction.',
      },
      {
        name: 'Goal (refutation)',
        syntax: '⊢ G  /  |- G',
        description: 'In clauses mode, the engine adds the negation of every goal literal as a unit clause and searches for ⊥. Reaching ⊥ proves the goal follows from the inputs.',
      },
      {
        name: 'Horn rule',
        syntax: 'h(X) :- b1(X), b2(X).',
        description: 'A head atom with zero or more body atoms. Facts are rules with empty body. The Prolog / Datalog notation; identifies a definite clause.',
      },
      {
        name: 'Query',
        syntax: '?- ancestor(alice, Z).',
        description: 'A conjunction of atoms to prove. SLD resolution backward-chains it leftmost-first and returns the answer substitution for its variables.',
      },
      {
        name: 'Unification',
        syntax: 'mgu(p(X, b), p(a, Y))',
        description: 'Robinson MGU: the most general substitution making two atoms identical. Required for both binary resolution and SLD goal reduction.',
      },
    ],
    examples: [
      {
        slug: 'modus-ponens-refutation',
        natural: 'Propositional refutation: modus ponens — {p, ¬p ∨ q, ⊢ q} resolves to ⊥.',
        dsl:
          'p\n' +
          '~p | q\n' +
          '|- q',
        note: 'The textbook refutation example. Adding ¬q gives the unit clause {¬q}; resolving with {¬p ∨ q} on q yields {¬p}; resolving with {p} yields ⊥.',
      },
      {
        slug: 'unsat-three-clauses',
        natural: 'Refute an unsatisfiable clause set: {p ∨ q, ¬p, ¬q} alone contradict.',
        dsl:
          'p | q\n' +
          '~p\n' +
          '~q',
        note: 'No goal needed — the clause set itself is unsatisfiable. Resolution on {p, q} with {¬p} yields {q}; resolving with {¬q} gives ⊥.',
      },
      {
        slug: 'transitivity-fol',
        natural: 'First-order resolution: from p(a) and ∀X. p(X) → q(X), derive q(a).',
        dsl:
          'p(a)\n' +
          '~p(X) | q(X)\n' +
          '|- q(a)',
        note: 'Demonstrates unification: resolving {¬p(X) ∨ q(X)} with {¬q(a)} on q binds X ↦ a; the resolvent {¬p(a)} then resolves with {p(a)} to ⊥.',
      },
      {
        slug: 'ancestor-sld',
        natural: 'Horn / SLD: who is alice an ancestor of?',
        dsl:
          'parent(alice, bob).\n' +
          'parent(bob, carol).\n' +
          'parent(carol, dave).\n' +
          'ancestor(X, Y) :- parent(X, Y).\n' +
          'ancestor(X, Z) :- parent(X, Y), ancestor(Y, Z).\n' +
          '?- ancestor(alice, Z).',
        note: 'SLD finds the first answer Z = bob via the base rule. Re-rooting the recursive rule on bob would find Z = carol and then Z = dave. The lab shows the first success path with backtracked dead-ends visible.',
      },
      {
        slug: 'append-sld',
        natural: 'Horn / SLD with structures: append([1, 2], [3], R).',
        dsl:
          'append(nil, L, L).\n' +
          'append(cons(H, T), L, cons(H, R)) :- append(T, L, R).\n' +
          '?- append(cons(one, cons(two, nil)), cons(three, nil), R).',
        note: 'The classic recursive list-append, with nil and cons used as constants and a binary functor. Each recursive resolution unifies the head pattern with the goal and emits the recursive sub-goal.',
      },
      {
        slug: 'transitive-closure-datalog',
        natural: 'Datalog: transitive closure of an edge relation.',
        dsl:
          'edge(a, b).\n' +
          'edge(b, c).\n' +
          'edge(c, d).\n' +
          'edge(d, e).\n' +
          'tc(X, Y) :- edge(X, Y).\n' +
          'tc(X, Y) :- edge(X, Z), tc(Z, Y).',
        note: 'No query — the engine forward-chains to the fixpoint. Stratum 0 = the four edge facts. Stratum 1 derives tc(a,b), tc(b,c), tc(c,d), tc(d,e) (base rule). Stratum 2 adds tc(a,c), tc(b,d), tc(c,e). Subsequent rounds chain on through.',
      },
      {
        slug: 'same-generation-datalog',
        natural: 'Datalog: classic same-generation query — siblings, cousins, second cousins…',
        dsl:
          'parent(arthur, bob).\n' +
          'parent(arthur, carol).\n' +
          'parent(bob, dave).\n' +
          'parent(carol, eve).\n' +
          'parent(dave, frank).\n' +
          'parent(eve, gail).\n' +
          'sg(X, X) :- person(X).\n' +
          'sg(X, Y) :- parent(P, X), parent(Q, Y), sg(P, Q).\n' +
          'person(arthur).\n' +
          'person(bob).\n' +
          'person(carol).\n' +
          'person(dave).\n' +
          'person(eve).\n' +
          'person(frank).\n' +
          'person(gail).',
        note: 'Same-generation pairs: bob and carol (siblings, both children of arthur); dave and eve (cousins, parents are siblings); frank and gail (second cousins). The reflexive base case sg(X, X) puts every person in their own generation.',
      },
      {
        slug: 'reachability-with-query',
        natural: 'Same edges, asked as an SLD query: is e reachable from a?',
        dsl:
          'edge(a, b).\n' +
          'edge(b, c).\n' +
          'edge(c, d).\n' +
          'edge(d, e).\n' +
          'reach(X, Y) :- edge(X, Y).\n' +
          'reach(X, Y) :- edge(X, Z), reach(Z, Y).\n' +
          '?- reach(a, e).',
        note: 'Same program shape as the Datalog example above, but with a `?-` query — switches into SLD mode. SLD chains through edge(a,b), edge(b,c), … until reach(b, e) → reach(c, e) → reach(d, e) → edge(d, e). The derivation tree is the witness.',
      },
    ],
    readingPointers: [
      {
        title: 'Robinson, "A Machine-Oriented Logic Based on the Resolution Principle" (JACM 1965)',
        href: 'https://dl.acm.org/doi/10.1145/321250.321253',
        kind: 'external',
      },
      {
        title: 'Stanford Encyclopedia of Philosophy: Automated Reasoning',
        href: 'https://plato.stanford.edu/entries/reasoning-automated/',
        kind: 'external',
      },
      {
        title: 'Stanford Encyclopedia of Philosophy: Logic Programming',
        href: 'https://plato.stanford.edu/entries/logic-programming/',
        kind: 'external',
      },
      {
        title: 'Abiteboul, Hull & Vianu, Foundations of Databases (1995) — Datalog chapters online',
        href: 'http://webdam.inria.fr/Alice/',
        kind: 'external',
      },
    ],
  },
  {
    slug: 'temporal-ctl',
    name: 'Computation Tree Logic (CTL)',
    shortDescription:
      'A branching-time temporal logic. Paths are *trees of futures* through a Kripke structure; each future-time operator is paired with a path quantifier (A — every path, E — some path). Decidable in polynomial time and the foundation of model checking.',
    era: '1981 →',
    keyPrimitive: 'A / E paired with X / F / G / U over a branching frame',
    status: 'available',
    thinkerSlug: null,
    history:
      'Edmund Clarke and Allen Emerson introduced CTL in 1981 as a branching-time alternative to LTL. The eight paired path-quantifier-plus-temporal operators (AX, EX, AF, EF, AG, EG, A[U], E[U]) give a logic with a polynomial-time labelling algorithm — for each subformula, mark every state where it holds — that became the core of practical model checkers (SMV, NuSMV, Uppaal). Clarke, Emerson, and Sistla (1986) gave the algorithm; Clarke, Emerson, and Sifakis shared the 2007 Turing Award for the resulting field. CTL and LTL are *incomparable* — neither subsumes the other — and CTL* is the common refinement.',
    primitives: [
      {
        name: 'AX / EX (next)',
        syntax: 'AX p   EX p',
        description:
          'AX φ holds at s iff φ holds at every successor of s. EX φ holds iff φ holds at some successor.',
      },
      {
        name: 'AF / EF (eventually)',
        syntax: 'AF p   EF p',
        description:
          'AF φ holds iff every infinite path through s eventually reaches a state forcing φ. EF φ iff some path does.',
      },
      {
        name: 'AG / EG (always)',
        syntax: 'AG p   EG p',
        description:
          'AG φ holds iff every state reachable from s forces φ. EG φ iff some path through s keeps φ true forever.',
      },
      {
        name: 'A[…U…] / E[…U…] (until)',
        syntax: 'A[p U q]   E[p U q]',
        description:
          'A[φ U ψ] iff every path through s has a position forcing ψ with φ holding strictly before. E[φ U ψ] iff some path does.',
      },
      {
        name: 'Branching frame',
        syntax: '(W, R, V) serial',
        description:
          'A Kripke structure with a serial accessibility relation. Paths are infinite sequences through R; the path-quantifier semantics is meaningful only when every state has a successor.',
      },
    ],
    examples: TEMPORAL_CTL_EXAMPLES(),
    readingPointers: [
      {
        title: 'Stanford Encyclopedia of Philosophy: Temporal Logic',
        href: 'https://plato.stanford.edu/entries/logic-temporal/',
        kind: 'external',
      },
      {
        title: 'Clarke, Emerson, Sistla, "Automatic Verification of Finite-State Concurrent Systems Using Temporal Logic Specifications" (TOPLAS 1986)',
        href: 'https://dl.acm.org/doi/10.1145/5397.5399',
        kind: 'external',
      },
      {
        title: 'Baier & Katoen, *Principles of Model Checking* (MIT Press, 2008)',
        href: 'https://mitpress.mit.edu/9780262026499/',
        kind: 'external',
      },
    ],
  },
  {
    slug: 'temporal-ltl',
    name: 'Linear Temporal Logic (LTL)',
    shortDescription:
      'A logic of time interpreted on infinite *traces* of states. The future-time operators X (next), F (eventually), G (always), and U (until) describe how a single timeline evolves. Standard for program-correctness specification (Pnueli 1977).',
    era: '1977 →',
    keyPrimitive: 'X / F / G / U over a single trace',
    status: 'available',
    thinkerSlug: null,
    history:
      'Amir Pnueli’s 1977 paper *The Temporal Logic of Programs* introduced LTL as a specification language for reactive systems, winning him the Turing Award in 1996. The core insight is that program properties — termination, response, fairness, mutual exclusion — are propositions about *the trace a program produces*, and LTL gives them a clean modal-logic syntax. Manna & Pnueli systematised the theory through the 1980s–90s; Lichtenstein & Pnueli (1985) gave the polynomial-time model checker for finite-state systems that became the basis for SPIN, NuSMV, and the formal-verification industry. The Lab represents infinite traces *finitely* as lassos: a finite list of states with a designated loopback index that says where the timeline cycles to.',
    primitives: [
      {
        name: 'Next',
        syntax: 'X p',
        description:
          'X φ holds at position i iff φ holds at position i+1. The "one tick from now" operator.',
      },
      {
        name: 'Eventually',
        syntax: 'F p',
        description:
          'F φ holds at i iff φ holds at some position ≥ i. Captures eventual occurrence — used to express liveness.',
      },
      {
        name: 'Always',
        syntax: 'G p',
        description:
          'G φ holds at i iff φ holds at every position ≥ i. Captures invariance — used to express safety.',
      },
      {
        name: 'Until',
        syntax: 'p U q',
        description:
          'φ U ψ holds at i iff there is a future j ≥ i with ψ at j and φ at every position in [i, j). The strongest binary temporal operator; F and G are definable from U.',
      },
      {
        name: 'Lasso trace',
        syntax: '(W, →, loop)',
        description:
          'A finite sequence of states ending in a cycle. The cycle’s starting index (loopBack) determines what "infinitely often" means on the trace; a stutter trace (loopBack = last index) approximates a non-cyclic future.',
      },
    ],
    examples: TEMPORAL_LTL_EXAMPLES(),
    readingPointers: [
      {
        title: 'Stanford Encyclopedia of Philosophy: Temporal Logic',
        href: 'https://plato.stanford.edu/entries/logic-temporal/',
        kind: 'external',
      },
      {
        title: 'Pnueli, "The Temporal Logic of Programs" (FOCS, 1977)',
        href: 'https://ieeexplore.ieee.org/document/4567924',
        kind: 'external',
      },
      {
        title: 'Baier & Katoen, *Principles of Model Checking* (MIT Press, 2008)',
        href: 'https://mitpress.mit.edu/9780262026499/',
        kind: 'external',
      },
    ],
  },
  {
    slug: 'epistemic',
    name: 'Multi-agent Epistemic Logic',
    shortDescription:
      'Knowledge and belief modelled with one accessibility relation per agent. Worlds are *epistemic alternatives*; agent a knows φ at w iff φ holds at every world a cannot distinguish from w. Standard knowledge logics use S5 frames; standard belief logics use KD45.',
    era: '1962 →',
    keyPrimitive: 'K_a φ over a per-agent accessibility relation',
    status: 'available',
    thinkerSlug: null,
    history:
      'Hintikka’s 1962 *Knowledge and Belief* introduced the modal-logic treatment of epistemic concepts: knowledge as a □-style operator quantifying over worlds an agent cannot distinguish from the actual one. Multi-agent versions were systematised by Halpern, Moses, Vardi, and Fagin in the 1980s–90s (`Reasoning About Knowledge`, MIT Press 1995), where they became central to distributed-systems verification, game theory, and pragmatics. Knowledge is canonically S5 (each R_a is an equivalence relation: factive, positive-introspective, negative-introspective). Belief is canonically KD45 — drop reflexivity, keep seriality. The Lab ships the K / T / 4 / 5 / D axiom panel per declared agent.',
    primitives: [
      {
        name: 'Knowledge operator',
        syntax: 'K_a p   ([a] p)',
        description:
          'K_a φ holds at w iff φ holds at every world v with R_a(w, v). Two notations are accepted: `K_a p` and `[a] p` for the same operator.',
      },
      {
        name: 'Consideration / possibility operator',
        syntax: 'M_a p   (<<a>> p)',
        description:
          'Dual of K_a: M_a φ ≡ ¬K_a ¬φ — agent a considers φ epistemically possible.',
      },
      {
        name: 'Per-agent accessibility',
        syntax: 'R_a',
        description:
          'A relation per declared agent. Two worlds related by R_a are *epistemically indistinguishable* for a. Knowledge axioms are constraints on R_a (T = reflexive, 4 = transitive, 5 = Euclidean, D = serial).',
      },
      {
        name: 'Knowledge frame (S5)',
        syntax: 'R_a equivalence',
        description:
          'Each R_a is reflexive, symmetric, and transitive. Validates K, T, 4, 5 — the canonical multi-agent knowledge logic.',
      },
      {
        name: 'Belief frame (KD45)',
        syntax: 'R_a serial+trans+euclid',
        description:
          'Drop reflexivity (an agent may falsely believe φ): each R_a is serial, transitive, and Euclidean. Validates K, D, 4, 5 — the canonical belief logic.',
      },
    ],
    examples: EPISTEMIC_EXAMPLES(),
    readingPointers: [
      {
        title: 'Stanford Encyclopedia of Philosophy: Epistemic Logic',
        href: 'https://plato.stanford.edu/entries/logic-epistemic/',
        kind: 'external',
      },
      {
        title: 'Hintikka, *Knowledge and Belief* (Cornell, 1962)',
        href: 'https://www.cornellpress.cornell.edu/book/9780801403149/knowledge-and-belief/',
        kind: 'external',
      },
      {
        title: 'Fagin, Halpern, Moses, Vardi, *Reasoning About Knowledge* (MIT Press, 1995)',
        href: 'https://mitpress.mit.edu/9780262562003/reasoning-about-knowledge/',
        kind: 'external',
      },
    ],
  },
  {
    slug: 'deontic',
    name: 'Standard Deontic Logic (KD)',
    shortDescription:
      'A modal logic of obligation and permission interpreted on serial Kripke frames. Re-uses the modal engine: O ≡ □ (obligatory), P ≡ ◇ (permitted), F ≡ ¬◇ (forbidden). Validates the D axiom (Oφ → Pφ): every obligation has at least one permitted realization.',
    era: '1951 →',
    keyPrimitive: 'O / P / F over a serial accessibility relation',
    status: 'available',
    thinkerSlug: null,
    history:
      'Modern deontic logic begins with G. H. von Wright’s 1951 paper *Deontic Logic*, which lifted ought-statements into the modal-logic toolkit. The standard system, KD, treats Oφ as a □ on a serial Kripke frame whose accessible worlds are the *deontically ideal* alternatives to the current world; Pφ is the dual ◇. The D axiom (Oφ → Pφ) corresponds exactly to seriality of R. KD has well-known limitations — Ross’s paradox (1944), Chisholm’s contrary-to-duty puzzle (1963), the gentle-murderer paradox (Forrester, 1984), and free-choice permission — which motivate richer dyadic, conditional, and STIT deontic logics. The Lab ships KD as the canonical entry point.',
    primitives: [
      {
        name: 'Obligation',
        syntax: '[]p   (Op)',
        description:
          'Op holds at world w iff p holds at every deontically-accessible alternative — every world that represents a way things ought to be from w.',
      },
      {
        name: 'Permission',
        syntax: '<>p   (Pp)',
        description:
          'Pp holds at w iff p holds at *some* deontically-accessible alternative. Dual of obligation: Pφ ≡ ¬O¬φ.',
      },
      {
        name: 'Prohibition',
        syntax: '!<>p  (Fp)',
        description:
          'Fp holds at w iff p holds at no deontically-accessible alternative. Definable: Fφ ≡ O¬φ ≡ ¬Pφ.',
      },
      {
        name: 'Serial frame',
        syntax: 'D-frame',
        description:
          'Accessibility relation R is *serial*: every world has at least one R-successor. This guarantees that Oφ never holds vacuously and that Oφ → Pφ is never trivially false.',
      },
      {
        name: 'D axiom',
        syntax: '[]p -> <>p',
        description:
          'Oφ → Pφ — what is obligatory is permitted. The characteristic axiom of standard deontic logic; it corresponds exactly to seriality of R.',
      },
    ],
    examples: DEONTIC_EXAMPLES(),
    readingPointers: [
      {
        title: 'Stanford Encyclopedia of Philosophy: Deontic Logic',
        href: 'https://plato.stanford.edu/entries/logic-deontic/',
        kind: 'external',
      },
      {
        title: 'von Wright, "Deontic Logic" (Mind, 1951)',
        href: 'https://www.jstor.org/stable/2251395',
        kind: 'external',
      },
      {
        title: 'Hilpinen & McNamara, "Deontic Logic: A Historical Survey and Introduction" (Handbook of Deontic Logic, vol. 1, 2013)',
        href: 'https://www.collegepublications.co.uk/handbooks/?00012',
        kind: 'external',
      },
    ],
    frameClasses: [FRAMES.D, FRAMES.T],
  },
  {
    slug: 'intuitionistic',
    name: 'Intuitionistic Propositional Logic',
    shortDescription:
      'A constructive propositional logic interpreted on a pre-order of "stages of knowledge". A formula holds at a stage only if there is a witness, and once witnessed it persists into every accessible future. Excluded middle, double-negation elimination, and Peirce’s law all fail.',
    era: '1907 →',
    keyPrimitive: 'persistent forcing on a pre-order',
    status: 'available',
    thinkerSlug: null,
    history:
      'Brouwer’s 1907 PhD thesis *On the Foundations of Mathematics* rejected the law of excluded middle as a universal principle, founding intuitionism. Heyting (1930) gave the first axiomatization of intuitionistic propositional logic; Gödel (1932), McKinsey and Tarski (1948), and Kripke (1965) gave it model theory. Kripke’s pre-order semantics — worlds as stages of knowledge, persistence as monotone growth of established truths — became the standard pedagogical introduction. Intuitionistic logic is the propositional core of constructive mathematics and, via the Curry–Howard correspondence, the type theory of pure functional programming.',
    primitives: [
      {
        name: 'Atomic proposition',
        syntax: 'p, q, r, …',
        description:
          'A proposition that may or may not be established at a given stage. The valuation V(w) lists the atoms established at world w; persistence requires V(w) ⊆ V(v) whenever w ≤ v.',
      },
      {
        name: 'Conjunction',
        syntax: 'p & q',
        description:
          'w ⊩ φ ∧ ψ iff w ⊩ φ and w ⊩ ψ. Both halves must be established at the current stage.',
      },
      {
        name: 'Disjunction',
        syntax: 'p | q',
        description:
          'w ⊩ φ ∨ ψ iff w ⊩ φ or w ⊩ ψ. Constructively, you must be able to *say* which disjunct holds — the law of excluded middle (φ ∨ ¬φ) is therefore not a universal principle.',
      },
      {
        name: 'Implication',
        syntax: 'p -> q',
        description:
          'w ⊩ φ → ψ iff for every accessible future v ≥ w: if v ⊩ φ then v ⊩ ψ. The universal-future quantification is what blocks classical principles like Peirce’s law.',
      },
      {
        name: 'Negation',
        syntax: '!p   (¬p)',
        description:
          'w ⊩ ¬φ iff for every accessible future v ≥ w: v ⋮ φ. “φ will never be established”. Strictly stronger than “φ isn’t established here yet”.',
      },
      {
        name: 'Pre-order frame',
        syntax: '(W, ≤)',
        description:
          'A reflexive, transitive accessibility relation. Worlds are *stages of knowledge*; ≤ is “extends to a later stage”. The pre-order shape is what guarantees persistence is well-defined.',
      },
      {
        name: 'Monotone valuation',
        syntax: 'w ≤ v ⇒ V(w) ⊆ V(v)',
        description:
          'Once an atom is forced at a stage, it remains forced at every later stage. The forcing relation lifts this to all formulas — every intuitionistic formula is upward-persistent.',
      },
    ],
    examples: INTUITIONISTIC_EXAMPLES(),
    readingPointers: [
      {
        title: 'Stanford Encyclopedia of Philosophy: Intuitionistic Logic',
        href: 'https://plato.stanford.edu/entries/logic-intuitionistic/',
        kind: 'external',
      },
      {
        title: 'Stanford Encyclopedia of Philosophy: The Development of Intuitionistic Logic',
        href: 'https://plato.stanford.edu/entries/intuitionistic-logic-development/',
        kind: 'external',
      },
      {
        title: 'Troelstra & van Dalen, *Constructivism in Mathematics* (North-Holland, 1988)',
        href: 'https://www.elsevier.com/books/constructivism-in-mathematics-vol-1/troelstra/978-0-444-70506-8',
        kind: 'external',
      },
      {
        title: 'van Dalen, *Logic and Structure* (Springer, 5th ed.)',
        href: 'https://link.springer.com/book/10.1007/978-1-4471-4558-5',
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
    {
      slug: 'four-fails-non-transitive',
      natural: '4-axiom fails on a chain w0 → w1 → w2 lacking w0 → w2',
      dsl: '[]p -> [][]p',
      frameClass: 'T',
      model: {
        worlds: [
          { id: 'w0', atoms: ['p'] },
          { id: 'w1', atoms: ['p'] },
          { id: 'w2', atoms: [] },
        ],
        edges: [
          K_REFLEXIVE('w0'),
          K_REFLEXIVE('w1'),
          K_REFLEXIVE('w2'),
          { from: 'w0', to: 'w1' },
          { from: 'w1', to: 'w2' },
        ],
        designated: 'w0',
      },
      satisfied: false,
      note: 'R is reflexive (so we are on a T-frame) but not transitive — w0 sees w1 and w1 sees w2, yet w0 doesn’t see w2. □p holds at w0 (every successor of w0 carries p) but □□p fails: at w1, □p needs p at every successor of w1, and w2 lacks it. The "close R under S4" button adds w0 → w2 and the verdict flips. This is exactly the model FEAT-006 §Notes anticipated as the engine’s motivating example.',
    },
    {
      slug: 'b-fails',
      natural: 'B-axiom fails on a non-symmetric line: p → □◇p',
      dsl: 'p -> []<>p',
      frameClass: 'K',
      model: {
        worlds: [
          { id: 'w0', atoms: ['p'] },
          { id: 'w1', atoms: [] },
        ],
        edges: [
          { from: 'w0', to: 'w1' },
        ],
        designated: 'w0',
      },
      satisfied: false,
      note: 'p holds at w0, but ◇p fails at w1 (w1 is a dead end with no successor carrying p), so □◇p fails at w0. B is the symmetry axiom; this counter-frame is the canonical illustration of why B requires R’s reverse closure.',
    },
    {
      slug: 'd-on-serial',
      natural: 'D-axiom on a serial-but-not-reflexive frame: □p → ◇p',
      dsl: '[]p -> <>p',
      frameClass: 'K',
      model: {
        worlds: [
          { id: 'w0', atoms: [] },
          { id: 'w1', atoms: ['p'] },
        ],
        edges: [
          { from: 'w0', to: 'w1' },
          { from: 'w1', to: 'w1' },
        ],
        designated: 'w0',
      },
      satisfied: true,
      note: 'Every world has at least one successor (w1 self-loops, w0 sees w1) — that’s seriality, the constraint D corresponds to. D is the deontic axiom: what is obligatory is permissible. Worth pairing with the b-fails case to see how different constraints produce different axiom verdicts.',
    },
  ];
}

// ─────────────────────────────────────────────────────────────────────
// CTL examples — hand-authored. Each ships a small branching Kripke
// structure (always serial). The state ids `s0`, `s1`, … and atoms
// follow the CTL textbook convention. Reuses KripkeModel.

function TEMPORAL_CTL_EXAMPLES(): LogicExample[] {
  return [
    {
      slug: 'ex-basic',
      natural: 'EX p — there is a next state where p',
      dsl: 'EX p',
      frameClass: 'D',
      model: {
        worlds: [
          { id: 's0', atoms: [] },
          { id: 's1', atoms: ['p'] },
          { id: 's2', atoms: [] },
        ],
        edges: [
          { from: 's0', to: 's1' },
          { from: 's0', to: 's2' },
          { from: 's1', to: 's1' },
          { from: 's2', to: 's2' },
        ],
        designated: 's0',
      },
      satisfied: true,
      note: 's0 has two successors; s1 carries p, so EX p holds at s0. AX p does not — s2 lacks p.',
    },
    {
      slug: 'ax-vs-ex',
      natural: 'AX p but ¬AG p — true at next-step but not always',
      dsl: 'AX p & !AG p',
      frameClass: 'D',
      model: {
        worlds: [
          { id: 's0', atoms: [] },
          { id: 's1', atoms: ['p'] },
          { id: 's2', atoms: [] },
        ],
        edges: [
          { from: 's0', to: 's1' },
          { from: 's1', to: 's2' },
          { from: 's2', to: 's2' },
        ],
        designated: 's0',
      },
      satisfied: true,
      note: 's0’s only successor (s1) has p, so AX p ⊨ s0. But s1 → s2 leaves the truthful world: AG p ⋮ s0 because s2 (reachable from s0) lacks p.',
    },
    {
      slug: 'ef-not-ag',
      natural: 'EF p but ¬AG p — possibly p but not invariantly',
      dsl: 'EF p & !AG p',
      frameClass: 'D',
      model: {
        worlds: [
          { id: 's0', atoms: [] },
          { id: 's1', atoms: ['p'] },
          { id: 's2', atoms: [] },
        ],
        edges: [
          { from: 's0', to: 's1' },
          { from: 's0', to: 's2' },
          { from: 's1', to: 's1' },
          { from: 's2', to: 's2' },
        ],
        designated: 's0',
      },
      satisfied: true,
      note: 'Some path from s0 reaches p (the s1 branch), so EF p holds. But the s2 branch never reaches p, so AG p fails. The exact distinction CTL gets you over LTL.',
    },
    {
      slug: 'eg-loop',
      natural: 'EG p — some path keeps p forever',
      dsl: 'EG p',
      frameClass: 'D',
      model: {
        worlds: [
          { id: 's0', atoms: ['p'] },
          { id: 's1', atoms: ['p'] },
          { id: 's2', atoms: [] },
        ],
        edges: [
          { from: 's0', to: 's1' },
          { from: 's0', to: 's2' },
          { from: 's1', to: 's1' },
          { from: 's2', to: 's2' },
        ],
        designated: 's0',
      },
      satisfied: true,
      note: 'The path s0 → s1 → s1 → … keeps p forever, so EG p ⊨ s0. AG p still fails (s2 lacks p). EG vs AG is the canonical CTL distinction.',
    },
    {
      slug: 'au-basic',
      natural: 'A[p U q] — every path has p until q',
      dsl: 'A[p U q]',
      frameClass: 'D',
      model: {
        worlds: [
          { id: 's0', atoms: ['p'] },
          { id: 's1', atoms: ['p'] },
          { id: 's2', atoms: ['q'] },
          { id: 's3', atoms: ['q'] },
        ],
        edges: [
          { from: 's0', to: 's1' },
          { from: 's0', to: 's2' },
          { from: 's1', to: 's2' },
          { from: 's1', to: 's3' },
          { from: 's2', to: 's2' },
          { from: 's3', to: 's3' },
        ],
        designated: 's0',
      },
      satisfied: true,
      note: 'Every path through s0 forces p until reaching q at s2 or s3. The closure conjunct (q must occur) holds because both s2 and s3 carry q and no path avoids them.',
    },
    {
      slug: 'eu-not-au',
      natural: 'E[p U q] but ¬A[p U q]',
      dsl: 'E[p U q] & !A[p U q]',
      frameClass: 'D',
      model: {
        worlds: [
          { id: 's0', atoms: ['p'] },
          { id: 's1', atoms: ['p'] },
          { id: 's2', atoms: ['q'] },
          { id: 's3', atoms: [] },
        ],
        edges: [
          { from: 's0', to: 's1' },
          { from: 's0', to: 's3' },
          { from: 's1', to: 's2' },
          { from: 's2', to: 's2' },
          { from: 's3', to: 's3' },
        ],
        designated: 's0',
      },
      satisfied: true,
      note: 'The s0 → s1 → s2 path has p until q, so E[p U q] holds. But the s0 → s3 path never reaches q (and s3 also lacks p), so the universal A[p U q] fails. Same scenario shape as the LTL "some traces are good, some aren’t" pattern, expressible directly here.',
    },
    {
      slug: 'mutex-ag',
      natural: 'Mutual exclusion — AG ¬(p1 ∧ p2)',
      dsl: 'AG !(p1 & p2)',
      frameClass: 'D',
      model: {
        worlds: [
          { id: 's0', atoms: [] },
          { id: 's1', atoms: ['p1'] },
          { id: 's2', atoms: ['p2'] },
        ],
        edges: [
          { from: 's0', to: 's1' },
          { from: 's0', to: 's2' },
          { from: 's1', to: 's0' },
          { from: 's2', to: 's0' },
        ],
        designated: 's0',
      },
      satisfied: true,
      note: 'A toy mutex: from idle (s0) one of two clients can be in their critical section (s1 has p1, s2 has p2), and they always return to idle. No reachable state has both atoms — AG ¬(p1 ∧ p2) holds. The branching shape is what makes mutex naturally a CTL property.',
    },
    {
      slug: 'starvation-fails',
      natural: 'Starvation — AG (req → AF resp) (fails on a starving branch)',
      dsl: 'AG (req -> AF resp)',
      frameClass: 'D',
      model: {
        worlds: [
          { id: 's0', atoms: ['req'] },
          { id: 's1', atoms: [] },         // ignored: stays here forever
          { id: 's2', atoms: ['resp'] },
        ],
        edges: [
          { from: 's0', to: 's1' },
          { from: 's0', to: 's2' },
          { from: 's1', to: 's1' },
          { from: 's2', to: 's2' },
        ],
        designated: 's0',
      },
      satisfied: false,
      note: 'At s0 a request is made; one path responds (via s2) but another stays in s1 forever, so AF resp fails along the s1 branch and AG-bracketing the implication fails at s0. Classic starvation pattern; pinning it down requires a path quantifier.',
    },
  ];
}

// ─────────────────────────────────────────────────────────────────────
// LTL examples — hand-authored. Each ships a small lasso trace.
// Convention: state ids `s0`, `s1`, … with `start = 0`. `loopBack`
// = states.length - 1 means "stutter" (last state self-loops);
// `loopBack < states.length - 1` makes the trace genuinely cyclic.

function TEMPORAL_LTL_EXAMPLES(): LogicExample[] {
  return [
    {
      slug: 'next-basic',
      natural: 'X p — at the next state, p',
      dsl: 'X p',
      trace: {
        states: [
          { id: 's0', atoms: [] },
          { id: 's1', atoms: ['p'] },
          { id: 's2', atoms: ['p'] },
        ],
        loopBack: 2,
        start: 0,
      },
      satisfied: true,
      note: 'p holds at s1 (the next state from s0), so X p holds at the start. Stutter trace — s2 self-loops, so the future after s2 is "p forever".',
    },
    {
      slug: 'eventually-basic',
      natural: 'F p — eventually p',
      dsl: 'F p',
      trace: {
        states: [
          { id: 's0', atoms: [] },
          { id: 's1', atoms: [] },
          { id: 's2', atoms: ['p'] },
        ],
        loopBack: 2,
        start: 0,
      },
      satisfied: true,
      note: 'p eventually holds (at s2). F p holds at every position ≤ 2 of the trace.',
    },
    {
      slug: 'always-on-stutter',
      natural: 'G p — always p, on a stutter trace',
      dsl: 'G p',
      trace: {
        states: [
          { id: 's0', atoms: ['p'] },
          { id: 's1', atoms: ['p'] },
        ],
        loopBack: 1,
        start: 0,
      },
      satisfied: true,
      note: 'p holds at every state. The stutter at s1 keeps it holding into the infinite future.',
    },
    {
      slug: 'always-fails-cyclic',
      natural: 'G p fails on a cyclic trace where p eventually drops',
      dsl: 'G p',
      trace: {
        states: [
          { id: 's0', atoms: ['p'] },
          { id: 's1', atoms: ['p'] },
          { id: 's2', atoms: [] },
        ],
        loopBack: 0,
        start: 0,
      },
      satisfied: false,
      note: 'The loop returns to s0 → s1 → s2 → s0 → … so the infinite trace is p, p, ¬p, p, p, ¬p, … . p fails infinitely often, so G p fails at every position.',
    },
    {
      slug: 'until-basic',
      natural: 'p U q — p until q',
      dsl: 'p U q',
      trace: {
        states: [
          { id: 's0', atoms: ['p'] },
          { id: 's1', atoms: ['p'] },
          { id: 's2', atoms: ['q'] },
        ],
        loopBack: 2,
        start: 0,
      },
      satisfied: true,
      note: 'q is reached at s2; p holds at every position before then (s0, s1). Until’s closure-conjunct is exactly this: q must occur, and p must persist up to it.',
    },
    {
      slug: 'liveness-response',
      natural: 'Response — G(req → F resp)',
      dsl: 'G(req -> F resp)',
      trace: {
        states: [
          { id: 's0', atoms: ['req'] },
          { id: 's1', atoms: [] },
          { id: 's2', atoms: ['resp'] },
          { id: 's3', atoms: ['req'] },
          { id: 's4', atoms: ['resp'] },
        ],
        loopBack: 4,
        start: 0,
      },
      satisfied: true,
      note: 'Every request is eventually answered: at s0 (req → response at s2), at s3 (req → response at s4). The canonical liveness pattern in protocol verification.',
    },
    {
      slug: 'fairness-fails',
      natural: 'Fairness fails — GF p (infinitely often p) fails on a stutter trace where p drops',
      dsl: 'G F p',
      trace: {
        states: [
          { id: 's0', atoms: ['p'] },
          { id: 's1', atoms: [] },
        ],
        loopBack: 1,
        start: 0,
      },
      satisfied: false,
      note: 'p holds only at s0; after that the trace stutters in s1 forever without p. So F p eventually becomes false, and G F p fails at the start. Switch the loopBack to 0 to make it true (the trace then becomes p, ¬p, p, ¬p, …).',
    },
    {
      slug: 'duality-f-not-g-not',
      natural: 'F p ↔ ¬G ¬p — the canonical LTL duality',
      dsl: 'F p <-> !G !p',
      trace: {
        states: [
          { id: 's0', atoms: [] },
          { id: 's1', atoms: ['p'] },
        ],
        loopBack: 1,
        start: 0,
      },
      satisfied: true,
      note: 'Holds at every position of every trace. Eventually-φ equals not-always-not-φ.',
    },
  ];
}

// ─────────────────────────────────────────────────────────────────────
// Epistemic examples — hand-authored. Each ships a small multi-agent
// model with the relations declared per agent. Atom valuations are
// shared across agents (everyone agrees on the *facts*; they differ
// only in which worlds they can tell apart).
//
// Two-agent S5 model (alice + bob) is the workhorse — all five
// classical knowledge axioms are validated on it; the knowledge-vs-
// belief example demotes one agent's relation to KD45 to break T.

function S5_REFLEX_PAIRS(world: string, agent: string) {
  return { from: world, to: world, agent };
}

function EPISTEMIC_EXAMPLES(): LogicExample[] {
  // Two-world S5 model with alice and bob.
  // Alice can't tell w0 from w1 (R_alice = total). Bob distinguishes
  // them (R_bob = identity only). Atom p holds at w1 only.
  const ALICE_BLIND_BOB_KNOWS: EpistemicModel = {
    worlds: [
      { id: 'w0', atoms: [] },
      { id: 'w1', atoms: ['p'] },
    ],
    edges: [
      // alice: total relation (S5: reflexive + symmetric + transitive)
      { from: 'w0', to: 'w0', agent: 'alice' },
      { from: 'w0', to: 'w1', agent: 'alice' },
      { from: 'w1', to: 'w0', agent: 'alice' },
      { from: 'w1', to: 'w1', agent: 'alice' },
      // bob: identity only (he can tell the worlds apart)
      { from: 'w0', to: 'w0', agent: 'bob' },
      { from: 'w1', to: 'w1', agent: 'bob' },
    ],
    agents: ['alice', 'bob'],
    designated: 'w1',
  };

  // S5 model where alice and bob both have the *total* relation.
  // Used to verify K / T / 4 / 5 hold for both agents.
  const TWO_WORLD_S5_BOTH: EpistemicModel = {
    worlds: [
      { id: 'w0', atoms: [] },
      { id: 'w1', atoms: ['p'] },
    ],
    edges: [
      { from: 'w0', to: 'w0', agent: 'alice' },
      { from: 'w0', to: 'w1', agent: 'alice' },
      { from: 'w1', to: 'w0', agent: 'alice' },
      { from: 'w1', to: 'w1', agent: 'alice' },
      { from: 'w0', to: 'w0', agent: 'bob' },
      { from: 'w0', to: 'w1', agent: 'bob' },
      { from: 'w1', to: 'w0', agent: 'bob' },
      { from: 'w1', to: 'w1', agent: 'bob' },
    ],
    agents: ['alice', 'bob'],
    designated: 'w0',
  };

  // KD45 model for `bob` (serial + trans + Euclid, NOT reflexive).
  // Used to show K_bob p → p (T) fails — knowledge-vs-belief cleavage.
  const BOB_BELIEVES_FALSELY: EpistemicModel = {
    worlds: [
      { id: 'w0', atoms: [] },        // actual world: p is false
      { id: 'w1', atoms: ['p'] },     // bob's only believed alternative
    ],
    edges: [
      // alice: S5 — knowledge
      S5_REFLEX_PAIRS('w0', 'alice'),
      S5_REFLEX_PAIRS('w1', 'alice'),
      { from: 'w0', to: 'w1', agent: 'alice' },
      { from: 'w1', to: 'w0', agent: 'alice' },
      // bob: KD45 — believes p, but p is false at the actual world.
      // R_bob = { (w0, w1), (w1, w1) } — serial, transitive, Euclidean,
      // but not reflexive at w0.
      { from: 'w0', to: 'w1', agent: 'bob' },
      { from: 'w1', to: 'w1', agent: 'bob' },
    ],
    agents: ['alice', 'bob'],
    designated: 'w0',
  };

  return [
    {
      slug: 'alice-doesnt-know-p',
      natural: 'Alice doesn’t know whether p — ¬K_alice p ∧ ¬K_alice ¬p',
      dsl: '!K_alice p & !K_alice !p',
      epistemicModel: ALICE_BLIND_BOB_KNOWS,
      satisfied: true,
      note: 'Alice considers both worlds possible. p ⊨ w1 but p ⋯ w0; since alice can’t distinguish them she neither knows p nor knows ¬p.',
    },
    {
      slug: 'bob-knows-p',
      natural: 'Bob knows whether p — K_bob p ∨ K_bob ¬p (here: K_bob p)',
      dsl: 'K_bob p',
      epistemicModel: ALICE_BLIND_BOB_KNOWS,
      satisfied: true,
      note: 'At the designated world (w1), bob’s only epistemic alternative is w1 itself. Since p ⊨ w1, K_bob p holds.',
    },
    {
      slug: 'higher-order-asymmetry',
      natural: 'Higher-order knowledge asymmetry — K_bob p ∧ ¬K_alice K_bob p',
      dsl: 'K_bob p & !K_alice K_bob p',
      epistemicModel: ALICE_BLIND_BOB_KNOWS,
      satisfied: true,
      note: 'Bob knows p, but alice doesn’t know that bob knows p — at the alternative w0 (which alice considers possible), p is false, so K_bob p fails there for bob. Alice can’t rule that out.',
    },
    {
      slug: 'k-axiom-multi-agent',
      natural: 'K-axiom holds for every agent — K_a (p → q) → (K_a p → K_a q)',
      dsl: 'K_alice (p -> q) -> (K_alice p -> K_alice q)',
      epistemicModel: TWO_WORLD_S5_BOTH,
      satisfied: true,
      note: 'Distribution of knowledge over implication is sound on every multi-agent Kripke model. The example just exhibits one.',
    },
    {
      slug: 'positive-introspection',
      natural: 'Positive introspection (4) — K_alice p → K_alice K_alice p',
      dsl: 'K_alice p -> K_alice K_alice p',
      epistemicModel: TWO_WORLD_S5_BOTH,
      satisfied: true,
      note: 'On an S5 frame R_alice is transitive: if alice knows p, she knows that she knows p. The 4 axiom.',
    },
    {
      slug: 'negative-introspection',
      natural: 'Negative introspection (5) — ¬K_alice p → K_alice ¬K_alice p',
      dsl: '!K_alice p -> K_alice !K_alice p',
      epistemicModel: ALICE_BLIND_BOB_KNOWS,
      satisfied: true,
      note: 'Alice doesn’t know p at w1, and she knows that — because at every world R_alice-related to w1, alice still doesn’t know p (the relation is total over a 2-world set). The 5 axiom on S5 frames.',
    },
    {
      slug: 'belief-not-knowledge',
      natural: 'Bob believes p falsely — K_bob p ∧ ¬p (T fails for bob)',
      dsl: 'K_bob p & !p',
      epistemicModel: BOB_BELIEVES_FALSELY,
      satisfied: true,
      note: 'At the actual world w0, p is false, but bob’s only epistemically-accessible alternative is w1, where p holds. So K_bob p (interpreted as belief) is forced even though p isn’t. The factivity (T) axiom fails for bob — exactly the formal cleavage between knowledge (S5) and belief (KD45).',
    },
  ];
}

// ─────────────────────────────────────────────────────────────────────
// Deontic examples — hand-authored. Each ships a small serial Kripke
// model and pairs the formula with its deontic gloss in the note.
// Designation = the actual world; accessible worlds represent
// deontically-ideal alternatives.

function DEONTIC_EXAMPLES(): LogicExample[] {
  return [
    {
      slug: 'd-axiom',
      natural: 'D axiom — Op → Pp (obligation implies permission)',
      dsl: '[]p -> <>p',
      frameClass: 'D',
      model: {
        worlds: [
          { id: 'w0', atoms: [] },
          { id: 'w1', atoms: ['p'] },
        ],
        edges: [
          { from: 'w0', to: 'w1' },
          { from: 'w1', to: 'w1' },
        ],
        designated: 'w0',
      },
      satisfied: true,
      note: 'Seriality at w0 (it has the alternative w1) ensures Op → Pp at w0. The defining picture of standard deontic logic — obligations come with at least one permitted realisation.',
    },
    {
      slug: 'd-fails-on-non-serial',
      natural: 'D fails on a non-serial frame — Op → Pp at a dead-end world',
      dsl: '[]p -> <>p',
      frameClass: 'K',
      model: {
        worlds: [
          { id: 'w0', atoms: [] },
        ],
        edges: [],
        designated: 'w0',
      },
      satisfied: false,
      note: 'Without seriality, Op is vacuously true at w0 (no successors to falsify p) but Pp is vacuously false (no successors to witness p). The D axiom fails — the canonical motivating reason deontic logic insists on seriality.',
    },
    {
      slug: 'forbidden-not-permitted',
      natural: 'Fp ≡ ¬Pp ≡ O¬p — three glosses on prohibition',
      dsl: '!<>p <-> []!p',
      frameClass: 'D',
      model: {
        worlds: [
          { id: 'w0', atoms: [] },
          { id: 'w1', atoms: [] },
        ],
        edges: [
          { from: 'w0', to: 'w1' },
          { from: 'w1', to: 'w1' },
        ],
        designated: 'w0',
      },
      satisfied: true,
      note: 'Validates the standard duality: forbidding p is the same as obliging not-p. Holds in every Kripke model — the K logic alone is enough; seriality isn’t needed for this fragment.',
    },
    {
      slug: 'k-conjunction-in-d',
      natural: 'Aggregation — Op ∧ Oq → O(p ∧ q)',
      dsl: '([]p & []q) -> [](p & q)',
      frameClass: 'D',
      model: {
        worlds: [
          { id: 'w0', atoms: [] },
          { id: 'w1', atoms: ['p', 'q'] },
        ],
        edges: [
          { from: 'w0', to: 'w1' },
          { from: 'w1', to: 'w1' },
        ],
        designated: 'w0',
      },
      satisfied: true,
      note: 'Two separate obligations imply the joint obligation. Sometimes flagged as too strong (Williams’s puzzle of joint impossibility) — modern deontic logics often weaken this.',
    },
    {
      slug: 'ross-paradox',
      natural: 'Ross’s paradox — Op → O(p ∨ q)',
      dsl: '[]p -> [](p | q)',
      frameClass: 'D',
      model: {
        worlds: [
          { id: 'w0', atoms: [] },
          { id: 'w1', atoms: ['p'] },
        ],
        edges: [
          { from: 'w0', to: 'w1' },
          { from: 'w1', to: 'w1' },
        ],
        designated: 'w0',
      },
      satisfied: true,
      note: 'Formally valid in KD: if you’re obliged to mail the letter (Op), you’re obliged that you-mail-it-or-burn-it (O(p ∨ q)). Ross (1944) pointed this out as counterintuitive evidence that O does not behave like ordinary necessity for natural-language ought.',
    },
    {
      slug: 'free-choice-fails',
      natural: 'Free-choice permission — P(p ∨ q) → (Pp ∧ Pq) (fails)',
      dsl: '<>(p | q) -> (<>p & <>q)',
      frameClass: 'D',
      model: {
        worlds: [
          { id: 'w0', atoms: [] },
          { id: 'w1', atoms: ['p'] },
        ],
        edges: [
          { from: 'w0', to: 'w1' },
          { from: 'w1', to: 'w1' },
        ],
        designated: 'w0',
      },
      satisfied: false,
      note: 'Counterexample for free-choice permission: w1 witnesses (p ∨ q) by virtue of p, so P(p ∨ q) holds at w0; but no successor witnesses q, so Pq fails. The natural-language reading "you may have tea or coffee" suggests both are permitted; KD doesn’t deliver that and a richer logic is needed.',
    },
    {
      slug: 'chisholm-fragment',
      natural: 'Conditional fragment — O(p → q) → (Op → Oq) (the K-axiom in deontic guise)',
      dsl: '[](p -> q) -> ([]p -> []q)',
      frameClass: 'D',
      model: {
        worlds: [
          { id: 'w0', atoms: [] },
          { id: 'w1', atoms: ['p', 'q'] },
        ],
        edges: [
          { from: 'w0', to: 'w1' },
          { from: 'w1', to: 'w1' },
        ],
        designated: 'w0',
      },
      satisfied: true,
      note: 'The K-axiom is exactly the principle Chisholm’s 1963 contrary-to-duty puzzle stresses: a conditional obligation O(p → q) plus the obligation Op forces the obligation Oq, even when in fact ¬p holds. Whether that is the right logic for ought-given-that is the open question that motivates dyadic deontic logics.',
    },
  ];
}

// ─────────────────────────────────────────────────────────────────────
// Intuitionistic examples — hand-authored. Each pairs a formula with a
// pre-order Kripke model whose valuation is monotone (atoms persist
// upward along R). The classical-only examples ship the canonical
// 2-world / 3-world counter-frames; the intuitionistically-valid ones
// ship a single-world model where the verdict is uncontroversial.
//
// Convention: w0 is the designated world; reflexive self-edges are
// included so the frame-shape verdict is green by default.

function INTUITIONISTIC_EXAMPLES(): LogicExample[] {
  return [
    {
      slug: 'identity',
      natural: 'Identity — p → p',
      dsl: 'p -> p',
      model: {
        worlds: [{ id: 'w0', atoms: [] }],
        edges: [{ from: 'w0', to: 'w0' }],
        designated: 'w0',
      },
      satisfied: true,
      note: 'Trivially intuitionistically valid at every world of every pre-order frame. The simplest sanity check.',
    },
    {
      slug: 'modus-ponens',
      natural: 'Modus ponens — (p ∧ (p → q)) → q',
      dsl: '(p & (p -> q)) -> q',
      model: {
        worlds: [{ id: 'w0', atoms: ['p', 'q'] }],
        edges: [{ from: 'w0', to: 'w0' }],
        designated: 'w0',
      },
      satisfied: true,
      note: 'Sound in every Kripke pre-order: if p ⊩ w and (p → q) ⊩ w, then in particular at w itself the implication forces q.',
    },
    {
      slug: 'dni',
      natural: 'Double-negation introduction — p → ¬¬p (intuitionistic)',
      dsl: 'p -> !!p',
      model: {
        worlds: [
          { id: 'w0', atoms: [] },
          { id: 'w1', atoms: ['p'] },
        ],
        edges: [
          { from: 'w0', to: 'w0' },
          { from: 'w0', to: 'w1' },
          { from: 'w1', to: 'w1' },
        ],
        designated: 'w0',
      },
      satisfied: true,
      note: 'Intuitionistically valid (the *converse* of DNE): once p is forced at v, no future v′ ≥ v can force ¬p, because ¬p needs p to never appear.',
    },
    {
      slug: 'lem-fails',
      natural: 'Excluded middle — p ∨ ¬p (classical only; fails here)',
      dsl: 'p | !p',
      model: {
        worlds: [
          { id: 'w0', atoms: [] },
          { id: 'w1', atoms: ['p'] },
        ],
        edges: [
          { from: 'w0', to: 'w0' },
          { from: 'w0', to: 'w1' },
          { from: 'w1', to: 'w1' },
        ],
        designated: 'w0',
      },
      satisfied: false,
      note: 'At w0, p ⋮ (atom not yet established) and ¬p ⋮ (some accessible future — w1 — does establish p). So neither disjunct holds at w0; LEM fails. The canonical 2-world counter-frame.',
    },
    {
      slug: 'dne-fails',
      natural: 'Double-negation elimination — ¬¬p → p (classical only; fails here)',
      dsl: '!!p -> p',
      model: {
        worlds: [
          { id: 'w0', atoms: [] },
          { id: 'w1', atoms: ['p'] },
        ],
        edges: [
          { from: 'w0', to: 'w0' },
          { from: 'w0', to: 'w1' },
          { from: 'w1', to: 'w1' },
        ],
        designated: 'w0',
      },
      satisfied: false,
      note: 'At w0, ¬¬p ⊩ (every accessible future has *some* further future forcing p — namely w1) but p ⋮. The implication therefore fails. Same counter-frame as LEM; intuitionism’s asymmetry between the two halves of double-negation is on display.',
    },
    {
      slug: 'peirce-fails',
      natural: 'Peirce’s law — ((p → q) → p) → p (classical only; fails here)',
      dsl: '((p -> q) -> p) -> p',
      model: {
        worlds: [
          { id: 'w0', atoms: [] },
          { id: 'w1', atoms: ['p'] },
        ],
        edges: [
          { from: 'w0', to: 'w0' },
          { from: 'w0', to: 'w1' },
          { from: 'w1', to: 'w1' },
        ],
        designated: 'w0',
      },
      satisfied: false,
      note: 'At w0: (p → q) ⋮ at w0 and at w1 (since p ⊩ w1, q ⋮ w1), so (p → q) → p ⊩ w0 vacuously. But p ⋮ w0, so Peirce ⊮ w0. A *purely implicational* classical tautology that the constructive reading rejects.',
    },
    {
      slug: 'wlem-fails',
      natural: 'Weak excluded middle — ¬p ∨ ¬¬p (classical only; fails here)',
      dsl: '!p | !!p',
      model: {
        worlds: [
          { id: 'w0', atoms: [] },
          { id: 'w1', atoms: ['p'] },
          { id: 'w2', atoms: [] },
        ],
        edges: [
          { from: 'w0', to: 'w0' },
          { from: 'w0', to: 'w1' },
          { from: 'w0', to: 'w2' },
          { from: 'w1', to: 'w1' },
          { from: 'w2', to: 'w2' },
        ],
        designated: 'w0',
      },
      satisfied: false,
      note: 'A 3-world fork: w0 sees w1 (with p) and w2 (without p). At w0, ¬p ⋮ (w1 forces p) and ¬¬p ⋮ (w2 has no successor forcing p, so ¬p ⊩ w2 — that is, some future of w0 forces ¬p). Both disjuncts fail.',
    },
    {
      slug: 'demorgan-classical-only',
      natural: 'De Morgan, classical half — ¬(p ∧ q) → (¬p ∨ ¬q) (fails here)',
      dsl: '!(p & q) -> (!p | !q)',
      model: {
        worlds: [
          { id: 'w0', atoms: [] },
          { id: 'w1', atoms: ['p'] },
          { id: 'w2', atoms: ['q'] },
        ],
        edges: [
          { from: 'w0', to: 'w0' },
          { from: 'w0', to: 'w1' },
          { from: 'w0', to: 'w2' },
          { from: 'w1', to: 'w1' },
          { from: 'w2', to: 'w2' },
        ],
        designated: 'w0',
      },
      satisfied: false,
      note: 'At w0, ¬(p ∧ q) ⊩ (no world forces both atoms) but ¬p ∨ ¬q ⋮ — neither disjunct holds, since w1 is a future where p is forced and w2 a future where q is forced. The constructive direction (¬p ∨ ¬q → ¬(p ∧ q)) is intuitionistically valid; this one is not.',
    },
    {
      slug: 'demorgan-intuitionistic',
      natural: 'De Morgan, intuitionistic half — (¬p ∨ ¬q) → ¬(p ∧ q) (valid)',
      dsl: '(!p | !q) -> !(p & q)',
      model: {
        worlds: [
          { id: 'w0', atoms: [] },
          { id: 'w1', atoms: ['p'] },
          { id: 'w2', atoms: ['q'] },
        ],
        edges: [
          { from: 'w0', to: 'w0' },
          { from: 'w0', to: 'w1' },
          { from: 'w0', to: 'w2' },
          { from: 'w1', to: 'w1' },
          { from: 'w2', to: 'w2' },
        ],
        designated: 'w0',
      },
      satisfied: true,
      note: 'Same fork as the classical-only example. Each disjunct on the antecedent gives a constructive witness against the conjunction; the implication is intuitionistically valid even when its converse isn’t.',
    },
  ];
}