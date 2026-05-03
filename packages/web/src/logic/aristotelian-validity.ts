import type { Figure, Mood, Syllogism } from './aristotelian-types';

// Validity table for Aristotelian syllogisms.
//
// 24 valid mood-figure pairs, keyed `{mood}-{figure}` → traditional name
// + a `weakened` flag for the 9 moods that depend on existential
// import (the universal A/E carrying "exists at least one S"). Phase 1
// adopts the traditional reading where existential import holds, so
// weakened moods are listed as valid; the UI can annotate them.
//
// See docs/formal-logic/aristotelian-syllogistic.md §Validity.

export type ValidEntry = {
  name: string;
  weakened: boolean;
};

type Key = `${Mood}-${Figure}`;

const ENTRIES: Partial<Record<Key, ValidEntry>> = {
  // Figure 1 (M-P, S-M ⊢ S-P)
  'AAA-1': { name: 'Barbara',    weakened: false },
  'EAE-1': { name: 'Celarent',   weakened: false },
  'AII-1': { name: 'Darii',      weakened: false },
  'EIO-1': { name: 'Ferio',      weakened: false },
  'AAI-1': { name: 'Barbari',    weakened: true  },
  'EAO-1': { name: 'Celaront',   weakened: true  },

  // Figure 2 (P-M, S-M ⊢ S-P)
  'EAE-2': { name: 'Cesare',     weakened: false },
  'AEE-2': { name: 'Camestres',  weakened: false },
  'EIO-2': { name: 'Festino',    weakened: false },
  'AOO-2': { name: 'Baroco',     weakened: false },
  'AEO-2': { name: 'Camestrop',  weakened: true  },
  'EAO-2': { name: 'Cesaro',     weakened: true  },

  // Figure 3 (M-P, M-S ⊢ S-P)
  'AAI-3': { name: 'Darapti',    weakened: true  },
  'IAI-3': { name: 'Disamis',    weakened: false },
  'AII-3': { name: 'Datisi',     weakened: false },
  'EAO-3': { name: 'Felapton',   weakened: true  },
  'OAO-3': { name: 'Bocardo',    weakened: false },
  'EIO-3': { name: 'Ferison',    weakened: false },

  // Figure 4 (P-M, M-S ⊢ S-P)
  'AAI-4': { name: 'Bramantip',  weakened: true  },
  'AEE-4': { name: 'Camenes',    weakened: false },
  'IAI-4': { name: 'Dimaris',    weakened: false },
  'EAO-4': { name: 'Fesapo',     weakened: true  },
  'EIO-4': { name: 'Fresison',   weakened: false },
  'AEO-4': { name: 'Camenop',    weakened: true  },
};

export type ValidityResult =
  | { valid: true;  entry: ValidEntry }
  | { valid: false };

export function checkSyllogism(s: Syllogism): ValidityResult {
  const key = `${s.mood}-${s.figure}` as Key;
  const entry = ENTRIES[key];
  return entry ? { valid: true, entry } : { valid: false };
}

export function lookupByMoodFigure(mood: Mood, figure: Figure): ValidEntry | undefined {
  return ENTRIES[`${mood}-${figure}` as Key];
}

export const ALL_VALID_ENTRIES: ReadonlyArray<{ mood: Mood; figure: Figure } & ValidEntry> =
  Object.entries(ENTRIES)
    .filter((kv): kv is [Key, ValidEntry] => kv[1] !== undefined)
    .map(([k, v]) => {
      const dash = k.indexOf('-');
      return {
        mood:   k.slice(0, dash) as Mood,
        figure: Number(k.slice(dash + 1)) as Figure,
        ...v,
      };
    });
