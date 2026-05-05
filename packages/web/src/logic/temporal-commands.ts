// Slash-command registry for the LTL Lab editor.

import { LOGIC_SYSTEMS } from '../data/logic-systems';
import type { SlashCommand } from './LogicCmEditor';

const structural: SlashCommand[] = [
  {
    slug: 'next',
    label: 'Insert X (next)',
    detail: 'next-step — X',
    insert: 'X ',
  },
  {
    slug: 'eventually',
    label: 'Insert F (eventually)',
    detail: 'eventually — F',
    insert: 'F ',
  },
  {
    slug: 'always',
    label: 'Insert G (always)',
    detail: 'always — G',
    insert: 'G ',
  },
  {
    slug: 'until',
    label: 'Insert U (until)',
    detail: 'until — U',
    insert: ' U ',
  },
  {
    slug: 'not',
    label: 'Insert ¬ (negation)',
    detail: 'negation — !',
    insert: '!',
  },
  {
    slug: 'implies',
    label: 'Insert → (implication)',
    detail: 'implication — ->',
    insert: ' -> ',
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
    slug: 'group',
    label: 'Insert grouping parentheses',
    detail: 'wrap a subformula',
    insert: '()',
    cursorOffset: 1,
  },
];

const examples: SlashCommand[] = LOGIC_SYSTEMS
  .find(s => s.slug === 'temporal-ltl')!
  .examples.map(ex => ({
    slug: `example.${ex.slug}`,
    label: `Example: ${ex.natural}`,
    detail: ex.dsl,
    insert: ex.dsl,
  }));

export const TEMPORAL_COMMANDS: SlashCommand[] = [...structural, ...examples];

export function findTemporalCommand(slug: string): SlashCommand | undefined {
  return TEMPORAL_COMMANDS.find(c => c.slug === slug);
}
