// Command registry for the Peirce Logic Lab editor. Each command has a
// short-form slug (`/foo`), a human label, and an insertion payload
// (text plus optional cursor offset). Commands are surfaced two ways:
//   1. As buttons in the Logic Lab toolbar.
//   2. As CodeMirror autocomplete options when the user types "/".
//
// Keep the command list small. If a command is only an example formula,
// put it in data/logic-systems.ts::examples instead.

import { LOGIC_SYSTEMS } from '../data/logic-systems';
import type { SlashCommand } from './LogicCmEditor';

const structural: SlashCommand[] = [
  {
    slug: 'cut',
    label: 'Insert cut',
    detail: 'negation — (\u2026)',
    insert: '()',
    cursorOffset: 1,
  },
  {
    slug: 'double-cut',
    label: 'Insert double cut',
    detail: 'identity transform — ((\u2026))',
    insert: '(())',
    cursorOffset: 2,
  },
  {
    slug: 'scroll',
    label: 'Insert implication scroll',
    detail: 'Peirce scroll — (A (B))',
    insert: '(A (B))',
  },
  {
    slug: 'conjunction',
    label: 'Insert conjunction',
    detail: 'two atoms side by side',
    insert: 'A B',
  },
];

const examples: SlashCommand[] = LOGIC_SYSTEMS
  .find(s => s.slug === 'peirce-eg')!
  .examples.map(ex => ({
    slug: `example.${ex.slug}`,
    label: `Example: ${ex.natural}`,
    detail: ex.dsl,
    insert: ex.dsl,
  }));

export const EG_COMMANDS: SlashCommand[] = [...structural, ...examples];

export function findCommand(slug: string): SlashCommand | undefined {
  return EG_COMMANDS.find(c => c.slug === slug);
}