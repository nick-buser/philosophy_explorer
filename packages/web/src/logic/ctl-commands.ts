// Slash-command registry for the CTL Lab editor.

import { LOGIC_SYSTEMS } from '../data/logic-systems';
import type { SlashCommand } from './LogicCmEditor';

const structural: SlashCommand[] = [
  { slug: 'AX', label: 'Insert AX (universal next)',  detail: 'AX — for every next-step',     insert: 'AX ' },
  { slug: 'EX', label: 'Insert EX (existential next)', detail: 'EX — for some next-step',     insert: 'EX ' },
  { slug: 'AF', label: 'Insert AF (inevitably)',       detail: 'AF — on every path eventually', insert: 'AF ' },
  { slug: 'EF', label: 'Insert EF (possibly)',         detail: 'EF — on some path eventually',  insert: 'EF ' },
  { slug: 'AG', label: 'Insert AG (invariantly)',      detail: 'AG — on every path always',     insert: 'AG ' },
  { slug: 'EG', label: 'Insert EG (potentially)',      detail: 'EG — on some path always',      insert: 'EG ' },
  {
    slug: 'AU', label: 'Insert A[…U…] (universal until)',
    detail: 'A[p U q] — on every path p until q',
    insert: 'A[ U ]',
    cursorOffset: 2,
  },
  {
    slug: 'EU', label: 'Insert E[…U…] (existential until)',
    detail: 'E[p U q] — on some path p until q',
    insert: 'E[ U ]',
    cursorOffset: 2,
  },
  { slug: 'not',     label: 'Insert ¬ (negation)',     detail: 'negation — !', insert: '!' },
  { slug: 'implies', label: 'Insert → (implication)',  detail: 'implication — ->', insert: ' -> ' },
  { slug: 'and',     label: 'Insert ∧ (conjunction)',  detail: 'conjunction — &',  insert: ' & ' },
  { slug: 'or',      label: 'Insert ∨ (disjunction)',  detail: 'disjunction — |',  insert: ' | ' },
  {
    slug: 'group', label: 'Insert grouping parentheses',
    detail: 'wrap a subformula', insert: '()', cursorOffset: 1,
  },
];

const examples: SlashCommand[] = LOGIC_SYSTEMS
  .find(s => s.slug === 'temporal-ctl')!
  .examples.map(ex => ({
    slug: `example.${ex.slug}`,
    label: `Example: ${ex.natural}`,
    detail: ex.dsl,
    insert: ex.dsl,
  }));

export const CTL_COMMANDS: SlashCommand[] = [...structural, ...examples];

export function findCtlCommand(slug: string): SlashCommand | undefined {
  return CTL_COMMANDS.find(c => c.slug === slug);
}
