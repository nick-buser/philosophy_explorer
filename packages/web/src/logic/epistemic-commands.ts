// Slash-command registry for the epistemic Lab editor.

import { LOGIC_SYSTEMS } from '../data/logic-systems';
import type { SlashCommand } from './LogicCmEditor';

const structural: SlashCommand[] = [
  {
    slug: 'know',
    label: 'Insert K_a (knowledge)',
    detail: 'agent a knows … — K_a',
    insert: 'K_a ',
  },
  {
    slug: 'consider',
    label: 'Insert M_a (consideration)',
    detail: 'agent a considers … possible — M_a',
    insert: 'M_a ',
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
  .find(s => s.slug === 'epistemic')!
  .examples.map(ex => ({
    slug: `example.${ex.slug}`,
    label: `Example: ${ex.natural}`,
    detail: ex.dsl,
    insert: ex.dsl,
  }));

export const EPISTEMIC_COMMANDS: SlashCommand[] = [...structural, ...examples];

export function findEpistemicCommand(slug: string): SlashCommand | undefined {
  return EPISTEMIC_COMMANDS.find(c => c.slug === slug);
}
