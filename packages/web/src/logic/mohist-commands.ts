// Command registry for the Mohist Logic Lab editor. Each command
// surfaces as a toolbar button and a CodeMirror autocomplete option.
//
// The editor holds a whole móu argument, so a structural command
// inserts a complete minimal argument rather than a fragment.

import { LOGIC_SYSTEMS } from '../data/logic-systems';
import type { SlashCommand } from './LogicCmEditor';

function skeleton(outcome: string, flag: string | null): string {
  const lines = [
    'base:     a white horse | a horse',
    'operator: ride',
    `outcome:  ${outcome}`,
  ];
  if (flag) lines.push(`flag:     ${flag}`);
  return lines.join('\n');
}

const structural: SlashCommand[] = [
  {
    slug: 'mou',
    label: 'Móu skeleton',
    detail: 'base / operator / outcome',
    insert: skeleton('shi-er-ran', null),
  },
  {
    slug: 'shi-er-ran',
    label: '是而然 — this, and so',
    detail: 'the parallel carries — móu is licensed',
    insert: skeleton('shi-er-ran', null),
  },
  {
    slug: 'shi-er-bu-ran',
    label: '是而不然 — this, but not so',
    detail: 'identical form, parallel fails — flag: opacity',
    insert: skeleton('shi-er-bu-ran', 'opacity'),
  },
  {
    slug: 'yi-zhou-yi-bu-zhou',
    label: '一周而一不周 — one comprehensive, one not',
    detail: 'scope asymmetry — flag: scope',
    insert: skeleton('yi-zhou-yi-bu-zhou', 'scope'),
  },
  {
    slug: 'yi-shi-yi-fei',
    label: '一是而一非 — one so, one not',
    detail: 'kind not preserved — flag: sortal',
    insert: skeleton('yi-shi-yi-fei', 'sortal'),
  },
];

const examples: SlashCommand[] = LOGIC_SYSTEMS
  .find(s => s.slug === 'mohist')!
  .examples.map(ex => ({
    slug:   `example.${ex.slug}`,
    label:  `Example: ${ex.natural}`,
    detail: ex.dsl,
    insert: ex.dsl,
  }));

export const MOHIST_COMMANDS: SlashCommand[] = [...structural, ...examples];

export function findMohistCommand(slug: string): SlashCommand | undefined {
  return MOHIST_COMMANDS.find(c => c.slug === slug);
}
