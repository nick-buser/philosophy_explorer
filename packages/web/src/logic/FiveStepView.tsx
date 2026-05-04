import type { Step } from './indian-render';

// Step-by-step textual presentation of the five-membered Nyāya
// inference. The matrix in the lab roadmap classes this as a new
// visualization family ("step-by-step textual"). Each step is a
// numbered row showing the Sanskrit / English label pair on the
// left and the rendered prose on the right; on narrow viewports
// the label and prose stack.

export function FiveStepView({ steps }: { steps: Step[] }) {
  return (
    <ol className="space-y-3">
      {steps.map(step => (
        <li
          key={step.ordinal}
          className="rounded-lg border border-gray-800 bg-gray-900/40 p-4 grid gap-2 sm:grid-cols-[auto,1fr] sm:gap-5 items-start"
        >
          <div className="flex items-baseline gap-2 min-w-[8rem]">
            <span className="text-xs font-mono text-gray-600 tabular-nums">{step.ordinal}.</span>
            <div>
              <div className="text-sm text-gray-100 font-medium leading-tight">{step.sanskrit}</div>
              <div className="text-[10px] uppercase tracking-wider text-gray-500 mt-0.5">{step.label}</div>
            </div>
          </div>
          <p className="text-sm text-gray-200 leading-relaxed">{step.text}</p>
        </li>
      ))}
    </ol>
  );
}
