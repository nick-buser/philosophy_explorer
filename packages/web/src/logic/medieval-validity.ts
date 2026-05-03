import type { Figure, Mood } from './aristotelian-types';
import {
  ALL_VALID_ENTRIES,
  checkSyllogism,
  DEFAULT_IMPORT,
  lookupByMoodFigure,
  type ImportSetting,
  type ValidEntry,
  type ValidityResult,
} from './aristotelian-validity';
import type {
  ModalMode,
  ModalMood,
  ModalReading,
  ModalSyllogism,
  SoritesChain,
} from './medieval-types';

// Validity for medieval modal syllogisms and sorites chains.
//
// Modal validity (phase 1, Buridan-aligned):
//
// 1. Pure assertoric (modalMood === 'XXX') → delegate to
//    checkSyllogism. This is just the Aristotelian fall-through.
// 2. All-L (LLL) and all-M (MMM): valid iff the assertoric mood is
//    valid in this figure (and not weakened-under-Boolean). Both
//    readings agree.
// 3. Mixed L-X / X-L moods, figure 1:
//      - de re, conclusion L:   valid (Aristotle, Prior Analytics I.9)
//      - de dicto, conclusion X: valid (Theophrastus / Buridan:
//        peiorem semper sequitur conclusio)
// 4. Mixed L-M / M-L / X-M / M-X moods, figure 1, de dicto only,
//    conclusion M: valid (weaker premise rule).
// 5. Anything else: invalid in phase 1. Specifically: mixed-mode
//    moods in figures 2-4, conclusion-mode mismatches, and any de re
//    mixed-mode moods other than LX/XL-figure-1.
//
// The phase-1 cut keeps the table defensible — we cover the famous
// cases (necessity-Barbara, possibility-Barbara, the contested
// Barbara LXL-1) and clearly defer the figure-2/3/4 modal cases that
// medieval authors disagreed on (Albert vs Buridan vs Aristotle's
// own apparently-inconsistent treatment in Prior Analytics I.8-22).

// ─────────────────────────────────────────────────────────────────────
// Modal validity result

export type ModalValidityReason =
  | 'pattern-not-supported'        // mode pattern × figure × reading not in phase-1 table
  | 'conclusion-mode-mismatch'     // pattern accepted but conclusion mode wrong for it
  | 'assertoric-not-in-table'      // underlying AEIO mood is invalid in this figure
  | 'weakened-under-boolean';      // assertoric weakened + boolean import

export type ModalValidityResult =
  | {
      valid: true;
      assertoric: ValidEntry;        // the underlying assertoric entry (Barbara, Celarent, …)
      modalName?: string;            // 'necessity-Barbara' / 'possibility-Celarent' / etc.
      reading: ModalReading;
      note?: string;
    }
  | {
      valid: false;
      reason: ModalValidityReason;
      assertoric?: ValidEntry;
      reading: ModalReading;
      note?: string;
    };

// ─────────────────────────────────────────────────────────────────────
// Pattern rules (the heart of the table)

// Given a modal premise pattern, figure, and reading, what conclusion
// modes does the medieval table accept? Returns the set of valid
// conclusion modes, or an empty array if the pattern is unsupported.
function expectedConclusionModes(
  majorMode: ModalMode,
  minorMode: ModalMode,
  figure: Figure,
  reading: ModalReading,
): ModalMode[] {
  // Both assertoric → caller short-circuits before this is consulted.
  // Defend the invariant anyway.
  if (majorMode === 'X' && minorMode === 'X') return ['X'];

  // Rule 1: both necessary → necessity in any figure (LL → L)
  if (majorMode === 'L' && minorMode === 'L') return ['L'];

  // Rule 2: both possibility → possibility in any figure (MM → M)
  if (majorMode === 'M' && minorMode === 'M') return ['M'];

  // Beyond this point, only figure-1 mixed-mode rules apply in phase 1.
  if (figure !== 1) return [];

  // Rule 3a: L+X / X+L
  //   de re   → L (Aristotle)
  //   de dicto → X (Theophrastus / Buridan)
  if (
    (majorMode === 'L' && minorMode === 'X') ||
    (majorMode === 'X' && minorMode === 'L')
  ) {
    return reading === 'de-re' ? ['L'] : reading === 'de-dicto' ? ['X'] : [];
  }

  // Rule 3b: L+M / M+L / X+M / M+X — de dicto only, conclusion M
  // (weaker premise rule extended to possibility).
  const involvesM = majorMode === 'M' || minorMode === 'M';
  const involvesNonM = majorMode !== 'M' || minorMode !== 'M'; // not both M (caught above)
  if (involvesM && involvesNonM) {
    return reading === 'de-dicto' ? ['M'] : [];
  }

  return [];
}

// ─────────────────────────────────────────────────────────────────────
// Modal-mood naming

// Lightweight naming for the canonical "modal Barbara" / "modal
// Celarent" cases. Only LL→L and MM→M get named in phase 1; mixed
// cases use the assertoric name plus a reading tag.
function modalNameFor(modalMood: ModalMood, assertoricName: string): string | undefined {
  if (modalMood === 'LLL') return `necessity-${assertoricName}`;
  if (modalMood === 'MMM') return `possibility-${assertoricName}`;
  return undefined;
}

// ─────────────────────────────────────────────────────────────────────
// Top-level checker

export function checkModalSyllogism(
  s: ModalSyllogism,
  importSetting: ImportSetting = DEFAULT_IMPORT,
): ModalValidityResult {
  // Pure assertoric → delegate (the page treats `XXX` as
  // Aristotelian-with-a-medieval-frame, which is correct).
  if (s.modalMood === 'XXX') {
    const r: ValidityResult = checkSyllogism(
      {
        major: s.major.base,
        minor: s.minor.base,
        conclusion: s.conclusion.base,
        middle: s.middle,
        mood: s.assertoricMood,
        figure: s.figure,
      },
      importSetting,
    );
    if (r.valid) {
      return { valid: true, assertoric: r.entry, reading: 'assertoric' };
    }
    if (r.reason === 'weakened-under-boolean' && r.entry) {
      return {
        valid: false,
        reason: 'weakened-under-boolean',
        assertoric: r.entry,
        reading: 'assertoric',
      };
    }
    return { valid: false, reason: 'assertoric-not-in-table', reading: 'assertoric' };
  }

  const [majorMode, minorMode, conclusionMode] = [
    s.modalMood[0] as ModalMode,
    s.modalMood[1] as ModalMode,
    s.modalMood[2] as ModalMode,
  ];

  const expected = expectedConclusionModes(majorMode, minorMode, s.figure, s.reading);
  if (expected.length === 0) {
    return {
      valid: false,
      reason: 'pattern-not-supported',
      reading: s.reading,
    };
  }
  if (!expected.includes(conclusionMode)) {
    return {
      valid: false,
      reason: 'conclusion-mode-mismatch',
      reading: s.reading,
      note: `expected conclusion mode ${expected.join(' or ')}, got ${conclusionMode}`,
    };
  }

  // Underlying assertoric mood must be valid in this figure under
  // traditional import. (Boolean is checked separately so we can
  // report 'weakened-under-boolean' specifically.)
  const assertoric = lookupByMoodFigure(s.assertoricMood, s.figure);
  if (!assertoric) {
    return {
      valid: false,
      reason: 'assertoric-not-in-table',
      reading: s.reading,
    };
  }
  if (importSetting === 'boolean' && assertoric.weakened) {
    return {
      valid: false,
      reason: 'weakened-under-boolean',
      assertoric,
      reading: s.reading,
    };
  }

  return {
    valid: true,
    assertoric,
    modalName: modalNameFor(s.modalMood, assertoric.name),
    reading: s.reading,
  };
}

// ─────────────────────────────────────────────────────────────────────
// Sorites

export type SoritesValidityResult =
  | {
      valid: true;
      shape: 'aristotelian' | 'goclenian';
      length: number;                          // number of premises
      stepNames: string[];                     // assertoric mood-figure name per step
    }
  | {
      valid: false;
      shape: 'aristotelian' | 'goclenian';
      failedStepIndex: number;                 // 0-based index into the chain
      reason: string;
    };

export function checkSorites(
  chain: SoritesChain,
  importSetting: ImportSetting = DEFAULT_IMPORT,
): SoritesValidityResult {
  // Decompose the chain into pairwise syllogism steps. Each step is
  // a 3-line syllogism: premise[i], premise[i+1], intermediate
  // conclusion. The intermediate conclusion's terms come from the
  // chain's outer terms after fusing through the shared term.
  const stepNames: string[] = [];
  const premises = chain.premises;

  // Walking conclusion: the proposition we'd assert after applying
  // the first k premises. We start with premise[0] and fuse each
  // subsequent premise through the shared term.
  let walking = premises[0]!;

  for (let i = 1; i < premises.length; i++) {
    const next = premises[i]!;

    // For an Aristotelian chain, the shared term is `next.subject`
    // = `walking.predicate`. The intermediate conclusion has subject
    // `walking.subject` and predicate `next.predicate`.
    //
    // For a Goclenian chain (premises walked tail-to-head):
    // shared term is `walking.subject` = `next.predicate`. The
    // intermediate conclusion has subject `next.subject` and
    // predicate `walking.predicate`.
    let intermediate: { subject: string; predicate: string };
    let major: typeof walking;
    let minor: typeof walking;
    let middle: string;

    if (chain.shape === 'aristotelian') {
      middle = walking.predicate;
      intermediate = { subject: walking.subject, predicate: next.predicate };
      major = next;     // contains predicate of intermediate conclusion
      minor = walking;  // contains subject of intermediate conclusion
    } else {
      middle = walking.subject;
      intermediate = { subject: next.subject, predicate: walking.predicate };
      major = walking;
      minor = next;
    }

    // Build the implicit syllogism. We assume the conclusion form
    // is A (universal affirmative) for the canonical Barbara case;
    // if either premise is non-A, treat the conclusion as adopting
    // the weaker form (the actual fused mood depends on a small
    // case grid, but for phase 1 we restrict sorites to all-A
    // premises and surface a clear error otherwise).
    if (major.form !== 'A' || minor.form !== 'A') {
      return {
        valid: false,
        shape: chain.shape,
        failedStepIndex: i - 1,
        reason: `sorites step ${i} mixes non-A premises (got ${major.form} + ${minor.form}); phase 1 supports all-A Barbara chains only`,
      };
    }

    // Determine the syllogism's figure from term placement of the
    // middle term. For an Aristotelian sorites with all-A premises,
    // each step is figure 1 (M-P, S-M ⊢ S-P). For a Goclenian
    // sorites with all-A premises, each step is also figure 1 by
    // construction — the chain is just walked in reverse.
    const result = checkSyllogism(
      {
        major: major,
        minor: minor,
        conclusion: { form: 'A', subject: intermediate.subject, predicate: intermediate.predicate },
        middle,
        mood: 'AAA' as Mood,
        figure: 1,
      },
      importSetting,
    );

    if (!result.valid) {
      return {
        valid: false,
        shape: chain.shape,
        failedStepIndex: i - 1,
        reason: result.reason === 'weakened-under-boolean'
          ? `sorites step ${i} is weakened under Boolean import`
          : `sorites step ${i} (Barbara) failed validity check`,
      };
    }
    stepNames.push(result.entry.name);

    walking = {
      form: 'A',
      subject: intermediate.subject,
      predicate: intermediate.predicate,
    };
  }

  // Final fused conclusion must match the user-asserted conclusion.
  if (
    walking.subject !== chain.conclusion.subject ||
    walking.predicate !== chain.conclusion.predicate
  ) {
    return {
      valid: false,
      shape: chain.shape,
      failedStepIndex: premises.length - 1,
      reason: `final fused conclusion '${walking.subject} → ${walking.predicate}' does not match the asserted '${chain.conclusion.subject} → ${chain.conclusion.predicate}'`,
    };
  }
  if (chain.conclusion.form !== 'A') {
    return {
      valid: false,
      shape: chain.shape,
      failedStepIndex: premises.length - 1,
      reason: `phase 1 sorites conclusion must be A (got ${chain.conclusion.form})`,
    };
  }

  return {
    valid: true,
    shape: chain.shape,
    length: premises.length,
    stepNames,
  };
}

// ─────────────────────────────────────────────────────────────────────
// Test surface — a generated list of valid modal cases derived from
// the assertoric table. Used by medieval-validity.test.ts to
// round-trip the rule logic.

export type ModalValidCase = {
  assertoricMood: Mood;
  figure: Figure;
  modalMood: ModalMood;
  reading: ModalReading;
  weakened: boolean;
};

function* enumerateModalCases(): Iterable<ModalValidCase> {
  for (const a of ALL_VALID_ENTRIES) {
    const modes: ModalMode[] = ['X', 'L', 'M'];
    const readings: ModalReading[] = ['de-re', 'de-dicto'];
    for (const m1 of modes) for (const m2 of modes) for (const m3 of modes) {
      // Skip the all-X case — it's plain Aristotelian and lives in
      // its own validity table.
      if (m1 === 'X' && m2 === 'X' && m3 === 'X') continue;
      const modalMood = `${m1}${m2}${m3}` as ModalMood;
      for (const reading of readings) {
        const expected = expectedConclusionModes(m1, m2, a.figure, reading);
        if (!expected.includes(m3)) continue;
        yield {
          assertoricMood: a.mood,
          figure: a.figure,
          modalMood,
          reading,
          weakened: a.weakened,
        };
      }
    }
  }
}

export const ALL_MODAL_VALID_CASES: ReadonlyArray<ModalValidCase> = [...enumerateModalCases()];

// Re-exports used by tests/UI for the rule logic.
export const _modalRules = { expectedConclusionModes, modalNameFor };
