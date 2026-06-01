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
import type { BoolFormula } from '../logic/boolean-types';
import type { Inference } from '../logic/indian-types';
import type { ModalFormula, KripkeModel } from '../logic/kripke-types';
import type { CtlFormula, KripkeModel as CtlKripkeModel } from '../logic/ctl-types';
import type { EpistemicFormula, EpistemicModel } from '../logic/epistemic-types';
import type { TemporalFormula, Trace } from '../logic/temporal-types';

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
export type BooleanAst = { formula: BoolFormula };
export type IndianAst = { inference: Inference };
// Modal formalisms carry a hand-authored model (or trace) alongside the formula.
export type KripkeAst = { formula: ModalFormula; model: KripkeModel };
export type CtlAst = { formula: CtlFormula; model: CtlKripkeModel };
export type IntuitionisticAst = { formula: ModalFormula; model: KripkeModel };
export type EpistemicAst = { formula: EpistemicFormula; model: EpistemicModel };
export type TemporalAst = { formula: TemporalFormula; trace: Trace };

// dialogical has no Logic Lab AST yet — it's first-party in claim_extractor.
// Mirror its v1 shape here until/unless it gets a dialogical-types.ts.
// DIALOGUE_ACTS mirrors claim_extractor/schemas/dialogical.py DialogueAct
// literal exactly. If the python side evolves the vocabulary, update here
// and the cross-repo fixture test will flag any extraction using an act
// we don't know about.
export const DIALOGUE_ACTS = [
  'assertion',
  'question',
  'proposal',
  'concession',
  'objection',
  'refutation',
  'retraction',
  'inference',
  'appeal_to_endoxa',
  'aporia',
  'example',
  'hedge',
] as const;

export type DialogueAct = typeof DIALOGUE_ACTS[number];

export function isDialogueAct(s: string): s is DialogueAct {
  return (DIALOGUE_ACTS as readonly string[]).includes(s);
}

export type DialogicalMove = {
  move_no: number;
  speaker: string;
  act: DialogueAct;
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

// The full formalism set mirrors claim_extractor's FormalismKind (schemas/
// extraction.py) and the importer (scripts/build-arguments-seed.mjs). Only the
// first four are "wired" — richly typed + rendered as a clause table / move
// list. The rest carry their AST verbatim and render via a generic fallback
// (formatted JSON + an "open in Logic Lab" link) until each gets bespoke UI.
export const ALL_FORMALISMS = [
  'fol', 'nd', 'aristotelian', 'dialogical',
  'boolean', 'frege', 'medieval', 'eg', 'kripke',
  'epistemic', 'intuitionistic', 'temporal', 'ctl', 'indian', 'resolution',
] as const;
export type Formalism = typeof ALL_FORMALISMS[number];

export const WIRED_FORMALISMS = ['fol', 'nd', 'aristotelian', 'dialogical'] as const;
export type WiredFormalism = typeof WIRED_FORMALISMS[number];

// Human labels for every formalism (switcher, assessments, index filter).
export const FORMALISM_LABELS: Record<Formalism, string> = {
  fol: 'First-order logic',
  nd: 'Natural deduction',
  aristotelian: 'Aristotelian',
  dialogical: 'Dialogical',
  boolean: 'Boolean algebra',
  frege: 'Frege Begriffsschrift',
  medieval: 'Medieval modal',
  eg: 'Existential graphs',
  kripke: 'Kripke modal',
  epistemic: 'Epistemic',
  intuitionistic: 'Intuitionistic',
  temporal: 'Temporal (LTL)',
  ctl: 'Branching (CTL)',
  indian: 'Indian / Nyāya',
  resolution: 'Resolution / Datalog',
};

// Map a formalism to its Logic Lab system slug (/logic/$system). dialogical is
// first-party in claim_extractor and has no Logic Lab counterpart → null.
export const FORMALISM_LAB_SLUG: Record<Formalism, string | null> = {
  fol: 'modern-fol',
  nd: 'natural-deduction',
  aristotelian: 'aristotelian',
  dialogical: null,
  boolean: 'boolean',
  frege: 'frege-bs',
  medieval: 'medieval',
  eg: 'peirce-eg',
  kripke: 'kripke',
  epistemic: 'epistemic',
  intuitionistic: 'intuitionistic',
  temporal: 'temporal-ltl',
  ctl: 'temporal-ctl',
  indian: 'indian-buddhist',
  resolution: 'resolution',
};

export function formalismLabel(f: string): string {
  return FORMALISM_LABELS[f as Formalism] ?? f;
}

type FormalizationBase = {
  id: string;
  isPrimary: boolean;
  fitScore: number | null;
  reason: string | null;
  distortionRisk: string | null;
};

// AST payload for the not-yet-wired formalisms — kept opaque; the generic view
// pretty-prints it and links to the matching Logic Lab system.
export type GenericAst = Record<string, unknown>;

export type Formalization =
  | (FormalizationBase & { formalism: 'fol'; ast: FolAst })
  | (FormalizationBase & { formalism: 'nd'; ast: NdAst })
  | (FormalizationBase & { formalism: 'aristotelian'; ast: AristotelianAst })
  | (FormalizationBase & { formalism: 'dialogical'; ast: DialogicalAst })
  | (FormalizationBase & { formalism: 'boolean'; ast: BooleanAst })
  | (FormalizationBase & { formalism: 'indian'; ast: IndianAst })
  | (FormalizationBase & { formalism: 'kripke'; ast: KripkeAst })
  | (FormalizationBase & { formalism: 'ctl'; ast: CtlAst })
  | (FormalizationBase & { formalism: 'intuitionistic'; ast: IntuitionisticAst })
  | (FormalizationBase & { formalism: 'epistemic'; ast: EpistemicAst })
  | (FormalizationBase & { formalism: 'temporal'; ast: TemporalAst })
  | (FormalizationBase & {
      formalism: Exclude<
        Formalism,
        WiredFormalism | 'boolean' | 'indian' | 'kripke' | 'ctl' | 'intuitionistic' | 'epistemic' | 'temporal'
      >;
      ast: GenericAst;
    });

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

// ── Write inputs (POST/PUT request bodies) ─────────────────────────────────
// Mirror the F# WriteArgumentDto in Domain/Dtos.fs. `ast` is sent verbatim as
// JSON; the server stores it as ast_json.

export type WriteClauseInput = {
  role: string;
  position: number;
  verbalText: string | null;
  sourceExcerpt: string | null;
};

export type WriteFormalizationInput = {
  formalism: Formalism;
  isPrimary: boolean;
  fitScore: number | null;
  reason: string | null;
  distortionRisk: string | null;
  ast: unknown;
};

export type WriteAssessmentInput = {
  formalism: string;
  fitScore: number;
  reason: string;
  distortionRisk: string | null;
};

export type WriteAttributionInput = {
  philosopherSlug: string;
  workSlug: string | null;
  formalismRef: string | null;
  provenance: Provenance;
  sourceText: string | null;
  note: string | null;
};

export type WriteArgumentInput = {
  workSlug: string | null;
  sourceFile: string | null;
  sourceStartLine: number | null;
  sourceEndLine: number | null;
  sourceExcerpt: string | null;
  intent: string;
  extractorNote: string | null;
  clauses: WriteClauseInput[];
  formalizations: WriteFormalizationInput[];
  assessments: WriteAssessmentInput[];
  reviewerNotes: string[];
  attributions: WriteAttributionInput[];
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
    case 'aristotelian': {
      const f = formalization.ast.formula;
      if (f.kind === 'proposition') return f;
      // Map each clause to its own proposition: conclusion by role, the two
      // premises by position (0 → major, 1 → minor). Returning the whole
      // syllogism made every row render the conclusion, because renderFormula
      // collapses a syllogism to its conclusion proposition.
      const s = f.syllogism;
      const proposition =
        clause.role === 'conclusion' ? s.conclusion
        : clause.position === 0 ? s.major
        : clause.position === 1 ? s.minor
        : s.conclusion;
      return { kind: 'proposition', proposition };
    }
    case 'dialogical':
      return null;
    default:
      // Not-yet-wired formalisms: the generic view renders the AST directly.
      return null;
  }
}
