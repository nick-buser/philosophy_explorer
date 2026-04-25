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
    status: 'stub',
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
    status: 'stub',
    thinkerSlug: null,
    history: '',
    primitives: [],
    examples: [],
    readingPointers: [],
  },
  {
    slug: 'aristotelian',
    name: 'Aristotelian Syllogistic',
    shortDescription:
      'Term logic with four categorical forms (A/E/I/O) and fixed syllogism patterns (Barbara, Celarent, \u2026).',
    era: '~350 BCE \u2192',
    keyPrimitive: 'categorical proposition',
    status: 'stub',
    thinkerSlug: null,
    history: '',
    primitives: [],
    examples: [],
    readingPointers: [],
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