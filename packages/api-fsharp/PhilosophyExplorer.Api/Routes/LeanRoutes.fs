namespace PhilosophyExplorer.Routes

open System
open Microsoft.AspNetCore.Builder
open Microsoft.AspNetCore.Http
open Microsoft.Extensions.Hosting
open Microsoft.Extensions.Logging
open PhilosophyExplorer.Logic.Lean

module LeanRoutes =

    // The end-to-end sanity job: it imports the built `Sanity` library and
    // uses its theorem, so a `verified` verdict also proves `import`
    // resolution through `lake env`.
    let private healthJob =
        { Name = "health"
          Source = "import Sanity\n\ntheorem health : True := ok\n" }

    let register (app: WebApplication) =
        // Dev-gated diagnostic endpoint — a curl target that exercises the
        // whole F# -> lake -> lean path. Excluded from the OpenAPI contract
        // (the real /api/verify lands in Milestone 1) and not registered
        // outside the Development environment.
        if app.Environment.IsDevelopment() then
            app.MapGet(
                "/api/lean/health",
                Func<ILeanRunner, ILoggerFactory, IResult>(fun runner loggerFactory ->
                    let logger = loggerFactory.CreateLogger("LeanRoutes")
                    match runner.Verify healthJob |> Async.RunSynchronously with
                    | Verified ->
                        Results.Json({| status = "ok"; verdict = "verified" |}, statusCode = 200)
                    | Failed diagnostics ->
                        logger.LogError("Lean health check failed: {Diagnostics}", diagnostics)
                        Results.Json(
                            {| status = "error"; verdict = "failed"; diagnostics = diagnostics |},
                            statusCode = 503)
                    | Timeout ->
                        logger.LogError("Lean health check timed out")
                        Results.Json({| status = "error"; verdict = "timeout" |}, statusCode = 503)
                    | RunnerError message ->
                        logger.LogError("Lean health check runner error: {Message}", message)
                        Results.Json(
                            {| status = "error"; verdict = "runner-error"; error = message |},
                            statusCode = 503))
            ).ExcludeFromDescription()
            |> ignore
