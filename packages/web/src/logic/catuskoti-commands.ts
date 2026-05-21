// Command registry for the catuṣkoṭi Logic Lab editor. Each command
// surfaces as a toolbar button and a CodeMirror autocomplete option.
//
// The editor holds a whole catuṣkoṭi instance, so a structural
// command inserts a complete minimal proposition rather than a
// fragment.

import { LOGIC_SYSTEMS } from '../data/logic-systems';
import type { SlashCommand } from './LogicCmEditor';

function skeleton(koti: string, reading: string): string {
  return (
    'proposition: the Tathāgata exists after death\n' +
    `koti:        ${koti}\n` +
    `reading:     ${reading}`
  );
}

const structural: SlashCommand[] = [
  {
    slug: 'catuskoti',
    label: 'Catuṣkoṭi skeleton',
    detail: 'proposition / koti / reading',
    insert: skeleton('affirmation', 'affirming'),
  },
  {
    slug: 'affirmation',
    label: 'Koṭi 1 — affirmation',
    detail: 'the corner A — “it is”',
    insert: skeleton('affirmation', 'affirming'),
  },
  {
    slug: 'negation',
    label: 'Koṭi 2 — negation',
    detail: 'the corner ¬A — “it is not”',
    insert: skeleton('negation', 'affirming'),
  },
  {
    slug: 'both',
    label: 'Koṭi 3 — both',
    detail: 'the corner A∧¬A — the glut',
    insert: skeleton('both', 'affirming'),
  },
  {
    slug: 'neither',
    label: 'Koṭi 4 — neither',
    detail: 'the corner ¬(A∨¬A) — the gap',
    insert: skeleton('neither', 'affirming'),
  },
  {
    slug: 'prasanga',
    label: 'Prasaṅga reading',
    detail: 'the Madhyamaka refutation — reject all four',
    insert: skeleton('affirmation', 'prasanga'),
  },
];

const examples: SlashCommand[] = LOGIC_SYSTEMS
  .find(s => s.slug === 'catuskoti')!
  .examples.map(ex => ({
    slug:   `example.${ex.slug}`,
    label:  `Example: ${ex.natural}`,
    detail: ex.dsl,
    insert: ex.dsl,
  }));

export const CATUSKOTI_COMMANDS: SlashCommand[] = [...structural, ...examples];

export function findCatuskotiCommand(slug: string): SlashCommand | undefined {
  return CATUSKOTI_COMMANDS.find(c => c.slug === slug);
}
