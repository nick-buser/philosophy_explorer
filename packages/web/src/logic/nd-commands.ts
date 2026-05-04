import { LOGIC_SYSTEMS } from '../data/logic-systems';
import type { SlashCommand } from './LogicCmEditor';

const structural: SlashCommand[] = [
  {
    slug: 'turnstile',
    label: 'Insert ⊢ (turnstile)',
    detail: 'separates premises from the conclusion',
    insert: ' |- ',
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
    slug: 'bot',
    label: 'Insert ⊥ (bottom)',
    detail: 'absurdity / contradiction',
    insert: 'false',
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
  .find(s => s.slug === 'natural-deduction')?.examples ?? [])
  .map(ex => ({
    slug:   `example.${ex.slug}`,
    label:  `Example: ${ex.natural}`,
    detail: ex.dsl,
    insert: ex.dsl,
  }));

export const ND_COMMANDS: SlashCommand[] = [...structural, ...examples];

export function findNdCommand(slug: string): SlashCommand | undefined {
  return ND_COMMANDS.find(c => c.slug === slug);
}
