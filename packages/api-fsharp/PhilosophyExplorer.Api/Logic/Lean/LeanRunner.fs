namespace PhilosophyExplorer.Logic.Lean

open System
open System.Diagnostics
open System.IO
open System.Text.Json
open System.Text.RegularExpressions

/// A unit of Lean source to verify. In the connectivity spike the source is
/// a committed fixture; from Milestone 1 it is emitted from a proof AST.
type LeanJob =
    { /// Short identifier — names the scratch file so logs trace back to it.
      Name: string
      /// Lean source, written verbatim into the lake package so diagnostic
      /// line numbers map directly onto it.
      Source: string }

/// One Lean diagnostic, located onto a line/column of the job source.
type Diagnostic =
    { Severity: string
      Line: int
      Column: int
      Message: string }

/// The verdict for a verification job.
type LeanResult =
    | Verified
    | Failed of Diagnostic list
    | Timeout
    | RunnerError of string

/// The seam between the F# API and a Lean toolchain. In-process today
/// (SubprocessLeanRunner over `lake env lean`); an out-of-process
/// HttpLeanRunner is the contingency in formal-verification.md §2.3.
type ILeanRunner =
    abstract member Verify: job: LeanJob -> Async<LeanResult>

/// Configuration for SubprocessLeanRunner.
type LeanRunnerOptions =
    { /// The packages/lean lake package directory; `lake build` is run here.
      PackageDir: string
      /// Hard wall-clock ceiling — past it the process tree is killed. The
      /// spike's resource guard; a memory ceiling is deferred to Milestone 1
      /// (see the work-history doc — `ulimit -v` proved non-viable).
      Timeout: TimeSpan }

module private LeanProcess =

    /// Restrict a job name to filesystem-safe characters before it is used in
    /// a scratch file name.
    let sanitize (name: string) =
        let cleaned = Regex.Replace((if isNull name then "" else name), "[^A-Za-z0-9_-]", "-")
        if cleaned.Length = 0 then "job" else cleaned

    /// `lean --json` emits one JSON object per message. Parse the located
    /// diagnostics out of a captured stdout buffer.
    let parseDiagnostics (stdout: string) : Diagnostic list =
        stdout.Split('\n')
        |> Array.choose (fun raw ->
            let line = raw.Trim()
            if not (line.StartsWith "{") then
                None
            else
                try
                    use doc = JsonDocument.Parse line
                    let root = doc.RootElement
                    let str (name: string) =
                        match root.TryGetProperty name with
                        | true, v when v.ValueKind = JsonValueKind.String -> v.GetString()
                        | _ -> ""
                    let posInt (field: string) =
                        match root.TryGetProperty "pos" with
                        | true, p when p.ValueKind = JsonValueKind.Object ->
                            match p.TryGetProperty field with
                            | true, v when v.ValueKind = JsonValueKind.Number -> v.GetInt32()
                            | _ -> 0
                        | _ -> 0
                    Some
                        { Severity = str "severity"
                          Line = posInt "line"
                          Column = posInt "column"
                          Message = (str "data").Trim() }
                with _ ->
                    None)
        |> Array.toList

    /// Kill the process and every descendant — the hard guarantee behind the
    /// timeout. See formal-verification.md §6.3.
    let killTree (proc: Process) =
        try
            if not proc.HasExited then
                proc.Kill(entireProcessTree = true)
        with _ ->
            ()

/// Verifies Lean jobs by spawning `lake env lean` as a subprocess. Stateless
/// per call: each job is written to scratch inside the lake package, checked,
/// and the scratch removed in a `finally`.
type SubprocessLeanRunner(options: LeanRunnerOptions) =

    interface ILeanRunner with
        member _.Verify(job: LeanJob) : Async<LeanResult> =
            async {
                let scratchDir = Path.Combine(options.PackageDir, ".scratch")
                let scratchFile =
                    Path.Combine(
                        scratchDir,
                        sprintf "%s-%s.lean"
                            (LeanProcess.sanitize job.Name)
                            (Guid.NewGuid().ToString("N")))
                try
                    try
                        Directory.CreateDirectory scratchDir |> ignore
                        do! File.WriteAllTextAsync(scratchFile, job.Source) |> Async.AwaitTask

                        // A relative path keeps the diagnostic `fileName` short.
                        let relPath = Path.GetRelativePath(options.PackageDir, scratchFile)
                        let psi =
                            ProcessStartInfo(
                                FileName = "lake",
                                WorkingDirectory = options.PackageDir,
                                RedirectStandardOutput = true,
                                RedirectStandardError = true,
                                UseShellExecute = false)
                        psi.ArgumentList.Add "env"
                        psi.ArgumentList.Add "lean"
                        psi.ArgumentList.Add "--json"
                        psi.ArgumentList.Add relPath

                        use proc = new Process(StartInfo = psi)
                        proc.Start() |> ignore
                        let stdoutTask = proc.StandardOutput.ReadToEndAsync()
                        let stderrTask = proc.StandardError.ReadToEndAsync()

                        let sw = Stopwatch.StartNew()
                        let mutable timedOut = false
                        while not timedOut && not proc.HasExited do
                            do! Async.Sleep 100
                            if not proc.HasExited && sw.Elapsed > options.Timeout then
                                LeanProcess.killTree proc
                                timedOut <- true

                        do! proc.WaitForExitAsync() |> Async.AwaitTask
                        let! stdout = stdoutTask |> Async.AwaitTask
                        let! stderr = stderrTask |> Async.AwaitTask

                        if timedOut then
                            return Timeout
                        elif proc.ExitCode = 0 then
                            return Verified
                        else
                            match LeanProcess.parseDiagnostics stdout with
                            | [] ->
                                return
                                    RunnerError(
                                        sprintf "lean exited %d with no diagnostics: %s"
                                            proc.ExitCode (stderr.Trim()))
                            | diagnostics ->
                                return Failed diagnostics
                    with ex ->
                        return RunnerError(sprintf "%s: %s" (ex.GetType().Name) ex.Message)
                finally
                    try
                        if File.Exists scratchFile then File.Delete scratchFile
                    with _ ->
                        ()
            }
