import { LOGIC_SYSTEMS } from '../data/logic-systems';
import type { SlashCommand } from './LogicCmEditor';

const structural: SlashCommand[] = [
  {
    slug: 'and',
    label: 'Insert · (AND, juxtaposition)',
    detail: 'AND — written as juxtaposition: x y',
    insert: ' ',
  },
  {
    slug: 'or',
    label: 'Insert + (OR)',
    detail: 'OR — algebraic +',
    insert: ' + ',
  },
  {
    slug: 'not',
    label: 'Insert ¬ (complement)',
    detail: 'NOT — also accepts ~x and x′',
    insert: '~',
  },
  {
    slug: 'prime',
    label: "Append ′ (postfix complement)",
    detail: "the algebra-of-logic spelling of NOT — x' equals ¬x",
    insert: '′',
  },
  {
    slug: 'xor',
    label: 'Insert ⊕ (XOR)',
    detail: 'XOR — exclusive disjunction',
    insert: ' ^ ',
  },
  {
    slug: 'implies',
    label: 'Insert → (implication)',
    detail: 'implication — definable as ¬x + y',
    insert: ' -> ',
  },
  {
    slug: 'iff',
    label: 'Insert ↔ (biconditional)',
    detail: 'biconditional — useful for equality of two algebra expressions',
    insert: ' <-> ',
  },
  {
    slug: 'zero',
    label: 'Insert 0',
    detail: 'the constant false / empty class',
    insert: '0',
  },
  {
    slug: 'one',
    label: 'Insert 1',
    detail: 'the constant true / universal class',
    insert: '1',
  },
  {
    slug: 'group',
    label: 'Insert grouping parentheses',
    detail: 'wrap a subexpression',
    insert: '()',
    cursorOffset: 1,
  },
];

const examples: SlashCommand[] = (LOGIC_SYSTEMS
  .find(s => s.slug === 'boolean')?.examples ?? [])
  .map(ex => ({
    slug:   `example.${ex.slug}`,
    label:  `Example: ${ex.natural}`,
    detail: ex.dsl,
    insert: ex.dsl,
  }));

export const BOOLEAN_COMMANDS: SlashCommand[] = [...structural, ...examples];

export function findBooleanCommand(slug: string): SlashCommand | undefined {
  return BOOLEAN_COMMANDS.find(c => c.slug === slug);
}