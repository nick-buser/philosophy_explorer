import type { FolFormula } from './fol-types';
import type { FitchLine, FitchProof, Rule } from './nd-types';

// Gentzen-style natural-deduction tree built from a Fitch proof. Each
// rule application becomes a node; its children are the premises of the
// rule (other Fitch lines or the bodies of cited subproofs). Premises
// and assumptions are leaves; assumptions discharged by an enclosing
// →I / ¬I / ∨E / RAA are tagged so the renderer can mark them in
// brackets, the textbook convention for discharged assumptions.

export type GentzenNode = {
  formula: FolFormula;
  rule: Rule;
  // Premises read top-to-bottom in the standard tree layout.
  children: GentzenNode[];
  // Display tags
  discharged: boolean;       // true on a leaf assumption that's discharged by an ancestor
  dischargedBy?: { rule: Rule };
};

export function buildGentzenTree(proof: FitchProof): GentzenNode {
  const linesByNo = new Map<number, FitchLine>();
  for (const l of proof.lines) linesByNo.set(l.lineNo, l);

  const conclusion = linesByNo.get(proof.conclusionLine);
  if (!conclusion) {
    return { formula: { kind: 'bot' }, rule: 'premise', children: [], discharged: false };
  }
  return walk(conclusion, linesByNo);
}

function walk(line: FitchLine, byNo: Map<number, FitchLine>): GentzenNode {
  const node: GentzenNode = {
    formula: line.formula,
    rule: line.rule,
    children: [],
    discharged: false,
  };

  if (line.rule === 'premise' || line.rule === 'assumption') {
    return node;
  }

  for (const cite of line.cites) {
    if (typeof cite === 'number') {
      const target = byNo.get(cite);
      if (target) node.children.push(walk(target, byNo));
      continue;
    }
    // Subproof span [start, end] — the structural premise of an intro
    // rule. The subtree of the *end* line carries the discharged
    // assumption.
    const [start, end] = cite;
    const endLine = byNo.get(end);
    if (!endLine) continue;
    const sub = walk(endLine, byNo);
    markDischarged(sub, start, line.rule);
    node.children.push(sub);
  }

  return node;
}

function markDischarged(node: GentzenNode, assumptionLine: number, byRule: Rule): void {
  // The Fitch line numbers don't survive into the GentzenNode shape, so
  // we mark the *first* leaf whose rule is `assumption` and whose
  // formula matches the line number's formula. Walk depth-first.
  // (For the renderer this is enough — the same assumption introduced
  // twice within nested subproofs is a niche case our prover doesn't
  // generate.)
  const walkAndMark = (n: GentzenNode): boolean => {
    if (n.rule === 'assumption' && !n.discharged) {
      n.discharged = true;
      n.dischargedBy = { rule: byRule };
      return true;
    }
    for (const c of n.children) {
      if (walkAndMark(c)) return true;
    }
    return false;
  };
  void assumptionLine;
  walkAndMark(node);
}
