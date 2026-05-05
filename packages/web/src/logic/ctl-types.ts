// Computation Tree Logic (CTL) — types.
//
// Branching-time logic: paths are *trees of futures* through a Kripke
// structure. Eight paired path-quantifier-plus-temporal operators:
//
//   AX φ        for every next state, φ
//   EX φ        for some next state, φ
//   AF φ        on every path, eventually φ
//   EF φ        on some path, eventually φ
//   AG φ        on every path, always φ
//   EG φ        on some path, always φ
//   A[φ U ψ]    on every path, φ until ψ
//   E[φ U ψ]    on some path, φ until ψ
//
// CTL frames are Kripke structures with a *serial* relation
// (every state has at least one successor). We reuse `KripkeModel`
// directly — a serial-frame check is part of the lab's diagnostics.

import type { KripkeModel } from './kripke-types';

export type CtlFormula =
  | { kind: 'atom';    name: string }
  | { kind: 'not';     body: CtlFormula }
  | { kind: 'and';     left: CtlFormula; right: CtlFormula }
  | { kind: 'or';      left: CtlFormula; right: CtlFormula }
  | { kind: 'implies'; left: CtlFormula; right: CtlFormula }
  | { kind: 'iff';     left: CtlFormula; right: CtlFormula }
  | { kind: 'AX';      body: CtlFormula }
  | { kind: 'EX';      body: CtlFormula }
  | { kind: 'AF';      body: CtlFormula }
  | { kind: 'EF';      body: CtlFormula }
  | { kind: 'AG';      body: CtlFormula }
  | { kind: 'EG';      body: CtlFormula }
  | { kind: 'AU';      left: CtlFormula; right: CtlFormula }
  | { kind: 'EU';      left: CtlFormula; right: CtlFormula };

export { type KripkeModel };
