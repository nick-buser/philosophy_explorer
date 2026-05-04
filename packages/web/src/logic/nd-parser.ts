import type { Argument } from './nd-types';
import { parseFol } from './fol-parser';

// ND argument DSL. Premises and conclusion are FOL-style formulas
// (parseFol handles them). The shape is one of:
//
//   p, p -> q |- q                       single line, comma-separated
//   p; p -> q |- q                       semicolons accepted too
//   p\np -> q\n|- q                      one premise per line, ⊢ before conclusion
//   |- p -> p                            no premises
//
// `|-`, `⊢`, and `therefore` all mark the conclusion. Whitespace and
// blank lines are ignored. A bare formula with no turnstile is treated
// as ` |- formula` — convenient for demonstrating tautologies.

export type ParseError = { message: string; position: number };
export type ParseArgumentResult =
  | { ok: true;  argument: Argument }
  | { ok: false; error: ParseError };

const TURNSTILES = ['|-', '⊢', 'therefore'];

export function parseArgument(input: string): ParseArgumentResult {
  const cleaned = input.replace(/\r\n?/g, '\n').trim();
  if (!cleaned) {
    return { ok: false, error: { message: 'empty input', position: 0 } };
  }

  const turnstileIdx = findTurnstile(cleaned);

  let premiseSrc = '';
  let conclusionSrc = '';
  if (turnstileIdx === null) {
    conclusionSrc = cleaned;
  } else {
    premiseSrc = cleaned.slice(0, turnstileIdx.index);
    conclusionSrc = cleaned.slice(turnstileIdx.index + turnstileIdx.length);
  }

  const premiseTexts = splitPremises(premiseSrc);
  const premises = [];
  for (const { text, offset } of premiseTexts) {
    const r = parseFol(text);
    if (!r.ok) {
      return { ok: false, error: { message: `premise: ${r.error.message}`, position: offset + r.error.position } };
    }
    premises.push(r.formula);
  }

  const conclusionText = conclusionSrc.replace(/\s+/g, ' ').trim();
  if (!conclusionText) {
    return { ok: false, error: { message: 'expected a conclusion after ⊢', position: cleaned.length } };
  }
  const c = parseFol(conclusionText);
  if (!c.ok) {
    const concOffset = turnstileIdx ? turnstileIdx.index + turnstileIdx.length : 0;
    return { ok: false, error: { message: `conclusion: ${c.error.message}`, position: concOffset + c.error.position } };
  }

  return { ok: true, argument: { premises, conclusion: c.formula } };
}

function findTurnstile(s: string): { index: number; length: number } | null {
  let bracketDepth = 0;
  for (let i = 0; i < s.length; i++) {
    const ch = s[i]!;
    if (ch === '(') bracketDepth++;
    else if (ch === ')') bracketDepth = Math.max(0, bracketDepth - 1);
    if (bracketDepth > 0) continue;
    for (const t of TURNSTILES) {
      if (s.startsWith(t, i)) {
        if (t === 'therefore') {
          const before = i === 0 ? '' : s[i - 1]!;
          const after  = s[i + t.length] ?? '';
          if (/[A-Za-z0-9_]/.test(before) || /[A-Za-z0-9_]/.test(after)) continue;
        }
        return { index: i, length: t.length };
      }
    }
  }
  return null;
}

function splitPremises(src: string): { text: string; offset: number }[] {
  const out: { text: string; offset: number }[] = [];
  let depth = 0;
  let start = 0;
  let hasContent = false;

  const flush = (end: number) => {
    const slice = src.slice(start, end);
    const trimmed = slice.trim();
    if (!trimmed) return;
    const offset = start + slice.indexOf(trimmed);
    out.push({ text: trimmed, offset });
  };

  for (let i = 0; i < src.length; i++) {
    const ch = src[i]!;
    if (ch === '(') depth++;
    else if (ch === ')') depth = Math.max(0, depth - 1);
    if (depth === 0 && (ch === ',' || ch === ';' || ch === '\n')) {
      flush(i);
      start = i + 1;
      continue;
    }
    if (!/\s/.test(ch)) hasContent = true;
  }
  flush(src.length);
  if (!hasContent && src.length > 0) return [];
  return out;
}