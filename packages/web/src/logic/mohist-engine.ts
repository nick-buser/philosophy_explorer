import type { BasePair, MouArgument, MouCategory } from './mohist-types';
import { applyOperator, categoryById, outcomeForFlag } from './mohist-types';

// The Mohist móu evaluator.
//
// `evaluateMou` is total and structural — no proof search, and no
// *inference* of the outcome (which Xiao Qu category a parallel falls
// into is not mechanically decidable). It does two things:
//
//   1. Form-check — the móu schema is well-formed iff the operator is
//      non-empty and the two base terms are non-empty and distinct.
//   2. Cross-check — the declared `outcome` is compared against the
//      outcome the declared `flag` implies. A mismatch is reported,
//      never silently corrected.
//
// See docs/formal-logic/mohist.md.

export type Verdict = 'transfers' | 'fails' | 'inconsistent' | 'ill-formed';

export type MouEvaluation = {
  argument: MouArgument;
  // The accepted base pair (是) and the operator-applied parallel pair.
  basePair: BasePair;
  parallelPair: BasePair;
  // Form-check: the móu schema is structurally well-formed.
  wellFormed: boolean;
  formIssues: string[];
  // The declared outcome, and the outcome the declared flag implies.
  declaredCategory: MouCategory;
  expectedCategory: MouCategory;
  // Cross-check: declared outcome agrees with the flag's implication.
  consistent: boolean;
  inconsistency: string | null;
  // móu's verdict on the parallel — only meaningful when well-formed
  // and consistent; the declared category's `transfers` flag.
  transfers: boolean;
  verdict: Verdict;
};

// Form-check the móu schema. A degenerate input — empty operator, an
// empty term, or two identical terms — licenses no genuine parallel.
function checkForm(arg: MouArgument): string[] {
  const issues: string[] = [];
  const subject = arg.base.subject.trim();
  const predicate = arg.base.predicate.trim();

  if (arg.operator.trim() === '') {
    issues.push('the operator is empty — móu applies an operation to both terms');
  }
  if (subject === '') issues.push('the base subject is empty');
  if (predicate === '') issues.push('the base predicate is empty');
  if (subject !== '' && subject.toLowerCase() === predicate.toLowerCase()) {
    issues.push(
      "the two base terms are identical — a parallel needs two distinct terms ('X is X' licenses nothing)",
    );
  }
  return issues;
}

export function evaluateMou(arg: MouArgument): MouEvaluation {
  const formIssues = checkForm(arg);
  const wellFormed = formIssues.length === 0;

  const parallelPair: BasePair = {
    subject: applyOperator(arg.operator, arg.base.subject),
    predicate: applyOperator(arg.operator, arg.base.predicate),
  };

  const declaredCategory = categoryById(arg.outcome);
  const expectedCategory = categoryById(outcomeForFlag(arg.flag));
  const consistent = declaredCategory.id === expectedCategory.id;

  const inconsistency = consistent
    ? null
    : arg.flag === null
      ? `declares the outcome ${declaredCategory.chinese} (${declaredCategory.pinyin}) ` +
        'but names no failure mode — a non-transferring outcome needs a flag'
      : `declares the outcome ${declaredCategory.chinese} (${declaredCategory.pinyin}) ` +
        `but the flag '${arg.flag}' implies ${expectedCategory.chinese} (${expectedCategory.pinyin})`;

  const verdict: Verdict = !wellFormed
    ? 'ill-formed'
    : !consistent
      ? 'inconsistent'
      : declaredCategory.transfers
        ? 'transfers'
        : 'fails';

  return {
    argument: arg,
    basePair: { subject: arg.base.subject, predicate: arg.base.predicate },
    parallelPair,
    wellFormed,
    formIssues,
    declaredCategory,
    expectedCategory,
    consistent,
    inconsistency,
    transfers: declaredCategory.transfers,
    verdict,
  };
}
