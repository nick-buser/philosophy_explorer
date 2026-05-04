import type { BoolFormula } from './boolean-types';
import { collectVariables, evalBool } from './boolean-types';

// Hasse diagram of the Boolean lattice 2^n with the formula's truth
// set highlighted. Up to 4 variables — same cap as the K-map view,
// since 2^5 = 32 vertices stops being legible as a flat figure.

export const HASSE_MAX_VARS = 4;

export type HasseNode = {
  index: number;          // truth-table index (matches K-map minterm encoding)
  hammingWeight: number;
  x: number;
  y: number;
  value: boolean;         // formula's truth value at this valuation
  label: string;          // pretty bitstring like "1010" — variables[0] is leftmost
};

export type HasseEdge = {
  from: number;
  to: number;
  // True iff both endpoints satisfy the formula. Useful for fading
  // edges that leave the truth set.
  both: boolean;
};

export type HasseData = {
  variables: string[];
  width: number;
  height: number;
  nodes: HasseNode[];
  edges: HasseEdge[];
  truthCount: number;
  totalCount: number;
};

const NODE_R = 14;
const COL_GAP = 56;
const ROW_GAP = 84;
const PADDING = 28;

export function buildHasse(formula: BoolFormula): HasseData | null {
  const variables = collectVariables(formula);
  if (variables.length > HASSE_MAX_VARS) return null;
  const n = variables.length;
  const total = n === 0 ? 1 : 1 << n;

  // Group vertex indices by Hamming weight; within a level we'll order
  // by index so adjacent levels' edges criss-cross less.
  const levels: number[][] = Array.from({ length: n + 1 }, () => []);
  for (let i = 0; i < total; i++) levels[popcount(i)]!.push(i);

  const maxLevelSize = levels.reduce((m, lvl) => Math.max(m, lvl.length), 0);
  const width  = PADDING * 2 + (Math.max(maxLevelSize, 1) - 1) * COL_GAP + NODE_R * 2;
  const height = PADDING * 2 + n * ROW_GAP + NODE_R * 2;

  const nodes: HasseNode[] = new Array(total);
  for (let w = 0; w <= n; w++) {
    const lvl = levels[w]!;
    const yLevel = PADDING + NODE_R + (n - w) * ROW_GAP;
    const lvlWidth = (lvl.length - 1) * COL_GAP;
    const xStart = (width - lvlWidth) / 2;
    lvl.forEach((idx, i) => {
      const env: Record<string, boolean> = {};
      for (let j = 0; j < n; j++) env[variables[j]!] = ((idx >> j) & 1) === 1;
      nodes[idx] = {
        index: idx,
        hammingWeight: w,
        x: xStart + i * COL_GAP,
        y: yLevel,
        value: evalBool(formula, env),
        label: bitsLabel(idx, n),
      };
    });
  }

  // Covering edges: differ in exactly one bit (always between adjacent
  // levels). For each vertex, walk every bit that's 0 and emit the edge
  // to the next-level neighbour.
  const edges: HasseEdge[] = [];
  for (let i = 0; i < total; i++) {
    for (let j = 0; j < n; j++) {
      if ((i >> j) & 1) continue;
      const k = i | (1 << j);
      edges.push({ from: i, to: k, both: nodes[i]!.value && nodes[k]!.value });
    }
  }

  let truthCount = 0;
  for (const node of nodes) if (node.value) truthCount++;

  return { variables, width, height, nodes, edges, truthCount, totalCount: total };
}

function popcount(x: number): number {
  let c = 0;
  while (x) { c += x & 1; x >>>= 1; }
  return c;
}

// Print high-bit on the left so the label reads "abcd" from
// left-to-right with a as the high-bit (matches mathematical-cube
// convention even though our index encoding has a as the LSB).
function bitsLabel(index: number, n: number): string {
  if (n === 0) return '';
  let out = '';
  for (let j = n - 1; j >= 0; j--) out += ((index >> j) & 1).toString();
  return out;
}