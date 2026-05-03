// Command registry for the Medieval Logic Lab editor.

import { LOGIC_SYSTEMS } from '../data/logic-systems';
import type { SlashCommand } from './LogicCmEditor';

const structural: SlashCommand[] = [
  {
    slug: 'necessity-de-dicto',
    label: 'Necessity (de dicto)',
    detail: 'L — Necessarily, all S is P',
    insert: 'Necessarily, all S is P',
  },
  {
    slug: 'necessity-de-re',
    label: 'Necessity (de re)',
    detail: 'L — All S is necessarily P',
    insert: 'All S is necessarily P',
  },
  {
    slug: 'possibility-de-dicto',
    label: 'Possibility (de dicto)',
    detail: 'M — Possibly, some S is P',
    insert: 'Possibly, some S is P',
  },
  {
    slug: 'possibility-de-re',
    label: 'Possibility (de re)',
    detail: 'M — Some S is possibly P',
    insert: 'Some S is possibly P',
  },
  {
    slug: 'modal-syllogism',
    label: 'Modal syllogism (LLL)',
    detail: 'three lines, necessity throughout',
    insert: 'Necessarily, all M is P\nNecessarily, all S is M\nTherefore necessarily all S is P',
  },
  {
    slug: 'lxl-syllogism',
    label: 'Mixed L/X syllogism',
    detail: 'the contested Barbara LXL-1',
    insert: 'Necessarily, all M is P\nAll S is M\nTherefore necessarily all S is P',
  },
  {
    slug: 'sorites',
    label: 'Sorites (Aristotelian)',
    detail: 'multi-step term-logic chain',
    insert: 'All A is B\nAll B is C\nAll C is D\nTherefore all A is D',
  },
  {
    slug: 'compact-modal',
    label: 'Compact modal syllogism',
    detail: 'mood-figure / reading / S,M,P',
    insert: 'LLL-1/de-re/S,M,P',
  },
];

const examples: SlashCommand[] = (LOGIC_SYSTEMS
  .find(s => s.slug === 'medieval')?.examples ?? [])
  .map(ex => ({
    slug:   `example.${ex.slug}`,
    label:  `Example: ${ex.natural}`,
    detail: ex.dsl,
    insert: ex.dsl,
  }));

export const MEDIEVAL_COMMANDS: SlashCommand[] = [...structural, ...examples];

export function findMedievalCommand(slug: string): SlashCommand | undefined {
  return MEDIEVAL_COMMANDS.find(c => c.slug === slug);
}
