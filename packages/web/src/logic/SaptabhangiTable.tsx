import { SEVEN_BHANGAS } from './saptabhangi-types';
import type { BhangaNumber } from './saptabhangi-types';

// The seven-cell bhaṅga table — the system's closed structure laid out
// in the traditional Jain order. When a predication is classified, its
// bhaṅga cell is highlighted.

const MODE_GLYPH: Record<string, string> = {
  asti: '+',
  nasti: '−',
  avaktavya: '·',
};

type Props = {
  active: BhangaNumber | null;
  className?: string;
};

export function SaptabhangiTable({ active, className }: Props) {
  return (
    <div className={className}>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
        {SEVEN_BHANGAS.map(b => {
          const isActive = active === b.n;
          return (
            <div
              key={b.n}
              className={
                'rounded border px-2.5 py-2 ' +
                (isActive
                  ? 'bg-amber-500/15 border-amber-500/40'
                  : 'bg-gray-950 border-gray-800')
              }
            >
              <div className="flex items-baseline justify-between gap-2">
                <span
                  className={
                    'text-sm font-medium ' +
                    (isActive ? 'text-amber-200' : 'text-gray-300')
                  }
                >
                  {b.n}. {b.sanskrit}
                </span>
                <span className="text-xs font-mono text-gray-500">
                  {b.modes.map(m => MODE_GLYPH[m]).join(' ')}
                </span>
              </div>
              <p className="mt-0.5 text-xs text-gray-500 leading-snug">{b.gloss}</p>
            </div>
          );
        })}
      </div>
      <p className="mt-2 text-[11px] text-gray-600 leading-relaxed">
        <span className="font-mono text-gray-500">+</span> asti ·{' '}
        <span className="font-mono text-gray-500">−</span> nāsti ·{' '}
        <span className="font-mono text-gray-500">·</span> avaktavya. The seven
        bhaṅgas are the seven non-empty subsets of the three modes.
      </p>
    </div>
  );
}
