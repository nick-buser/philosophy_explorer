import type { ReactNode } from 'react';
import type { ImportSetting } from '../aristotelian-validity';

export function SectionHeading({ children }: { children: ReactNode }) {
  return (
    <h2 className="text-xs font-semibold tracking-widest uppercase text-gray-500 mb-4">
      {children}
    </h2>
  );
}

export function ImportToggle({
  value, onChange,
}: {
  value: ImportSetting;
  onChange: (s: ImportSetting) => void;
}) {
  const options: { id: ImportSetting; label: string; title: string }[] = [
    {
      id: 'traditional',
      label: 'Traditional',
      title: 'Universal A/E carry existential import — the 9 weakened moods are valid.',
    },
    {
      id: 'boolean',
      label: 'Boolean',
      title: 'No existential import — A/E are conditionals; the 9 weakened moods become invalid.',
    },
  ];
  return (
    <div
      role="radiogroup"
      aria-label="Existential import"
      className="inline-flex rounded border border-gray-800 bg-gray-900 overflow-hidden"
    >
      {options.map(opt => {
        const active = value === opt.id;
        return (
          <button
            key={opt.id}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(opt.id)}
            title={opt.title}
            className={
              'text-xs px-2.5 py-1.5 transition-colors ' +
              (active
                ? 'bg-blue-500/15 text-blue-200'
                : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200')
            }
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
