import type { BasicMode, Bhanga, Predication } from './saptabhangi-types';
import { BASIC_MODES, SEVEN_BHANGAS, modeSetKey } from './saptabhangi-types';

// The saptabhaṅgī classification engine.
//
// `classifyBhanga` is total and structural — no proof search. It unions
// the modes asserted across the predication's standpoints into a
// non-empty subset of {asti, nāsti, avaktavya}, and that subset *is*
// one of the seven bhaṅgas by construction.

export type Classification = {
  bhanga: Bhanga;
  // The union of standpoint modes, in BASIC_MODES order. Equal to
  // `bhanga.modes` — surfaced so the UI can show the aggregation.
  presentModes: BasicMode[];
  // Which standpoints contributed each present mode.
  byMode: { mode: BasicMode; standpoints: string[] }[];
};

// The parser guarantees a non-empty standpoint list, so the union is
// always a non-empty subset and the lookup always hits.
export function classifyBhanga(p: Predication): Classification {
  const present = new Set<BasicMode>();
  for (const s of p.standpoints) present.add(s.mode);

  const presentModes = BASIC_MODES.filter(m => present.has(m));
  const key = modeSetKey(presentModes);
  const bhanga = SEVEN_BHANGAS.find(b => modeSetKey(b.modes) === key);
  if (!bhanga) {
    // Unreachable for a parser-produced Predication: every non-empty
    // subset of the 3-set is one of the seven bhaṅgas.
    throw new Error(`no bhaṅga for mode set '${key}'`);
  }

  const byMode = presentModes.map(mode => ({
    mode,
    standpoints: p.standpoints.filter(s => s.mode === mode).map(s => s.name),
  }));

  return { bhanga, presentModes, byMode };
}
