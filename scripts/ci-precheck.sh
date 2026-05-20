#!/usr/bin/env bash
# Fast (<2s) sanity for .woodpecker.yml. Catches the 1-second-fixable
# failures that otherwise burn a 7-minute Woodpecker cycle. See homelab
# docs/incidents/009 § P3 for why this exists.
#
# Usage:
#   make ci-precheck                      # offline (no secret-existence probe)
#   WP_TOKEN=$(...) make ci-precheck      # full check

set -uo pipefail

YAML_FILE="${YAML_FILE:-.woodpecker.yml}"
WP_URL="${WP_URL:-https://ci.lab}"
WP_TOKEN="${WP_TOKEN:-}"

PASS=0
FAIL=0
red() { printf '\033[0;31m%s\033[0m' "$*"; }
grn() { printf '\033[0;32m%s\033[0m' "$*"; }
ylw() { printf '\033[0;33m%s\033[0m' "$*"; }
ok()   { PASS=$((PASS+1)); printf '  %s %s\n' "$(grn '✓')" "$*"; }
bad()  { FAIL=$((FAIL+1)); printf '  %s %s\n' "$(red '✗')" "$*"; }
skip() {                   printf '  %s %s\n' "$(ylw '○')" "$*"; }

echo "$(grn parse:)"
[[ -f "$YAML_FILE" ]] || { bad "$YAML_FILE not found"; exit 1; }
python3 -c "import yaml; yaml.safe_load(open('$YAML_FILE'))" 2>/dev/null \
    || { bad "$YAML_FILE invalid YAML"; python3 -c "import yaml; yaml.safe_load(open('$YAML_FILE'))"; exit 1; }
ok "$YAML_FILE parses"

echo "$(grn syntax:)"
grep -nE '^[[:space:]]*secrets:[[:space:]]*\[' "$YAML_FILE" >/dev/null 2>&1 \
    && bad "v2 \`secrets: [...]\` syntax (use environment.VAR.from_secret)" \
    || ok "no v2 \`secrets: [...]\` syntax"
if python3 -c "
import yaml
d=yaml.safe_load(open('$YAML_FILE'))
import sys
bad=[n for n,s in (d.get('steps') or {}).items() if isinstance(s,dict) and isinstance(s.get('secrets'),list)]
sys.exit(1 if bad else 0)" 2>/dev/null; then
    ok "no v2 \`secrets:\` list block"
else
    bad "v2 \`secrets:\` list block found"
fi

echo "$(grn images:)"
grep -nE 'image:[[:space:]]*woodpeckerci/plugin-docker:' "$YAML_FILE" >/dev/null 2>&1 \
    && bad "deprecated woodpeckerci/plugin-docker (use plugin-docker-buildx)" \
    || ok "no deprecated plugin-docker references"

echo "$(grn secrets:)"
REFS=$(python3 -c "
import yaml
d=yaml.safe_load(open('$YAML_FILE'))
seen=set()
def walk(n):
    if isinstance(n,dict):
        if 'from_secret' in n and isinstance(n['from_secret'],str): seen.add(n['from_secret'])
        for v in n.values(): walk(v)
    elif isinstance(n,list):
        for v in n: walk(v)
walk(d)
print('\n'.join(sorted(seen)))")
if [[ -z "$WP_TOKEN" ]]; then
    skip "WP_TOKEN unset — skipping live probe"
    [[ -n "$REFS" ]] && echo "    secrets referenced: $(echo "$REFS" | tr '\n' ' ')"
else
    HAVE=$(curl -fsSL -H "Authorization: Bearer $WP_TOKEN" "$WP_URL/api/secrets" 2>/dev/null \
            | python3 -c "import json,sys;[print(s['name']) for s in json.load(sys.stdin)]" | sort -u)
    MISSING=""
    for n in $REFS; do echo "$HAVE" | grep -qx "$n" || MISSING="$MISSING $n"; done
    [[ -n "$MISSING" ]] && bad "missing on $WP_URL:$MISSING" || ok "all referenced secrets exist on $WP_URL"
fi

echo "$(grn deploy-target:)"
if [[ -f .deploy-target ]]; then
    python3 -c "
import yaml, sys
d=yaml.safe_load(open('.deploy-target')) or {}
errs=[]
for env,cfg in d.items():
    if not isinstance(cfg,dict): errs.append(f'{env}: not a dict')
    elif 'app' in cfg and 'apps' in cfg: errs.append(f'{env}: both app and apps')
    elif 'app' not in cfg and 'apps' not in cfg: errs.append(f'{env}: missing app/apps')
sys.exit(0 if not errs else 1)" \
        && ok ".deploy-target shape OK" || bad ".deploy-target malformed"
else
    skip "no .deploy-target"
fi

echo
if (( FAIL == 0 )); then
    printf '%s  %d checks passed\n' "$(grn 'PRECHECK PASS:')" "$PASS"
    exit 0
else
    printf '%s  %d failed / %d total\n' "$(red 'PRECHECK FAIL:')" "$FAIL" "$((PASS+FAIL))"
    exit 1
fi
