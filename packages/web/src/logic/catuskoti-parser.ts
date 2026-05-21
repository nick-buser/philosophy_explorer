import type { KotiNumber, Proposition, Reading } from './catuskoti-types';

// Parser for the catuṣkoṭi DSL. Line-based `key: value`, in the
// `saptabhangi-parser.ts` idiom:
//
//   proposition: the Tathāgata exists after death
//   koti:        affirmation
//   reading:     prasanga
//
// Grammar:
//   catuskoti   := proposition-line koti-line reading-line?
//   proposition := "proposition" ":" text
//   koti        := "koti" ":" corner
//   reading     := "reading" ":" ("affirming" | "prasanga")
//   corner      := affirmation | negation | both | neither   (+ aliases)
//
// A missing `reading:` line defaults to `affirming`. `--` and `#`
// begin a line comment.

export type ParseError = { message: string; line: number };
export type ParseResult =
  | { ok: true; proposition: Proposition }
  | { ok: false; error: ParseError };

const COMMENT_RE = /(?:^|\s)(?:--|#).*$/;

// Corner aliases — the canonical English token, common synonyms, and
// the bare koṭi number, mapped to the koṭi number.
const KOTI_ALIASES: Record<string, KotiNumber> = {
  affirmation: 1,
  affirm: 1,
  affirmative: 1,
  is: 1,
  asti: 1,
  a: 1,
  '1': 1,
  negation: 2,
  negate: 2,
  negative: 2,
  not: 2,
  nasti: 2,
  'nāsti': 2,
  '2': 2,
  both: 3,
  ubhaya: 3,
  'glut': 3,
  '3': 3,
  neither: 4,
  anubhaya: 4,
  none: 4,
  'gap': 4,
  '4': 4,
};

// Reading aliases.
const READING_ALIASES: Record<string, Reading> = {
  affirming: 'affirming',
  affirm: 'affirming',
  positive: 'affirming',
  prasanga: 'prasanga',
  'prasaṅga': 'prasanga',
  prasangika: 'prasanga',
  rejecting: 'prasanga',
  refuting: 'prasanga',
  negative: 'prasanga',
};

function parseKoti(raw: string): KotiNumber | null {
  return KOTI_ALIASES[raw.trim().toLowerCase()] ?? null;
}

function parseReading(raw: string): Reading | null {
  return READING_ALIASES[raw.trim().toLowerCase()] ?? null;
}

export function parseCatuskoti(src: string): ParseResult {
  const lines = src.split(/\r?\n/);

  let text: string | null = null;
  let koti: KotiNumber | null = null;
  let reading: Reading | null = null;

  for (let i = 0; i < lines.length; i++) {
    const raw = (lines[i] ?? '').replace(COMMENT_RE, '').trim();
    if (raw === '') continue;
    const lineNo = i + 1;

    const colon = raw.indexOf(':');
    if (colon < 0) {
      return err("expected 'proposition:', 'koti:', or 'reading:'", lineNo);
    }
    const key = raw.slice(0, colon).trim().toLowerCase();
    const value = raw.slice(colon + 1).trim();

    if (key === 'proposition') {
      if (text !== null) return err("duplicate 'proposition:' line", lineNo);
      if (value === '') return err("'proposition:' is empty", lineNo);
      text = value;
    } else if (key === 'koti') {
      if (koti !== null) return err("duplicate 'koti:' line", lineNo);
      if (value === '') return err("'koti:' is missing a corner", lineNo);
      const k = parseKoti(value);
      if (!k) {
        return err(
          `unknown koṭi '${value}' — expected affirmation, negation, both, or neither`,
          lineNo,
        );
      }
      koti = k;
    } else if (key === 'reading') {
      if (reading !== null) return err("duplicate 'reading:' line", lineNo);
      if (value === '') return err("'reading:' is missing a value", lineNo);
      const r = parseReading(value);
      if (!r) {
        return err(`unknown reading '${value}' — expected affirming or prasanga`, lineNo);
      }
      reading = r;
    } else {
      return err(
        `unknown key '${key}' — expected 'proposition', 'koti', or 'reading'`,
        lineNo,
      );
    }
  }

  if (text === null) return err("missing 'proposition:' line", 0);
  if (koti === null) return err("missing 'koti:' line", 0);

  // A missing reading defaults to the affirming (positive) catuṣkoṭi.
  return { ok: true, proposition: { text, koti, reading: reading ?? 'affirming' } };
}

function err(message: string, line: number): { ok: false; error: ParseError } {
  return { ok: false, error: { message, line } };
}
