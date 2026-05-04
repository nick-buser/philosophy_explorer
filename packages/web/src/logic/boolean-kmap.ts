import type { BoolFormula } from './boolean-types';
import { collectVariables, evalBool } from './boolean-types';

// Karnaugh map data for 1- to 4-variable Boolean functions. Capped at
// 4 variables because the 4-cube is the largest readable as a flat
// grid; 5+ variables fragment into stacked maps and aren't worth the
// extra UI complexity until someone asks.
//
// Layout convention (4-var case, [a,b,c,d] alphabetical):
//   rows = ab in Gray order   00, 01, 11, 10
//   cols = cd in Gray order   00, 01, 11, 10
// where bit 0 of the truth-table minterm index is variable a (matches
// `boolean-truth-table.ts`). The Gray ordering is what makes
// physically-adjacent cells differ in exactly one variable, which is
// what lets you read prime implicants off the map by eye.

export const KMAP_MAX_VARS = 4;

export type KMapCell = {
  row: number;
  col: number;
  minterm: number;        // truth-table index for this cell
  value: boolean;         // formula's value at this cell
  // Indices into the cover's PI list; usually 0 or 1 entries. When a
  // cell is covered by multiple essential PIs we attach all of them so
  // the renderer can layer fills.
  coverPIs: number[];
};

export type KMapAxis = {
  // Variable names along this axis, e.g. ['a','b'] for 4-var rows.
  // First entry is the high-bit of the Gray label, last is the low-bit.
  variables: string[];
  // Cell labels in display order, aligned with row / col indices.
  // Length is 2^variables.length; values are Gray-code bit strings
  // like '00', '01', '11', '10'.
  labels: string[];
};

export type KMapData = {
  variables: string[];     // canonical variable order, e.g. ['a','b','c','d']
  rows: KMapAxis;
  cols: KMapAxis;
  cells: KMapCell[];       // row-major
  primeImplicants: PrimeImplicant[]; // all PIs (essential or not)
  cover: PrimeImplicant[];           // chosen minimal-ish cover
};

export type PrimeImplicant = {
  // 'pattern' indexes by variable position (matching `variables` order).
  // '0' / '1' means the variable is fixed; '-' means don't-care.
  pattern: string;
  // Truth-table indices covered by this PI.
  minterms: number[];
  // Pre-rendered algebraic label for the implicant, e.g. "a·c′·d".
  label: string;
};

export function buildKMap(formula: BoolFormula): KMapData | null {
  const variables = collectVariables(formula);
  if (variables.length > KMAP_MAX_VARS) return null;

  const n = variables.length;
  const total = n === 0 ? 1 : 1 << n;

  // Compute truth table.
  const truth = new Array<boolean>(total);
  const minterms: number[] = [];
  for (let i = 0; i < total; i++) {
    const env: Record<string, boolean> = {};
    for (let j = 0; j < n; j++) env[variables[j]!] = ((i >> j) & 1) === 1;
    truth[i] = evalBool(formula, env);
    if (truth[i]) minterms.push(i);
  }

  const { rows, cols, cellLayout } = layoutFor(variables);

  // Quine–McCluskey to find prime implicants (over our minterms).
  const primeImplicants = quineMcCluskey(minterms, n).map(pi => ({
    ...pi,
    label: implicantLabel(pi.pattern, variables),
  }));

  // Greedy minimal cover: take essential PIs first, then largest PI
  // covering most uncovered minterms until done.
  const cover = chooseCover(primeImplicants, minterms);

  // Map cover back to cells.
  const coverByMinterm = new Map<number, number[]>();
  cover.forEach((pi, idx) => {
    for (const m of pi.minterms) {
      const list = coverByMinterm.get(m) ?? [];
      list.push(idx);
      coverByMinterm.set(m, list);
    }
  });

  const cells: KMapCell[] = cellLayout.map(({ row, col, minterm }) => ({
    row,
    col,
    minterm,
    value: truth[minterm]!,
    coverPIs: coverByMinterm.get(minterm) ?? [],
  }));

  return { variables, rows, cols, cells, primeImplicants, cover };
}

// ---------- Layout helpers ----------

const GRAY_2 = ['00', '01', '11', '10'];
const GRAY_1 = ['0', '1'];

function layoutFor(variables: string[]): {
  rows: KMapAxis;
  cols: KMapAxis;
  cellLayout: { row: number; col: number; minterm: number }[];
} {
  const n = variables.length;
  const cellLayout: { row: number; col: number; minterm: number }[] = [];

  if (n === 0) {
    return {
      rows: { variables: [], labels: [''] },
      cols: { variables: [], labels: [''] },
      cellLayout: [{ row: 0, col: 0, minterm: 0 }],
    };
  }

  if (n === 1) {
    // Single row, two cols; col bit = variables[0].
    for (const colCode of GRAY_1) {
      const m = parseInt(colCode, 2);
      cellLayout.push({ row: 0, col: GRAY_1.indexOf(colCode), minterm: m });
    }
    return {
      rows: { variables: [], labels: [''] },
      cols: { variables: [variables[0]!], labels: [...GRAY_1] },
      cellLayout,
    };
  }

  if (n === 2) {
    // 2×2: row = variables[0] (a), col = variables[1] (b)
    for (let r = 0; r < 2; r++) {
      for (let c = 0; c < 2; c++) {
        const a = parseInt(GRAY_1[r]!, 2);
        const b = parseInt(GRAY_1[c]!, 2);
        const m = (a << 0) | (b << 1);
        cellLayout.push({ row: r, col: c, minterm: m });
      }
    }
    return {
      rows: { variables: [variables[0]!], labels: [...GRAY_1] },
      cols: { variables: [variables[1]!], labels: [...GRAY_1] },
      cellLayout,
    };
  }

  if (n === 3) {
    // 2×4: rows = variables[0] alone (a), cols = variables[1..2] (bc) Gray.
    for (let r = 0; r < 2; r++) {
      for (let c = 0; c < 4; c++) {
        const a    = parseInt(GRAY_1[r]!, 2);
        const colG = GRAY_2[c]!;
        const bHi  = parseInt(colG[0]!, 2); // first listed = b
        const cLo  = parseInt(colG[1]!, 2); // second listed = c
        const m = (a << 0) | (bHi << 1) | (cLo << 2);
        cellLayout.push({ row: r, col: c, minterm: m });
      }
    }
    return {
      rows: { variables: [variables[0]!],                labels: [...GRAY_1] },
      cols: { variables: [variables[1]!, variables[2]!], labels: [...GRAY_2] },
      cellLayout,
    };
  }

  // n === 4: 4×4. rows = variables[0..1] (ab) Gray, cols = variables[2..3] (cd) Gray.
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      const rowG = GRAY_2[r]!;
      const colG = GRAY_2[c]!;
      const a = parseInt(rowG[0]!, 2);
      const b = parseInt(rowG[1]!, 2);
      const cc = parseInt(colG[0]!, 2);
      const d  = parseInt(colG[1]!, 2);
      const m = (a << 0) | (b << 1) | (cc << 2) | (d << 3);
      cellLayout.push({ row: r, col: c, minterm: m });
    }
  }
  return {
    rows: { variables: [variables[0]!, variables[1]!], labels: [...GRAY_2] },
    cols: { variables: [variables[2]!, variables[3]!], labels: [...GRAY_2] },
    cellLayout,
  };
}

// ---------- Quine–McCluskey ----------

type RawImplicant = { pattern: string; minterms: number[] };

function quineMcCluskey(minterms: number[], n: number): RawImplicant[] {
  if (minterms.length === 0 || n === 0) {
    return minterms.length === 0 ? [] : [{ pattern: '', minterms: [...minterms] }];
  }

  let groups: RawImplicant[] = minterms.map(m => ({
    pattern: bitsOf(m, n),
    minterms: [m],
  }));

  const allImplicants: RawImplicant[] = [];

  while (groups.length > 0) {
    const merged = new Set<number>();
    const next: RawImplicant[] = [];
    const seen = new Map<string, number>();

    for (let i = 0; i < groups.length; i++) {
      for (let j = i + 1; j < groups.length; j++) {
        const a = groups[i]!;
        const b = groups[j]!;
        const m = mergePatterns(a.pattern, b.pattern);
        if (!m) continue;
        merged.add(i);
        merged.add(j);
        const combined = mergeMinterms(a.minterms, b.minterms);
        const key = m + '|' + combined.join(',');
        if (seen.has(key)) continue;
        seen.set(key, next.length);
        next.push({ pattern: m, minterms: combined });
      }
    }

    // Anything not merged this round is a prime implicant.
    for (let i = 0; i < groups.length; i++) {
      if (!merged.has(i)) allImplicants.push(groups[i]!);
    }
    groups = next;
  }

  // Deduplicate by pattern (the merge step can produce equivalents).
  const uniq = new Map<string, RawImplicant>();
  for (const pi of allImplicants) {
    if (!uniq.has(pi.pattern)) uniq.set(pi.pattern, pi);
  }
  return [...uniq.values()];
}

// Lowest bit of `m` corresponds to the *first* character of the pattern
// (i.e. variables[0]). Pattern is read left-to-right as variables[0..n-1].
function bitsOf(m: number, n: number): string {
  let s = '';
  for (let j = 0; j < n; j++) s += ((m >> j) & 1).toString();
  return s;
}

// Two patterns merge iff they differ in exactly one position and neither
// has a '-' there. The differing position becomes '-'.
function mergePatterns(a: string, b: string): string | null {
  if (a.length !== b.length) return null;
  let diff = -1;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) {
      if (a[i] === '-' || b[i] === '-') return null;
      if (diff !== -1) return null;
      diff = i;
    }
  }
  if (diff === -1) return null;
  return a.slice(0, diff) + '-' + a.slice(diff + 1);
}

function mergeMinterms(a: number[], b: number[]): number[] {
  const set = new Set([...a, ...b]);
  return [...set].sort((x, y) => x - y);
}

function chooseCover(pis: PrimeImplicant[], minterms: number[]): PrimeImplicant[] {
  if (minterms.length === 0) return [];
  const remaining = new Set(minterms);
  const chosen: PrimeImplicant[] = [];

  // Essentials.
  for (const m of minterms) {
    const covering = pis.filter(pi => pi.minterms.includes(m));
    if (covering.length === 1) {
      const ess = covering[0]!;
      if (!chosen.includes(ess)) {
        chosen.push(ess);
        ess.minterms.forEach(x => remaining.delete(x));
      }
    }
  }

  // Greedy: largest uncovered count, ties broken by larger group, then label.
  while (remaining.size > 0) {
    let best: PrimeImplicant | null = null;
    let bestScore = -1;
    for (const pi of pis) {
      if (chosen.includes(pi)) continue;
      const score = pi.minterms.filter(m => remaining.has(m)).length;
      if (score > bestScore || (score === bestScore && best && pi.minterms.length > best.minterms.length)) {
        best = pi;
        bestScore = score;
      }
    }
    if (!best || bestScore <= 0) break;
    chosen.push(best);
    best.minterms.forEach(x => remaining.delete(x));
  }

  return chosen;
}

function implicantLabel(pattern: string, variables: string[]): string {
  if (pattern.length === 0) return '1';
  const factors: string[] = [];
  for (let i = 0; i < pattern.length; i++) {
    const ch = pattern[i]!;
    if (ch === '-') continue;
    factors.push(ch === '1' ? variables[i]! : `${variables[i]}′`);
  }
  if (factors.length === 0) return '1';
  return factors.join('·');
}