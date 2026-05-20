#!/usr/bin/env bash
# Curl-based smoke test for a deployed philosophy-explorer slot.
# Usage:
#   TARGET=https://philosophy-explorer-dev.app.lab ./scripts/smoke-deployed.sh
#   TARGET=https://philosophy-explorer.app.lab     ./scripts/smoke-deployed.sh

set -uo pipefail

TARGET="${TARGET:-https://philosophy-explorer-dev.app.lab}"
PASS=0
FAIL=0

grn()  { printf '\033[0;32m%s\033[0m' "$*"; }
red()  { printf '\033[0;31m%s\033[0m' "$*"; }
ok()   { PASS=$((PASS+1)); printf '  %s %s\n' "$(grn '✓')" "$*"; }
bad()  { FAIL=$((FAIL+1)); printf '  %s %s\n' "$(red '✗')" "$*"; }

# NO `-f` flag — we want 4xx bodies to come back for assertions.
require_status() {
    local url="$1" want="$2" label="$3"
    local got
    got=$(curl -sS -o /dev/null -w "%{http_code}" -m 10 "$url" 2>/dev/null || echo "000")
    [[ "$got" == "$want" ]] && ok "$label  ($want)" || bad "$label  (want $want, got $got)  url=$url"
}
require_body() {
    local url="$1" pattern="$2" label="$3"
    local body; body=$(curl -sS -m 10 "$url" 2>/dev/null || echo "")
    echo "$body" | grep -qE "$pattern" && ok "$label  (matches /$pattern/)" || bad "$label  (no /$pattern/)  url=$url"
}
require_no_body() {
    local url="$1" pattern="$2" label="$3"
    local body; body=$(curl -sS -m 10 "$url" 2>/dev/null || echo "")
    echo "$body" | grep -qE "$pattern" && bad "$label  (regression: /$pattern/ found)  url=$url" || ok "$label  (no /$pattern/)"
}

echo "target: $TARGET"

# --- Substrate ---
echo "$(grn substrate:)"
require_status "$TARGET/api/health" 200 "/api/health reachable"
require_body   "$TARGET/api/health" '"db":[[:space:]]*"ok"'      "/api/health reports db: ok"
require_body   "$TARGET/api/health" '"status":[[:space:]]*"ok"'  "/api/health reports status: ok"
require_status "$TARGET/ping"       200 "/ping reachable"

# --- SPA serving ---
echo "$(grn spa:)"
require_status  "$TARGET/"                    200 "/ returns 200"
require_body    "$TARGET/"                    "<title>Philosophy Explorer</title>" "/ is the SPA HTML"
require_body    "$TARGET/"                    "/assets/index-[A-Za-z0-9_-]+\\.js"   "/ references hashed bundle"
require_no_body "$TARGET/"                    "localhost:3001"                      "/ no hardcoded localhost API"
require_status  "$TARGET/some/deep/spa/route" 200 "deep route falls back to index"
ASSET=$(curl -sS -m 10 "$TARGET/" 2>/dev/null | grep -oE '/assets/index-[A-Za-z0-9_-]+\.js' | head -n1)
[[ -n "$ASSET" ]] && require_status "$TARGET$ASSET" 200 "hashed bundle served"

# --- API ---
echo "$(grn api:)"
require_status "$TARGET/api/graph/stats" 200 "/api/graph/stats"
require_body   "$TARGET/api/graph/stats" '"nodeCount"' "/api/graph/stats returns graph stats"
require_status "$TARGET/api/philosophers" 200 "/api/philosophers"

# --- Docs ---
echo "$(grn docs:)"
require_status "$TARGET/api/doc/index.html"      200 "/api/doc/index.html (Swagger UI) reachable"
require_status "$TARGET/swagger/v1/swagger.json" 200 "/swagger/v1/swagger.json reachable"

# --- Known gap: API 404 fallback ---
# Program.fs maps `MapFallbackToFile("index.html")` with no `/api` exclusion,
# so an unknown `/api/...` path currently serves the SPA HTML (200) instead of
# a JSON 404. Not breaking, but worth fixing — see work-history doc. Once an
# `/api`-excluding fallback lands, uncomment:
# require_status "$TARGET/api/this-route-does-not-exist" 404 "unknown API route 404s"

echo
if (( FAIL == 0 )); then
    printf '%s  %d/%d checks passed\n' "$(grn 'PASS:')" "$PASS" "$((PASS+FAIL))"
    exit 0
else
    printf '%s  %d failed / %d total\n' "$(red 'FAIL:')" "$FAIL" "$((PASS+FAIL))"
    exit 1
fi
