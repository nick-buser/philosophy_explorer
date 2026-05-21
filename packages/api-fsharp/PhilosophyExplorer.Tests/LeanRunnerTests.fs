module PhilosophyExplorer.Tests.LeanRunnerTests

open System
open System.Diagnostics
open System.IO
open Xunit
open PhilosophyExplorer.Logic.Lean

// packages/lean, resolved from this test file (mirrors ArgumentTests' seedDir).
let private leanPackageDir =
    Path.Combine(__SOURCE_DIRECTORY__, "..", "..", "..", "packages", "lean")
    |> Path.GetFullPath

let private fixtureSource (name: string) =
    File.ReadAllText(Path.Combine(leanPackageDir, "Fixtures", name))

// `lake` + `lean` must resolve on PATH. When the toolchain is absent — a dev
// without elan, or a CI step without it — these tests return green rather than
// red; Woodpecker's `lake build` step is the hard toolchain gate.
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

// Build the lake package once before the assertions: `import Sanity` needs
// `Sanity.olean`, and the build also absorbs the one-time toolchain cold start.
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

let private verify (timeoutSeconds: float) (name: string) (fixture: string) : LeanResult =
    prepared.Force()
    let runner: ILeanRunner =
        SubprocessLeanRunner(
            { PackageDir = leanPackageDir
              Timeout = TimeSpan.FromSeconds timeoutSeconds })
    runner.Verify { Name = name; Source = fixtureSource fixture }
    |> Async.RunSynchronously

[<Fact>]
let ``Ok fixture verifies`` () =
    if toolchainAvailable.Value then
        Assert.Equal(Verified, verify 60.0 "ok" "Ok.lean")

[<Fact>]
let ``ill-typed fixture fails with a line-located diagnostic`` () =
    if toolchainAvailable.Value then
        match verify 60.0 "ill-typed" "IllTyped.lean" with
        | Failed diagnostics ->
            Assert.NotEmpty diagnostics
            let err = diagnostics |> List.find (fun d -> d.Severity = "error")
            Assert.True(err.Line > 0, $"diagnostic should carry a line number, got line {err.Line}")
        | other ->
            Assert.True(false, $"expected Failed, got {other}")

[<Fact>]
let ``divergent fixture times out`` () =
    if toolchainAvailable.Value then
        Assert.Equal(Timeout, verify 5.0 "divergent" "Diverge.lean")
