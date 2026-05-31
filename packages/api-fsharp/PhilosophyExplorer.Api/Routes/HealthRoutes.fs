namespace PhilosophyExplorer.Routes

open System
open Microsoft.AspNetCore.Builder
open Microsoft.AspNetCore.Http
open Microsoft.Extensions.Logging
open PhilosophyExplorer.Domain
open PhilosophyExplorer.Db

module HealthRoutes =

    let private envStatus () =
        { DatabaseUrl = Environment.GetEnvironmentVariable("DATABASE_URL") |> isNull |> not
          AllowedOrigins = Environment.GetEnvironmentVariable("ALLOWED_ORIGINS") |> isNull |> not }

    let register (app: WebApplication) =
        app.MapGet("/api/health", Func<ILoggerFactory, IResult>(fun loggerFactory ->
            let logger = loggerFactory.CreateLogger("HealthRoutes")
            task {
                try
                    use conn = DbFactory.createConnection ()
                    conn.Open()
                    use cmd = conn.CreateCommand()
                    cmd.CommandText <- "SELECT 1"
                    cmd.ExecuteScalar() |> ignore
                    // schemaVersion = latest applied migration; lets you compare
                    // dev vs prod (`curl …/api/health`) to confirm they're in sync.
                    let schemaVersion = Migrations.latestApplied conn
                    return Results.Json(
                        { Status = "ok"; Db = "ok"; SchemaVersion = schemaVersion; Env = envStatus () },
                        statusCode = 200)
                with ex ->
                    logger.LogError(ex, "Health check DB probe failed")
                    return Results.Json(
                        { HealthErrorResponseDto.Status = "error"
                          Error = string ex
                          Env = envStatus () },
                        statusCode = 503)
            } |> _.Result
        )) |> ignore
