// Command registry for the Aristotelian Logic Lab editor. Each command
// surfaces as a toolbar button and a CodeMirror autocomplete option.

import { LOGIC_SYSTEMS } from '../data/logic-systems';
import type { SlashCommand } from './LogicCmEditor';

const structural: SlashCommand[] = [
  {
    slug: 'a-form',
    label: 'Universal affirmative',
    detail: 'A — All S is P',
    insert: 'All S is P',
  },
  {
    slug: 'e-form',
    label: 'Universal negative',
    detail: 'E — No S is P',
    insert: 'No S is P',
  },
  {
    slug: 'i-form',
    label: 'Particular affirmative',
    detail: 'I — Some S is P',
    insert: 'Some S is P',
  },
  {
    slug: 'o-form',
    label: 'Particular negative',
    detail: 'O — Some S is not P',
    insert: 'Some S is not P',
  },
  {
    slug: 'syllogism',
    label: 'Three-line syllogism',
    detail: 'major / minor / conclusion',
    insert: 'All M is P\nAll S is M\nTherefore all S is P',
  },
  {
    slug: 'compact',
    label: 'Compact syllogism',
    detail: 'mood-figure / S,M,P',
    insert: 'AAA-1/S,M,P',
  },
];

const examples: SlashCommand[] = LOGIC_SYSTEMS
  .find(s => s.slug === 'aristotelian')!
  .examples.map(ex => ({
    slug:   `example.${ex.slug}`,
    label:  `Example: ${ex.natural}`,
    detail: ex.dsl,
    insert: ex.dsl,
  }));

export const ARISTOTELIAN_COMMANDS: SlashCommand[] = [...structural, ...examples];

export function findAristotelianCommand(slug: string): SlashCommand | undefined {
  return ARISTOTELIAN_COMMANDS.find(c => c.slug === slug);
}
