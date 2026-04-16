#!/usr/bin/env bash
# Fetches the OpenAPI spec from the running F# API server and saves it.
# The API must be running on port 3001 (or PORT env var).

set -euo pipefail

PORT="${PORT:-3001}"
OUT="$(dirname "$0")/../packages/specs/openapi.json"

echo "Fetching OpenAPI spec from http://localhost:${PORT}/swagger/v1/swagger.json ..."
curl -sf "http://localhost:${PORT}/swagger/v1/swagger.json" | python3 -m json.tool > "$OUT"
echo "Written to $OUT"
