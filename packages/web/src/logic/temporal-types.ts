// Linear Temporal Logic (LTL) — types.
//
// LTL extends propositional logic with future-time operators that
// quantify over a single trace of states:
//   X φ   — at the next state, φ
//   F φ   — at some future state, φ ("eventually")
//   G φ   — at every future state, φ ("always")
//   φ U ψ — φ holds until ψ does, and ψ does eventually
//
// LTL semantics are defined on infinite traces; we represent infinite
// traces *finitely* as a *lasso*: a finite list of states with a
// `loopBack` index that says where the trace cycles to after the
// last state. Pure-linear traces are represented by setting loopBack
// to the last index (the last state self-loops), which is the
// standard "stutter" treatment.

export type StateId = string;

export type TemporalFormula =
  | { kind: 'atom';    name: string }
  | { kind: 'not';     body: TemporalFormula }
  | { kind: 'and';     left: TemporalFormula; right: TemporalFormula }
  | { kind: 'or';      left: TemporalFormula; right: TemporalFormula }
  | { kind: 'implies'; left: TemporalFormula; right: TemporalFormula }
  | { kind: 'iff';     left: TemporalFormula; right: TemporalFormula }
  | { kind: 'next';    body: TemporalFormula }                              // X
  | { kind: 'eventually'; body: TemporalFormula }                           // F
  | { kind: 'always';  body: TemporalFormula }                              // G
  | { kind: 'until';   left: TemporalFormula; right: TemporalFormula };     // U

export type TemporalState = {
  id: StateId;
  label?: string;
  atoms: string[];
};

export type Trace = {
  states: TemporalState[];
  // Index into `states` (0-based) where the trace cycles back to after
  // the last state. Must satisfy 0 ≤ loopBack < states.length.
  // For pure-linear "stuttering" traces, set loopBack = states.length - 1
  // so the last state self-loops.
  loopBack: number;
  // Designated starting position for the truth badge. Defaults to 0.
  start?: number;
};
