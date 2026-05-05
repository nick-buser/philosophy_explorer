// Slash-command registry for the intuitionistic Lab editor.
// Mirrors the Kripke palette minus □ / ◇, which have no intuitionistic
// reading in this propositional fragment.

import { LOGIC_SYSTEMS } from '../data/logic-systems';
import type { SlashCommand } from './LogicCmEditor';

const structural: SlashCommand[] = [
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
  .find(s => s.slug === 'intuitionistic')!
  .examples.map(ex => ({
    slug: `example.${ex.slug}`,
    label: `Example: ${ex.natural}`,
    detail: ex.dsl,
    insert: ex.dsl,
  }));

export const INTUITIONISTIC_COMMANDS: SlashCommand[] = [...structural, ...examples];

export function findIntuitionisticCommand(slug: string): SlashCommand | undefined {
  return INTUITIONISTIC_COMMANDS.find(c => c.slug === slug);
}
