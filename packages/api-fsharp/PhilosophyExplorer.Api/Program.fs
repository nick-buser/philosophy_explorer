open System
open System.IO
open System.Text.Json
open System.Text.Json.Serialization
open Microsoft.AspNetCore.Builder
open Microsoft.Extensions.DependencyInjection
open Microsoft.Extensions.Hosting
open Microsoft.Extensions.Logging
open PhilosophyExplorer.Graph
open PhilosophyExplorer.Routes
open PhilosophyExplorer.Telemetry

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

    PhilosophyExplorer.Db.Queries.configureDapper ()

    let builder = WebApplication.CreateBuilder(args)

    // OpenTelemetry — traces, metrics, logs exported via OTLP to Signoz.
    let otelExporting = Otel.configure builder

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

    // Static SPA assets from wwwroot/. UseDefaultFiles rewrites `/` to
    // `/index.html`; UseStaticFiles serves the files. Both no-op when
    // wwwroot/ is absent (dev runs against `npm run dev:web` instead).
    app.UseDefaultFiles() |> ignore
    app.UseStaticFiles() |> ignore

    // /ping — startup diagnostic, matches original
    app.MapGet("/ping", Func<{| ok: bool |}>(fun () -> {| ok = true |})) |> ignore

    // Graph service — load graph-data.json
    let graphDataPath =
        let fromEnv = Environment.GetEnvironmentVariable("GRAPH_DATA_PATH")
        if not (String.IsNullOrEmpty fromEnv) then fromEnv
        else Path.Combine(AppContext.BaseDirectory, "..", "..", "..", "..", "..", "data", "graph-data.json") |> Path.GetFullPath

    let graphService = MemoryGraphService(graphDataPath)
    Diagnostics.graphNodeCount <- graphService.NodeCount
    Diagnostics.graphEdgeCount <- graphService.EdgeCount
    app.Logger.LogInformation(
        "Graph loaded: {NodeCount} nodes, {EdgeCount} edges",
        graphService.NodeCount, graphService.EdgeCount)

    // Register route modules
    HealthRoutes.register app
    PhilosopherRoutes.register app
    CatalogRoutes.register app
    ArgumentRoutes.register app
    GraphRoutes.register graphService app

    // Swagger / OpenAPI
    app.UseSwagger() |> ignore
    app.UseSwaggerUI(fun c ->
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "Philosophy Explorer API v1")
        c.RoutePrefix <- "api/doc"
    ) |> ignore

    // SPA client-routing fallback. Any unmatched non-API request is served
    // index.html so TanStack Router can resolve the route on the client.
    // Must come after all `Map*` endpoint registrations.
    app.MapFallbackToFile("index.html") |> ignore

    let port = Environment.GetEnvironmentVariable("PORT") |> Option.ofObj |> Option.defaultValue "3001"
    app.Urls.Add($"http://0.0.0.0:{port}")

    app.Logger.LogInformation("API running at http://localhost:{Port}", port)
    app.Logger.LogInformation("OpenAPI docs at http://localhost:{Port}/api/doc", port)
    if otelExporting then
        app.Logger.LogInformation(
            "OpenTelemetry exporting to {Endpoint}",
            Environment.GetEnvironmentVariable("OTEL_EXPORTER_OTLP_ENDPOINT"))
    else
        app.Logger.LogInformation(
            "OpenTelemetry instrumentation active; OTLP export disabled (OTEL_EXPORTER_OTLP_ENDPOINT unset)")

    app.Run()
    0
