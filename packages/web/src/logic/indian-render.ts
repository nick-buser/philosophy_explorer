import type { Inference } from './indian-types';

// Builders for the canonical five-membered Nyāya inference
// (pañcāvayava): pratijñā / hetu / udāharaṇa / upanaya / nigamana.
// Each step returns the Sanskrit name, an English label, and the
// rendered text that incorporates the inference's terms — so the
// renderer is a pure function of `Inference`. The example sentence
// in step 3 picks the first witness from each side when available.

export type Step = {
  // Canonical step ordinal: 1..5.
  ordinal: number;
  // Sanskrit name for the step.
  sanskrit: string;
  // English label rendered next to the Sanskrit.
  label: string;
  // Rendered prose for this step.
  text: string;
};

export function fiveSteps(inf: Inference): Step[] {
  const sapWithHetu = inf.examples.find(e => e.side === 'sapaksha' && e.hasHetu);
  const vipWithoutHetu = inf.examples.find(e => e.side === 'vipaksha' && !e.hasHetu);

  const exampleClause =
    sapWithHetu && vipWithoutHetu
      ? `wherever there is ${inf.hetu}, there is ${inf.sadhya}, as in the ${sapWithHetu.name}; and where ${inf.sadhya} is absent, ${inf.hetu} is also absent, as in the ${vipWithoutHetu.name}`
      : sapWithHetu
      ? `wherever there is ${inf.hetu}, there is ${inf.sadhya}, as in the ${sapWithHetu.name}`
      : vipWithoutHetu
      ? `where ${inf.sadhya} is absent, ${inf.hetu} is also absent, as in the ${vipWithoutHetu.name}`
      : `(no example was supplied to ground the concomitance — the udāharaṇa is missing)`;

  const upanaya = inf.pakshaHasHetu
    ? sapWithHetu
      ? `${inf.paksha} is ${inf.hetu}, as in the ${sapWithHetu.name}`
      : `${inf.paksha} is ${inf.hetu}`
    : `${inf.paksha} is not ${inf.hetu} — and so the application step does not go through`;

  return [
    {
      ordinal: 1,
      sanskrit: 'pratijñā',
      label: 'Thesis',
      text: `${cap(inf.paksha)} is ${inf.sadhya}.`,
    },
    {
      ordinal: 2,
      sanskrit: 'hetu',
      label: 'Reason',
      text: `Because ${inf.paksha} is ${inf.hetu}.`,
    },
    {
      ordinal: 3,
      sanskrit: 'udāharaṇa',
      label: 'Example',
      text: `${cap(exampleClause)}.`,
    },
    {
      ordinal: 4,
      sanskrit: 'upanaya',
      label: 'Application',
      text: `${cap(upanaya)}.`,
    },
    {
      ordinal: 5,
      sanskrit: 'nigamana',
      label: 'Conclusion',
      text: `Therefore ${inf.paksha} is ${inf.sadhya}.`,
    },
  ];
}

function cap(s: string): string {
  if (!s) return s;
  return s[0]!.toUpperCase() + s.slice(1);
}
