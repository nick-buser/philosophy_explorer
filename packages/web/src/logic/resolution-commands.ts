import { LOGIC_SYSTEMS } from '../data/logic-systems';
import type { SlashCommand } from './LogicCmEditor';

const structural: SlashCommand[] = [
  {
    slug: 'or',
    label: 'Insert ∨ (clause disjunction)',
    detail: 'between literals in a clause-mode line',
    insert: ' ∨ ',
  },
  {
    slug: 'not',
    label: 'Insert ¬ (negation)',
    detail: 'before a literal in a clause',
    insert: '¬',
  },
  {
    slug: 'turnstile',
    label: 'Insert ⊢ (clause-mode goal)',
    detail: 'goal to refute',
    insert: '⊢ ',
  },
  {
    slug: 'rule',
    label: 'Insert head :- body. (Horn rule)',
    detail: 'Prolog-style definite clause',
    insert: 'head(X) :- body(X).',
    cursorOffset: 4,
  },
  {
    slug: 'fact',
    label: 'Insert fact.',
    detail: 'ground atom (no body)',
    insert: 'fact(a).',
    cursorOffset: 0,
  },
  {
    slug: 'query',
    label: 'Insert ?- query.',
    detail: 'SLD query (Horn mode)',
    insert: '?- query(X).',
    cursorOffset: 3,
  },
  {
    slug: 'comment',
    label: 'Insert % comment',
    detail: 'comment line',
    insert: '% ',
  },
];

const examples: SlashCommand[] = (LOGIC_SYSTEMS
  .find(s => s.slug === 'resolution')?.examples ?? [])
  .map(ex => ({
    slug:   `example.${ex.slug}`,
    label:  `Example: ${ex.natural}`,
    detail: ex.dsl,
    insert: ex.dsl,
  }));

export const RESOLUTION_COMMANDS: SlashCommand[] = [...structural, ...examples];
