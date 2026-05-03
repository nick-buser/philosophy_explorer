// Command registry for the Kripke Logic Lab editor.

import { LOGIC_SYSTEMS } from '../data/logic-systems';
import type { SlashCommand } from './LogicCmEditor';

const structural: SlashCommand[] = [
  {
    slug: 'box',
    label: 'Insert □ (necessity)',
    detail: 'necessity — []',
    insert: '[]',
  },
  {
    slug: 'dia',
    label: 'Insert ◇ (possibility)',
    detail: 'possibility — <>',
    insert: '<>',
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
    slug: 'iff',
    label: 'Insert ↔ (biconditional)',
    detail: 'biconditional — <->',
    insert: ' <-> ',
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
  .find(s => s.slug === 'kripke')!
  .examples.map(ex => ({
    slug: `example.${ex.slug}`,
    label: `Example: ${ex.natural}`,
    detail: ex.dsl,
    insert: ex.dsl,
  }));

export const KRIPKE_COMMANDS: SlashCommand[] = [...structural, ...examples];

export function findKripkeCommand(slug: string): SlashCommand | undefined {
  return KRIPKE_COMMANDS.find(c => c.slug === slug);
}