// Slash-command registry for the deontic Lab editor.
//
// Standard deontic logic (KD) reuses the Kripke modal AST: O ≡ □
// (obligatory), P ≡ ◇ (permitted), F ≡ ¬◇ (forbidden). The palette
// surfaces the deontic glosses on the same DSL primitives — typing
// /obligatory inserts `[]`, /permitted inserts `<>`, /forbidden inserts
// `!<>`. Examples come from the deontic system entry, not the kripke
// one.

import { LOGIC_SYSTEMS } from '../data/logic-systems';
import type { SlashCommand } from './LogicCmEditor';

const structural: SlashCommand[] = [
  {
    slug: 'obligatory',
    label: 'Insert O (obligatory)',
    detail: 'Oφ ≡ □φ — “it is obligatory that φ”',
    insert: '[]',
  },
  {
    slug: 'permitted',
    label: 'Insert P (permitted)',
    detail: 'Pφ ≡ ◇φ — “it is permitted that φ”',
    insert: '<>',
  },
  {
    slug: 'forbidden',
    label: 'Insert F (forbidden)',
    detail: 'Fφ ≡ ¬◇φ ≡ □¬φ — “it is forbidden that φ”',
    insert: '!<>',
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
  .find(s => s.slug === 'deontic')!
  .examples.map(ex => ({
    slug: `example.${ex.slug}`,
    label: `Example: ${ex.natural}`,
    detail: ex.dsl,
    insert: ex.dsl,
  }));

export const DEONTIC_COMMANDS: SlashCommand[] = [...structural, ...examples];

export function findDeonticCommand(slug: string): SlashCommand | undefined {
  return DEONTIC_COMMANDS.find(c => c.slug === slug);
}
