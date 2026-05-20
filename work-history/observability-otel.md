# infra — OpenTelemetry exporter to Signoz

**Branch:** `infra/observability-otel`
**Merged:** 2026-05-20 (TBD on actual merge)

Resolves the `.tickets/infra-observability-otel.md` ticket, with the
scope widened past the original ticket text — see **Why** below.

## What changed

### API (`packages/api-fsharp`)

- New `Telemetry/Otel.fs` (compiled after `Domain/`, before `Db/`).
  Two modules:
  - `Diagnostics` — one `ActivitySource` and one `Meter`, both named
    `philosophy-explorer-api`. Domain instruments: counters
    `philexp.graph.traversals` (tagged `endpoint`) and
    `philexp.argument.lookups` (tagged `kind`), plus observable
    gauges `philexp.graph.nodes` / `philexp.graph.edges`. The gauge
    values are plain mutable module fields set by `Program.fs` after
    the graph loads — done this way to avoid a compile-order
    dependency on the `Graph/` module.
  - `Otel` — `configure : WebApplicationBuilder -> bool`. Wires
    tracing (ASP.NET Core, HttpClient, Npgsql, the app
    `ActivitySource`), metrics (ASP.NET Core, HttpClient, .NET
    runtime, Npgsql, the app `Meter`), and logging (OTel logging
    provider) and exports all three over OTLP. Returns whether OTLP
    export is active.
- `Program.fs` — calls `Otel.configure` right after `CreateBuilder`;
  startup `printfn`s replaced with structured `ILogger` calls;
  publishes graph size to the metrics gauges.
- Route instrumentation: graph traversal endpoints increment
  `graph.traversals`; argument list/detail endpoints increment
  `argument.lookups`; `HealthRoutes` now logs the exception when the
  DB probe fails (it previously only returned it in the response).
- `PhilosophyExplorer.Api.fsproj` — added `OpenTelemetry.*`
  (hosting, OTLP exporter, AspNetCore/Http/Runtime instrumentation)
  and `Npgsql.OpenTelemetry`.

### Frontend (`packages/web`)

- New `src/lib/telemetry.ts` — browser RUM via the OTel Web SDK
  (auto-instrumentations: document-load, fetch, XHR, user
  interaction). `initTelemetry()` is called first thing in
  `main.tsx`.
- Added the `@opentelemetry/*` browser packages to `package.json`.
- `vite-env.d.ts` — typed `VITE_OTEL_EXPORTER_OTLP_ENDPOINT` /
  `VITE_API_URL`.

### Deployment

- `Dockerfile` — runtime stage sets `OTEL_SERVICE_NAME`,
  `OTEL_EXPORTER_OTLP_PROTOCOL=http/protobuf`,
  `OTEL_EXPORTER_OTLP_ENDPOINT` (homelab Signoz collector), and
  `ASPNETCORE_ENVIRONMENT=Production`. Web-build stage takes an
  opt-in `VITE_OTEL_EXPORTER_OTLP_ENDPOINT` build arg.

## Why

Signoz is already running in the homelab (`signoz-setup.yml`,
`192.168.1.59` — OTLP gRPC `:4317`, HTTP `:4318`, dashboard `:8080`)
and is the SIP-roadmap standard sink. The app was connected to it
but emitting nothing. This wires real instrumentation so request
traces, DB timing, and runtime metrics exist before the first prod
incident. Closes the `infra/observability-otel` ticket.

Scope widened past the ticket on the operator's call:
- **Logs included.** The ticket deferred log forwarding; the operator
  asked for logs too, so the OTel logging provider exports `ILogger`
  records over the same OTLP pipeline. Console logging is left
  intact for Dokploy stdout scraping.
- **Frontend RUM included.** The ticket marked browser tracing out
  of scope; the operator asked for it.
- **Domain metrics included.** The ticket deferred custom metrics;
  the operator asked for "a few", hence the graph/argument counters
  and graph-size gauges.

## Notes for future work

- **DB tracing is Postgres-only.** We use Npgsql's native activity
  source (`AddNpgsql()` / `AddNpgsqlInstrumentation()`), so DB spans
  appear in staging/prod (Postgres) but **not** in local SQLite dev
  — `Microsoft.Data.Sqlite` emits no OTel and there is no maintained
  instrumentation package for it. A `DbConnection` decorator in
  `DbFactory.fs` would cover both dialects uniformly if dev DB spans
  are ever wanted; it was considered and deferred as boilerplate.
- **OTLP export is gated on `OTEL_EXPORTER_OTLP_ENDPOINT`.** When the
  var is unset (local dev with no collector) `Otel.configure`
  registers instrumentation but skips the exporter, so the app stays
  quiet. The Dockerfile bakes the homelab collector as the default;
  override per environment in Dokploy.
- **Frontend RUM needs CORS on the collector.** Browser spans are
  POSTed straight to the OTLP HTTP endpoint, so Signoz's collector
  must allow CORS from the SPA origin. RUM is off unless the image
  is built with `--build-arg VITE_OTEL_EXPORTER_OTLP_ENDPOINT=...`;
  verify the collector CORS config before enabling it.
- **`Npgsql.OpenTelemetry` pinned to 9.0.3** to match `Npgsql`
  9.0.3 — `dotnet add package` defaulted to 10.x, which wants
  Npgsql 10.
- **Verify in Signoz after deploy:** hit `/api/graph/neighbors/...`
  and confirm a trace with the HTTP span + nested Npgsql span, plus
  the `philexp.*` metrics under the `philosophy-explorer-api`
  service. Note `/api/graph/stats` (the ticket's example) hits the
  in-memory graph, not the DB — it produces an HTTP span only.
- The OTel browser SDK adds weight to the web bundle. If bundle size
  becomes a concern, `telemetry.ts` could be lazy-imported behind a
  dynamic `import()` so it only loads when RUM is enabled.
