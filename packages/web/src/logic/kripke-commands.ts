// Command registry for the Kripke Logic Lab editor. Same shape as
// `eg-commands.ts` (the two will fold into a shared LogicCmEditor in
// a later REFAC); kept duplicated for phase 1 per
// docs/formal-logic/kripke-modal-logic.md §Open Q2.

import { LOGIC_SYSTEMS } from '../data/logic-systems';

export type KripkeCommand = {
  slug: string;
  label: string;
  detail?: string;
  insert: string;
  cursorOffset?: number;
};

const structural: KripkeCommand[] = [
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

const examples: KripkeCommand[] = LOGIC_SYSTEMS
  .find(s => s.slug === 'kripke')!
  .examples.map(ex => ({
    slug: `example.${ex.slug}`,
    label: `Example: ${ex.natural}`,
    detail: ex.dsl,
    insert: ex.dsl,
  }));

export const KRIPKE_COMMANDS: KripkeCommand[] = [...structural, ...examples];

export function findKripkeCommand(slug: string): KripkeCommand | undefined {
  return KRIPKE_COMMANDS.find(c => c.slug === slug);
}