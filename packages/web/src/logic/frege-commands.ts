// Command registry for the Frege Begriffsschrift Logic Lab editor.
// Each command surfaces as a toolbar button and a CodeMirror
// autocomplete option.

import { LOGIC_SYSTEMS } from '../data/logic-systems';
import type { SlashCommand } from './LogicCmEditor';

const structural: SlashCommand[] = [
  {
    slug: 'judgment',
    label: 'Insert judgment',
    detail: 'turnstile / Urteilsstrich — |- ...',
    insert: '|- ',
  },
  {
    slug: 'negation',
    label: 'Insert negation',
    detail: 'negation tick on the content stroke — ~A',
    insert: '~',
  },
  {
    slug: 'conditional',
    label: 'Insert conditional',
    detail: 'condition stroke (consequent on top) — A -> B',
    insert: 'A -> B',
  },
  {
    slug: 'forall',
    label: 'Insert generality',
    detail: 'concavity with Gothic individual letter — all x. F(x)',
    insert: 'all x. F(x)',
  },
  {
    slug: 'exists',
    label: 'Insert existential',
    detail: 'derived shape ¬∀¬ — exists x. F(x)',
    insert: 'exists x. F(x)',
  },
  {
    slug: 'iden',
    label: 'Insert identity-of-content',
    detail: 'triple-bar ≡ between two contents — A == B',
    insert: 'A == B',
  },
  {
    slug: 'forall-pred',
    label: 'Insert higher-order generality',
    detail: 'predicate-bound concavity — all F. F(a)',
    insert: 'all F. F(a)',
  },
];

const examples: SlashCommand[] = LOGIC_SYSTEMS
  .find(s => s.slug === 'frege-bs')!
  .examples.map(ex => ({
    slug:   `example.${ex.slug}`,
    label:  `Example: ${ex.natural}`,
    detail: ex.dsl,
    insert: ex.dsl,
  }));

export const FREGE_COMMANDS: SlashCommand[] = [...structural, ...examples];

export function findFregeCommand(slug: string): SlashCommand | undefined {
  return FREGE_COMMANDS.find(c => c.slug === slug);
}
