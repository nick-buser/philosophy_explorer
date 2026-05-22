/**
 * M1 integration test: the joint between the TypeScript ND prover and the
 * F# POST /api/verify endpoint. Each prover output is a free verification
 * case — emit it to Lean and the kernel either accepts the term or not.
 *
 * Skipped (not failed) when the API server is not reachable — e.g. a CI
 * step without it. Run `npm run dev:api` first; set VERIFY_API_URL to point
 * elsewhere.
 */
import { describe, it, expect } from 'vitest';
import { parseArgument } from '../logic/nd-parser';
import { proveArgument } from '../logic/nd-prover';
import type { FitchProof, RuleSet, Cite } from '../logic/nd-types';

const API_BASE = process.env.VERIFY_API_URL ?? 'http://localhost:3001';

async function serverUp(): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/ping`, { signal: AbortSignal.timeout(2000) });
    return res.ok;
  } catch {
    return false;
  }
}

type Verdict = {
  verdict: string;
  diagnostics: { line: number; severity: string; message: string }[];
  message: string;
};

async function verify(proof: FitchProof, ruleSet: RuleSet): Promise<Verdict> {
  const res = await fetch(`${API_BASE}/api/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ proof, ruleSet }),
  });
  if (!res.ok) throw new Error(`/api/verify responded ${res.status}`);
  return res.json() as Promise<Verdict>;
}

function prove(dsl: string, mode: RuleSet): FitchProof {
  const parsed = parseArgument(dsl);
  if (!parsed.ok) throw new Error(`could not parse "${dsl}"`);
  const result = proveArgument(parsed.argument, mode);
  if (!result.ok) throw new Error(`prover found no proof for "${dsl}" (${mode})`);
  return result.proof;
}

const describeIf = (await serverUp()) ? describe : describe.skip;

// A span of valid propositional arguments — every prover proof here should
// clear the Lean embedding.
const CORPUS: { dsl: string; mode: RuleSet }[] = [
  { dsl: 'p & q |- q & p', mode: 'intuitionistic' },
  { dsl: '|- p -> p', mode: 'intuitionistic' },
  { dsl: 'p, p -> q |- q', mode: 'intuitionistic' },
  { dsl: 'p -> q, q -> r |- p -> r', mode: 'intuitionistic' },
  { dsl: 'p & q |- p | r', mode: 'intuitionistic' },
  { dsl: '|- ~~p -> p', mode: 'classical' },
];

describeIf('POST /api/verify — M1 contract', () => {
  it.each(CORPUS)('verifies the prover proof of "$dsl" ($mode)', async ({ dsl, mode }) => {
    const result = await verify(prove(dsl, mode), mode);
    expect(result.verdict).toBe('verified');
  });

  it('rejects a mis-cited proof and locates the diagnostic on the bad line', async () => {
    const proof = prove('p & q |- q & p', 'intuitionistic');
    // The conclusion is q∧p by ∧I; re-point its citations at the premise
    // line so the emitted term no longer carries the claimed type.
    const broken: FitchProof = {
      ...proof,
      lines: proof.lines.map(l =>
        l.lineNo === proof.conclusionLine ? { ...l, cites: [1, 1] as Cite[] } : l,
      ),
    };
    const result = await verify(broken, 'intuitionistic');
    expect(result.verdict).toBe('failed');
    expect(result.diagnostics.some(d => d.line === proof.conclusionLine)).toBe(true);
  });

  it('rejects an RAA proof submitted as intuitionistic', async () => {
    // Proven classically — the prover reaches for RAA — then verified under
    // intuitionistic, where the embedding makes `raa` ill-typed.
    const result = await verify(prove('|- ~~p -> p', 'classical'), 'intuitionistic');
    expect(result.verdict).toBe('failed');
  });
});
