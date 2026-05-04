import {
  type Cell,
  type Inference,
  type SapakshaCount,
  type VipakshaCount,
  findCell,
} from './indian-types';

// Engine for Indian-tradition inference. Runs trairūpya (the three
// characteristics) on the input and places the hetu on Dignāga's
// nine-cell wheel. Both views agree by construction: the cell's
// status is derived from the same sapakṣa / vipakṣa counts the
// trairūpya conditions report.

export type TrairupyaCheck = {
  satisfied: boolean;
  reason: string;
};

export type Trairupya = {
  // 1. The hetu is present in the pakṣa.
  pakshadharmata: TrairupyaCheck;
  // 2. The hetu is present in (at least one) similar example
  //    bearing the sādhya. Strict reading per Dignāga: "in some
  //    sapakṣa." Empty sapakṣa list ⇒ unsatisfied (no positive
  //    correlate to ground the inference).
  sapakshasattva: TrairupyaCheck & { count: SapakshaCount };
  // 3. The hetu is absent from every dissimilar example. Empty
  //    vipakṣa list ⇒ vacuously satisfied — no counter-instance
  //    is exhibited. Marked vacuous in the reason text so the UI
  //    can flag it as "tested against no counter-examples."
  vipakshasattva: TrairupyaCheck & { count: VipakshaCount };
};

export type Verdict =
  | { kind: 'valid'; cell: Cell }
  | { kind: 'inconclusive'; cell: Cell }
  | { kind: 'contradictory'; cell: Cell }
  // Pakṣa-dharmatā fails — the hetu isn't even in the subject;
  // the inference is asiddha (unestablished) before the wheel is
  // consulted. Distinct from the wheel-level fallacies above.
  | { kind: 'unestablished'; cell: Cell };

export type Classification = {
  trairupya: Trairupya;
  verdict: Verdict;
};

export function classify(inference: Inference): Classification {
  const pakshadharmata: TrairupyaCheck = inference.pakshaHasHetu
    ? { satisfied: true,  reason: `the ${inference.hetu} is present in ${inference.paksha}` }
    : { satisfied: false, reason: `the ${inference.hetu} is not present in ${inference.paksha} — pakṣa-dharmatā fails (asiddha)` };

  const sap = countHetuPresence(inference, 'sapaksha');
  const vip = countHetuPresence(inference, 'vipaksha');

  const sapakshasattva: Trairupya['sapakshasattva'] =
    sap.total === 0
      ? { satisfied: false, count: 'none',
          reason: 'no sapakṣa examples were given — the hetu has no positive correlate' }
      : sap.withHetu === 0
      ? { satisfied: false, count: 'none',
          reason: `the hetu is absent from every sapakṣa (${sap.total}/0)` }
      : { satisfied: true,
          count: sap.withHetu === sap.total ? 'all' : 'some',
          reason: sap.withHetu === sap.total
            ? `the hetu is present in every sapakṣa (${sap.withHetu}/${sap.total})`
            : `the hetu is present in some sapakṣa (${sap.withHetu}/${sap.total})` };

  const vipakshasattva: Trairupya['vipakshasattva'] =
    vip.total === 0
      ? { satisfied: true, count: 'none',
          reason: 'no vipakṣa examples were given — vipakṣe-asattva holds vacuously' }
      : vip.withHetu === 0
      ? { satisfied: true, count: 'none',
          reason: `the hetu is absent from every vipakṣa (${vip.total} tested)` }
      : { satisfied: false,
          count: vip.withHetu === vip.total ? 'all' : 'some',
          reason: vip.withHetu === vip.total
            ? `the hetu is present in every vipakṣa (${vip.withHetu}/${vip.total}) — vipakṣe-asattva fails`
            : `the hetu leaks into part of the vipakṣa (${vip.withHetu}/${vip.total}) — vipakṣe-asattva fails` };

  const cell = findCell(sapakshasattva.count, vipakshasattva.count);

  // Pakṣa-dharmatā gates the whole inference. If it fails, the
  // wheel still places the hetu (so the UI can show *where* it
  // would have landed) but the verdict is "unestablished".
  if (!pakshadharmata.satisfied) {
    return {
      trairupya: { pakshadharmata, sapakshasattva, vipakshasattva },
      verdict: { kind: 'unestablished', cell },
    };
  }

  return {
    trairupya: { pakshadharmata, sapakshasattva, vipakshasattva },
    verdict: { kind: cell.status === 'valid'
      ? 'valid'
      : cell.status === 'contradictory'
      ? 'contradictory'
      : 'inconclusive', cell },
  };
}

function countHetuPresence(
  inf: Inference, side: 'sapaksha' | 'vipaksha',
): { total: number; withHetu: number } {
  let total = 0;
  let withHetu = 0;
  for (const e of inf.examples) {
    if (e.side !== side) continue;
    total += 1;
    if (e.hasHetu) withHetu += 1;
  }
  return { total, withHetu };
}
