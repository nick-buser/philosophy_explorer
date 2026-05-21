// Command registry for the saptabhaṅgī Logic Lab editor. Each command
// surfaces as a toolbar button and a CodeMirror autocomplete option.
//
// The editor holds a whole predication, so a structural command
// inserts a complete minimal predication rather than a fragment.

import { LOGIC_SYSTEMS } from '../data/logic-systems';
import type { SlashCommand } from './LogicCmEditor';

const structural: SlashCommand[] = [
  {
    slug: 'predication',
    label: 'Predication skeleton',
    detail: 'subject / predicate / one standpoint',
    insert:
      'subject:   the pot\n' +
      'predicate: permanent\n' +
      'standpoint substance : asti',
  },
  {
    slug: 'asti',
    label: 'Standpoint — asti',
    detail: 'a respect in which the predicate holds',
    insert:
      'subject:   the pot\n' +
      'predicate: permanent\n' +
      'standpoint substance : asti',
  },
  {
    slug: 'nasti',
    label: 'Standpoint — nāsti',
    detail: 'a respect in which the predicate fails',
    insert:
      'subject:   the pot\n' +
      'predicate: permanent\n' +
      'standpoint present-shape : nasti',
  },
  {
    slug: 'avaktavya',
    label: 'Standpoint — avaktavya',
    detail: 'a respect in which the predicate is inexpressible',
    insert:
      'subject:   the pot\n' +
      'predicate: permanent\n' +
      'standpoint co-presentation : avaktavya',
  },
  {
    slug: 'standpoint',
    label: 'Sevenfold predication',
    detail: 'all three modes — reaches bhaṅga 7',
    insert:
      'subject:   the pot\n' +
      'predicate: permanent\n' +
      'standpoint substance : asti\n' +
      'standpoint mode      : nasti\n' +
      'standpoint origin    : avaktavya',
  },
];

const examples: SlashCommand[] = LOGIC_SYSTEMS
  .find(s => s.slug === 'saptabhangi')!
  .examples.map(ex => ({
    slug:   `example.${ex.slug}`,
    label:  `Example: ${ex.natural}`,
    detail: ex.dsl,
    insert: ex.dsl,
  }));

export const SAPTABHANGI_COMMANDS: SlashCommand[] = [...structural, ...examples];

export function findSaptabhangiCommand(slug: string): SlashCommand | undefined {
  return SAPTABHANGI_COMMANDS.find(c => c.slug === slug);
}
