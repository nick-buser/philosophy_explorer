// Aristotelian Syllogistic AST.
//
// Phase 1: the four categorical proposition forms (A/E/I/O) and the
// classical syllogism — major premise, minor premise, conclusion,
// joined by a shared middle term and decided as valid/invalid by the
// figure × mood lookup. See docs/formal-logic/aristotelian-syllogistic.md.
//
// Two top-level shapes share a single AST so the renderer can switch
// between a 2-circle Venn (single proposition) and a 3-circle Venn
// (syllogism) from the same parsed value.

// ---------- Categorical proposition ----------

export type PropForm = 'A' | 'E' | 'I' | 'O';

// A proposition's two AEIO axes: A and E are universal (quantity),
// A and I are affirmative (quality). The matrix is encoded directly
// in `PropForm` to avoid a dependent join at the call site.
export type Quantity = 'universal' | 'particular';
export type Quality  = 'affirmative' | 'negative';

export type CategoricalProposition = {
  form: PropForm;
  subject: string;
  predicate: string;
};

// ---------- Syllogism ----------

// Three-letter mood: premise1, premise2, conclusion. The string carries
// the natural Aristotelian order — major mood letter first, minor
// second, conclusion last. The validity table is keyed on `mood-figure`
// so a 3-letter string + Figure number is enough.
export type Mood = `${PropForm}${PropForm}${PropForm}`;
export type Figure = 1 | 2 | 3 | 4;

export type Syllogism = {
  major: CategoricalProposition;       // contains the predicate (major term) of the conclusion
  minor: CategoricalProposition;       // contains the subject  (minor term) of the conclusion
  conclusion: CategoricalProposition;
  middle: string;                      // the shared term — derived, not user-supplied
  mood: Mood;
  figure: Figure;
};

// ---------- Top-level wrapper ----------

export type AristotelianFormula =
  | { kind: 'proposition'; proposition: CategoricalProposition }
  | { kind: 'syllogism';   syllogism:   Syllogism };

// ---------- Helpers ----------

export function quantityOf(f: PropForm): Quantity {
  return f === 'A' || f === 'E' ? 'universal' : 'particular';
}

export function qualityOf(f: PropForm): Quality {
  return f === 'A' || f === 'I' ? 'affirmative' : 'negative';
}

export function formFromParts(quantity: Quantity, quality: Quality): PropForm {
  if (quantity === 'universal' && quality === 'affirmative') return 'A';
  if (quantity === 'universal' && quality === 'negative')    return 'E';
  if (quantity === 'particular' && quality === 'affirmative') return 'I';
  return 'O';
}
