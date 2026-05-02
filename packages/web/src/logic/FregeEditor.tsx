import { useEffect, useRef } from 'react';
import { EditorState } from '@codemirror/state';
import { EditorView, keymap, lineNumbers } from '@codemirror/view';
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands';
import { bracketMatching } from '@codemirror/language';
import {
  autocompletion,
  completionKeymap,
  type CompletionContext,
  type CompletionResult,
} from '@codemirror/autocomplete';
import { FREGE_COMMANDS } from './frege-commands';

// CodeMirror 6 host for the Frege DSL. Near-copy of EgEditor and
// KripkeFormulaEditor; differs only in the slash-command source. The
// design doc anticipates a `LogicCmEditor` extraction once a third
// system uses CodeMirror — Frege is that third system, so a follow-up
// REFAC ticket can collapse all three.

type Props = {
  value: string;
  onChange: (value: string) => void;
  className?: string;
};

function slashCommands(ctx: CompletionContext): CompletionResult | null {
  const match = ctx.matchBefore(/\/[\w\-.]*/);
  if (!match) return null;
  if (match.from === match.to && !ctx.explicit) return null;
  return {
    from: match.from,
    options: FREGE_COMMANDS.map(cmd => ({
      label:  `/${cmd.slug}`,
      detail: cmd.detail,
      info:   cmd.label,
      apply: (view, _completion, from, to) => {
        const cursor = from + (cmd.cursorOffset ?? cmd.insert.length);
        view.dispatch({
          changes: { from, to, insert: cmd.insert },
          selection: { anchor: cursor },
        });
      },
    })),
    validFor: /^\/[\w\-.]*$/,
  };
}

const theme = EditorView.theme({
  '&': {
    fontSize: '14px',
    backgroundColor: 'transparent',
    color: '#e5e7eb',
    height: '100%',
  },
  '.cm-content': {
    fontFamily: "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace",
    padding: '12px 0',
    caretColor: '#e5e7eb',
  },
  '.cm-gutters': {
    backgroundColor: 'transparent',
    border: 'none',
    color: '#4b5563',
  },
  '.cm-activeLine':       { backgroundColor: 'rgba(255,255,255,0.02)' },
  '.cm-activeLineGutter': { backgroundColor: 'rgba(255,255,255,0.02)' },
  '.cm-matchingBracket':  { backgroundColor: 'rgba(96,165,250,0.2)', color: '#93c5fd' },
  '.cm-tooltip': {
    backgroundColor: '#111827',
    border: '1px solid #374151',
    color: '#e5e7eb',
  },
  '.cm-tooltip.cm-tooltip-autocomplete > ul > li[aria-selected]': {
    backgroundColor: '#1f2937',
    color: '#f9fafb',
  },
}, { dark: true });

export function FregeEditor({ value, onChange, className }: Props) {
  const hostRef     = useRef<HTMLDivElement | null>(null);
  const viewRef     = useRef<EditorView | null>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useEffect(() => {
    if (!hostRef.current) return;
    const state = EditorState.create({
      doc: value,
      extensions: [
        lineNumbers(),
        history(),
        bracketMatching(),
        autocompletion({ override: [slashCommands] }),
        keymap.of([...defaultKeymap, ...historyKeymap, ...completionKeymap]),
        theme,
        EditorView.updateListener.of(u => {
          if (u.docChanged) onChangeRef.current(u.state.doc.toString());
        }),
      ],
    });
    const view = new EditorView({ state, parent: hostRef.current });
    viewRef.current = view;
    return () => { view.destroy(); viewRef.current = null; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;
    const current = view.state.doc.toString();
    if (current !== value) {
      view.dispatch({
        changes: { from: 0, to: current.length, insert: value },
      });
    }
  }, [value]);

  return <div ref={hostRef} className={className} />;
}
