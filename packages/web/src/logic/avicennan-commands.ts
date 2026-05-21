// Command registry for the Avicennan Logic Lab editor. Each command
// surfaces as a toolbar button and a CodeMirror autocomplete option.

import { LOGIC_SYSTEMS } from '../data/logic-systems';
import type { SlashCommand } from './LogicCmEditor';

const structural: SlashCommand[] = [
  {
    slug: 'necessary',
    label: 'Necessary proposition',
    detail: 'ḍarūrī — necessarily P',
    insert: 'necessary every S is P',
  },
  {
    slug: 'perpetual',
    label: 'Perpetual proposition',
    detail: 'dāʾima — always P',
    insert: 'perpetual every S is P',
  },
  {
    slug: 'absolute',
    label: 'Absolute proposition',
    detail: 'muṭlaqa ʿāmma — P at some time',
    insert: 'absolute every S is P',
  },
  {
    slug: 'possible',
    label: 'Possible proposition',
    detail: 'mumkina — two-sided possibility',
    insert: 'possible some S is not P',
  },
  {
    slug: 'syllogism',
    label: 'Modal syllogism',
    detail: 'major / minor / conclusion',
    insert:
      'syllogism\n' +
      '  necessary every M is P\n' +
      '  absolute  every S is M\n' +
      '  necessary every S is P\n' +
      'end',
  },
];

const examples: SlashCommand[] = LOGIC_SYSTEMS
  .find(s => s.slug === 'avicennan')!
  .examples.map(ex => ({
    slug:   `example.${ex.slug}`,
    label:  `Example: ${ex.natural}`,
    detail: ex.dsl,
    insert: ex.dsl,
  }));

export const AVICENNAN_COMMANDS: SlashCommand[] = [...structural, ...examples];

export function findAvicennanCommand(slug: string): SlashCommand | undefined {
  return AVICENNAN_COMMANDS.find(c => c.slug === slug);
}
