#!/usr/bin/env bash
# Fetches the OpenAPI spec from the running F# API server and saves it.
# The API must be running on port 3001 (or PORT env var).

set -euo pipefail

PORT="${PORT:-3001}"
OUT="$(dirname "$0")/../packages/specs/openapi.json"

echo "Fetching OpenAPI spec from http://localhost:${PORT}/swagger/v1/swagger.json ..."
# NO_COLOR/PYTHON_COLORS: Python 3.14's json.tool colorizes its output even when
# redirected to a file, which embeds ANSI escapes and corrupts the JSON. Disable.
curl -sf "http://localhost:${PORT}/swagger/v1/swagger.json" | NO_COLOR=1 PYTHON_COLORS=0 python3 -m json.tool > "$OUT"
echo "Written to $OUT"
