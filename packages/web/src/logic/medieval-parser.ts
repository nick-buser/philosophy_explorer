import type {
  CategoricalProposition,
  Figure,
  Mood,
  PropForm,
} from './aristotelian-types';
import type {
  MedievalFormula,
  ModalMode,
  ModalMood,
  ModalProposition,
  ModalReading,
  ModalSyllogism,
  SoritesChain,
  SoritesShape,
} from './medieval-types';

// Parser for the Medieval Syllogistic DSL. Three top-level shapes
// share one entry point (`parseMedieval`):
//
//   long form (single modal proposition)
//     "Necessarily, all Greeks are Mortal"           ; de dicto
//     "All Greeks are necessarily Mortal"            ; de re
//     "Possibly, some swans are not white"           ; de dicto
//     "Some swans are possibly not white"            ; de re
//
//   long form (three-line modal syllogism)
//     "Necessarily, all M is P
//      All S is M
//      Therefore necessarily all S is P"
//
//   long form (sorites — N >= 3 premises + a conclusion)
//     "All A is B
//      All B is C
//      All C is D
//      Therefore all A is D"
//
//   compact (modal)
//     "LXL-1/de-re/Greeks,Mortal,Wise"
//
// Mixing is allowed in syllogisms: assertoric premises can sit
// alongside modal premises. A premise with a de-dicto prefix and a
// de-re infix is rejected (the prefix wins is *not* the rule —
// they're explicit alternatives, and ambiguity would obscure the
// reading the user intended).

export type ParseError = { message: string; position: number };
export type ParseResult =
  | { ok: true;  formula: MedievalFormula }
  | { ok: false; error: ParseError };

const CONCLUSION_KEYWORDS = ['therefore', 'so', 'hence'];
const QUANTIFIERS = ['All', 'No', 'Some'] as const;

const TERM_RE = /^[A-Za-z][A-Za-z0-9_-]*$/;
const COMPACT_HEAD_RE = /^[XLM]{3}-[1-4]\//;

// Map of de-dicto prefix lemma → mode. Trailing comma is stripped
// before matching.
const DE_DICTO_PREFIX: Record<string, ModalMode> = {
  necessarily: 'L',
  possibly:    'M',
};

// Map of de-re infix lemma → mode. Appears between copula (or
// "is not") and predicate.
const DE_RE_INFIX: Record<string, ModalMode> = {
  necessarily: 'L',
  possibly:    'M',
};

export function parseMedieval(input: string): ParseResult {
  const trimmed = input.trim();
  if (trimmed.length === 0) return err('empty input', 0);

  if (COMPACT_HEAD_RE.test(trimmed)) return parseCompact(trimmed);

  const lines = trimmed
    .split(/\r?\n/)
    .map(l => l.trim())
    .filter(l => l.length > 0);

  if (lines.length === 1) {
    const r = parseModalProposition(lines[0]!);
    if (!r.ok) return r;
    return { ok: true, formula: { kind: 'modal-proposition', proposition: r.proposition } };
  }

  if (lines.length === 3) {
    return parseLongSyllogism(lines);
  }

  if (lines.length >= 4) {
    return parseSorites(lines);
  }

  return err(
    `expected 1 line (proposition), 3 lines (syllogism), or 4+ lines (sorites), got ${lines.length}`,
    0,
  );
}

// ─────────────────────────────────────────────────────────────────────
// Single modal proposition

type ModalPropOk = { ok: true; proposition: ModalProposition };
type ModalPropResult = ModalPropOk | { ok: false; error: ParseError };

function parseModalProposition(line: string): ModalPropResult {
  const cleaned = line.replace(/[.;]+\s*$/, '').trim();
  if (cleaned.length === 0) return err('empty proposition', 0);

  // De-dicto prefix? Accept either "Necessarily, ..." (with comma) or
  // "Necessarily ..." (no comma). The trailing-comma form is the
  // canonical dictation; the no-comma form lets a `Therefore
  // necessarily all S is P` conclusion line read naturally.
  let mode: ModalMode = 'X';
  let reading: ModalReading = 'assertoric';
  let body = cleaned;
  let prefixToken: string | null = null;

  const commaPrefix = cleaned.match(/^([A-Za-z]+)\s*,\s*(.*)$/);
  if (commaPrefix) {
    const candidate = commaPrefix[1]!.toLowerCase();
    const m = DE_DICTO_PREFIX[candidate];
    if (m) {
      mode = m;
      reading = 'de-dicto';
      body = commaPrefix[2]!;
      prefixToken = commaPrefix[1]!;
    }
  } else {
    const tokens = cleaned.split(/\s+/);
    if (tokens.length >= 2) {
      const candidate = tokens[0]!.toLowerCase();
      const m = DE_DICTO_PREFIX[candidate];
      if (m) {
        mode = m;
        reading = 'de-dicto';
        body = tokens.slice(1).join(' ');
        prefixToken = tokens[0]!;
      }
    }
  }

  const tokens = body.split(/\s+/);
  if (tokens.length === 0) return err('empty proposition', 0);

  const head = tokens[0]!;
  const quantifier = QUANTIFIERS.find(q => q.toLowerCase() === head.toLowerCase());
  if (!quantifier) {
    return err(
      `expected quantifier 'All', 'No', or 'Some' at start of proposition (got '${head}')`,
      0,
    );
  }
  if (tokens.length < 4) {
    return err(`proposition too short — expected '${quantifier} <S> is/are [modifier] <P>'`, 0);
  }

  const subject = tokens[1]!;
  if (!TERM_RE.test(subject)) {
    return err(`invalid subject term '${subject}' — terms must be a single identifier`, 0);
  }

  const copula = tokens[2]!.toLowerCase();
  if (copula !== 'is' && copula !== 'are') {
    return err(`expected 'is' or 'are' after subject (got '${tokens[2]}')`, 0);
  }

  let idx = 3;
  let negated = false;
  if (tokens[idx]?.toLowerCase() === 'not') {
    negated = true;
    idx++;
  }

  // De-re infix? Look for "necessarily" / "possibly" in the modifier slot.
  let infixMode: ModalMode | null = null;
  if (idx < tokens.length) {
    const candidate = tokens[idx]!.toLowerCase();
    const m = DE_RE_INFIX[candidate];
    if (m) {
      infixMode = m;
      idx++;
    }
  }

  if (infixMode && mode !== 'X') {
    return err(
      `proposition mixes a de-dicto prefix ('${prefixToken ?? ''}') with a de-re modifier ('${tokens[idx - 1]}') — pick one`,
      0,
    );
  }
  if (infixMode) {
    mode = infixMode;
    reading = 'de-re';
  }

  if (idx >= tokens.length) {
    return err('expected predicate term', 0);
  }
  const predicate = tokens[idx]!;
  if (!TERM_RE.test(predicate)) {
    return err(`invalid predicate term '${predicate}' — terms must be a single identifier`, 0);
  }
  if (idx + 1 < tokens.length) {
    return err(`unexpected trailing token '${tokens[idx + 1]}'`, 0);
  }

  let form: PropForm;
  if (quantifier === 'All') {
    if (negated) return err("'All ... is not' is not a categorical form (use 'No' or 'Some not')", 0);
    form = 'A';
  } else if (quantifier === 'No') {
    if (negated) return err("'No ... is not' is not a categorical form", 0);
    form = 'E';
  } else {
    form = negated ? 'O' : 'I';
  }

  const base: CategoricalProposition = { form, subject, predicate };
  return { ok: true, proposition: { base, mode, reading } };
}

// ─────────────────────────────────────────────────────────────────────
// Long-form modal syllogism

function parseLongSyllogism(lines: string[]): ParseResult {
  const conclIdx = lines.findIndex(l => {
    const first = l.split(/\s+/)[0] ?? '';
    return CONCLUSION_KEYWORDS.includes(first.toLowerCase());
  });

  let conclusionLine: string;
  let premiseLines: string[];
  if (conclIdx === -1) {
    conclusionLine = lines[2]!;
    premiseLines = [lines[0]!, lines[1]!];
  } else {
    conclusionLine = lines[conclIdx]!.replace(/^\S+\s+/, '');
    premiseLines = lines.filter((_, i) => i !== conclIdx);
  }

  const concl = parseModalProposition(conclusionLine);
  if (!concl.ok) return concl;
  const p1 = parseModalProposition(premiseLines[0]!);
  if (!p1.ok) return p1;
  const p2 = parseModalProposition(premiseLines[1]!);
  if (!p2.ok) return p2;

  return assembleModalSyllogism(p1.proposition, p2.proposition, concl.proposition);
}

function assembleModalSyllogism(
  premiseA: ModalProposition,
  premiseB: ModalProposition,
  conclusion: ModalProposition,
): ParseResult {
  const S = conclusion.base.subject;
  const P = conclusion.base.predicate;

  const aHasP = premiseA.base.subject === P || premiseA.base.predicate === P;
  const bHasP = premiseB.base.subject === P || premiseB.base.predicate === P;
  if (aHasP === bHasP) {
    return err(
      aHasP
        ? `both premises contain the predicate '${P}' — not a standard syllogism`
        : `neither premise contains the conclusion's predicate '${P}'`,
      0,
    );
  }

  const major = aHasP ? premiseA : premiseB;
  const minor = aHasP ? premiseB : premiseA;

  const minorHasS = minor.base.subject === S || minor.base.predicate === S;
  if (!minorHasS) {
    return err(`the minor premise must contain the conclusion's subject '${S}'`, 0);
  }

  const majorMiddle = major.base.subject === P ? major.base.predicate : major.base.subject;
  const minorMiddle = minor.base.subject === S ? minor.base.predicate : minor.base.subject;
  if (majorMiddle !== minorMiddle) {
    return err(
      `premises share no middle term — major has '${majorMiddle}', minor has '${minorMiddle}'`,
      0,
    );
  }
  const middle = majorMiddle;

  const mInMajorIsSubject = major.base.subject === middle;
  const mInMinorIsSubject = minor.base.subject === middle;
  const figure: Figure =
      mInMajorIsSubject && !mInMinorIsSubject ? 1
    : !mInMajorIsSubject && !mInMinorIsSubject ? 2
    : mInMajorIsSubject &&  mInMinorIsSubject ? 3
    :                                            4;

  const assertoricMood = `${major.base.form}${minor.base.form}${conclusion.base.form}` as Mood;
  const modalMood = `${major.mode}${minor.mode}${conclusion.mode}` as ModalMood;

  // Effective reading: the unique non-assertoric reading among the
  // modally-annotated premises. If they conflict, error.
  const readings = [major.reading, minor.reading, conclusion.reading]
    .filter((r): r is Exclude<ModalReading, 'assertoric'> => r !== 'assertoric');
  let reading: ModalReading;
  if (readings.length === 0) {
    reading = 'assertoric';
  } else if (readings.every(r => r === readings[0])) {
    reading = readings[0]!;
  } else {
    return err(
      'syllogism mixes de re and de dicto modal premises — resolve to a single reading',
      0,
    );
  }

  const syllogism: ModalSyllogism = {
    major, minor, conclusion, middle,
    assertoricMood, modalMood, figure, reading,
  };
  return { ok: true, formula: { kind: 'modal-syllogism', syllogism } };
}

// ─────────────────────────────────────────────────────────────────────
// Sorites

function parseSorites(lines: string[]): ParseResult {
  // Conclusion is the keyword-prefixed line, else the last line.
  const conclIdx = lines.findIndex(l => {
    const first = l.split(/\s+/)[0] ?? '';
    return CONCLUSION_KEYWORDS.includes(first.toLowerCase());
  });

  let conclusionLine: string;
  let premiseLines: string[];
  if (conclIdx === -1) {
    conclusionLine = lines[lines.length - 1]!;
    premiseLines = lines.slice(0, lines.length - 1);
  } else {
    conclusionLine = lines[conclIdx]!.replace(/^\S+\s+/, '');
    premiseLines = lines.filter((_, i) => i !== conclIdx);
  }

  if (premiseLines.length < 3) {
    return err(`sorites needs at least 3 premises (got ${premiseLines.length})`, 0);
  }

  // Parse all lines as plain (non-modal) propositions. Any modal
  // annotation on a sorites line is rejected — modal sorites is
  // deferred (see design doc §Open questions).
  const premises: CategoricalProposition[] = [];
  for (const line of premiseLines) {
    const r = parseModalProposition(line);
    if (!r.ok) return r;
    if (r.proposition.mode !== 'X') {
      return err(
        'modal annotations in sorites are not supported in phase 1 (assertoric only)',
        0,
      );
    }
    premises.push(r.proposition.base);
  }

  const conclR = parseModalProposition(conclusionLine);
  if (!conclR.ok) return conclR;
  if (conclR.proposition.mode !== 'X') {
    return err('modal annotations in sorites are not supported in phase 1', 0);
  }
  const conclusion = conclR.proposition.base;

  const shape = detectSoritesShape(premises);
  if (!shape) {
    return err(
      'premises do not form a sorites chain — adjacent premises must share a term in the Aristotelian or Goclenian pattern',
      0,
    );
  }

  // Sanity: the chain's outer terms (subject and predicate of the
  // implicit conclusion) must match the explicit conclusion line.
  const chainHead = shape === 'aristotelian'
    ? premises[0]!.subject
    : premises[premises.length - 1]!.subject;
  const chainTail = shape === 'aristotelian'
    ? premises[premises.length - 1]!.predicate
    : premises[0]!.predicate;
  if (conclusion.subject !== chainHead || conclusion.predicate !== chainTail) {
    return err(
      `conclusion '${conclusion.subject} → ${conclusion.predicate}' does not match the chain ends '${chainHead} → ${chainTail}'`,
      0,
    );
  }

  const chain: SoritesChain = { premises, conclusion, shape };
  return { ok: true, formula: { kind: 'sorites', chain } };
}

// Aristotelian sorites: each line shares its subject with the
// previous line's predicate.
//   line 0:  All A is B
//   line 1:  All B is C   — subject 'B' = previous predicate 'B'
//   line 2:  All C is D   — subject 'C' = previous predicate 'C'
//
// Goclenian: each line shares its predicate with the previous line's
// subject (i.e. the chain runs in the opposite direction).
//   line 0:  All C is D
//   line 1:  All B is C   — predicate 'C' = previous subject 'C'
//   line 2:  All A is B   — predicate 'B' = previous subject 'B'
function detectSoritesShape(premises: CategoricalProposition[]): SoritesShape | null {
  let aristotelian = true;
  let goclenian = true;
  for (let i = 1; i < premises.length; i++) {
    const prev = premises[i - 1]!;
    const cur  = premises[i]!;
    if (cur.subject !== prev.predicate) aristotelian = false;
    if (cur.predicate !== prev.subject) goclenian = false;
  }
  if (aristotelian) return 'aristotelian';
  if (goclenian) return 'goclenian';
  return null;
}

// ─────────────────────────────────────────────────────────────────────
// Compact form (modal only — assertoric compact remains the
// Aristotelian parser's job)

function parseCompact(trimmed: string): ParseResult {
  // Layout: MODE3-figure/reading/S,M,P
  //         e.g. LXL-1/de-re/Greeks,Mortal,Wise
  const slash1 = trimmed.indexOf('/');
  const headPart = trimmed.slice(0, slash1);   // "LXL-1"
  const rest = trimmed.slice(slash1 + 1);      // "de-re/Greeks,Mortal,Wise"

  const slash2 = rest.indexOf('/');
  if (slash2 === -1) {
    return err("modal compact form needs a reading suffix — 'MOOD-figure/de-re/S,M,P'", slash1);
  }
  const readingStr = rest.slice(0, slash2);
  const body = rest.slice(slash2 + 1);

  if (readingStr !== 'de-re' && readingStr !== 'de-dicto') {
    return err(`reading must be 'de-re' or 'de-dicto' (got '${readingStr}')`, slash1 + 1);
  }
  const reading: ModalReading = readingStr;

  const moodStr = headPart.slice(0, 3);
  const figureStr = headPart.slice(4);
  const figureNum = Number(figureStr);
  if (!isFigure(figureNum)) {
    return err(`invalid figure '${figureStr}' (must be 1-4)`, 0);
  }

  const terms = body.split(',').map(t => t.trim());
  if (terms.length !== 3) {
    return err(`compact form needs exactly 3 terms (S,M,P) — got ${terms.length}`, 0);
  }
  for (const t of terms) {
    if (!TERM_RE.test(t)) return err(`invalid term '${t}'`, 0);
  }
  const [S, M, P] = terms as [string, string, string];

  const [m1, m2, m3] = [moodStr[0]!, moodStr[1]!, moodStr[2]!] as [ModalMode, ModalMode, ModalMode];

  // Compact form requires a fixed AAA assertoric base — phase 1 keeps
  // the modal compact narrow (it's the autocomplete-friendly mode for
  // the canonical modal-Barbara family). Mixing AEIO into the modal
  // compact is real but multiplies the surface; long form covers the
  // full grid.
  const figure = figureNum;
  const baseForm: PropForm = 'A';
  const conclusion: ModalProposition = {
    base: { form: baseForm, subject: S, predicate: P },
    mode: m3,
    reading: m3 === 'X' ? 'assertoric' : reading,
  };
  let major: ModalProposition;
  let minor: ModalProposition;
  switch (figure) {
    case 1:
      major = { base: { form: baseForm, subject: M, predicate: P }, mode: m1, reading: m1 === 'X' ? 'assertoric' : reading };
      minor = { base: { form: baseForm, subject: S, predicate: M }, mode: m2, reading: m2 === 'X' ? 'assertoric' : reading };
      break;
    case 2:
      major = { base: { form: baseForm, subject: P, predicate: M }, mode: m1, reading: m1 === 'X' ? 'assertoric' : reading };
      minor = { base: { form: baseForm, subject: S, predicate: M }, mode: m2, reading: m2 === 'X' ? 'assertoric' : reading };
      break;
    case 3:
      major = { base: { form: baseForm, subject: M, predicate: P }, mode: m1, reading: m1 === 'X' ? 'assertoric' : reading };
      minor = { base: { form: baseForm, subject: M, predicate: S }, mode: m2, reading: m2 === 'X' ? 'assertoric' : reading };
      break;
    case 4:
      major = { base: { form: baseForm, subject: P, predicate: M }, mode: m1, reading: m1 === 'X' ? 'assertoric' : reading };
      minor = { base: { form: baseForm, subject: M, predicate: S }, mode: m2, reading: m2 === 'X' ? 'assertoric' : reading };
      break;
  }

  const assertoricMood = 'AAA' as Mood;
  const modalMood = moodStr as ModalMood;

  // Reading at the syllogism level: 'assertoric' iff every mode is X,
  // else the chosen reading (parser already guards against mixed
  // de-re/de-dicto by virtue of the single suffix).
  const allAssertoric = m1 === 'X' && m2 === 'X' && m3 === 'X';
  const effectiveReading: ModalReading = allAssertoric ? 'assertoric' : reading;

  const syllogism: ModalSyllogism = {
    major, minor, conclusion, middle: M,
    assertoricMood, modalMood, figure, reading: effectiveReading,
  };
  return { ok: true, formula: { kind: 'modal-syllogism', syllogism } };
}

function isFigure(n: number): n is Figure {
  return n === 1 || n === 2 || n === 3 || n === 4;
}

function err(message: string, position: number): { ok: false; error: ParseError } {
  return { ok: false, error: { message, position } };
}
