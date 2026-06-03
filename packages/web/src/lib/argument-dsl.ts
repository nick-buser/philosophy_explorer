import { renderUnicode } from '../logic/fol-render';
import { renderUnicode as renderBoolUnicode } from '../logic/boolean-render';
import { renderUnicode as renderModalUnicode } from '../logic/kripke-render';
import { renderUnicodeCtl } from '../logic/ctl-render';
import { renderUnicodeE } from '../logic/epistemic-render';
import { renderUnicodeT } from '../logic/temporal-render';
import { formatInference } from '../logic/indian-parser';
import type { CategoricalProposition } from '../logic/aristotelian-types';
import type {
  Formalization, FolAst, NdAst, AristotelianAst, BooleanAst, IndianAst,
  KripkeAst, CtlAst, IntuitionisticAst, EpistemicAst, TemporalAst,
} from './argument-types';

// AST → the Logic Lab DSL source text, for the formalisms whose lab parses a
// round-trippable string. This is what powers the copyable "DSL" block on an
// argument and the `?dsl=` prefill of the matching lab. Each serializer emits
// exactly what the corresponding parser accepts (fol-parser / nd-parser /
// aristotelian-parser) so the round trip is lossless — see argument-dsl.test.ts.

export function folToDsl(ast: FolAst): string {
  // fol-parser accepts the same Unicode glyphs renderUnicode emits (∀ ∃ ¬ ∧ ∨ → ↔).
  return renderUnicode(ast.formula);
}

export function ndToDsl(ast: NdAst): string {
  // nd-parser shape: `p, q ⊢ r` (premises comma-separated, ⊢ marks the conclusion).
  const premises = ast.argument.premises.map(renderUnicode);
  const conclusion = renderUnicode(ast.argument.conclusion);
  return premises.length > 0 ? `${premises.join(', ')} ⊢ ${conclusion}` : `⊢ ${conclusion}`;
}

export function aristotelianToDsl(ast: AristotelianAst): string {
  const f = ast.formula;
  if (f.kind === 'proposition') return propositionProse(f.proposition);
  // aristotelian-parser long form: two premise lines + a `Therefore …` conclusion.
  const s = f.syllogism;
  return [
    propositionProse(s.major),
    propositionProse(s.minor),
    `Therefore ${propositionProse(s.conclusion)}`,
  ].join('\n');
}

export function booleanToDsl(ast: BooleanAst): string {
  // boolean-parser accepts ∨ ∧ ¬ (and +/·/~ aliases) that renderUnicode emits.
  return renderBoolUnicode(ast.formula);
}

export function indianToDsl(ast: IndianAst): string {
  // indian-parser round-trips its own formatInference output.
  return formatInference(ast.inference);
}

// Modal formalisms: the DSL is the formula source (the lab gets the formula;
// the model/trace lives in the argument). Each renderer's Unicode output is
// accepted by the matching parser.
export function kripkeToDsl(ast: KripkeAst): string { return renderModalUnicode(ast.formula); }
export function intuitionisticToDsl(ast: IntuitionisticAst): string { return renderModalUnicode(ast.formula); }
export function ctlToDsl(ast: CtlAst): string { return renderUnicodeCtl(ast.formula); }
export function epistemicToDsl(ast: EpistemicAst): string { return renderUnicodeE(ast.formula); }
export function temporalToDsl(ast: TemporalAst): string { return renderUnicodeT(ast.formula); }

function propositionProse(p: CategoricalProposition): string {
  switch (p.form) {
    case 'A': return `All ${p.subject} are ${p.predicate}`;
    case 'E': return `No ${p.subject} are ${p.predicate}`;
    case 'I': return `Some ${p.subject} are ${p.predicate}`;
    case 'O': return `Some ${p.subject} are not ${p.predicate}`;
  }
}

// Dispatch on the formalization's discriminant. Returns null for formalisms
// without a wired DSL serializer (dialogical + the not-yet-wired systems),
// whose views fall back to the raw AST.
export function formalizationToDsl(f: Formalization): string | null {
  switch (f.formalism) {
    case 'fol': return folToDsl(f.ast);
    case 'nd': return ndToDsl(f.ast);
    case 'aristotelian': return aristotelianToDsl(f.ast);
    case 'boolean': return booleanToDsl(f.ast);
    case 'indian': return indianToDsl(f.ast);
    case 'kripke': return kripkeToDsl(f.ast);
    case 'intuitionistic': return intuitionisticToDsl(f.ast);
    case 'ctl': return ctlToDsl(f.ast);
    case 'epistemic': return epistemicToDsl(f.ast);
    case 'temporal': return temporalToDsl(f.ast);
    default: return null;
  }
}
