// Mohist disputation — móu (parallel inference) AST.
//
// Phase 1: a *móu* argument. An accepted base pair "X is Y" (the 是,
// shì — "this"), an operator applied uniformly to both terms, and a
// declared outcome — one of the four categories the *Xiao Qu* 小取
// enumerates for how a structurally-parallel sentence-pair behaves.
//
// The engine form-checks the schema and cross-checks the declared
// outcome; it never *infers* the outcome — which category a parallel
// falls into is not mechanically decidable.
//
// See docs/formal-logic/mohist.md.

// ---------- The four Xiao Qu outcomes ----------

export type CategoryId =
  | 'shi-er-ran'
  | 'shi-er-bu-ran'
  | 'yi-zhou-yi-bu-zhou'
  | 'yi-shi-yi-fei';

// The failure mode a non-transferring category corresponds to.
//   opacity — the operator reads its object under a description (an
//             intensional / referentially-opaque context).
//   scope   — the predicate scopes over all on one side, some on the
//             other.
//   sortal  — the operator preserves kind for one term, not the other.
export type MouFlag = 'opacity' | 'scope' | 'sortal';

export type MouCategory = {
  id: CategoryId;
  n: 1 | 2 | 3 | 4;
  chinese: string;            // 是而然
  pinyin: string;             // shì ér rán
  english: string;            // this, and so
  transfers: boolean;         // true only for shi-er-ran
  flag: MouFlag | null;       // the failure flag — null for shi-er-ran
  gloss: string;
  canonicalExample: string;   // a stock Xiao Qu case
};

// The closed structure of the system: the four categories of the
// *Xiao Qu*, in textual order. Exactly one transfers; the other three
// are in bijection with the three failure flags.
export const FOUR_CATEGORIES: MouCategory[] = [
  {
    id: 'shi-er-ran',
    n: 1,
    chinese: '是而然',
    pinyin: 'shì ér rán',
    english: 'this, and so',
    transfers: true,
    flag: null,
    gloss: 'parallel wording, parallel truth — the inference carries; móu is licensed',
    canonicalExample:
      '白馬，馬也；乘白馬，乘馬也 — a white horse is a horse; riding a white horse is riding a horse',
  },
  {
    id: 'shi-er-bu-ran',
    n: 2,
    chinese: '是而不然',
    pinyin: 'shì ér bù rán',
    english: 'this, but not so',
    transfers: false,
    flag: 'opacity',
    gloss:
      'identical wording, yet the parallel fails — the operator reads its object under a description',
    canonicalExample:
      '其弟，美人也；愛弟，非愛美人也 — her brother is a handsome man; but loving one’s brother is not loving a handsome man',
  },
  {
    id: 'yi-zhou-yi-bu-zhou',
    n: 3,
    chinese: '一周而一不周',
    pinyin: 'yī zhōu ér yī bù zhōu',
    english: 'one comprehensive, one not',
    transfers: false,
    flag: 'scope',
    gloss:
      'the predicate scopes over all (周, comprehensive) on one side and over some on the other',
    canonicalExample:
      '乘馬 needs but one horse; 不乘馬 needs every horse refused',
  },
  {
    id: 'yi-shi-yi-fei',
    n: 4,
    chinese: '一是而一非',
    pinyin: 'yī shì ér yī fēi',
    english: 'one so, one not',
    transfers: false,
    flag: 'sortal',
    gloss: 'the operator preserves kind for one term but not the other',
    canonicalExample:
      '兄之鬼，兄也；人之鬼，非人也 — a brother’s ghost is a brother; a person’s ghost is not a person',
  },
];

// ---------- Flag ↔ outcome ----------

// The outcome a flag implies. A móu argument with no named failure
// mode is *shì ér rán*; each flag names exactly one failure category.
export const FLAG_OUTCOME: Record<MouFlag, CategoryId> = {
  opacity: 'shi-er-bu-ran',
  scope: 'yi-zhou-yi-bu-zhou',
  sortal: 'yi-shi-yi-fei',
};

// The outcome implied by a flag (or its absence).
export function outcomeForFlag(flag: MouFlag | null): CategoryId {
  return flag === null ? 'shi-er-ran' : FLAG_OUTCOME[flag];
}

// ---------- Argument ----------

export type BasePair = {
  subject: string;
  predicate: string;
};

export type MouArgument = {
  // The accepted base pair — "subject is predicate" is granted (是).
  base: BasePair;
  // The operation applied uniformly to both base terms.
  operator: string;
  // The declared Xiao Qu outcome. Declared, never inferred.
  outcome: CategoryId;
  // The declared failure mode, if any.
  flag: MouFlag | null;
  // Optional authoring commentary.
  gloss: string | null;
};

// ---------- Helpers ----------

export function categoryById(id: CategoryId): MouCategory {
  const c = FOUR_CATEGORIES.find(x => x.id === id);
  if (!c) throw new Error(`no Xiao Qu category '${id}'`);
  return c;
}

// The canonical DSL word for each category.
export const CATEGORY_WORD: Record<CategoryId, string> = {
  'shi-er-ran': 'shi-er-ran',
  'shi-er-bu-ran': 'shi-er-bu-ran',
  'yi-zhou-yi-bu-zhou': 'yi-zhou-yi-bu-zhou',
  'yi-shi-yi-fei': 'yi-shi-yi-fei',
};

// Apply the operator to a base term — the parallel-pair construction.
// A plain prefix join: "ride" + "a white horse" → "ride a white horse".
export function applyOperator(operator: string, term: string): string {
  return `${operator.trim()} ${term.trim()}`.trim();
}

// Canonical round-trippable DSL form, matching the parser's grammar.
export function formatArgument(a: MouArgument): string {
  const lines = [
    `base:     ${a.base.subject} | ${a.base.predicate}`,
    `operator: ${a.operator}`,
    `outcome:  ${CATEGORY_WORD[a.outcome]}`,
  ];
  if (a.flag !== null) lines.push(`flag:     ${a.flag}`);
  if (a.gloss !== null) lines.push(`gloss:    ${a.gloss}`);
  return lines.join('\n');
}
