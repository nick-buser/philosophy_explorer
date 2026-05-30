import type { BasicMode, Predication, Standpoint } from './saptabhangi-types';

// Parser for the saptabhaṅgī predication DSL. Line-based `key: value`,
// in the `indian-parser.ts` idiom:
//
//   subject:   the pot
//   predicate: permanent
//   standpoint substance : asti        -- qua its clay, permanent
//   standpoint mode      : nasti       -- qua its present shape, not
//   standpoint origin    : avaktavya   -- qua coming-to-be, inexpressible
//
// Grammar:
//   predication := subject-line predicate-line standpoint-line+
//   subject-line   := "subject"   ":" text
//   predicate-line := "predicate" ":" text
//   standpoint-line:= "standpoint" name ":" mode
//   mode           := asti | nasti | avaktavya   (+ IAST aliases)
//
// A predication asserts at least one mode, so an empty standpoint list
// is a parse error. `--` and `#` begin a line comment.

export type ParseError = { message: string; line: number };
export type ParseResult =
  | { ok: true; predication: Predication }
  | { ok: false; error: ParseError };

const COMMENT_RE = /(?:^|\s)(?:--|#).*$/;

// Mode aliases — the canonical ASCII token, the IAST spelling, and a
// plain-English gloss, accepted alongside one another per the
// indian-parser.ts precedent for non-Latin source terminology.
const MODE_ALIASES: Record<string, BasicMode> = {
  asti: 'asti',
  is: 'asti',
  nasti: 'nasti',
  'nāsti': 'nasti',
  avaktavya: 'avaktavya',
  inexpressible: 'avaktavya',
};

// An optional *syāt* / *syād* particle may prefix the mode token —
// `standpoint substance : syād asti` is the same as `: asti`.
const SYAT_PREFIX_RE = /^(?:syāt|syād|syat|syad)\s+/u;

function parseMode(raw: string): BasicMode | null {
  const cleaned = raw.trim().toLowerCase().replace(SYAT_PREFIX_RE, '').trim();
  return MODE_ALIASES[cleaned] ?? null;
}

export function parseSaptabhangi(src: string): ParseResult {
  const lines = src.split(/\r?\n/);

  let subject: string | null = null;
  let predicate: string | null = null;
  const standpoints: Standpoint[] = [];
  const seenNames = new Set<string>();

  for (let i = 0; i < lines.length; i++) {
    const raw = (lines[i] ?? '').replace(COMMENT_RE, '').trim();
    if (raw === '') continue;
    const lineNo = i + 1;

    // standpoint <name> : <mode>
    if (/^standpoint(\s|$)/i.test(raw)) {
      const rest = raw.slice('standpoint'.length);
      const colon = rest.indexOf(':');
      if (colon < 0) {
        return err("a standpoint line is 'standpoint <name>: <mode>' — the ':' is missing", lineNo);
      }
      const name = rest.slice(0, colon).trim();
      if (name === '') {
        return err("standpoint is missing a name before the ':'", lineNo);
      }
      const modeText = rest.slice(colon + 1).trim();
      if (modeText === '') {
        return err(`standpoint '${name}' is missing a mode after the ':'`, lineNo);
      }
      const mode = parseMode(modeText);
      if (!mode) {
        return err(
          `unknown mode '${modeText}' for standpoint '${name}' — expected asti, nasti, or avaktavya`,
          lineNo,
        );
      }
      const nameKey = name.toLowerCase();
      if (seenNames.has(nameKey)) {
        return err(
          `standpoint '${name}' is declared twice — each standpoint asserts exactly one mode`,
          lineNo,
        );
      }
      seenNames.add(nameKey);
      standpoints.push({ name, mode });
      continue;
    }

    // subject: / predicate:
    const colon = raw.indexOf(':');
    if (colon < 0) {
      return err("expected 'subject:', 'predicate:', or 'standpoint <name>: <mode>'", lineNo);
    }
    const key = raw.slice(0, colon).trim().toLowerCase();
    const value = raw.slice(colon + 1).trim();

    if (key === 'subject') {
      if (subject !== null) return err("duplicate 'subject:' line", lineNo);
      if (value === '') return err("'subject:' is empty", lineNo);
      subject = value;
    } else if (key === 'predicate') {
      if (predicate !== null) return err("duplicate 'predicate:' line", lineNo);
      if (value === '') return err("'predicate:' is empty", lineNo);
      predicate = value;
    } else {
      return err(
        `unknown key '${key}' — expected 'subject', 'predicate', or 'standpoint'`,
        lineNo,
      );
    }
  }

  if (subject === null) return err("missing 'subject:' line", 0);
  if (predicate === null) return err("missing 'predicate:' line", 0);
  if (standpoints.length === 0) {
    return err("a predication needs at least one 'standpoint <name>: <mode>' line", 0);
  }

  return { ok: true, predication: { subject, predicate, standpoints } };
}

function err(message: string, line: number): { ok: false; error: ParseError } {
  return { ok: false, error: { message, line } };
}
