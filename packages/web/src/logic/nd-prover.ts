import type { FolFormula } from './fol-types';
import {
  type Argument,
  type FitchLine,
  type FitchProof,
  type ProveResult,
  type Rule,
  type RuleSet,
  formulaKey,
  isPropositionalArgument,
  neg,
} from './nd-types';

// Backward-chaining ND prover for the propositional fragment. Builds a
// Fitch proof in-place via a mutable line array; failed search branches
// are rolled back by truncating to a snapshot. Rule choice is fixed —
// the `ruleSet` flag toggles whether RAA (proof by contradiction) is
// permitted, which is the classical / intuitionistic boundary.
//
// Strategy at each `prove(goal)` call:
//   1. saturate the available set with cheap eliminations (∧E, →E, ↔E,
//      ¬E into ⊥, ⊥E into anything seen)
//   2. if goal already in scope, Reit it
//   3. try goal-shape introduction
//   4. try each available disjunction as a case split (∨E)
//   5. classical only — try RAA: assume ¬goal, derive ⊥
//
// Saturation is strictly forward-chaining and idempotent, so stays
// terminating. The only place recursion can balloon is in case splits
// and RAA; both are gated on `depth` and the global `budget`.

const DEFAULT_DEPTH = 6;
const DEFAULT_BUDGET = 600;

export function proveArgument(
  arg: Argument,
  ruleSet: RuleSet,
  options: { depth?: number; budget?: number } = {},
): ProveResult {
  if (!isPropositionalArgument(arg)) {
    return { ok: false, ruleSet, reason: 'non-propositional' };
  }

  const prover = new Prover(ruleSet, options.depth ?? DEFAULT_DEPTH, options.budget ?? DEFAULT_BUDGET);
  for (const p of arg.premises) prover.emitLine(p, 'premise', []);
  prover.saturate();

  const ok = prover.prove(arg.conclusion);
  if (!ok) {
    return {
      ok: false,
      ruleSet,
      reason: prover.budgetExhausted ? 'budget' : 'no-proof',
    };
  }

  const conclusionLine = prover.scopeFind(arg.conclusion);
  if (conclusionLine === null) {
    // Shouldn't happen — prove() returning true means the goal was either
    // discovered or freshly emitted. Defensive shim.
    return { ok: false, ruleSet, reason: 'no-proof' };
  }
  const proof: FitchProof = { lines: prover.lines, conclusionLine };

  // Classical-only when RAA was used.
  const classicalOnly = ruleSet === 'classical' && prover.usedClassical;

  return { ok: true, proof, ruleSet, classicalOnly };
}

// ---------- internals ----------

type Scope = Map<string, number>;

class Prover {
  lines: FitchLine[] = [];
  scopes: Scope[] = [new Map()];
  depth = 0;
  steps = 0;
  budgetExhausted = false;
  usedClassical = false;

  constructor(
    private ruleSet: RuleSet,
    private maxDepth: number,
    private budget: number,
  ) {}

  // ---- snapshot / restore ----

  snapshot(): Snapshot {
    return {
      length: this.lines.length,
      scopes: this.scopes.map(s => new Map(s)),
      usedClassical: this.usedClassical,
    };
  }

  restore(s: Snapshot): void {
    this.lines.length = s.length;
    this.scopes = s.scopes.map(m => new Map(m));
    this.usedClassical = s.usedClassical;
  }

  // ---- scope ----

  scopeFind(f: FolFormula): number | null {
    const key = formulaKey(f);
    for (let i = this.scopes.length - 1; i >= 0; i--) {
      const v = this.scopes[i]!.get(key);
      if (v !== undefined) return v;
    }
    return null;
  }

  scopeRecord(f: FolFormula, lineNo: number): void {
    const key = formulaKey(f);
    const top = this.scopes[this.scopes.length - 1]!;
    if (!top.has(key)) top.set(key, lineNo);
  }

  // ---- line emission ----

  emitLine(formula: FolFormula, rule: Rule, cites: (number | [number, number])[]): number {
    const lineNo = this.lines.length + 1;
    this.lines.push({ lineNo, depth: this.depth, formula, rule, cites });
    this.scopeRecord(formula, lineNo);
    return lineNo;
  }

  // Saturate the current scope with cheap forward eliminations. Idempotent
  // because every emit checks `scopeFind` before adding.
  saturate(): void {
    let changed = true;
    while (changed) {
      changed = false;
      // Snapshot the formulas in scope right now to avoid iterating over
      // a mutating list. We also need lineRefs.
      const known = this.collectScopeEntries();

      for (const [, line] of known) {
        const f = line.formula;

        // ∧E
        if (f.kind === 'and') {
          if (this.scopeFind(f.left) === null) {
            this.emitLine(f.left, 'andEL', [line.lineNo]); changed = true;
          }
          if (this.scopeFind(f.right) === null) {
            this.emitLine(f.right, 'andER', [line.lineNo]); changed = true;
          }
        }
      }

      // →E
      for (const [, line] of known) {
        const f = line.formula;
        if (f.kind === 'implies') {
          const argLine = this.scopeFind(f.left);
          if (argLine !== null && this.scopeFind(f.right) === null) {
            this.emitLine(f.right, 'impE', [line.lineNo, argLine]);
            changed = true;
          }
        }
      }

      // ↔E (both directions, only when one side is on the branch)
      for (const [, line] of known) {
        const f = line.formula;
        if (f.kind === 'iff') {
          const lLine = this.scopeFind(f.left);
          const rLine = this.scopeFind(f.right);
          if (lLine !== null && this.scopeFind(f.right) === null) {
            this.emitLine(f.right, 'iffEL', [line.lineNo, lLine]);
            changed = true;
          }
          if (rLine !== null && this.scopeFind(f.left) === null) {
            this.emitLine(f.left, 'iffER', [line.lineNo, rLine]);
            changed = true;
          }
        }
      }

      // ¬E into ⊥ (whenever both p and ¬p are in scope)
      for (const [, line] of known) {
        const f = line.formula;
        if (f.kind === 'not') {
          const posLine = this.scopeFind(f.body);
          if (posLine !== null) {
            const botKey = formulaKey({ kind: 'bot' });
            if (!this.hasKey(botKey)) {
              this.emitLine({ kind: 'bot' }, 'notE', [posLine, line.lineNo]);
              changed = true;
            }
          }
        }
      }
    }
  }

  collectScopeEntries(): [string, FitchLine][] {
    const visible = new Map<string, FitchLine>();
    for (const scope of this.scopes) {
      for (const [k, lineNo] of scope) {
        const line = this.lines[lineNo - 1];
        if (line) visible.set(k, line);
      }
    }
    return [...visible];
  }

  hasKey(key: string): boolean {
    for (let i = this.scopes.length - 1; i >= 0; i--) {
      if (this.scopes[i]!.has(key)) return true;
    }
    return false;
  }

  // ---- search ----

  // Returns true when `goal` becomes available in scope. May emit lines
  // as a side effect; failed branches roll back via snapshot/restore.
  prove(goal: FolFormula, depthLeft: number = this.maxDepth): boolean {
    if (this.budgetExhausted) return false;
    if (++this.steps > this.budget) {
      this.budgetExhausted = true;
      return false;
    }

    this.saturate();
    if (this.scopeFind(goal) !== null) return true;

    if (depthLeft <= 0) return false;

    // Goal-shape introduction.
    if (goal.kind === 'and') {
      const snap = this.snapshot();
      if (this.prove(goal.left, depthLeft - 1) && this.prove(goal.right, depthLeft - 1)) {
        const lLine = this.scopeFind(goal.left);
        const rLine = this.scopeFind(goal.right);
        if (lLine !== null && rLine !== null) {
          this.emitLine(goal, 'andI', [lLine, rLine]);
          return true;
        }
      }
      this.restore(snap);
    }

    if (goal.kind === 'iff') {
      const snap = this.snapshot();
      const ltr = this.proveSubproof(goal.left, goal.right, depthLeft - 1);
      if (ltr) {
        const rtl = this.proveSubproof(goal.right, goal.left, depthLeft - 1);
        if (rtl) {
          this.emitLine(goal, 'iffI', [ltr, rtl]);
          return true;
        }
      }
      this.restore(snap);
    }

    if (goal.kind === 'implies') {
      const snap = this.snapshot();
      const span = this.proveSubproof(goal.left, goal.right, depthLeft - 1);
      if (span) {
        this.emitLine(goal, 'impI', [span]);
        return true;
      }
      this.restore(snap);
    }

    if (goal.kind === 'not') {
      const snap = this.snapshot();
      const span = this.proveSubproof(goal.body, { kind: 'bot' }, depthLeft - 1);
      if (span) {
        this.emitLine(goal, 'notI', [span]);
        return true;
      }
      this.restore(snap);
    }

    if (goal.kind === 'or') {
      const snap = this.snapshot();
      if (this.prove(goal.left, depthLeft - 1)) {
        const lLine = this.scopeFind(goal.left);
        if (lLine !== null) {
          this.emitLine(goal, 'orIL', [lLine]);
          return true;
        }
      }
      this.restore(snap);

      const snap2 = this.snapshot();
      if (this.prove(goal.right, depthLeft - 1)) {
        const rLine = this.scopeFind(goal.right);
        if (rLine !== null) {
          this.emitLine(goal, 'orIR', [rLine]);
          return true;
        }
      }
      this.restore(snap2);
    }

    // ⊥ goal — find a contradiction via ¬E. The saturate() above only
    // detects already-paired contradictions; here we actively try to
    // prove ¬φ's positive partner.
    if (goal.kind === 'bot') {
      const negs = this.collectScopeEntries().filter(([, l]) => l.formula.kind === 'not');
      for (const [, line] of negs) {
        const negF = line.formula;
        if (negF.kind !== 'not') continue;
        if (this.scopeFind(negF.body) !== null) {
          // Already paired — saturate would have emitted ⊥, but in case
          // we suppressed it we wire the citation here.
          const posLine = this.scopeFind(negF.body)!;
          this.emitLine({ kind: 'bot' }, 'notE', [posLine, line.lineNo]);
          return true;
        }
        const snap = this.snapshot();
        if (this.prove(negF.body, depthLeft - 1)) {
          const posLine = this.scopeFind(negF.body)!;
          this.emitLine({ kind: 'bot' }, 'notE', [posLine, line.lineNo]);
          return true;
        }
        this.restore(snap);
      }
    } else {
      // ⊥E — if ⊥ is provable, the goal follows by ex falso. Try this
      // before case-splits: it tends to be cheaper when the assumptions
      // are already inconsistent.
      const snap = this.snapshot();
      if (this.prove({ kind: 'bot' }, depthLeft - 1)) {
        const botLine = this.scopeFind({ kind: 'bot' });
        if (botLine !== null) {
          this.emitLine(goal, 'botE', [botLine]);
          return true;
        }
      }
      this.restore(snap);
    }

    // Backward chain through implications and biconditionals: for each
    // `A -> goal` or `A <-> goal` / `goal <-> A` in scope, try proving
    // `A` so the elimination rule fires the goal. This is what carries
    // proofs of currying, Peirce's law, and other reasoning steps where
    // the user has to invent the antecedent.
    {
      const known = this.collectScopeEntries();
      const goalKey = formulaKey(goal);
      for (const [, line] of known) {
        const f = line.formula;
        if (f.kind === 'implies' && formulaKey(f.right) === goalKey) {
          const snap = this.snapshot();
          if (this.prove(f.left, depthLeft - 1)) {
            const argLine = this.scopeFind(f.left);
            if (argLine !== null && this.scopeFind(goal) === null) {
              this.emitLine(goal, 'impE', [line.lineNo, argLine]);
              return true;
            }
            if (this.scopeFind(goal) !== null) return true;
          }
          this.restore(snap);
        }
        if (f.kind === 'iff') {
          if (formulaKey(f.right) === goalKey) {
            const snap = this.snapshot();
            if (this.prove(f.left, depthLeft - 1)) {
              const argLine = this.scopeFind(f.left);
              if (argLine !== null && this.scopeFind(goal) === null) {
                this.emitLine(goal, 'iffEL', [line.lineNo, argLine]);
                return true;
              }
              if (this.scopeFind(goal) !== null) return true;
            }
            this.restore(snap);
          }
          if (formulaKey(f.left) === goalKey) {
            const snap = this.snapshot();
            if (this.prove(f.right, depthLeft - 1)) {
              const argLine = this.scopeFind(f.right);
              if (argLine !== null && this.scopeFind(goal) === null) {
                this.emitLine(goal, 'iffER', [line.lineNo, argLine]);
                return true;
              }
              if (this.scopeFind(goal) !== null) return true;
            }
            this.restore(snap);
          }
        }
      }
    }

    // ∨E — case analysis on each available disjunction.
    const disjs = this.collectScopeEntries().filter(([, l]) => l.formula.kind === 'or');
    for (const [, disjLine] of disjs) {
      if (disjLine.formula.kind !== 'or') continue;
      const snap = this.snapshot();
      const leftSpan  = this.proveSubproof(disjLine.formula.left,  goal, depthLeft - 1);
      if (leftSpan) {
        const rightSpan = this.proveSubproof(disjLine.formula.right, goal, depthLeft - 1);
        if (rightSpan) {
          this.emitLine(goal, 'orE', [disjLine.lineNo, leftSpan, rightSpan]);
          return true;
        }
      }
      this.restore(snap);
    }

    // RAA — classical only. Assume ¬goal, derive ⊥.
    if (this.ruleSet === 'classical' && goal.kind !== 'bot') {
      const snap = this.snapshot();
      const span = this.proveSubproof(neg(goal), { kind: 'bot' }, depthLeft - 1);
      if (span) {
        this.usedClassical = true;
        this.emitLine(goal, 'raa', [span]);
        return true;
      }
      this.restore(snap);
    }

    return false;
  }

  // Open a subproof, drop in `assumption`, recurse to prove `target`.
  // Returns the `[start, end]` line span on success or null on failure.
  // Always restores prover state cleanly (closes scope) before returning.
  proveSubproof(
    assumption: FolFormula,
    target: FolFormula,
    depthLeft: number,
  ): [number, number] | null {
    const snap = this.snapshot();
    this.depth++;
    this.scopes.push(new Map());
    const startLine = this.emitLine(assumption, 'assumption', []);
    this.saturate();

    // The target may already be available — for `p -> p`, the assumption
    // and conclusion are identical and `prove` will just Reit.
    let endLine: number | null = null;
    if (this.scopeFind(target) !== null) {
      // Need to ensure the last line of the subproof is `target` so a
      // citing rule reads cleanly. If saturate didn't end on it, emit a
      // Reit so the box visibly closes on the right formula.
      const existing = this.scopeFind(target)!;
      const last = this.lines[this.lines.length - 1]!;
      if (last.lineNo === existing) {
        endLine = existing;
      } else {
        endLine = this.emitLine(target, 'reit', [existing]);
      }
    } else if (this.prove(target, depthLeft)) {
      const found = this.scopeFind(target)!;
      const last = this.lines[this.lines.length - 1]!;
      if (last.lineNo !== found) {
        endLine = this.emitLine(target, 'reit', [found]);
      } else {
        endLine = found;
      }
    }

    this.scopes.pop();
    this.depth--;

    if (endLine === null) {
      this.restore(snap);
      return null;
    }
    return [startLine, endLine];
  }
}

type Snapshot = {
  length: number;
  scopes: Scope[];
  usedClassical: boolean;
};
