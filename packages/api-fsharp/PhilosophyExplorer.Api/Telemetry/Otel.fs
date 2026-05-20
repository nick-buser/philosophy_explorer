namespace PhilosophyExplorer.Telemetry

open System
open System.Collections.Generic
open System.Diagnostics
open System.Diagnostics.Metrics

/// Shared instrumentation primitives — one ActivitySource for app-level
/// spans and one Meter for domain metrics. Kept in its own module so route
/// modules can record metrics without depending on the OTel wiring.
module Diagnostics =

    [<Literal>]
    let ServiceName = "philosophy-explorer-api"

    /// App-level span source. ASP.NET / HTTP / Npgsql spans come from their
    /// own instrumentation; this is for any manual spans we add later.
    let ActivitySource = new ActivitySource(ServiceName)

    /// Meter backing the custom domain metrics below.
    let Meter = new Meter(ServiceName)

    /// Incremented by the graph traversal endpoints, tagged with `endpoint`.
    let GraphTraversals : Counter<int64> =
        Meter.CreateCounter<int64>(
            "philexp.graph.traversals",
            unit = "{traversal}",
            description = "Graph traversal endpoint invocations")

    /// Incremented by the argument list/detail endpoints, tagged with `kind`.
    let ArgumentLookups : Counter<int64> =
        Meter.CreateCounter<int64>(
            "philexp.argument.lookups",
            unit = "{lookup}",
            description = "Argument list and detail lookups")

    // Graph size — set once by Program after the property graph loads, then
    // reported as observable gauges on each metrics collection.
    let mutable graphNodeCount = 0
    let mutable graphEdgeCount = 0

    Meter.CreateObservableGauge<int>(
        "philexp.graph.nodes",
        (fun () -> graphNodeCount),
        unit = "{node}",
        description = "Nodes in the loaded property graph")
    |> ignore

    Meter.CreateObservableGauge<int>(
        "philexp.graph.edges",
        (fun () -> graphEdgeCount),
        unit = "{edge}",
        description = "Edges in the loaded property graph")
    |> ignore

    /// Helper for tagging a counter with a single string dimension.
    let tag (key: string) (value: string) =
        KeyValuePair<string, obj>(key, box value)


/// OpenTelemetry wiring — traces, metrics, and logs exported via OTLP.
/// Kept out of Program.fs so the startup file stays readable.
module Otel =

    open Microsoft.AspNetCore.Builder
    open Microsoft.Extensions.DependencyInjection
    open Microsoft.Extensions.Logging
    open OpenTelemetry
    open OpenTelemetry.Logs
    open Npgsql
    open OpenTelemetry.Metrics
    open OpenTelemetry.Resources
    open OpenTelemetry.Trace

    /// OTLP endpoint, e.g. http://signoz.lab:4318. When unset (local dev with
    /// no collector) the exporter is skipped entirely so the app stays quiet.
    let private otlpEndpoint () =
        Environment.GetEnvironmentVariable("OTEL_EXPORTER_OTLP_ENDPOINT")
        |> Option.ofObj
        |> Option.filter (String.IsNullOrWhiteSpace >> not)

    let private serviceVersion =
        let v = Reflection.Assembly.GetExecutingAssembly().GetName().Version
        if isNull (box v) then "0.0.0" else string v

    let private deploymentEnvironment () =
        Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT")
        |> Option.ofObj
        |> Option.defaultValue "development"

    /// Identity attached to every span / metric / log record.
    let private applyResource (r: ResourceBuilder) =
        r.AddService(serviceName = Diagnostics.ServiceName, serviceVersion = serviceVersion)
            .AddAttributes(
                [ KeyValuePair<string, obj>("deployment.environment", box (deploymentEnvironment ())) ])
        |> ignore

    /// Wire OTel into the host. Call once, right after CreateBuilder.
    let configure (builder: WebApplicationBuilder) =
        let exportEnabled = (otlpEndpoint ()).IsSome

        builder.Services
            .AddOpenTelemetry()
            .ConfigureResource(fun r -> applyResource r)
            .WithTracing(fun t ->
                t.AddSource(Diagnostics.ActivitySource.Name)
                    .AddAspNetCoreInstrumentation()
                    .AddHttpClientInstrumentation()
                    .AddNpgsql()
                |> ignore
                if exportEnabled then t.AddOtlpExporter() |> ignore)
            .WithMetrics(fun m ->
                m.AddMeter(Diagnostics.Meter.Name)
                    .AddAspNetCoreInstrumentation()
                    .AddHttpClientInstrumentation()
                    .AddRuntimeInstrumentation()
                    .AddNpgsqlInstrumentation()
                |> ignore
                if exportEnabled then m.AddOtlpExporter() |> ignore)
        |> ignore

        // Logs ride the same OTLP pipeline. Console logging is left intact so
        // Dokploy's stdout scraping keeps working.
        builder.Logging.AddOpenTelemetry(fun o ->
            o.IncludeScopes <- true
            o.IncludeFormattedMessage <- true
            o.ParseStateValues <- true
            let resource = ResourceBuilder.CreateDefault()
            applyResource resource
            o.SetResourceBuilder(resource) |> ignore
            if exportEnabled then o.AddOtlpExporter() |> ignore)
        |> ignore

        exportEnabled
