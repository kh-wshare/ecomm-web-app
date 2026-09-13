# Frontend Deployment

This runbook covers frontend apps only. Backend deployment lives in `docs/backend-deployment.md` from the repository root.

## Scope

```txt
apps/marketing
apps/merchant
apps/storefront
packages/*
nginx gateway for frontend routing
```

Marketing is included in the frontend workspace and has a dedicated production Dockerfile and direct port exposure.

## Local Frontend Setup

```bash
cd ecomm-web-app
pnpm install
```

Run apps individually:

```bash
pnpm marketing:dev
pnpm merchant:dev
pnpm storefront:dev
```

## Local Gateway

Run the frontend apps first:

```bash
pnpm marketing:dev
pnpm merchant:dev
pnpm storefront:dev
```

Then start the gateway from the repo root:

```bash
docker compose -f docker-compose.dev.yml up
```

Routes:

```txt
/merchant -> merchant app
/         -> storefront app
```

Marketing remains direct:

```txt
http://localhost:3003
```

## Build One Frontend App

```bash
pnpm --filter @repo/marketing build
pnpm --filter @repo/merchant build
pnpm --filter @repo/storefront build
```

## Build Frontend Workspace

```bash
pnpm type-check
pnpm lint
pnpm build
```

## Frontend Environment

Frontend apps use app-local `.env.example` files.

Common local values:

```env
INTERNAL_API_URL=http://localhost:9001
NEXT_PUBLIC_API_URL=http://localhost:9001
```

Docker/internal values should point server-side requests to the backend service:

```env
INTERNAL_API_URL=http://app:3000
NEXT_PUBLIC_API_URL=https://api.example.com
```

## Frontend Ownership Rules

- Frontend deploys must not run Prisma migrations.
- Frontend deploys must not require rebuilding the backend API.
- App route handlers may proxy to backend APIs, but domain state remains backend-owned.
- Shared client code belongs in `client/packages/*`.
- Real `.env` files, `.next`, `node_modules`, `.turbo`, and build info stay out of Git.

## CI/CD

Each app (`marketing`, `merchant`, `storefront`) is built, pushed, and
deployed **independently** — a change scoped to `apps/merchant` never
rebuilds or restarts `storefront`, and vice versa. This is driven by a
`changes` job (in `ci.yml`) that diffs the push/PR against its base:

- A change under `apps/<app>/**` affects only `<app>`.
- A change under `packages/**` or root config (`package.json`,
  `pnpm-lock.yaml`, `pnpm-workspace.yaml`, `turbo.json`) is treated as
  affecting **all three apps**, since any of them may transpile that shared
  code — this repo doesn't attempt to model the package→app dependency graph
  more precisely than that.
- A change under `deploy/nginx/**` or `docker-compose.prod.yml` triggers a
  config sync + nginx restart without necessarily rebuilding any app image.
- `workflow_dispatch` (manual run) always treats every app as affected, since
  there's no diff to compare against.

Two GitHub Actions workflows implement this:

- **`.github/workflows/ci.yml`** — runs on every pull request, and is also
  called by the deploy workflow as a reusable workflow: `pnpm install`,
  `lint`, `type-check`, `build` (whole workspace, since these are cheap and
  turbo-cached), plus a Docker build (no push) of only the affected app(s)'
  Dockerfiles to catch build breakage early. Exposes `apps_json`/`apps_list`
  (which apps are affected) and `gateway_changed` as outputs for the deploy
  workflow to consume.
- **`.github/workflows/deploy.yml`** — runs on every push to `main`:
  1. Calls `ci.yml` as a gate and to get the affected-apps list.
  2. Builds and pushes an image **only for each affected app** to GitHub
     Container Registry, as `ghcr.io/<owner>/<repo>/<app>:latest` and
     `:<commit-sha>`.
  3. Copies `docker-compose.prod.yml`, `deploy/nginx/templates`, and
     `deploy/nginx/init-letsencrypt.sh` to the production host over SCP
     (always, so config stays in sync even on an app-only change).
  4. SSHes in and, for each affected app only, sets that app's
     `<APP>_IMAGE_TAG` to the commit SHA, `docker compose pull`s it, and
     `docker compose up -d`s it — the other apps' containers are left
     untouched, still running whatever they were already running. If the
     gateway config changed, `nginx` is also brought up to pick up the new
     template.

It can also be triggered manually from the Actions tab
(`workflow_dispatch`) to redeploy every app without a new commit.

### Per-app image tags

`docker-compose.prod.yml` gives each app its own tag variable
(`MARKETING_IMAGE_TAG`, `MERCHANT_IMAGE_TAG`, `STOREFRONT_IMAGE_TAG`, all
defaulting to `latest`) instead of one shared
`IMAGE_TAG`. That's what makes independence possible: pinning `merchant` to a
new commit SHA has no effect on which tag `storefront`'s `image:` line
resolves to.

### Import boundaries

`packages/eslint-config/app-boundaries.mjs` adds an `eslint-plugin-import`
`no-restricted-paths` rule to every app's flat config, failing lint if one
app imports source directly from another (e.g. `apps/merchant` importing
from `../storefront`). This is the existing "apps must not import source
directly from another app" rule from [Architecture](./architecture.md),
enforced rather than just documented. Shared code still belongs in
`packages/*`.

### Repository secrets required

Set these under **Settings → Secrets and variables → Actions**:

| Secret | Purpose |
| --- | --- |
| `DEPLOY_HOST` | Production host, e.g. `203.0.113.10` |
| `DEPLOY_USER` | SSH user with Docker permissions on that host |
| `DEPLOY_SSH_KEY` | Private key for that user (matching public key in the host's `authorized_keys`) |
| `DEPLOY_PORT` | Optional, defaults to `22` |
| `DEPLOY_PATH` | Absolute path on the host holding `docker-compose.prod.yml` and `.env.production` (e.g. `/opt/ecomm-web-app`) |
| `GHCR_PULL_TOKEN` | A classic PAT with `read:packages`, used by the host to `docker login ghcr.io` and pull images (only needed while the GHCR packages are private) |

`GITHUB_TOKEN` (automatic, no setup) is used to push images during the build
step and needs no secret of its own.

### Production host — one-time setup

1. Install Docker + the Compose plugin.
2. `mkdir -p <DEPLOY_PATH>` and generate an SSH keypair for the deploy user;
   add the public half to `authorized_keys`, the private half becomes
   `DEPLOY_SSH_KEY`.
3. Copy `.env.production.example` to `<DEPLOY_PATH>/.env.production` and fill
   in real values (domains, API URL, Firebase/Telegram keys). This file is
   never touched by the deploy workflow — edit it directly on the host.
4. Run the first push to `main` (or trigger `deploy.yml` manually) so
   `docker-compose.prod.yml`, `deploy/nginx/templates`, and
   `deploy/nginx/init-letsencrypt.sh` land in `<DEPLOY_PATH>`. The app
   containers will come up fine; `nginx` will crash-loop harmlessly until the
   next step provisions certificates for it to serve.
5. From `<DEPLOY_PATH>` on the host, bootstrap TLS once:
   ```bash
   ./deploy/nginx/init-letsencrypt.sh
   ```
   This issues the first Let's Encrypt certificates for `GATEWAY_DOMAIN` and
   `MARKETING_DOMAIN` (from `.env.production`) and brings up the full stack.
   Point both domains' DNS at the host before running it.

After that, every push to `main` rebuilds, re-pushes, and redeploys
automatically — no manual steps. Certificate renewal is handled by the
`certbot` service in `docker-compose.prod.yml`, which checks twice a day; the
`nginx` service reloads every 6 hours to pick up renewed certs.
