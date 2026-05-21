// Jain saptabhaṅgī / syādvāda AST.
//
// Phase 1: a predication classified into one of the seven *bhaṅgas* —
// the seven non-empty subsets of the three basic modes of predication.
// `avaktavya` is treated as a third primitive mode (the Ganeri-style
// reconstruction), so the value space is exactly 2^3 − 1 = 7.
//
// See docs/formal-logic/saptabhangi.md.

// ---------- Basic modes ----------

//   asti       — "is": the predicate holds (in some respect)
//   nasti      — "is not": the predicate fails (in some respect)
//   avaktavya  — "inexpressible": the predicate jointly holds-and-fails
//                in the same respect, which cannot be asserted
export type BasicMode = 'asti' | 'nasti' | 'avaktavya';

// Canonical order for the three modes — drives subset comparison and
// the order modes are rendered in.
export const BASIC_MODES: readonly BasicMode[] = ['asti', 'nasti', 'avaktavya'];

export type BasicModeInfo = {
  mode: BasicMode;
  iast: string;        // IAST spelling of the Sanskrit term
  gloss: string;       // short reading
};

export const BASIC_MODE_INFO: Record<BasicMode, BasicModeInfo> = {
  asti: {
    mode: 'asti',
    iast: 'asti',
    gloss: 'is — the predicate holds, in some respect',
  },
  nasti: {
    mode: 'nasti',
    iast: 'nāsti',
    gloss: 'is not — the predicate fails, in some respect',
  },
  avaktavya: {
    mode: 'avaktavya',
    iast: 'avaktavya',
    gloss: 'inexpressible — the predicate jointly holds-and-fails in the same respect',
  },
};

// ---------- The seven bhaṅgas ----------

export type BhangaNumber = 1 | 2 | 3 | 4 | 5 | 6 | 7;

export type Bhanga = {
  n: BhangaNumber;
  modes: BasicMode[];    // the non-empty subset, in BASIC_MODES order
  sanskrit: string;      // the *syāt*-prefixed name
  gloss: string;
};

// The closed structure of the system: the seven non-empty subsets of
// {asti, nāsti, avaktavya}, in the traditional Jain ordering — the
// three singletons and the {asti,nāsti} pair first, then the
// avaktavya-bearing combinations.
export const SEVEN_BHANGAS: Bhanga[] = [
  { n: 1, modes: ['asti'], sanskrit: 'syād asti', gloss: 'in some respect, is' },
  { n: 2, modes: ['nasti'], sanskrit: 'syād nāsti', gloss: 'in some respect, is not' },
  {
    n: 3,
    modes: ['asti', 'nasti'],
    sanskrit: 'syād asti nāsti',
    gloss: 'is (in one respect), is not (in another)',
  },
  { n: 4, modes: ['avaktavya'], sanskrit: 'syād avaktavya', gloss: 'in some respect, inexpressible' },
  {
    n: 5,
    modes: ['asti', 'avaktavya'],
    sanskrit: 'syād asti avaktavya',
    gloss: 'is; and, in some respect, inexpressible',
  },
  {
    n: 6,
    modes: ['nasti', 'avaktavya'],
    sanskrit: 'syād nāsti avaktavya',
    gloss: 'is not; and, in some respect, inexpressible',
  },
  {
    n: 7,
    modes: ['asti', 'nasti', 'avaktavya'],
    sanskrit: 'syād asti nāsti avaktavya',
    gloss: 'is; is not; and, in some respect, inexpressible',
  },
];

// ---------- Predication ----------

export type Standpoint = {
  name: string;          // an opaque label (a *naya*) — free text
  mode: BasicMode;
};

export type Predication = {
  subject: string;
  predicate: string;
  standpoints: Standpoint[];   // always non-empty — the parser enforces it
};

// ---------- Helpers ----------

// A stable key for a set of modes — the modes in BASIC_MODES order,
// joined. Two subsets are equal iff their keys are.
export function modeSetKey(modes: readonly BasicMode[]): string {
  return BASIC_MODES.filter(m => modes.includes(m)).join('+');
}

// Canonical round-trippable DSL form, matching the parser's grammar.
export function formatPredication(p: Predication): string {
  const lines = [`subject:   ${p.subject}`, `predicate: ${p.predicate}`];
  for (const s of p.standpoints) {
    lines.push(`standpoint ${s.name} : ${s.mode}`);
  }
  return lines.join('\n');
}
