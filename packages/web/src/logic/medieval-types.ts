// Medieval Syllogistic AST.
//
// Phase 1 (FEAT-010): modal syllogistic with `□` (necessity) and `◇`
// (possibility) operators, two scope readings (de re / de dicto), plus
// multi-premise sorites chains. Reuses the Aristotelian
// `CategoricalProposition` so the assertoric grain remains identical.
// See docs/formal-logic/medieval-syllogistic.md.

import type {
  CategoricalProposition,
  Figure,
  Mood,
} from './aristotelian-types';

// ---------- Modal mode ----------

// Buridan's three-mode notation:
//   X = assertoric (no modal annotation) — "Omnis S est P"
//   L = necessary  — "Necessario omnis S est P" (Latin necesse → L)
//   M = possible   — "Possibiliter omnis S est P" (Latin possibile → M)
export type ModalMode = 'X' | 'L' | 'M';

// Where the modal operator binds inside the proposition:
//   'de-re'    — operator binds the predicate ("All S is necessarily P")
//                = in sensu diviso
//   'de-dicto' — operator binds the proposition ("Necessarily, all S is P")
//                = in sensu composito
// Pure assertoric (mode === 'X') propositions parse with reading
// 'assertoric' so the validity engine can short-circuit to the
// Aristotelian table.
export type ModalReading = 'de-re' | 'de-dicto' | 'assertoric';

// ---------- Modal proposition ----------

export type ModalProposition = {
  // The underlying assertoric form A/E/I/O carries quantity and quality.
  base: CategoricalProposition;
  mode: ModalMode;
  reading: ModalReading;
};

// ---------- Modal syllogism ----------

// Three-letter modal mood, one letter per (major, minor, conclusion)
// drawn from {X, L, M}. The Aristotelian mood letters (A/E/I/O) are
// stored separately on each premise via its `base.form`.
export type ModalMood = `${ModalMode}${ModalMode}${ModalMode}`;

export type ModalSyllogism = {
  major: ModalProposition;
  minor: ModalProposition;
  conclusion: ModalProposition;
  middle: string;
  // The underlying assertoric mood (e.g. 'AAA') from the three premises'
  // `base.form` letters. Validity is keyed on (modalMood, figure,
  // reading, assertoricMood).
  assertoricMood: Mood;
  modalMood: ModalMood;
  figure: Figure;
  // The page-level reading toggle is the *default* for parsing, but a
  // syllogism's effective reading is the (non-trivial) reading shared
  // by its modally-annotated premises. If all three premises are
  // assertoric, reading is 'assertoric' (the validity engine
  // short-circuits to checkSyllogism). If premises mix de re and de
  // dicto annotations, the parser flags it as a mixed-reading error.
  reading: ModalReading;
};

// ---------- Sorites ----------

// An N-premise term-logic chain with a single conclusion.
// Phase 1: assertoric only. Modal sorites is deferred.
export type SoritesShape = 'aristotelian' | 'goclenian';

export type SoritesChain = {
  premises: CategoricalProposition[];   // length >= 3
  conclusion: CategoricalProposition;
  shape: SoritesShape;
};

// ---------- Top-level wrapper ----------

export type MedievalFormula =
  | { kind: 'modal-proposition'; proposition: ModalProposition }
  | { kind: 'modal-syllogism';   syllogism:   ModalSyllogism }
  | { kind: 'sorites';           chain:       SoritesChain };

// ---------- Helpers ----------

export function isAssertoric(p: ModalProposition): boolean {
  return p.mode === 'X';
}

export function modeLabel(m: ModalMode): string {
  return m === 'L' ? 'necessity' : m === 'M' ? 'possibility' : 'assertoric';
}

export function modeGlyph(m: ModalMode): string {
  return m === 'L' ? '□' : m === 'M' ? '◇' : '';
}

export function readingLabel(r: ModalReading): string {
  return r === 'de-re'
    ? 'de re (in sensu diviso)'
    : r === 'de-dicto'
      ? 'de dicto (in sensu composito)'
      : 'assertoric';
}
