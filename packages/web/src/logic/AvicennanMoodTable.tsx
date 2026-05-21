import { useMemo } from 'react';
import { ALL_VALID_ENTRIES } from './aristotelian-validity';
import type { Figure as AristotelianFigure } from './aristotelian-types';
import {
  FIGURE_1_INHERITANCE,
  FIGURE_RULES,
  assertoricMood,
} from './avicennan-validity';
import { MODALITY_INFO } from './avicennan-render';
import type { Syllogism } from './avicennan-types';

// The modalized mood table — the Lab's primary view.
//
// Two layers, matching how an Avicennan verdict is decided:
//   1. The figure-1 modality-inheritance grid (the conclusion follows
//      the major premise).
//   2. The valid assertoric skeletons, grouped by figure. A modal
//      syllogism is admissible only if its quantity × quality letters
//      land on one of these moods.
//
// When a syllogism is parsed, its active mood-figure cell and the
// matching inheritance row are highlighted.

const FIGURES: AristotelianFigure[] = [1, 2, 3, 4];

type Props = {
  syllogism: Syllogism | null;
  className?: string;
};

export function AvicennanMoodTable({ syllogism, className }: Props) {
  const active = useMemo(
    () => (syllogism ? { mood: assertoricMood(syllogism), figure: syllogism.figure } : null),
    [syllogism],
  );

  const byFigure = useMemo(() => {
    const map = new Map<number, typeof ALL_VALID_ENTRIES[number][]>();
    for (const e of ALL_VALID_ENTRIES) {
      const list = map.get(e.figure) ?? [];
      list.push(e);
      map.set(e.figure, list);
    }
    return map;
  }, []);

  return (
    <div className={className}>
      <InheritanceGrid activeMajor={syllogism?.figure === 1 ? syllogism.major.modality : null} />

      <div className="mt-5 space-y-4">
        {FIGURES.map(fig => {
          const rule = FIGURE_RULES.find(r => r.figure === fig)!;
          const entries = byFigure.get(fig) ?? [];
          const isActiveFigure = active?.figure === fig;
          return (
            <div key={fig}>
              <div className="flex items-baseline gap-2 flex-wrap">
                <span className="text-xs font-semibold text-gray-300">Figure {fig}</span>
                <span className="text-xs text-gray-500">{rule.rule}</span>
              </div>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {entries.map(e => {
                  const isActive =
                    isActiveFigure && active?.mood === e.mood;
                  return (
                    <span
                      key={`${e.mood}-${e.figure}`}
                      title={`${e.name} (${e.mood}-${e.figure})${e.weakened ? ' — weakened' : ''}`}
                      className={
                        'text-[11px] px-1.5 py-0.5 rounded border font-mono ' +
                        (isActive
                          ? 'bg-amber-500/20 text-amber-200 border-amber-500/40'
                          : 'bg-gray-950 text-gray-400 border-gray-800')
                      }
                    >
                      {e.name} · {e.mood}
                    </span>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function InheritanceGrid({ activeMajor }: { activeMajor: string | null }) {
  return (
    <div>
      <div className="text-xs font-semibold text-gray-300">
        Figure 1 — modality inheritance
      </div>
      <p className="mt-1 text-xs text-gray-500 leading-relaxed">
        The conclusion follows the <span className="text-gray-300">major</span> premise (de re).
        The minor’s modality never changes the verdict.
      </p>
      <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-1.5">
        {FIGURE_1_INHERITANCE.map(row => {
          const isActive = activeMajor === row.major;
          const info = MODALITY_INFO[row.major];
          return (
            <div
              key={row.major}
              className={
                'flex items-center justify-between gap-2 rounded border px-2 py-1.5 text-xs ' +
                (isActive
                  ? 'bg-amber-500/15 border-amber-500/40'
                  : 'bg-gray-950 border-gray-800')
              }
            >
              <span className={isActive ? 'text-amber-200' : 'text-gray-300'}>
                {row.major} major <span className="text-gray-600">({info.arabic})</span>
              </span>
              <span className="text-gray-500">→ {row.conclusion}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
