namespace PhilosophyExplorer.Routes

open System
open System.Text.Json
open System.Text.Json.Serialization
open System.Threading.Tasks
open Microsoft.AspNetCore.Builder
open Microsoft.AspNetCore.Http
open Microsoft.Extensions.Logging
open PhilosophyExplorer.Domain
open PhilosophyExplorer.Logic.Lean
open PhilosophyExplorer.Logic.Nd

/// POST /api/verify — ships a Fitch natural-deduction proof to Lean and
/// reports the verdict. Replaces the Milestone 0 /api/lean/health spike.
module VerifyRoutes =

    /// Request body: the proof to check and the rule set it claims.
    type VerifyRequestDto =
        { [<JsonPropertyName("proof")>] Proof: FitchProof
          [<JsonPropertyName("ruleSet")>] RuleSet: RuleSet }

    /// One Lean diagnostic relocated onto a FitchProof line — `line` is 0
    /// when the diagnostic fell outside the per-line region of the emitted
    /// source.
    type VerifyDiagnosticDto =
        { [<JsonPropertyName("line")>] Line: int
          [<JsonPropertyName("severity")>] Severity: string
          [<JsonPropertyName("message")>] Message: string }

    /// Response: `verdict` is verified | failed | timeout | error.
    /// `diagnostics` is populated only for `failed`; `message` carries the
    /// detail for `timeout` / `error`.
    type VerifyResponseDto =
        { [<JsonPropertyName("verdict")>] Verdict: string
          [<JsonPropertyName("diagnostics")>] Diagnostics: VerifyDiagnosticDto list
          [<JsonPropertyName("message")>] Message: string }

    let private validate (proof: FitchProof) : string option =
        if List.isEmpty proof.Lines then
            Some "proof has no lines"
        elif not (proof.Lines |> List.exists (fun l -> l.LineNo = proof.ConclusionLine)) then
            Some(sprintf "conclusionLine %d is not among the proof lines" proof.ConclusionLine)
        else
            None

    let private toResponse (proof: FitchProof) (result: LeanResult) : VerifyResponseDto =
        match result with
        | Verified -> { Verdict = "verified"; Diagnostics = []; Message = "" }
        | Failed diagnostics ->
            { Verdict = "failed"
              Diagnostics =
                diagnostics
                |> List.map (fun d ->
                    { Line = LeanEmitter.fitchLineOf proof d.Line
                      Severity = d.Severity
                      Message = d.Message })
              Message = "" }
        | Timeout ->
            { Verdict = "timeout"
              Diagnostics = []
              Message = "Lean verification exceeded the time limit" }
        | RunnerError message -> { Verdict = "error"; Diagnostics = []; Message = message }

    let register (app: WebApplication) =
        app
            .MapPost(
                "/api/verify",
                Func<HttpContext, ILeanRunner, ILoggerFactory, Task<IResult>>(fun ctx runner loggerFactory ->
                    task {
                        let logger = loggerFactory.CreateLogger("VerifyRoutes")
                        try
                            let! req =
                                JsonSerializer
                                    .DeserializeAsync<VerifyRequestDto>(ctx.Request.Body, NdJson.options)
                                    .AsTask()
                            match box req with
                            | null ->
                                return Results.Json(
                                    { ErrorResponseDto.Error = "empty request body" },
                                    options = NdJson.options, statusCode = 400)
                            | _ ->
                                match validate req.Proof with
                                | Some err ->
                                    return Results.Json(
                                        { ErrorResponseDto.Error = err },
                                        options = NdJson.options, statusCode = 400)
                                | None ->
                                    let source = LeanEmitter.emit req.RuleSet req.Proof
                                    let! result =
                                        runner.Verify { Name = "verify"; Source = source }
                                        |> Async.StartAsTask
                                    return Results.Json(
                                        toResponse req.Proof result,
                                        options = NdJson.options, statusCode = 200)
                        with ex ->
                            logger.LogError(ex, "verify request failed")
                            return Results.Json(
                                { ErrorResponseDto.Error = ex.Message },
                                options = NdJson.options, statusCode = 400)
                    }))
            .Accepts<VerifyRequestDto>("application/json")
            .Produces<VerifyResponseDto>(200)
            .Produces<ErrorResponseDto>(400)
        |> ignore
