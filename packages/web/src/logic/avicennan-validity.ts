import type { Mood } from './aristotelian-types';
import { lookupByMoodFigure } from './aristotelian-validity';
import type {
  Figure,
  Modality,
  Proposition,
  Syllogism,
  SyllogismVerdict,
} from './avicennan-types';
import { letterOf } from './avicennan-types';

// Validity for Avicennan modal-temporal syllogisms (phase 1).
//
// A verdict has two layers, decided in order:
//
//   1. Assertoric skeleton. Strip the modalities; the underlying
//      quantity × quality mood (A/E/I/O letters) must be one of the 24
//      valid Aristotelian moods for the figure. Avicenna predates the
//      Boolean reading, so we use the traditional table (existential
//      import granted) — the 9 weakened moods are admitted.
//
//   2. Modality. Which modality the conclusion inherits:
//
//      Figure 1 — the conclusion follows the MAJOR premise's modality.
//        This is Avicenna's signature de re result, defended against
//        Theophrastus's "weaker premise" (peiorem) rule: a necessary
//        major with a merely-absolute minor still yields a NECESSARY
//        conclusion (the contested LXL syllogism). See Street, "Arabic
//        and Islamic Philosophy of Language and Logic" (SEP), and
//        Hodges, *Mathematical Background to the Logic of Ibn Sīnā*.
//
//      Figures 2-4 — phase 1 admits only UNIFORM-modality moods (all
//        three propositions carry the same modality); the conclusion
//        inherits that shared modality. Mixed-modality moods outside
//        figure 1 turn on modal conversion, whose behaviour is
//        modality-sensitive and contested; they are deferred to phase
//        2, exactly as medieval-validity.ts defers figure-2/3/4 mixed
//        modal moods.
//
// `avicennan-validity.test.ts` cross-checks the table below against a
// hand-transcribed list of rows from the Street reconstruction.
//
// Phase-2 scope (per docs/formal-logic/avicennan.md): the
// two-dimensional subject-side/copula-side modality, a semantic model
// checker over individuals × times, and the hypothetical syllogistic.

// ─────────────────────────────────────────────────────────────────────
// Modality power — the alethic-temporal strength chain.
//
//   necessary > perpetual > absolute
//
// `possible` (two-sided possibility — possibly P and possibly not-P) is
// NOT on this chain: a necessary conclusion does not entail a two-sided
// possible one, so `possible` is treated as incomparable to the other
// three.

const POWER: Record<Modality, number> = {
  necessary: 3,
  perpetual: 2,
  absolute: 1,
  possible: 0,
};

export type ModalityComparison = 'equal' | 'stronger' | 'weaker' | 'incomparable';

// Compare a STATED conclusion modality against the one that follows.
export function compareModality(stated: Modality, follows: Modality): ModalityComparison {
  if (stated === follows) return 'equal';
  if (stated === 'possible' || follows === 'possible') return 'incomparable';
  return POWER[stated] > POWER[follows] ? 'stronger' : 'weaker';
}

// ─────────────────────────────────────────────────────────────────────
// Modality inheritance

// The modality the conclusion inherits from the premises, or `null` if
// the mood is not decided by the phase-1 table (an invalid assertoric
// skeleton, or a mixed-modality mood outside figure 1).
export function inheritedModality(s: Syllogism): Modality | null {
  if (!assertoricSkeletonValid(s)) return null;

  if (s.figure === 1) {
    // De re: the conclusion follows the major premise.
    return s.major.modality;
  }

  // Figures 2-4: uniform-modality moods only.
  if (s.major.modality === s.minor.modality) {
    return s.major.modality;
  }
  return null;
}

// The underlying A/E/I/O mood must be a valid Aristotelian mood for the
// figure under the traditional (existential-import) reading.
export function assertoricSkeletonValid(s: Syllogism): boolean {
  return lookupByMoodFigure(assertoricMood(s), s.figure) !== undefined;
}

export function assertoricMood(s: Syllogism): Mood {
  return `${letterOf(s.major)}${letterOf(s.minor)}${letterOf(s.conclusion)}` as Mood;
}

// ─────────────────────────────────────────────────────────────────────
// Verdict

export function checkSyllogism(s: Syllogism): SyllogismVerdict {
  if (!assertoricSkeletonValid(s)) {
    return {
      kind: 'invalid',
      reason: `the assertoric skeleton ${assertoricMood(s)}-${s.figure} is not a valid Aristotelian mood — the syllogism fails before modality is considered`,
    };
  }

  const follows = inheritedModality(s);
  if (follows === null) {
    // Skeleton is valid, so this is the mixed-modality figure-2-4 case.
    return {
      kind: 'invalid',
      reason: `phase 1 decides mixed-modality moods in figure 1 only; this is a figure-${s.figure} mood with differing premise modalities (${s.major.modality} major, ${s.minor.modality} minor) — deferred to phase 2`,
    };
  }

  const stated = s.conclusion.modality;
  const cmp = compareModality(stated, follows);

  if (cmp === 'stronger') {
    return {
      kind: 'invalid',
      reason: `the conclusion claims '${stated}', but only '${follows}' follows from these premises`,
    };
  }
  if (cmp === 'incomparable') {
    return {
      kind: 'invalid',
      reason: `the conclusion claims '${stated}', but the premises yield '${follows}' — two-sided possibility is not comparable to the necessary/perpetual/absolute modalities`,
    };
  }

  // 'equal' or 'weaker' — the stated conclusion is entailed. Report the
  // strongest modality that actually follows.
  return { kind: 'valid', inheritedModality: follows };
}

// ─────────────────────────────────────────────────────────────────────
// Mood-table support
//
// Phase-1 modality rule, per figure, for the AvicennanMoodTable view.

export type FigureRule = {
  figure: Figure;
  rule: string;
};

export const FIGURE_RULES: readonly FigureRule[] = [
  { figure: 1, rule: 'conclusion follows the major premise (de re)' },
  { figure: 2, rule: 'uniform modality only — all three propositions share one modality' },
  { figure: 3, rule: 'uniform modality only — all three propositions share one modality' },
  { figure: 4, rule: 'uniform modality only — all three propositions share one modality' },
];

// A worked inheritance row for figure 1: a major modality and the
// conclusion modality it forces (the minor modality is free in figure
// 1 — the conclusion never depends on it).
export const FIGURE_1_INHERITANCE: ReadonlyArray<{ major: Modality; conclusion: Modality }> = [
  { major: 'necessary', conclusion: 'necessary' },
  { major: 'perpetual', conclusion: 'perpetual' },
  { major: 'absolute',  conclusion: 'absolute'  },
  { major: 'possible',  conclusion: 'possible'  },
];

// Re-export for tests: build a Proposition quickly from its parts.
export function mkProposition(
  quantity: Proposition['quantity'],
  quality: Proposition['quality'],
  modality: Modality,
  subject: string,
  predicate: string,
): Proposition {
  return { quantity, quality, modality, subject, predicate };
}
