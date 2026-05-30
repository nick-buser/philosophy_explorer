import type { CategoryId, MouArgument, MouFlag } from './mohist-types';

// Parser for the Mohist móu DSL. Line-based `key: value`, in the
// `catuskoti-parser.ts` idiom:
//
//   base:     a white horse | a horse
//   operator: ride
//   outcome:  shi-er-ran
//   flag:     opacity        (optional)
//   gloss:    ...            (optional)
//
// Grammar:
//   mohist    := base-line operator-line outcome-line flag-line? gloss-line?
//   base      := "base" ":" term "|" term
//   operator  := "operator" ":" text
//   outcome   := "outcome" ":" category
//   flag      := "flag" ":" ("opacity" | "scope" | "sortal")   (+ aliases)
//   gloss     := "gloss" ":" text
//
// A missing `flag:` line means "no failure mode named." `--` and `#`
// begin a line comment.

export type ParseError = { message: string; line: number };
export type ParseResult =
  | { ok: true; argument: MouArgument }
  | { ok: false; error: ParseError };

const COMMENT_RE = /(?:^|\s)(?:--|#).*$/;

// Outcome aliases — the canonical kebab token, the Chinese name, a
// short alias, and the bare category number.
const OUTCOME_ALIASES: Record<string, CategoryId> = {
  'shi-er-ran': 'shi-er-ran',
  '是而然': 'shi-er-ran',
  'transfers': 'shi-er-ran',
  'transfer': 'shi-er-ran',
  'holds': 'shi-er-ran',
  '1': 'shi-er-ran',
  'shi-er-bu-ran': 'shi-er-bu-ran',
  '是而不然': 'shi-er-bu-ran',
  '2': 'shi-er-bu-ran',
  'yi-zhou-yi-bu-zhou': 'yi-zhou-yi-bu-zhou',
  '一周而一不周': 'yi-zhou-yi-bu-zhou',
  'yi-zhou': 'yi-zhou-yi-bu-zhou',
  'zhou': 'yi-zhou-yi-bu-zhou',
  '3': 'yi-zhou-yi-bu-zhou',
  'yi-shi-yi-fei': 'yi-shi-yi-fei',
  '一是而一非': 'yi-shi-yi-fei',
  'yi-shi': 'yi-shi-yi-fei',
  '4': 'yi-shi-yi-fei',
};

// Flag aliases.
const FLAG_ALIASES: Record<string, MouFlag> = {
  opacity: 'opacity',
  opaque: 'opacity',
  intensional: 'opacity',
  referential: 'opacity',
  scope: 'scope',
  quantifier: 'scope',
  zhou: 'scope',
  comprehensive: 'scope',
  sortal: 'sortal',
  sort: 'sortal',
  kind: 'sortal',
  part: 'sortal',
};

function parseOutcome(raw: string): CategoryId | null {
  return OUTCOME_ALIASES[raw.trim().toLowerCase()] ?? null;
}

function parseFlag(raw: string): MouFlag | null {
  return FLAG_ALIASES[raw.trim().toLowerCase()] ?? null;
}

export function parseMohist(src: string): ParseResult {
  const lines = src.split(/\r?\n/);

  let base: { subject: string; predicate: string } | null = null;
  let operator: string | null = null;
  let outcome: CategoryId | null = null;
  let flag: MouFlag | null = null;
  let flagSeen = false;
  let gloss: string | null = null;

  for (let i = 0; i < lines.length; i++) {
    const raw = (lines[i] ?? '').replace(COMMENT_RE, '').trim();
    if (raw === '') continue;
    const lineNo = i + 1;

    const colon = raw.indexOf(':');
    if (colon < 0) {
      return err("expected 'base:', 'operator:', 'outcome:', 'flag:', or 'gloss:'", lineNo);
    }
    const key = raw.slice(0, colon).trim().toLowerCase();
    const value = raw.slice(colon + 1).trim();

    if (key === 'base') {
      if (base !== null) return err("duplicate 'base:' line", lineNo);
      const bar = value.indexOf('|');
      if (bar < 0) {
        return err("'base:' must be two terms separated by '|' — 'X | Y'", lineNo);
      }
      const subject = value.slice(0, bar).trim();
      const predicate = value.slice(bar + 1).trim();
      if (subject === '') return err("'base:' is missing the first term", lineNo);
      if (predicate === '') return err("'base:' is missing the second term", lineNo);
      if (value.indexOf('|', bar + 1) >= 0) {
        return err("'base:' has more than two terms — expected exactly one '|'", lineNo);
      }
      base = { subject, predicate };
    } else if (key === 'operator') {
      if (operator !== null) return err("duplicate 'operator:' line", lineNo);
      if (value === '') return err("'operator:' is empty", lineNo);
      operator = value;
    } else if (key === 'outcome') {
      if (outcome !== null) return err("duplicate 'outcome:' line", lineNo);
      if (value === '') return err("'outcome:' is missing a category", lineNo);
      const o = parseOutcome(value);
      if (!o) {
        return err(
          `unknown outcome '${value}' — expected shi-er-ran, shi-er-bu-ran, ` +
            'yi-zhou-yi-bu-zhou, or yi-shi-yi-fei',
          lineNo,
        );
      }
      outcome = o;
    } else if (key === 'flag') {
      if (flagSeen) return err("duplicate 'flag:' line", lineNo);
      flagSeen = true;
      if (value === '') return err("'flag:' is missing a value", lineNo);
      const f = parseFlag(value);
      if (!f) {
        return err(`unknown flag '${value}' — expected opacity, scope, or sortal`, lineNo);
      }
      flag = f;
    } else if (key === 'gloss') {
      if (gloss !== null) return err("duplicate 'gloss:' line", lineNo);
      if (value === '') return err("'gloss:' is empty", lineNo);
      gloss = value;
    } else {
      return err(
        `unknown key '${key}' — expected 'base', 'operator', 'outcome', 'flag', or 'gloss'`,
        lineNo,
      );
    }
  }

  if (base === null) return err("missing 'base:' line", 0);
  if (operator === null) return err("missing 'operator:' line", 0);
  if (outcome === null) return err("missing 'outcome:' line", 0);

  return { ok: true, argument: { base, operator, outcome, flag, gloss } };
}

function err(message: string, line: number): { ok: false; error: ParseError } {
  return { ok: false, error: { message, line } };
}
