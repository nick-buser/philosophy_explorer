import { renderUnicode } from '../logic/fol-render';
import type { CategoricalProposition } from '../logic/aristotelian-types';
import type { Formalization, FolAst, NdAst, AristotelianAst } from './argument-types';

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
    default: return null;
  }
}
