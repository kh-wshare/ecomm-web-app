# Gateway Routing

The nginx gateway is an optional front door for the frontend apps. It does not replace the apps; it only exposes them through cleaner browser URLs.

Each frontend app still runs on its own host port, and nginx forwards traffic from a friendly public URL to that app.

## Why use the gateway?

This is useful when you want URLs like these instead of raw app ports:

```txt
http://localhost/merchant
http://localhost
```

Without the gateway, you would open the apps directly on their app ports:

```txt
http://localhost:3008/merchant
http://localhost:3002
http://localhost:3003
```

## Start the apps

Run each frontend app from the repo root in its own terminal:

```bash
pnpm marketing:dev
pnpm merchant:dev
pnpm storefront:dev
```

## Start the gateway

This starts nginx in front of the host-run apps:

```bash
docker compose -f docker-compose.dev.yml up
```

## Route mapping

The gateway routes requests like this:

```txt
http://localhost/merchant -> http://localhost:3008/merchant
http://localhost          -> http://localhost:3002
```

Marketing is not behind the gateway because it is a standalone landing site:

```txt
http://localhost:3003 -> marketing app
```

## Static assets

The gateway also forwards Next.js static asset requests for the routed apps:

```txt
/merchant/_next/static/* -> merchant app
/_next/static/*          -> storefront app
```

## Verify

Once the apps and nginx are running, check the routes directly in the browser or with curl:

```bash
curl -I http://localhost/merchant
curl -I http://localhost
curl -I http://localhost:3003
```

You can also validate nginx itself from the running container:

```bash
docker compose -f docker-compose.dev.yml exec nginx nginx -t
```

Production frontend deployment is documented in [Deployment](./deployment.md).
