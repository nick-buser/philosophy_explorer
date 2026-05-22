module PhilosophyExplorer.Tests.LeanEmitterTests

open System
open System.Diagnostics
open System.IO
open Xunit
open PhilosophyExplorer.Logic.Lean
open PhilosophyExplorer.Logic.Nd

// packages/lean, resolved from this test file (mirrors LeanRunnerTests).
let private leanPackageDir =
    Path.Combine(__SOURCE_DIRECTORY__, "..", "..", "..", "packages", "lean")
    |> Path.GetFullPath

// `lake` + `lean` must resolve on PATH. When the toolchain is absent — a dev
// without elan, or a CI step without it — these tests return green rather
// than red; Woodpecker's `lake build` step is the hard toolchain gate.
let private toolchainAvailable =
    lazy (
        let onPath (exe: string) =
            try
                let psi =
                    ProcessStartInfo(
                        FileName = "/bin/sh",
                        RedirectStandardOutput = true,
                        RedirectStandardError = true,
                        UseShellExecute = false)
                psi.ArgumentList.Add "-c"
                psi.ArgumentList.Add(sprintf "command -v %s" exe)
                use p = Process.Start psi
                p.WaitForExit()
                p.ExitCode = 0
            with _ -> false
        onPath "lake" && onPath "lean")

// Build the lake package once so the NaturalDeduction .oleans the emitted
// jobs `import` exist, and the toolchain cold start is paid up front.
let private prepared =
    lazy (
        let psi =
            ProcessStartInfo(
                FileName = "lake",
                WorkingDirectory = leanPackageDir,
                RedirectStandardOutput = true,
                RedirectStandardError = true,
                UseShellExecute = false)
        psi.ArgumentList.Add "build"
        use p = Process.Start psi
        p.WaitForExit())

let private verify (name: string) (source: string) : LeanResult =
    prepared.Force()
    let runner: ILeanRunner =
        SubprocessLeanRunner({ PackageDir = leanPackageDir; Timeout = TimeSpan.FromSeconds 60.0 })
    runner.Verify { Name = name; Source = source } |> Async.RunSynchronously

let private atomP = Pred "p"
let private atomQ = Pred "q"

// p ∧ q ⊢ q ∧ p — premise, ∧E, ∧I, all at depth 0.
let private conjComm : FitchProof =
    { Lines =
        [ { LineNo = 1; Depth = 0; Formula = And(atomP, atomQ); Rule = Rule.Premise; Cites = [] }
          { LineNo = 2; Depth = 0; Formula = atomP; Rule = Rule.AndEL; Cites = [ CiteLine 1 ] }
          { LineNo = 3; Depth = 0; Formula = atomQ; Rule = Rule.AndER; Cites = [ CiteLine 1 ] }
          { LineNo = 4; Depth = 0; Formula = And(atomQ, atomP); Rule = Rule.AndI; Cites = [ CiteLine 3; CiteLine 2 ] } ]
      ConclusionLine = 4 }

// ⊢ p → p — a one-line subproof discharged by →I.
let private idImp : FitchProof =
    { Lines =
        [ { LineNo = 1; Depth = 1; Formula = atomP; Rule = Rule.Assumption; Cites = [] }
          { LineNo = 2; Depth = 0; Formula = Implies(atomP, atomP); Rule = Rule.ImpI; Cites = [ CiteRange(1, 1) ] } ]
      ConclusionLine = 2 }

// ⊢ ¬¬p → p — classical: nested subproofs, ¬E citing across a scope
// boundary (so the emitter must lift line 1 with Deriv.reit), and RAA.
let private doubleNeg : FitchProof =
    { Lines =
        [ { LineNo = 1; Depth = 1; Formula = Not(Not atomP); Rule = Rule.Assumption; Cites = [] }
          { LineNo = 2; Depth = 2; Formula = Not atomP; Rule = Rule.Assumption; Cites = [] }
          { LineNo = 3; Depth = 2; Formula = Bot; Rule = Rule.NotE; Cites = [ CiteLine 2; CiteLine 1 ] }
          { LineNo = 4; Depth = 1; Formula = atomP; Rule = Rule.Raa; Cites = [ CiteRange(2, 3) ] }
          { LineNo = 5; Depth = 0; Formula = Implies(Not(Not atomP), atomP); Rule = Rule.ImpI; Cites = [ CiteRange(1, 4) ] } ]
      ConclusionLine = 5 }

[<Fact>]
let ``emits one let-binding per line ending in the conclusion`` () =
    let src = LeanEmitter.emit RuleSet.Intuitionistic conjComm
    Assert.Contains("import NaturalDeduction", src)
    Assert.Contains("example : Deriv RuleSet.intuitionistic", src)
    Assert.Contains("let l1 : Deriv RuleSet.intuitionistic", src)
    Assert.Contains("Deriv.andEL l1", src)
    Assert.Contains("Deriv.andI l3 l2", src)
    Assert.Contains("  l4", src)

[<Fact>]
let ``a cross-scope citation is lifted with Deriv.reit`` () =
    // line 3 (depth 2) cites line 1 (depth 1), one subproof boundary away.
    let src = LeanEmitter.emit RuleSet.Classical doubleNeg
    Assert.Contains("Deriv.reit", src)

[<Fact>]
let ``emits a conjunction-commutation proof Lean verifies`` () =
    if toolchainAvailable.Value then
        Assert.Equal(Verified, verify "conjComm" (LeanEmitter.emit RuleSet.Intuitionistic conjComm))

[<Fact>]
let ``emits an implication-introduction proof Lean verifies`` () =
    if toolchainAvailable.Value then
        Assert.Equal(Verified, verify "idImp" (LeanEmitter.emit RuleSet.Intuitionistic idImp))

[<Fact>]
let ``emits a classical double-negation proof Lean verifies`` () =
    if toolchainAvailable.Value then
        Assert.Equal(Verified, verify "doubleNeg" (LeanEmitter.emit RuleSet.Classical doubleNeg))

[<Fact>]
let ``the classical proof fails when emitted under intuitionistic`` () =
    if toolchainAvailable.Value then
        match verify "doubleNegIntuit" (LeanEmitter.emit RuleSet.Intuitionistic doubleNeg) with
        | Failed _ -> ()
        | other -> Assert.True(false, $"expected Failed (raa needs classical), got {other}")

[<Fact>]
let ``a mis-cited proof fails verification`` () =
    if toolchainAvailable.Value then
        // line 4 still claims q ∧ p but now cites p (line 2) twice.
        let broken =
            { conjComm with
                Lines =
                    conjComm.Lines
                    |> List.map (fun l ->
                        if l.LineNo = 4 then { l with Cites = [ CiteLine 2; CiteLine 2 ] } else l) }
        match verify "broken" (LeanEmitter.emit RuleSet.Intuitionistic broken) with
        | Failed _ -> ()
        | other -> Assert.True(false, $"expected Failed, got {other}")
