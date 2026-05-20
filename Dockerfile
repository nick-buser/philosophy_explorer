# syntax=docker/dockerfile:1.7

# ---- Stage 1: web build ----
FROM node:20-alpine AS web-build
WORKDIR /src
COPY package.json package-lock.json ./
COPY packages/web/package.json ./packages/web/
RUN npm ci
COPY packages/specs/ ./packages/specs/
COPY packages/web/ ./packages/web/
# VITE_API_URL="" => SPA fetches /api/* from same origin (Caddy/Dokploy)
ENV VITE_API_URL=""
# Browser RUM is opt-in: build with
#   --build-arg VITE_OTEL_EXPORTER_OTLP_ENDPOINT=http://signoz.lab:4318
# to ship traces from the SPA. Empty (default) => RUM stays off.
ARG VITE_OTEL_EXPORTER_OTLP_ENDPOINT=""
ENV VITE_OTEL_EXPORTER_OTLP_ENDPOINT=$VITE_OTEL_EXPORTER_OTLP_ENDPOINT
RUN npm run build --workspace=packages/web

# ---- Stage 2: api build ----
FROM mcr.microsoft.com/dotnet/sdk:9.0 AS api-build
WORKDIR /src
COPY packages/api-fsharp/PhilosophyExplorer.Api/PhilosophyExplorer.Api.fsproj \
     ./packages/api-fsharp/PhilosophyExplorer.Api/
RUN dotnet restore packages/api-fsharp/PhilosophyExplorer.Api/PhilosophyExplorer.Api.fsproj
COPY packages/api-fsharp/PhilosophyExplorer.Api/ ./packages/api-fsharp/PhilosophyExplorer.Api/
RUN dotnet publish packages/api-fsharp/PhilosophyExplorer.Api/PhilosophyExplorer.Api.fsproj \
    -c Release -o /publish --no-restore

# ---- Stage 3: runtime ----
FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS runtime
WORKDIR /app
COPY --from=api-build /publish ./
COPY --from=web-build /src/packages/web/dist ./wwwroot
COPY data/seed/ ./data/seed/
COPY data/graph-data.json ./data/graph-data.json

ENV ASPNETCORE_URLS=http://+:3001 \
    PORT=3001 \
    SEED_DATA_PATH=/app/data/seed \
    GRAPH_DATA_PATH=/app/data/graph-data.json \
    RUN_SEED=false

# OpenTelemetry — exports traces/metrics/logs to Signoz over OTLP.
# OTEL_EXPORTER_OTLP_ENDPOINT is the homelab Signoz collector; override
# per environment in Dokploy. Unsetting it disables OTLP export entirely.
# ASPNETCORE_ENVIRONMENT feeds the deployment.environment resource attribute.
ENV ASPNETCORE_ENVIRONMENT=Production \
    OTEL_SERVICE_NAME=philosophy-explorer-api \
    OTEL_EXPORTER_OTLP_PROTOCOL=http/protobuf \
    OTEL_EXPORTER_OTLP_ENDPOINT=http://192.168.1.59:4318

EXPOSE 3001

COPY <<'EOF' /docker-entrypoint.sh
#!/bin/sh
set -e
if [ "$RUN_SEED" = "true" ]; then
  exec dotnet PhilosophyExplorer.Api.dll --seed
fi
exec dotnet PhilosophyExplorer.Api.dll
EOF
RUN chmod +x /docker-entrypoint.sh

ENTRYPOINT ["/docker-entrypoint.sh"]
