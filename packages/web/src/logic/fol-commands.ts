// Command registry for the Modern FOL Logic Lab editor.

import { LOGIC_SYSTEMS } from '../data/logic-systems';
import type { SlashCommand } from './LogicCmEditor';

const structural: SlashCommand[] = [
  {
    slug: 'forall',
    label: 'Insert ∀ (universal quantifier)',
    detail: 'forall x. <body>',
    insert: 'forall x. ',
  },
  {
    slug: 'exists',
    label: 'Insert ∃ (existential quantifier)',
    detail: 'exists x. <body>',
    insert: 'exists x. ',
  },
  {
    slug: 'not',
    label: 'Insert ¬ (negation)',
    detail: 'negation — ~',
    insert: '~',
  },
  {
    slug: 'and',
    label: 'Insert ∧ (conjunction)',
    detail: 'conjunction — &',
    insert: ' & ',
  },
  {
    slug: 'or',
    label: 'Insert ∨ (disjunction)',
    detail: 'disjunction — |',
    insert: ' | ',
  },
  {
    slug: 'implies',
    label: 'Insert → (implication)',
    detail: 'implication — ->',
    insert: ' -> ',
  },
  {
    slug: 'iff',
    label: 'Insert ↔ (biconditional)',
    detail: 'biconditional — <->',
    insert: ' <-> ',
  },
  {
    slug: 'eq',
    label: 'Insert = (identity)',
    detail: 'identity — t = u',
    insert: ' = ',
  },
  {
    slug: 'neq',
    label: 'Insert ≠ (non-identity)',
    detail: 'non-identity — t != u',
    insert: ' != ',
  },
  {
    slug: 'group',
    label: 'Insert grouping parentheses',
    detail: 'wrap a subformula',
    insert: '()',
    cursorOffset: 1,
  },
];

const examples: SlashCommand[] = (LOGIC_SYSTEMS
  .find(s => s.slug === 'modern-fol')?.examples ?? [])
  .map(ex => ({
    slug:   `example.${ex.slug}`,
    label:  `Example: ${ex.natural}`,
    detail: ex.dsl,
    insert: ex.dsl,
  }));

export const FOL_COMMANDS: SlashCommand[] = [...structural, ...examples];

export function findFolCommand(slug: string): SlashCommand | undefined {
  return FOL_COMMANDS.find(c => c.slug === slug);
}
