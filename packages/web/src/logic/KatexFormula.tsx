import { useEffect, useRef } from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';

// Thin wrapper around katex.render. Display-mode by default — the
// formula sits in a panel where vertical space is fine. Input is TeX
// source (use `renderKatex` from kripke-render to produce it).

type Props = {
  tex: string;
  className?: string;
  displayMode?: boolean;
};

export function KatexFormula({ tex, className, displayMode = true }: Props) {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!ref.current) return;
    katex.render(tex, ref.current, {
      throwOnError: false,
      displayMode,
      output: 'html',
    });
  }, [tex, displayMode]);

  return <div ref={ref} className={className} />;
}