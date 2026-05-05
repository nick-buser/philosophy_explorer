// Multi-agent epistemic logic — types.
//
// Extends the modal idea with an *agent index* on the box / diamond.
// K_a φ = "agent a knows that φ"; M_a φ = "agent a considers φ
// possible" = ¬K_a ¬φ. The accessibility relation R is replaced by a
// relation R_a per declared agent. Worlds reuse the Kripke `World`
// shape — atom valuations don't depend on the agent.
//
// This module is deliberately minimal: single common-knowledge /
// distributed-knowledge operators are *not* in the AST yet. The
// substrate is in place to add them (least-fixed-point eval over the
// union of relations) when content demands it.

import type { World, WorldId } from './kripke-types';

export type AgentId = string;

export type EpistemicFormula =
  | { kind: 'atom';     name: string }
  | { kind: 'not';      body: EpistemicFormula }
  | { kind: 'know';     agent: AgentId; body: EpistemicFormula }   // K_a
  | { kind: 'consider'; agent: AgentId; body: EpistemicFormula }   // M_a (dual)
  | { kind: 'and';      left: EpistemicFormula; right: EpistemicFormula }
  | { kind: 'or';       left: EpistemicFormula; right: EpistemicFormula }
  | { kind: 'implies';  left: EpistemicFormula; right: EpistemicFormula }
  | { kind: 'iff';      left: EpistemicFormula; right: EpistemicFormula };

export type EpistemicEdge = {
  from: WorldId;
  to: WorldId;
  agent: AgentId;
};

export type EpistemicModel = {
  worlds: World[];
  edges: EpistemicEdge[];
  // Declared agents drive the per-agent palette and the axiom panel.
  // Edges referencing un-declared agents are silently ignored at eval
  // time; the system-data tests catch those at seed-load.
  agents: AgentId[];
  designated?: WorldId;
};

export { type World, type WorldId };
