// Nyāya / Dignāga inference types.
//
// An Indian-tradition inference (anumāna) is built around three
// terms — pakṣa (subject), sādhya (the property to be proved), and
// hetu (the inferential mark / reason) — together with two example
// classes that test the hetu against trairūpya, the three
// characteristics of a valid reason:
//
//   1. pakṣa-dharmatā — the hetu is present in the pakṣa
//   2. sapakṣe sattvam — the hetu is present in (similar) examples
//                        that bear the sādhya
//   3. vipakṣe asattvam — the hetu is absent from (dissimilar)
//                         examples that lack the sādhya
//
// Dignāga's hetu-cakra ("wheel of reason") cross-classifies the
// hetu's relation to the sapakṣa class (all / some / none) against
// its relation to the vipakṣa class (all / some / none), giving
// nine cells. Two cells are valid (sap-all/vip-none and
// sap-some/vip-none); two are contradictory (viruddha — sap-none
// with hetu in some/all of vipakṣa); five are inconclusive
// (anaikāntika).

export type ExampleSide = 'sapaksha' | 'vipaksha';

export type Example = {
  // A short noun phrase identifying the example, e.g. "kitchen".
  name: string;
  // Whether the hetu is present in this example. Convention:
  // sapakṣa unmarked = hasHetu true (the canonical case);
  // vipakṣa unmarked = hasHetu false (the canonical case).
  hasHetu: boolean;
  // Which side this example is on. Distinguishes a sapakṣa with
  // hetu absent from a vipakṣa with hetu absent (which look the
  // same on the hetu axis but differ on the sādhya axis).
  side: ExampleSide;
};

export type Inference = {
  paksha: string;          // subject (e.g. "the mountain")
  sadhya: string;          // property to prove (e.g. "fiery")
  hetu: string;            // inferential mark (e.g. "smoky")
  pakshaHasHetu: boolean;  // pakṣadharmatā assertion
  examples: Example[];     // both sides interleaved, parser order preserved
};

export type SapakshaCount = 'all' | 'some' | 'none';
export type VipakshaCount = 'all' | 'some' | 'none';

// Hetu-cakra cells. The id encodes (sapakṣa, vipakṣa) presence.
export type CellId =
  | 'sap-all/vip-all'   | 'sap-all/vip-some'   | 'sap-all/vip-none'
  | 'sap-some/vip-all'  | 'sap-some/vip-some'  | 'sap-some/vip-none'
  | 'sap-none/vip-all'  | 'sap-none/vip-some'  | 'sap-none/vip-none';

export type CellStatus = 'valid' | 'inconclusive' | 'contradictory';

export type Cell = {
  id: CellId;
  sapaksha: SapakshaCount;
  vipaksha: VipakshaCount;
  status: CellStatus;
  // Sanskrit name of the cell, with an English gloss. The named
  // fallacies follow Dignāga's Nyāyamukha and the standard
  // Nyāya-Bhāṣya labels for the wheel.
  sanskrit: string;
  gloss: string;
};

// All 9 cells of the wheel, in the canonical row-major reading
// (rows = sapakṣa, columns = vipakṣa, both in all/some/none order).
export const HETU_CAKRA: Cell[] = [
  { id: 'sap-all/vip-all',   sapaksha: 'all',  vipaksha: 'all',
    status: 'inconclusive',
    sanskrit: 'sādhāraṇa anaikāntika',
    gloss: 'common — hetu found in every sapakṣa AND every vipakṣa, so it discriminates nothing' },
  { id: 'sap-all/vip-some',  sapaksha: 'all',  vipaksha: 'some',
    status: 'inconclusive',
    sanskrit: 'anaikāntika',
    gloss: 'inconclusive — hetu spans the whole sapakṣa but also leaks into part of the vipakṣa' },
  { id: 'sap-all/vip-none',  sapaksha: 'all',  vipaksha: 'none',
    status: 'valid',
    sanskrit: 'sad-hetu (anvaya-vyatireka)',
    gloss: 'valid — hetu present throughout sapakṣa, absent from vipakṣa: full positive + negative concomitance' },
  { id: 'sap-some/vip-all',  sapaksha: 'some', vipaksha: 'all',
    status: 'inconclusive',
    sanskrit: 'anaikāntika',
    gloss: 'inconclusive — partial sapakṣa coverage but full vipakṣa overlap; hetu fails to track sādhya' },
  { id: 'sap-some/vip-some', sapaksha: 'some', vipaksha: 'some',
    status: 'inconclusive',
    sanskrit: 'anaikāntika',
    gloss: 'inconclusive — partial on both sides; the hetu is uncorrelated with sādhya' },
  { id: 'sap-some/vip-none', sapaksha: 'some', vipaksha: 'none',
    status: 'valid',
    sanskrit: 'sad-hetu (eka-deśa)',
    gloss: 'valid — hetu present in part of the sapakṣa, absent from the whole vipakṣa: weak but sound' },
  { id: 'sap-none/vip-all',  sapaksha: 'none', vipaksha: 'all',
    status: 'contradictory',
    sanskrit: 'viruddha',
    gloss: 'contradictory — hetu absent from every sapakṣa and present in every vipakṣa: it proves the opposite' },
  { id: 'sap-none/vip-some', sapaksha: 'none', vipaksha: 'some',
    status: 'contradictory',
    sanskrit: 'viruddha',
    gloss: 'contradictory — hetu absent from sapakṣa but present in part of the vipakṣa: it tilts toward the negation' },
  { id: 'sap-none/vip-none', sapaksha: 'none', vipaksha: 'none',
    status: 'inconclusive',
    sanskrit: 'asādhāraṇa anaikāntika',
    gloss: 'uncommon — hetu found nowhere except the pakṣa; no positive or negative correlate to ground the inference' },
];

export function findCell(sap: SapakshaCount, vip: VipakshaCount): Cell {
  const c = HETU_CAKRA.find(c => c.sapaksha === sap && c.vipaksha === vip);
  if (!c) throw new Error(`no hetu-cakra cell for (${sap}, ${vip})`);
  return c;
}
