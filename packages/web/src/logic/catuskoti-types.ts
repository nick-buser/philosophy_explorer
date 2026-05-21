// Catuṣkoṭi — Nāgārjuna's tetralemma AST.
//
// Phase 1: a proposition placed at one of the four *koṭis* — the four
// "corners" — under one of two readings. The koṭis are the four
// subsets of the two classical truth values {true, false}, i.e. the
// four values of First Degree Entailment (FDE): true only, false
// only, both (a glut), neither (a gap).
//
// See docs/formal-logic/catuskoti.md.

// ---------- Truth values ----------

// The two classical truth values. An FDE value is a *subset* of these:
// {true} / {false} / {true,false} / {} — see `Koti.values` below.
export type TruthValue = 'true' | 'false';

export const TRUTH_VALUES: readonly TruthValue[] = ['true', 'false'];

// ---------- The four koṭis ----------

export type KotiNumber = 1 | 2 | 3 | 4;

export type Koti = {
  n: KotiNumber;
  // The FDE value — the subset of {true,false} this corner is. The
  // koṭi a proposition occupies *is* its FDE value.
  values: TruthValue[];
  sanskrit: string;     // the Sanskrit phrasing of the corner
  formula: string;      // the modern formula, over the proposition A
  gloss: string;        // short English reading
};

// The closed structure of the system: the four corners, in the
// traditional tetralemma order — affirmation, negation, both, neither.
// The value sets are the four subsets of {true,false}: one singleton
// each for 1 and 2, the pair for 3, the empty set for 4.
export const FOUR_KOTIS: Koti[] = [
  {
    n: 1,
    values: ['true'],
    sanskrit: 'asti',
    formula: 'A',
    gloss: 'it is — the proposition holds',
  },
  {
    n: 2,
    values: ['false'],
    sanskrit: 'nāsti',
    formula: '¬A',
    gloss: 'it is not — the proposition fails',
  },
  {
    n: 3,
    values: ['true', 'false'],
    sanskrit: 'asti ca nāsti ca',
    formula: 'A ∧ ¬A',
    gloss: 'it both is and is not — a glut',
  },
  {
    n: 4,
    values: [],
    sanskrit: 'naivāsti na nāsti',
    formula: '¬(A ∨ ¬A)',
    gloss: 'it neither is nor is not — a gap',
  },
];

// ---------- Reading ----------

//   affirming — the positive catuṣkoṭi: one corner is asserted of the
//               proposition (the classificatory use, MMK 18.8).
//   prasanga  — the Madhyamaka refutation: all four corners are
//               denied (the treatment of the *avyākṛta*).
export type Reading = 'affirming' | 'prasanga';

export type ReadingInfo = {
  reading: Reading;
  label: string;
  gloss: string;
};

export const READING_INFO: Record<Reading, ReadingInfo> = {
  affirming: {
    reading: 'affirming',
    label: 'Affirming',
    gloss: 'the positive catuṣkoṭi — one corner is asserted of the proposition',
  },
  prasanga: {
    reading: 'prasanga',
    label: 'Prasaṅga',
    gloss: 'the Madhyamaka refutation — all four corners are denied',
  },
};

// ---------- Proposition ----------

export type Proposition = {
  text: string;
  koti: KotiNumber;        // the corner under consideration
  reading: Reading;
};

// ---------- Helpers ----------

// A stable key for an FDE value — the truth values in TRUTH_VALUES
// order, joined. The empty value keys to the empty string.
export function valueKey(values: readonly TruthValue[]): string {
  return TRUTH_VALUES.filter(v => values.includes(v)).join('+');
}

export function kotiByNumber(n: KotiNumber): Koti {
  const k = FOUR_KOTIS.find(x => x.n === n);
  if (!k) throw new Error(`no koṭi numbered ${n}`);
  return k;
}

// Canonical round-trippable DSL form, matching the parser's grammar.
export function formatProposition(p: Proposition): string {
  const koti = kotiByNumber(p.koti);
  const cornerWord = CORNER_WORD[p.koti];
  return [
    `proposition: ${p.text}`,
    `koti:        ${cornerWord}`,
    `reading:     ${p.reading}`,
  ].join('\n') + `\n-- koṭi ${koti.n}: ${koti.sanskrit} (${koti.formula})`;
}

// The canonical DSL word for each koṭi number.
export const CORNER_WORD: Record<KotiNumber, string> = {
  1: 'affirmation',
  2: 'negation',
  3: 'both',
  4: 'neither',
};
