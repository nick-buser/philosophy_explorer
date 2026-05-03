import type {
  AristotelianFormula,
  CategoricalProposition,
  Figure,
  Mood,
  PropForm,
  Syllogism,
} from './aristotelian-types';

// Parser for the Aristotelian Syllogistic DSL. Two input modes share
// one entry point (`parseAristotelian`):
//
//   long form (single proposition)
//     "All Greeks are Mortal"
//     "Some swans are not white."
//
//   long form (three-line syllogism)
//     "All men are Mortal
//      All Greeks are men
//      Therefore all Greeks are Mortal"
//
//   compact form
//     "AAA-1/Greeks,Mortal,Wise"
//     "EIO-2/dog,bird,red"
//
// Long-form rules:
//   - Lines may end with '.', ';', or nothing.
//   - The conclusion line is the one prefixed with 'Therefore' / 'So' /
//     'Hence' (case-insensitive) if present, else the last line.
//   - Premise order (major-first vs minor-first) is detected from term
//     content, not from position — the line containing the conclusion's
//     predicate is treated as the major premise.
//   - A "term" is a single identifier (alphanumeric + `_-`). Phase 1
//     does not support multi-word terms; this keeps parsing
//     unambiguous since copula and negation keywords use the same
//     character class. A future ticket may relax this.
//
// Compact-form grammar:
//   compact := mood '-' figure '/' term ',' term ',' term
//   mood    := [AEIO][AEIO][AEIO]
//   figure  := [1-4]

import { quantityOf, qualityOf } from './aristotelian-types';

export type ParseError = { message: string; position: number };
export type ParseResult =
  | { ok: true;  formula: AristotelianFormula }
  | { ok: false; error: ParseError };

const CONCLUSION_KEYWORDS = ['therefore', 'so', 'hence'];
const QUANTIFIERS = ['All', 'No', 'Some'] as const;

const TERM_RE = /^[A-Za-z][A-Za-z0-9_-]*$/;
const COMPACT_HEAD_RE = /^[AEIO]{3}-[1-4]\//;

export function parseAristotelian(input: string): ParseResult {
  const trimmed = input.trim();
  if (trimmed.length === 0) {
    return err('empty input', 0);
  }

  if (COMPACT_HEAD_RE.test(trimmed)) {
    return parseCompact(trimmed, input);
  }

  const lines = trimmed
    .split(/\r?\n/)
    .map(l => l.trim())
    .filter(l => l.length > 0);

  if (lines.length === 1) {
    const r = parseProposition(lines[0]!);
    if (!r.ok) return r;
    return { ok: true, formula: { kind: 'proposition', proposition: r.proposition } };
  }

  if (lines.length === 3) {
    return parseLongSyllogism(lines);
  }

  return err(
    `expected 1 line (proposition) or 3 lines (syllogism), got ${lines.length}`,
    0,
  );
}

// ─────────────────────────────────────────────────────────────────────
// Single proposition

type PropOk = { ok: true; proposition: CategoricalProposition };
type PropResult = PropOk | { ok: false; error: ParseError };

function parseProposition(line: string): PropResult {
  // Strip trailing terminator.
  const cleaned = line.replace(/[.;]+\s*$/, '').trim();
  const tokens = cleaned.split(/\s+/);
  if (tokens.length === 0) return err('empty proposition', 0);

  const head = tokens[0]!;
  const quantifier = QUANTIFIERS.find(q => q.toLowerCase() === head.toLowerCase());
  if (!quantifier) {
    return err(
      `expected quantifier 'All', 'No', or 'Some' at start of proposition (got '${head}')`,
      0,
    );
  }

  // Pattern: <Quant> <subject> (is|are) (not)? <predicate>
  if (tokens.length < 4) {
    return err(`proposition too short — expected '${quantifier} <S> is/are <P>'`, 0);
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

  if (idx >= tokens.length) {
    return err('expected predicate term after copula', 0);
  }
  const predicate = tokens[idx]!;
  if (!TERM_RE.test(predicate)) {
    return err(`invalid predicate term '${predicate}' — terms must be a single identifier`, 0);
  }
  if (idx + 1 < tokens.length) {
    return err(`unexpected trailing token '${tokens[idx + 1]}'`, 0);
  }

  // Apply quantifier × negation grid:
  //   All  S is     P  → A
  //   No   S is     P  → E
  //   Some S is     P  → I
  //   Some S is not P  → O
  // 'All ... is not' and 'No ... is not' are not valid Aristotelian forms.
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

  return { ok: true, proposition: { form, subject, predicate } };
}

// ─────────────────────────────────────────────────────────────────────
// Long-form syllogism

function parseLongSyllogism(lines: string[]): ParseResult {
  // Locate the conclusion: any line whose first word is a conclusion
  // keyword. Strip the keyword before parsing.
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

  const conclusion = parseProposition(conclusionLine);
  if (!conclusion.ok) return conclusion;
  const p1 = parseProposition(premiseLines[0]!);
  if (!p1.ok) return p1;
  const p2 = parseProposition(premiseLines[1]!);
  if (!p2.ok) return p2;

  return assembleSyllogism(p1.proposition, p2.proposition, conclusion.proposition);
}

// Determine major/minor by which premise contains the conclusion's
// predicate (P). Then derive the middle term and figure. Reports a
// clear error for non-syllogism shapes (e.g. four distinct terms,
// premises sharing no term).
function assembleSyllogism(
  premiseA: CategoricalProposition,
  premiseB: CategoricalProposition,
  conclusion: CategoricalProposition,
): ParseResult {
  const S = conclusion.subject;
  const P = conclusion.predicate;

  const aHasP = premiseA.subject === P || premiseA.predicate === P;
  const bHasP = premiseB.subject === P || premiseB.predicate === P;

  if (aHasP === bHasP) {
    return err(
      aHasP
        ? `both premises contain the predicate '${P}' — not a standard syllogism (the major term should appear in exactly one premise)`
        : `neither premise contains the conclusion's predicate '${P}'`,
      0,
    );
  }

  const major = aHasP ? premiseA : premiseB;
  const minor = aHasP ? premiseB : premiseA;

  const minorHasS = minor.subject === S || minor.predicate === S;
  if (!minorHasS) {
    return err(
      `the minor premise must contain the conclusion's subject '${S}'`,
      0,
    );
  }

  // Middle term = the term in major that isn't P, and the term in minor
  // that isn't S. They must agree.
  const majorMiddle = major.subject === P ? major.predicate : major.subject;
  const minorMiddle = minor.subject === S ? minor.predicate : minor.subject;
  if (majorMiddle !== minorMiddle) {
    return err(
      `premises share no middle term — major has '${majorMiddle}', minor has '${minorMiddle}'`,
      0,
    );
  }
  const middle = majorMiddle;

  // Figure from middle-term placement.
  const mInMajorIsSubject = major.subject === middle;
  const mInMinorIsSubject = minor.subject === middle;
  const figure: Figure =
      mInMajorIsSubject && !mInMinorIsSubject ? 1
    : !mInMajorIsSubject && !mInMinorIsSubject ? 2
    : mInMajorIsSubject &&  mInMinorIsSubject ? 3
    :                                            4;

  const mood = `${major.form}${minor.form}${conclusion.form}` as Mood;

  const syllogism: Syllogism = { major, minor, conclusion, middle, mood, figure };
  return { ok: true, formula: { kind: 'syllogism', syllogism } };
}

// ─────────────────────────────────────────────────────────────────────
// Compact form

function parseCompact(trimmed: string, _original: string): ParseResult {
  const slash = trimmed.indexOf('/');
  const head = trimmed.slice(0, slash);   // e.g. "AAA-1"
  const body = trimmed.slice(slash + 1);  // e.g. "Greeks,Mortal,Wise"

  const moodStr = head.slice(0, 3);
  const figureStr = head.slice(4);
  const figureNum = Number(figureStr);
  if (!isFigure(figureNum)) {
    return err(`invalid figure '${figureStr}' (must be 1-4)`, slash);
  }

  const terms = body.split(',').map(t => t.trim());
  if (terms.length !== 3) {
    return err(`compact form needs exactly 3 terms (S,M,P) — got ${terms.length}`, slash + 1);
  }
  for (const t of terms) {
    if (!TERM_RE.test(t)) {
      return err(`invalid term '${t}' — must be a single identifier`, trimmed.indexOf(t));
    }
  }
  const [S, M, P] = terms as [string, string, string];

  const figure = figureNum;
  const [m1, m2, m3] = [moodStr[0]!, moodStr[1]!, moodStr[2]!] as [PropForm, PropForm, PropForm];

  // Build the three propositions according to the figure's term layout:
  //   Figure 1: M-P, S-M, S-P
  //   Figure 2: P-M, S-M, S-P
  //   Figure 3: M-P, M-S, S-P
  //   Figure 4: P-M, M-S, S-P
  const conclusion: CategoricalProposition = mkProp(m3, S, P);
  let major: CategoricalProposition;
  let minor: CategoricalProposition;
  switch (figure) {
    case 1: major = mkProp(m1, M, P); minor = mkProp(m2, S, M); break;
    case 2: major = mkProp(m1, P, M); minor = mkProp(m2, S, M); break;
    case 3: major = mkProp(m1, M, P); minor = mkProp(m2, M, S); break;
    case 4: major = mkProp(m1, P, M); minor = mkProp(m2, M, S); break;
  }

  const mood = moodStr as Mood;
  const syllogism: Syllogism = { major, minor, conclusion, middle: M, mood, figure };
  return { ok: true, formula: { kind: 'syllogism', syllogism } };
}

function mkProp(form: PropForm, subject: string, predicate: string): CategoricalProposition {
  // Validate the form letter; the regex on the head guarantees A/E/I/O
  // but TS sees a string-letter union.
  void quantityOf(form);
  void qualityOf(form);
  return { form, subject, predicate };
}

function isFigure(n: number): n is Figure {
  return n === 1 || n === 2 || n === 3 || n === 4;
}

function err(message: string, position: number): { ok: false; error: ParseError } {
  return { ok: false, error: { message, position } };
}
