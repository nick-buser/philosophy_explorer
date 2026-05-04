import { LOGIC_SYSTEMS } from '../data/logic-systems';
import type { SlashCommand } from './LogicCmEditor';

const structural: SlashCommand[] = [
  {
    slug: 'paksha',
    label: 'Insert paksha line',
    detail: 'subject of the inference',
    insert: 'paksha:   ',
  },
  {
    slug: 'sadhya',
    label: 'Insert sadhya line',
    detail: 'property to prove',
    insert: 'sadhya:   ',
  },
  {
    slug: 'hetu',
    label: 'Insert hetu line',
    detail: 'reason / inferential mark',
    insert: 'hetu:     ',
  },
  {
    slug: 'sapaksha',
    label: 'Insert sapaksha list',
    detail: 'similar examples (bear the sādhya)',
    insert: 'sapaksha: ',
  },
  {
    slug: 'vipaksha',
    label: 'Insert vipaksha list',
    detail: 'dissimilar examples (lack the sādhya)',
    insert: 'vipaksha: ',
  },
  {
    slug: 'has-hetu',
    label: 'Insert + (hetu present)',
    detail: 'mark an example as bearing the hetu',
    insert: '+',
  },
  {
    slug: 'lacks-hetu',
    label: 'Insert − (hetu absent)',
    detail: 'mark an example as lacking the hetu',
    insert: '-',
  },
];

const examples: SlashCommand[] = (LOGIC_SYSTEMS
  .find(s => s.slug === 'indian-buddhist')?.examples ?? [])
  .map(ex => ({
    slug:   `example.${ex.slug}`,
    label:  `Example: ${ex.natural}`,
    detail: ex.dsl,
    insert: ex.dsl,
  }));

export const INDIAN_COMMANDS: SlashCommand[] = [...structural, ...examples];
