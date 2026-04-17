// Logic-systems seed data — client-side for phase 1. Will migrate to
// data/seed/logic-systems.json + F# API when a second system ships.
// See docs/formal-logic/logic-explorer-tab.md §Storage.

export type LogicSystemStatus = 'available' | 'stub';

export type LogicExample = {
  slug: string;
  natural: string;       // plain-English gloss
  dsl: string;           // short-form DSL
  note?: string;         // lossiness / commentary
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