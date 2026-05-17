// Wire types for the Argument API. Hand-mirrored from the F# DTOs in
// PhilosophyExplorer.Api/Domain/Dtos.fs — the F# side is canonical (same
// convention as the WorkDetail type in routes/works.$slug.tsx). The OpenAPI
// spec the codegen produces is currently shape-only for response bodies, so
// response types are written here by hand.
//
// The per-formalism `ast` payloads are exactly what scripts/build-arguments-seed.mjs
// emits — they re-use the existing Logic Lab AST types verbatim.

import type { FolFormula } from '../logic/fol-types';
import type { Argument as NdArgument, FitchProof } from '../logic/nd-types';
import type { AristotelianFormula } from '../logic/aristotelian-types';

export type ClauseRole = 'premise' | 'conclusion' | 'lemma' | 'claim' | 'composite';

export type ArgumentClause = {
  id: string;
  role: ClauseRole;
  position: number;
  verbalText: string | null;
  sourceExcerpt: string | null;
};

// ── Per-formalism AST payloads ────────────────────────────────────────────

export type FolAst = { formula: FolFormula };
export type NdAst = { argument: NdArgument; proof: FitchProof | null };
export type AristotelianAst = { formula: AristotelianFormula };

// dialogical has no Logic Lab AST yet — it's first-party in claim_extractor.
// Mirror its v1 shape here until/unless it gets a dialogical-types.ts.
export type DialogicalMove = {
  move_no: number;
  speaker: string;
  act: string;
  content: string;
  cites: number[];
};
export type DialogicalAst = {
  dialogue: {
    participants: string[];
    moves: DialogicalMove[];
    summary: string | null;
  };
};

type FormalizationBase = {
  id: string;
  isPrimary: boolean;
  fitScore: number | null;
  reason: string | null;
  distortionRisk: string | null;
};

export type Formalization =
  | (FormalizationBase & { formalism: 'fol'; ast: FolAst })
  | (FormalizationBase & { formalism: 'nd'; ast: NdAst })
  | (FormalizationBase & { formalism: 'aristotelian'; ast: AristotelianAst })
  | (FormalizationBase & { formalism: 'dialogical'; ast: DialogicalAst });

export type Formalism = Formalization['formalism'];

export type ArgumentAssessment = {
  formalism: string;
  fitScore: number;
  reason: string;
  distortionRisk: string | null;
};

export type Provenance = 'auto' | 'sanity_checked' | 'hand_written';

export type ArgumentAttribution = {
  id: string;
  philosopherId: string;
  philosopherSlug: string;
  philosopherName: string;
  workId: string | null;
  workSlug: string | null;
  workTitle: string | null;
  formalizationId: string | null;
  provenance: Provenance;
  sourceText: string | null;
  note: string | null;
};

export type ArgumentSource = {
  file: string | null;
  startLine: number | null;
  endLine: number | null;
  excerpt: string | null;
};

export type ArgumentSummary = {
  id: string;
  extractionId: string;
  workId: string | null;
  workSlug: string | null;
  workTitle: string | null;
  intent: string;
  primaryFormalism: string;
  clauseCount: number;
};

export type ArgumentDetail = {
  id: string;
  extractionId: string;
  workId: string | null;
  workSlug: string | null;
  workTitle: string | null;
  source: ArgumentSource;
  intent: string;
  extractorNote: string | null;
  clauses: ArgumentClause[];
  formalizations: Formalization[];
  assessments: ArgumentAssessment[];
  reviewerNotes: string[];
  attributions: ArgumentAttribution[];
};

// Pick the formula a given clause maps to within a whole-AST formalization.
// V1 alignment is positional (clause.position indexes into the AST). Returns
// null for formalisms where clauses don't map 1:1 to formulas (dialogical).
export function clauseFormula(
  formalization: Formalization,
  clause: ArgumentClause,
): FolFormula | AristotelianFormula | null {
  switch (formalization.formalism) {
    case 'fol':
      return formalization.ast.formula;
    case 'nd': {
      const { premises, conclusion } = formalization.ast.argument;
      return clause.role === 'conclusion' ? conclusion : premises[clause.position] ?? null;
    }
    case 'aristotelian':
      // syllogism positions 0/1/2 → major/minor/conclusion; proposition → single.
      return formalization.ast.formula;
    case 'dialogical':
      return null;
  }
}
