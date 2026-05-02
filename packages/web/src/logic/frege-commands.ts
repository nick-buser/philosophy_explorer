// Command registry for the Frege Begriffsschrift Logic Lab editor.
// Same shape as eg-commands / kripke-commands: each command has a
// short-form slug, a human label, and an insertion payload. Surfaced
// both as toolbar buttons and CodeMirror autocomplete options.

import { LOGIC_SYSTEMS } from '../data/logic-systems';

export type FregeCommand = {
  slug: string;
  label: string;
  detail?: string;
  insert: string;
  cursorOffset?: number;
};

const structural: FregeCommand[] = [
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
    detail: 'concavity with Gothic letter — all x. F(x)',
    insert: 'all x. F(x)',
  },
];

const examples: FregeCommand[] = LOGIC_SYSTEMS
  .find(s => s.slug === 'frege-bs')!
  .examples.map(ex => ({
    slug:   `example.${ex.slug}`,
    label:  `Example: ${ex.natural}`,
    detail: ex.dsl,
    insert: ex.dsl,
  }));

export const FREGE_COMMANDS: FregeCommand[] = [...structural, ...examples];

export function findFregeCommand(slug: string): FregeCommand | undefined {
  return FREGE_COMMANDS.find(c => c.slug === slug);
}
