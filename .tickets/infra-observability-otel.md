# infra: OTel exporter to Signoz

**Branch slug:** `infra/observability-otel`
**Status:** queued
**Size:** M
**Depends on:** `none` (parallelizable with the cutover tickets)

## Why

Signoz is already running in the homelab and the SIP roadmap
adopts it as the standard sink for traces/logs/metrics. Wiring
philosophy-explorer at deploy time (rather than retrofitting later)
costs little and gets us request traces + DB call timing before
the first prod incident.

Pure read-side observability for now — we're not tracing user
sessions or doing front-end RUM, just the API and Dapper calls.

## Scope

**In:**
- Add `OpenTelemetry.Extensions.Hosting`,
  `OpenTelemetry.Exporter.OpenTelemetryProtocol`, and the
  `OpenTelemetry.Instrumentation.AspNetCore` /
  `OpenTelemetry.Instrumentation.Http` instrumentation packages to
  `PhilosophyExplorer.Api.fsproj`.
- Add an instrumentation source for Dapper calls — either via
  `OpenTelemetry.Instrumentation.SqlClient` (Postgres) or a small
  custom `ActivitySource` wrapper around `IDbConnection.QueryAsync`
  in `Db/`. Decide once we see what the Npgsql ADO.NET layer emits
  natively.
- OTLP exporter targeting `$OTEL_EXPORTER_OTLP_ENDPOINT`
  (`http://signoz.lab:4318` by default; override per env).
- Service identity: `OTEL_SERVICE_NAME=philosophy-explorer-api`,
  `OTEL_RESOURCE_ATTRIBUTES=deployment.environment=$ENV`.
- Verify in Signoz: a request to `/api/graph/stats` produces a
  trace with at least the HTTP span + one DB span.

**Out (captured separately):**
- Front-end RUM (browser-side tracing) — out of scope; if we want
  it later, file a separate ticket.
- Custom business metrics (e.g. arguments-created counter) — add
  when we have a use case.
- Log forwarding — Signoz can ingest logs via OTLP, but stdout
  scraping from Dokploy may already cover it. Confirm separately.

## Build sketch

- Pattern after any existing OTel-enabled .NET app in the homelab;
  if there isn't one, the Microsoft .NET OTel docs (recent) are the
  reference.
- Keep the wiring in a small `Telemetry/Otel.fs` module called from
  `Program.fs` to keep `Program.fs` from sprawling.
- Smoke-test against a local Signoz collector before pushing
  config to the deployed env.

## References

- `homelab_infra_and_planning/ansible/playbooks/` — find the Signoz
  playbook for the canonical OTLP endpoint URL.
- OpenTelemetry .NET getting-started docs (current; check version
  pins against .NET 9 support).
