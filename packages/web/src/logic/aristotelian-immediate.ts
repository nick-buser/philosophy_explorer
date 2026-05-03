import type { CategoricalProposition, PropForm } from './aristotelian-types';

// Medieval "immediate inferences" — single-premise transformations of a
// categorical proposition. Each transformation returns the resulting
// proposition plus a validity tag:
//
//   simple        — always valid, regardless of existential import
//   per-accidens  — valid only under the traditional reading
//                   (existential import: "All S is P" presupposes
//                   that S is non-empty)
//   invalid       — never valid
//
// Reference table:
//
//   Conversion (swap S ↔ P, keep form):
//     A: invalid (per-accidens variant produces an I — see below)
//     E: simple
//     I: simple
//     O: invalid
//   Conversion per accidens (A → I, E → O on the swapped terms):
//     only A and E have per-accidens conversions. Both depend on import.
//
//   Obversion (swap quality, replace P with non-P):
//     A → E with predicate "non-P"   simple
//     E → A with predicate "non-P"   simple
//     I → O with predicate "non-P"   simple
//     O → I with predicate "non-P"   simple
//
//   Contraposition (replace S with non-P, P with non-S, keep form;
//   equivalent to obversion → conversion → obversion):
//     A: simple
//     E: per-accidens (the modern "contraposition by limitation")
//     I: invalid
//     O: simple
//
// Predicates produced by obversion / contraposition use a "non-X" prefix
// to mark complementation.  This is a notational convention — the parser
// does not understand "non-X" as a separate predicate, but the renderer
// shows it for pedagogical purposes only.
//
// See docs/formal-logic/aristotelian-syllogistic.md §Phase-2.

export type InferenceValidity = 'simple' | 'per-accidens' | 'invalid';

export type ImmediateInference = {
  kind: 'conversion' | 'conversion-per-accidens' | 'obversion' | 'contraposition';
  label: string;
  result: CategoricalProposition;
  validity: InferenceValidity;
  reason: string;
};

const NON_PREFIX = 'non-';

function complement(term: string): string {
  return term.startsWith(NON_PREFIX) ? term.slice(NON_PREFIX.length) : NON_PREFIX + term;
}

// ─────────────────────────────────────────────────────────────────────
// Conversion: swap subject and predicate, keep form.

export function convert(p: CategoricalProposition): ImmediateInference {
  const swapped: CategoricalProposition = {
    form: p.form,
    subject: p.predicate,
    predicate: p.subject,
  };
  const validity: InferenceValidity =
      p.form === 'E' || p.form === 'I' ? 'simple'
    : 'invalid';
  const reason =
      p.form === 'E' ? 'E converts simply: "No S is P" ⇔ "No P is S".'
    : p.form === 'I' ? 'I converts simply: "Some S is P" ⇔ "Some P is S".'
    : p.form === 'A' ? 'A does not convert simply — see conversion per accidens.'
    : 'O does not convert at all (no valid conversion).';
  return { kind: 'conversion', label: 'Conversion', result: swapped, validity, reason };
}

// Conversion per accidens: A → I and E → O on swapped terms.
// Defined for A and E only; invalid for I and O.
export function convertPerAccidens(p: CategoricalProposition): ImmediateInference | null {
  if (p.form !== 'A' && p.form !== 'E') return null;
  const newForm: PropForm = p.form === 'A' ? 'I' : 'O';
  const result: CategoricalProposition = {
    form: newForm,
    subject: p.predicate,
    predicate: p.subject,
  };
  const reason =
    p.form === 'A'
      ? '"All S is P" → "Some P is S" — valid only with existential import (assumes S exists).'
      : '"No S is P" → "Some P is not S" — valid only with existential import (assumes P exists).';
  return {
    kind: 'conversion-per-accidens',
    label: 'Conversion per accidens',
    result,
    validity: 'per-accidens',
    reason,
  };
}

// ─────────────────────────────────────────────────────────────────────
// Obversion: change quality, replace predicate with its complement.
//   A "All S is P"     → E "No S is non-P"
//   E "No S is P"      → A "All S is non-P"
//   I "Some S is P"    → O "Some S is not non-P"
//   O "Some S is not P"→ I "Some S is non-P"

export function obvert(p: CategoricalProposition): ImmediateInference {
  const flippedForm: PropForm =
      p.form === 'A' ? 'E'
    : p.form === 'E' ? 'A'
    : p.form === 'I' ? 'O'
    : 'I';
  const result: CategoricalProposition = {
    form: flippedForm,
    subject: p.subject,
    predicate: complement(p.predicate),
  };
  return {
    kind: 'obversion',
    label: 'Obversion',
    result,
    validity: 'simple',
    reason: 'Obversion is always valid: flip quality (affirmative ↔ negative) and complement the predicate.',
  };
}

// ─────────────────────────────────────────────────────────────────────
// Contraposition: replace S with non-P and P with non-S, keep form.
//   A "All S is P"     → "All non-P is non-S"   simple
//   E "No S is P"      → "No non-P is non-S"    per accidens (modern: by limitation)
//   I "Some S is P"    → "Some non-P is non-S"  invalid
//   O "Some S is not P"→ "Some non-P is not non-S" simple

export function contrapose(p: CategoricalProposition): ImmediateInference {
  const result: CategoricalProposition = {
    form: p.form,
    subject: complement(p.predicate),
    predicate: complement(p.subject),
  };
  const validity: InferenceValidity =
      p.form === 'A' || p.form === 'O' ? 'simple'
    : p.form === 'E' ? 'per-accidens'
    : 'invalid';
  const reason =
      p.form === 'A' ? 'A contraposes simply: "All S is P" ⇔ "All non-P is non-S".'
    : p.form === 'O' ? 'O contraposes simply: equivalent under double obversion + conversion.'
    : p.form === 'E' ? 'E contraposes only by limitation (per accidens) — needs existential import.'
    : 'I has no valid contrapositive.';
  return { kind: 'contraposition', label: 'Contraposition', result, validity, reason };
}

// ─────────────────────────────────────────────────────────────────────
// All immediate inferences for a single proposition. Returned in
// pedagogical order: conversion, conversion per accidens (when defined),
// obversion, contraposition.

export function allImmediateInferences(p: CategoricalProposition): ImmediateInference[] {
  const out: ImmediateInference[] = [convert(p)];
  const cpa = convertPerAccidens(p);
  if (cpa) out.push(cpa);
  out.push(obvert(p), contrapose(p));
  return out;
}

// ─────────────────────────────────────────────────────────────────────
// Pretty-print a categorical proposition in the long-form prose.
// (Used by the immediate-inferences UI to display results that contain
// "non-X" predicates the parser doesn't natively accept.)

export function formatProposition(p: CategoricalProposition): string {
  const head =
      p.form === 'A' ? `All ${p.subject} is ${p.predicate}`
    : p.form === 'E' ? `No ${p.subject} is ${p.predicate}`
    : p.form === 'I' ? `Some ${p.subject} is ${p.predicate}`
    : `Some ${p.subject} is not ${p.predicate}`;
  return head;
}
