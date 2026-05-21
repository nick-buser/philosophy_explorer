import type {
  AvicennanFormula,
  Figure,
  Modality,
  Proposition,
  Quantity,
  Syllogism,
} from './avicennan-types';

// Parser for the Avicennan modal-syllogistic DSL.
//
// Two surfaces share one entry point (`parseAvicennan`):
//
//   single modalized proposition (one line)
//     "necessary every animal is mortal"
//     "possible some human is not awake"
//
//   syllogism block (three propositions: major, minor, conclusion)
//     syllogism
//       necessary every animal is mortal
//       absolute  every human  is animal
//       necessary every human  is mortal
//     end
//
// Proposition grammar:
//   proposition := modality quantifier term "is" ["not"] term
//   modality    := necessary | perpetual | absolute | possible   (+ aliases)
//   quantifier  := every | some | no
//
// A "term" is a single identifier ([A-Za-z][A-Za-z0-9_-]*). Multi-word
// terms are not supported in phase 1 — same restriction as
// aristotelian-parser.ts. `--` and `#` begin a line comment.

export type ParseError = { message: string; position: number };
export type ParseResult =
  | { ok: true;  formula: AvicennanFormula }
  | { ok: false; error: ParseError };

const TERM_RE = /^[A-Za-z][A-Za-z0-9_-]*$/;
const COMMENT_RE = /(?:^|\s)(?:--|#).*$/;

// Transliteration aliases for the four modality tokens — accepted
// alongside the canonical English token, per the indian-parser.ts
// precedent for non-Latin source terminology.
const MODALITY_ALIASES: Record<string, Modality> = {
  necessary: 'necessary',
  daruri: 'necessary',
  daruriyya: 'necessary',
  perpetual: 'perpetual',
  daima: 'perpetual',
  dawam: 'perpetual',
  absolute: 'absolute',
  mutlaqa: 'absolute',
  mutlaq: 'absolute',
  possible: 'possible',
  mumkina: 'possible',
  mumkin: 'possible',
};

export function parseAvicennan(input: string): ParseResult {
  const lines = input
    .split(/\r?\n/)
    .map(l => l.replace(COMMENT_RE, '').trim())
    .filter(l => l.length > 0);

  if (lines.length === 0) {
    return err('empty input', 0);
  }

  const firstWord = lines[0]!.split(/\s+/)[0]!.toLowerCase();
  if (firstWord === 'syllogism') {
    return parseSyllogismBlock(lines);
  }

  if (lines.length === 1) {
    const r = parseProposition(lines[0]!);
    if (!r.ok) return r;
    return { ok: true, formula: { kind: 'proposition', proposition: r.proposition } };
  }

  return err(
    'expected a single modalized proposition, or a "syllogism … end" block of three',
    0,
  );
}

// ─────────────────────────────────────────────────────────────────────
// Single proposition

type PropOk = { ok: true; proposition: Proposition };
type PropResult = PropOk | { ok: false; error: ParseError };

function parseProposition(line: string): PropResult {
  const cleaned = line.replace(/[.;]+\s*$/, '').trim();
  const tokens = cleaned.split(/\s+/);

  // modality
  const modality = MODALITY_ALIASES[tokens[0]?.toLowerCase() ?? ''];
  if (!modality) {
    return err(
      `expected a modality (necessary, perpetual, absolute, possible) at the start of the proposition (got '${tokens[0] ?? ''}')`,
      0,
    );
  }

  // Pattern: <modality> <quantifier> <subject> is [not] <predicate>
  if (tokens.length < 5) {
    return err(
      `proposition too short — expected '${modality} <every|some|no> <S> is <P>'`,
      0,
    );
  }

  const quantWord = tokens[1]!.toLowerCase();
  if (quantWord !== 'every' && quantWord !== 'some' && quantWord !== 'no') {
    return err(`expected quantifier 'every', 'some', or 'no' (got '${tokens[1]}')`, 0);
  }

  const subject = tokens[2]!;
  if (!TERM_RE.test(subject)) {
    return err(`invalid subject term '${subject}' — terms must be a single identifier`, 0);
  }

  const copula = tokens[3]!.toLowerCase();
  if (copula !== 'is' && copula !== 'are') {
    return err(`expected 'is' after the subject (got '${tokens[3]}')`, 0);
  }

  let idx = 4;
  let negated = false;
  if (tokens[idx]?.toLowerCase() === 'not') {
    negated = true;
    idx++;
  }

  if (idx >= tokens.length) {
    return err('expected a predicate term after the copula', 0);
  }
  const predicate = tokens[idx]!;
  if (!TERM_RE.test(predicate)) {
    return err(`invalid predicate term '${predicate}' — terms must be a single identifier`, 0);
  }
  if (idx + 1 < tokens.length) {
    return err(`unexpected trailing token '${tokens[idx + 1]}'`, 0);
  }

  // quantifier × negation grid:
  //   every S is     P  → universal affirmative
  //   no    S is     P  → universal negative
  //   some  S is     P  → particular affirmative
  //   some  S is not P  → particular negative
  let quantity: Quantity;
  let quality: 'affirmative' | 'negative';
  if (quantWord === 'every') {
    if (negated) return err("'every … is not' is not a categorical form (use 'no' or 'some … not')", 0);
    quantity = 'universal';
    quality = 'affirmative';
  } else if (quantWord === 'no') {
    if (negated) return err("'no … is not' is not a categorical form", 0);
    quantity = 'universal';
    quality = 'negative';
  } else {
    quantity = 'particular';
    quality = negated ? 'negative' : 'affirmative';
  }

  return { ok: true, proposition: { quantity, quality, modality, subject, predicate } };
}

// ─────────────────────────────────────────────────────────────────────
// Syllogism block

function parseSyllogismBlock(lines: string[]): ParseResult {
  // lines[0] starts with `syllogism`; anything after it on that line is
  // disallowed to keep the block shape unambiguous.
  if (lines[0]!.trim().toLowerCase() !== 'syllogism') {
    return err("the 'syllogism' keyword must stand alone on its own line", 0);
  }
  const last = lines[lines.length - 1]!.trim().toLowerCase();
  if (last !== 'end') {
    return err("a 'syllogism' block must be closed with 'end' on its own line", 0);
  }

  const body = lines.slice(1, -1);
  if (body.length !== 3) {
    return err(
      `a syllogism block needs exactly 3 propositions (major, minor, conclusion) — got ${body.length}`,
      0,
    );
  }

  const major = parseProposition(body[0]!);
  if (!major.ok) return major;
  const minor = parseProposition(body[1]!);
  if (!minor.ok) return minor;
  const conclusion = parseProposition(body[2]!);
  if (!conclusion.ok) return conclusion;

  return assembleSyllogism(major.proposition, minor.proposition, conclusion.proposition);
}

// Major/minor are fixed by position in the block. Derive the middle
// term and figure from term arrangement, and validate the shape.
function assembleSyllogism(
  major: Proposition,
  minor: Proposition,
  conclusion: Proposition,
): ParseResult {
  const S = conclusion.subject;
  const P = conclusion.predicate;

  if (major.subject !== P && major.predicate !== P) {
    return err(`the major premise must contain the conclusion's predicate '${P}'`, 0);
  }
  if (minor.subject !== S && minor.predicate !== S) {
    return err(`the minor premise must contain the conclusion's subject '${S}'`, 0);
  }

  const majorMiddle = major.subject === P ? major.predicate : major.subject;
  const minorMiddle = minor.subject === S ? minor.predicate : minor.subject;
  if (majorMiddle !== minorMiddle) {
    return err(
      `premises share no middle term — major has '${majorMiddle}', minor has '${minorMiddle}'`,
      0,
    );
  }
  const middle = majorMiddle;

  const mInMajorIsSubject = major.subject === middle;
  const mInMinorIsSubject = minor.subject === middle;
  const figure: Figure =
      mInMajorIsSubject && !mInMinorIsSubject ? 1
    : !mInMajorIsSubject && !mInMinorIsSubject ? 2
    : mInMajorIsSubject &&  mInMinorIsSubject ? 3
    :                                           4;

  const syllogism: Syllogism = { major, minor, conclusion, middle, figure };
  return { ok: true, formula: { kind: 'syllogism', syllogism } };
}

function err(message: string, position: number): { ok: false; error: ParseError } {
  return { ok: false, error: { message, position } };
}
