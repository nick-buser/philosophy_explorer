import type { Example, ExampleSide, Inference } from './indian-types';

// Parser for the Indian / Buddhist inference DSL. Line-based, key:value:
//
//   paksha:   the mountain
//   sadhya:   fire
//   hetu:     smoke
//   sapaksha: kitchen, forge, brazier
//   vipaksha: lake, dewy ground
//
// Each example may carry a postfix marker indicating whether the
// hetu is present in it:
//   "kitchen+"  — hetu is present
//   "lake-"     — hetu is absent
// Defaults: sapakṣa = +, vipakṣa = − (the canonical case). The
// pakṣa line accepts the same +/− marker; default is +.
//
// The parser is permissive about whitespace, comma vs newline-
// separation inside the example lists, and the order of keys.

export type ParseError = { message: string; line: number };
export type ParseResult =
  | { ok: true; inference: Inference }
  | { ok: false; error: ParseError };

const KEY_ALIASES: Record<string, keyof KeyMap> = {
  // Canonical
  'paksha':    'paksha',
  'sadhya':    'sadhya',
  'hetu':      'hetu',
  'sapaksha':  'sapaksha',
  'vipaksha':  'vipaksha',
  // IAST-flavoured spellings (no diacritics required in the DSL)
  'pakṣa':       'paksha',
  'sādhya':      'sadhya',
  'sapakṣa':     'sapaksha',
  'vipakṣa':     'vipaksha',
  // English glosses
  'subject':   'paksha',
  'property':  'sadhya',
  'reason':    'hetu',
  'similar':   'sapaksha',
  'dissimilar':'vipaksha',
};

type KeyMap = {
  paksha?:   { value: string; line: number };
  sadhya?:   { value: string; line: number };
  hetu?:     { value: string; line: number };
  sapaksha?: { value: string; line: number };
  vipaksha?: { value: string; line: number };
};

export function parseInference(src: string): ParseResult {
  const lines = src.split(/\r?\n/);
  const map: KeyMap = {};

  // Allow continuation: a non-empty line that does not start with a
  // recognised key word + colon is appended to the previous key's value.
  let lastKey: keyof KeyMap | null = null;
  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i] ?? '';
    const trimmed = raw.trim();
    if (trimmed === '' || trimmed.startsWith('#')) continue;

    const colon = trimmed.indexOf(':');
    let isKeyLine = false;
    let key: keyof KeyMap | null = null;
    if (colon > 0) {
      const head = trimmed.slice(0, colon).trim().toLowerCase();
      const resolved = KEY_ALIASES[head];
      if (resolved) {
        isKeyLine = true;
        key = resolved;
      }
    }

    if (isKeyLine && key) {
      const value = trimmed.slice(colon + 1).trim();
      if (map[key]) {
        return { ok: false, error: { message: `duplicate key "${key}"`, line: i + 1 } };
      }
      map[key] = { value, line: i + 1 };
      lastKey = key;
    } else {
      if (!lastKey) {
        return { ok: false, error: { message: `expected "key: value" line`, line: i + 1 } };
      }
      const slot = map[lastKey]!;
      slot.value = slot.value === '' ? trimmed : `${slot.value} ${trimmed}`;
    }
  }

  for (const required of ['paksha', 'sadhya', 'hetu'] as const) {
    if (!map[required]) {
      return { ok: false, error: { message: `missing "${required}:" line`, line: 0 } };
    }
    if (map[required]!.value === '') {
      return { ok: false, error: { message: `"${required}:" is empty`, line: map[required]!.line } };
    }
  }

  const pakshaParsed = parseSubject(map.paksha!.value);
  const sadhya = map.sadhya!.value;
  const hetu = map.hetu!.value;

  const sapakshaList = map.sapaksha
    ? parseExampleList(map.sapaksha.value, 'sapaksha', map.sapaksha.line)
    : { ok: true as const, examples: [] as Example[] };
  if (!sapakshaList.ok) return { ok: false, error: sapakshaList.error };

  const vipakshaList = map.vipaksha
    ? parseExampleList(map.vipaksha.value, 'vipaksha', map.vipaksha.line)
    : { ok: true as const, examples: [] as Example[] };
  if (!vipakshaList.ok) return { ok: false, error: vipakshaList.error };

  return {
    ok: true,
    inference: {
      paksha: pakshaParsed.name,
      sadhya,
      hetu,
      pakshaHasHetu: pakshaParsed.hasHetu,
      examples: [...sapakshaList.examples, ...vipakshaList.examples],
    },
  };
}

function parseSubject(value: string): { name: string; hasHetu: boolean } {
  // Pakṣa default: hetu present (pakṣa-dharmatā holds). A trailing
  // "-" (or "(no hetu)") flips it; a trailing "+" makes it explicit.
  const m = value.match(/^(.*?)\s*([+-])\s*$/);
  if (m && m[1]) {
    return { name: m[1].trim(), hasHetu: m[2] === '+' };
  }
  if (/\(\s*no\s+hetu\s*\)\s*$/i.test(value)) {
    return { name: value.replace(/\(\s*no\s+hetu\s*\)\s*$/i, '').trim(), hasHetu: false };
  }
  return { name: value, hasHetu: true };
}

function parseExampleList(
  value: string, side: ExampleSide, line: number,
): { ok: true; examples: Example[] } | { ok: false; error: ParseError } {
  const items = value.split(/[,;\n]/).map(s => s.trim()).filter(s => s !== '');
  const examples: Example[] = [];
  for (const item of items) {
    const parsed = parseExampleItem(item, side);
    if (!parsed) {
      return { ok: false, error: { message: `could not parse example "${item}"`, line } };
    }
    examples.push(parsed);
  }
  return { ok: true, examples };
}

function parseExampleItem(item: string, side: ExampleSide): Example | null {
  if (item === '') return null;
  // Trailing +/- marker takes precedence.
  const m = item.match(/^(.+?)\s*([+-])\s*$/);
  if (m && m[1]) {
    return { name: m[1].trim(), hasHetu: m[2] === '+', side };
  }
  // Defaults: sapakṣa unmarked = +, vipakṣa unmarked = −.
  return { name: item, hasHetu: side === 'sapaksha', side };
}

// Round-trip helper for the "insert example" command. Produces a
// canonical DSL string matching the parser's grammar.
export function formatInference(inf: Inference): string {
  const sap = inf.examples.filter(e => e.side === 'sapaksha');
  const vip = inf.examples.filter(e => e.side === 'vipaksha');
  const lines: string[] = [
    `paksha:   ${inf.paksha}${inf.pakshaHasHetu ? '' : ' -'}`,
    `sadhya:   ${inf.sadhya}`,
    `hetu:     ${inf.hetu}`,
  ];
  if (sap.length) lines.push(`sapaksha: ${sap.map(formatExample('sapaksha')).join(', ')}`);
  if (vip.length) lines.push(`vipaksha: ${vip.map(formatExample('vipaksha')).join(', ')}`);
  return lines.join('\n');
}

function formatExample(side: ExampleSide) {
  return (e: Example): string => {
    // Print the marker only when it diverges from the default.
    const defaultHas = side === 'sapaksha';
    if (e.hasHetu === defaultHas) return e.name;
    return `${e.name}${e.hasHetu ? '+' : '-'}`;
  };
}
