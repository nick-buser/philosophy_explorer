import { useEffect, useRef } from 'react';
import { EditorState, type Extension } from '@codemirror/state';
import { EditorView, keymap, lineNumbers } from '@codemirror/view';
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands';
import { bracketMatching } from '@codemirror/language';
import {
  autocompletion,
  completionKeymap,
  type CompletionContext,
  type CompletionResult,
} from '@codemirror/autocomplete';

// Shared CodeMirror 6 host for every Logic Lab DSL editor. The only
// per-system input is the slash-command list; everything else
// (extensions, theme, mount/sync lifecycle) lives here so that the ~10
// planned logic systems do not each carry a near-verbatim copy.
//
// Behavior intentionally NOT shared: parsing, validation, rendering,
// and the command lists themselves stay in each system's own files.
// `extraExtensions` is the single escape hatch for a system that ever
// genuinely needs to diverge from the shared CodeMirror config.

export type SlashCommand = {
  slug: string;                 // "cut", "example.modus-ponens"
  label: string;                // human-readable name
  detail?: string;              // hint shown in the autocomplete popup
  insert: string;               // text to insert at the cursor
  cursorOffset?: number;        // cursor offset within `insert` (default: end)
};

type Props = {
  value: string;
  onChange: (value: string) => void;
  commands: readonly SlashCommand[];
  className?: string;
  extraExtensions?: readonly Extension[];
};

function buildSlashCompletion(commands: readonly SlashCommand[]) {
  return (ctx: CompletionContext): CompletionResult | null => {
    const match = ctx.matchBefore(/\/[\w\-.]*/);
    if (!match) return null;
    if (match.from === match.to && !ctx.explicit) return null;
    return {
      from: match.from,
      options: commands.map(cmd => ({
        label: `/${cmd.slug}`,
        detail: cmd.detail,
        info: cmd.label,
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

export function LogicCmEditor({
  value,
  onChange,
  commands,
  className,
  extraExtensions,
}: Props) {
  const hostRef     = useRef<HTMLDivElement | null>(null);
  const viewRef     = useRef<EditorView | null>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  // Mount once. `commands` and `extraExtensions` are captured at mount;
  // changing them after mount is not supported (no caller does this).
  useEffect(() => {
    if (!hostRef.current) return;
    const slash = buildSlashCompletion(commands);
    const state = EditorState.create({
      doc: value,
      extensions: [
        lineNumbers(),
        history(),
        bracketMatching(),
        autocompletion({ override: [slash] }),
        keymap.of([...defaultKeymap, ...historyKeymap, ...completionKeymap]),
        theme,
        ...(extraExtensions ?? []),
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

  // Sync external value changes (e.g. clicking an example).
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