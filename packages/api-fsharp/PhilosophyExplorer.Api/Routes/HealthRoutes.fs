namespace PhilosophyExplorer.Routes

open System
open Microsoft.AspNetCore.Builder
open Microsoft.AspNetCore.Http
open PhilosophyExplorer.Domain
open PhilosophyExplorer.Db

module HealthRoutes =

    let private envStatus () =
        { DatabaseUrl = Environment.GetEnvironmentVariable("DATABASE_URL") |> isNull |> not
          AllowedOrigins = Environment.GetEnvironmentVariable("ALLOWED_ORIGINS") |> isNull |> not }

    let register (app: WebApplication) =
        app.MapGet("/api/health", Func<IResult>(fun () ->
            task {
                try
                    do! DbFactory.testConnection ()
                    return Results.Json(
                        { Status = "ok"; Db = "ok"; Env = envStatus () },
                        statusCode = 200)
                with ex ->
                    return Results.Json(
                        { HealthErrorResponseDto.Status = "error"
                          Error = string ex
                          Env = envStatus () },
                        statusCode = 503)
            } |> _.Result
        )) |> ignore
