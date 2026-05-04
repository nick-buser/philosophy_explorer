import type { FolFormula, FolTerm } from './fol-types';
import { isPropositional } from './fol-types';

// Natural-deduction proof shapes. Reuses FolFormula from fol-types so
// the same renderer / parser stack drives the displayed formulas. The
// ND-specific layer adds: arguments (premises ⊢ conclusion), Fitch
// proofs (numbered lines + nested subproof boxes), and the rule
// vocabulary the prover and renderers share.

export type Argument = {
  premises: FolFormula[];
  conclusion: FolFormula;
};

export type Rule =
  | 'premise'
  | 'assumption'
  | 'reit'
  | 'andI'  | 'andEL' | 'andER'
  | 'orIL'  | 'orIR'  | 'orE'
  | 'impI'  | 'impE'
  | 'iffI'  | 'iffEL' | 'iffER'
  | 'notI'  | 'notE'
  | 'botE'
  | 'raa';

export const RULE_LABELS: Record<Rule, string> = {
  premise:    'premise',
  assumption: 'assume',
  reit:       'Reit',
  andI:       '∧I',
  andEL:      '∧E',
  andER:      '∧E',
  orIL:       '∨I',
  orIR:       '∨I',
  orE:        '∨E',
  impI:       '→I',
  impE:       '→E',
  iffI:       '↔I',
  iffEL:      '↔E',
  iffER:      '↔E',
  notI:       '¬I',
  notE:       '¬E',
  botE:       '⊥E',
  raa:        'RAA',
};

export type Cite = number | [number, number];

export type FitchLine = {
  lineNo: number;
  depth: number;
  formula: FolFormula;
  rule: Rule;
  cites: Cite[];
};

export type FitchProof = {
  lines: FitchLine[];
  conclusionLine: number;
};

export type RuleSet = 'classical' | 'intuitionistic';

export type ProveResult =
  | { ok: true;  proof: FitchProof; ruleSet: RuleSet; classicalOnly: boolean }
  | { ok: false; ruleSet: RuleSet; reason: 'no-proof' | 'budget' | 'non-propositional' };

export function formulaKey(f: FolFormula): string {
  switch (f.kind) {
    case 'top': return '⊤';
    case 'bot': return '⊥';
    case 'pred':
      return f.args.length === 0
        ? f.name
        : `${f.name}(${f.args.map(termKey).join(',')})`;
    case 'eq':
      return `${termKey(f.left)}=${termKey(f.right)}`;
    case 'not':
      return `¬(${formulaKey(f.body)})`;
    case 'and':
      return `(${formulaKey(f.left)}∧${formulaKey(f.right)})`;
    case 'or':
      return `(${formulaKey(f.left)}∨${formulaKey(f.right)})`;
    case 'implies':
      return `(${formulaKey(f.left)}→${formulaKey(f.right)})`;
    case 'iff':
      return `(${formulaKey(f.left)}↔${formulaKey(f.right)})`;
    case 'forall':
      return `(∀${f.variable}.${formulaKey(f.body)})`;
    case 'exists':
      return `(∃${f.variable}.${formulaKey(f.body)})`;
  }
}

function termKey(t: FolTerm): string {
  switch (t.kind) {
    case 'var':
    case 'const':
      return t.name;
    case 'fn':
      return `${t.name}(${t.args.map(termKey).join(',')})`;
  }
}

export function neg(f: FolFormula): FolFormula {
  return { kind: 'not', body: f };
}

export function isPropositionalArgument(arg: Argument): boolean {
  return [arg.conclusion, ...arg.premises].every(isPropositional);
}