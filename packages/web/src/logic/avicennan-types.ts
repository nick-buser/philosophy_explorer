// Avicennan modal-temporal syllogistic AST.
//
// Phase 1: a categorical proposition that carries an alethic-temporal
// modality on top of the Aristotelian quantity × quality grid, and the
// three-proposition modal syllogism decided by table lookup against the
// Hodges/Street reconstruction of Avicenna's *Qiyās*.
//
// See docs/formal-logic/avicennan.md.

// ---------- Proposition ----------

export type Quantity = 'universal' | 'particular';
export type Quality  = 'affirmative' | 'negative';

// The four phase-1 modalities — the most-used Avicennan modalized
// propositions. The two-dimensional (subject-side / copula-side) Hodges
// refinement is phase 2; phase 1 ships a single enumerated token.
//
//   necessary  (ḍarūrī)        — necessarily B, while A exists
//   perpetual  (dāʾima)        — always B, while A exists
//   absolute   (muṭlaqa ʿāmma) — B at some time, while A exists
//   possible   (mumkina)       — possibly B (two-sided possibility)
export type Modality = 'necessary' | 'perpetual' | 'absolute' | 'possible';

export const MODALITIES: readonly Modality[] = [
  'necessary',
  'perpetual',
  'absolute',
  'possible',
];

export type Proposition = {
  quantity: Quantity;
  quality: Quality;
  modality: Modality;
  subject: string;
  predicate: string;
};

// ---------- Syllogism ----------

export type Figure = 1 | 2 | 3 | 4;

export type Syllogism = {
  major: Proposition;        // contains the predicate (major term) of the conclusion
  minor: Proposition;        // contains the subject  (minor term) of the conclusion
  conclusion: Proposition;
  middle: string;            // the shared term — derived, not user-supplied
  figure: Figure;            // derived from term arrangement
};

// ---------- Top-level wrapper ----------

export type AvicennanFormula =
  | { kind: 'proposition'; proposition: Proposition }
  | { kind: 'syllogism';   syllogism:   Syllogism };

// ---------- Verdict ----------

// `invalid` covers an unproductive mood OR a productive mood whose
// stated conclusion modality is stronger than what actually follows.
export type SyllogismVerdict =
  | { kind: 'valid';   inheritedModality: Modality }
  | { kind: 'invalid'; reason: string };

// ---------- Helpers ----------

// AEIO letter for the quantity × quality grid — the bridge to the
// reused `AristotelianSquare` (its corners are keyed A/E/I/O).
export type PropLetter = 'A' | 'E' | 'I' | 'O';

export function letterOf(p: Proposition): PropLetter {
  if (p.quantity === 'universal') {
    return p.quality === 'affirmative' ? 'A' : 'E';
  }
  return p.quality === 'affirmative' ? 'I' : 'O';
}
