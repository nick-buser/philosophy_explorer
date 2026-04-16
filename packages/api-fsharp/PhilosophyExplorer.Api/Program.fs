open System
open System.IO
open System.Text.Json
open System.Text.Json.Serialization
open Microsoft.AspNetCore.Builder
open Microsoft.Extensions.DependencyInjection
open Microsoft.Extensions.Hosting
open PhilosophyExplorer.Graph
open PhilosophyExplorer.Routes

[<EntryPoint>]
let main args =
    // CLI: `dotnet run -- --seed` seeds the database and exits
    if args |> Array.contains "--seed" then
        let seedDir =
            let fromEnv = Environment.GetEnvironmentVariable("SEED_DATA_PATH")
            if not (String.IsNullOrEmpty fromEnv) then fromEnv
            else Path.Combine(AppContext.BaseDirectory, "..", "..", "..", "..", "..", "data", "seed") |> Path.GetFullPath
        printfn $"Seed data dir: {seedDir}"
        PhilosophyExplorer.Db.Seed.run seedDir
        0
    else

    let builder = WebApplication.CreateBuilder(args)

    let jsonOptions = JsonSerializerOptions(PropertyNamingPolicy = JsonNamingPolicy.CamelCase)
    jsonOptions.DefaultIgnoreCondition <- JsonIgnoreCondition.WhenWritingNull
    jsonOptions.Converters.Add(JsonFSharpConverter(JsonUnionEncoding.ExternalTag))

    builder.Services.AddEndpointsApiExplorer() |> ignore
    builder.Services.AddSwaggerGen(fun c ->
        c.SwaggerDoc("v1", Microsoft.OpenApi.Models.OpenApiInfo(
            Title = "Philosophy Explorer API",
            Version = "0.0.1"))
    ) |> ignore

    builder.Services.ConfigureHttpJsonOptions(fun opts ->
        opts.SerializerOptions.PropertyNamingPolicy <- JsonNamingPolicy.CamelCase
        opts.SerializerOptions.DefaultIgnoreCondition <- JsonIgnoreCondition.WhenWritingNull
    ) |> ignore

    builder.Services.AddCors() |> ignore

    let app = builder.Build()

    // CORS — mirrors packages/api/src/index.ts
    let allowedOrigins =
        (Environment.GetEnvironmentVariable("ALLOWED_ORIGINS") |> Option.ofObj |> Option.defaultValue "http://localhost:3000")
            .Split(',', StringSplitOptions.RemoveEmptyEntries)

    app.UseCors(fun policy ->
        policy
            .WithOrigins(allowedOrigins)
            .AllowAnyHeader()
            .AllowAnyMethod()
        |> ignore
    ) |> ignore

    // /ping — startup diagnostic, matches original
    app.MapGet("/ping", Func<{| ok: bool |}>(fun () -> {| ok = true |})) |> ignore

    // Graph service — load graph-data.json
    let graphDataPath =
        let fromEnv = Environment.GetEnvironmentVariable("GRAPH_DATA_PATH")
        if not (String.IsNullOrEmpty fromEnv) then fromEnv
        else Path.Combine(AppContext.BaseDirectory, "..", "..", "..", "..", "..", "data", "graph-data.json") |> Path.GetFullPath

    let graphService = MemoryGraphService(graphDataPath)
    printfn $"  Graph loaded: {graphService.NodeCount} nodes, {graphService.EdgeCount} edges"

    // Register route modules
    HealthRoutes.register app
    PhilosopherRoutes.register app
    CatalogRoutes.register app
    GraphRoutes.register graphService app

    // Swagger / OpenAPI
    app.UseSwagger() |> ignore
    app.UseSwaggerUI(fun c ->
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "Philosophy Explorer API v1")
        c.RoutePrefix <- "api/doc"
    ) |> ignore

    let port = Environment.GetEnvironmentVariable("PORT") |> Option.ofObj |> Option.defaultValue "3001"
    app.Urls.Add($"http://0.0.0.0:{port}")

    printfn $"API running at http://localhost:{port}"
    printfn $"OpenAPI docs at http://localhost:{port}/api/doc"

    app.Run()
    0
