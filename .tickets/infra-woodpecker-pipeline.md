# infra: Woodpecker pipeline for build/test/push/redeploy

**Branch slug:** `infra/woodpecker-pipeline`
**Status:** in-progress
**Size:** S–M
**Depends on:** `infra/dockerize-monorepo`

## Why

The homelab CI runs on Woodpecker (`ci.lab`) and the image registry
is the Gitea registry on `git.lab`. Once a Dockerfile exists, we
need a pipeline that builds it on push, runs tests, pushes the
image, and pokes Dokploy to redeploy the right slot.

Without this, every deploy is a manual `docker build && docker push
&& curl dokploy-webhook` — fine for the first run, not for the
weekly drumbeat. The `swe-interview-prep` migration roadmap (§ Phase
4) is the template to copy.

## Scope

**In:**
- `.woodpecker.yml` at repo root with these steps:
  1. **install + test** — `npm ci`; `npm test` (covers both
     packages per root `package.json`).
  2. **build image** — `docker build -t
     git.lab/nick-b/philosophy_explorer:${CI_COMMIT_BRANCH}-${CI_COMMIT_SHA:0:7}`.
  3. **push to Gitea registry** — log in with Woodpecker secrets,
     push the SHA-tagged image plus a moving `:<branch>` tag.
  4. **redeploy hook** — POST to Dokploy webhook for the matching
     slot (`philosophy-explorer-dev` on `main`/`paper-whistle`,
     `philosophy-explorer-prod` on a release tag).
- Pipeline triggers: pushes to the default branch and to release
  tags (`v*`). Skip on PR builds for now — the homelab Woodpecker
  setup typically doesn't run PR builds; verify with `ci.lab`.
- Woodpecker secrets needed: `gitea_registry_user`,
  `gitea_registry_token`, `dokploy_webhook_dev`, `dokploy_webhook_prod`.
  Filed via Woodpecker UI per the homelab pattern.

**Out (captured separately):**
- Dokploy slot creation — `0016-philosophy-explorer-dokploy-slots.md`.
- Postgres + Garage provisioning — `0014`, `0015`.
- Multi-arch builds — single arch (amd64) is fine; the homelab is
  amd64 throughout.

## Build sketch

- Copy `.woodpecker.yml` from `swe-interview-prep` as a starting
  point and swap image name, test command, and webhook secret names.
- Confirm SIP's pipeline structure before copying — it may have
  landed changes since the homelab roadmap doc was written.
- Test locally first with `woodpecker-cli exec .woodpecker.yml` if
  available; otherwise push a no-op commit to a throwaway branch.
- Add a one-line `README.md` snippet pointing at the pipeline so
  the deploy path is discoverable.

## References

- `swe-interview-prep/docs/homelab-migration-roadmap.md` — § Phase 4,
  Woodpecker pipeline shape.
- `homelab_infra_and_planning/docs/cicd-flow.md` (if present) — the
  homelab's canonical CI/CD doc.
- `git.lab/nick-b/philosophy_explorer` — registry namespace.
