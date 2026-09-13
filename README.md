# Commerce Client Workspace

This folder contains the frontend micro-apps for the commerce platform. Each app is a separate Next.js package and can be developed, built, and deployed independently while sharing UI, query, type, and API client packages.

## Requirements

- Node.js `26.5.0` or newer
- pnpm `10.30.1`
- Optional backend API at `http://localhost:9001` for local API integration

```bash
cd ecomm-web-app
pnpm install
```

## Apps

| App | Package | Local URL | Purpose |
| --- | --- | --- | --- |
| Marketing | `@repo/marketing` | `http://localhost:3003` | Public landing page for the platform |
| Merchant | `@repo/merchant` | `http://localhost:3008/merchant` | Merchant admin workspace |
| Storefront | `@repo/storefront` | `http://localhost:3002` | Public shopping storefront |

## Scripts

```bash
pnpm marketing:dev
pnpm merchant:dev
pnpm storefront:dev
pnpm type-check
pnpm lint
pnpm build
```

## Local Gateway

The frontend apps are designed to run locally on the host, while an optional nginx gateway can sit in front of them.

Start the apps in separate terminals:

```bash
pnpm marketing:dev
pnpm merchant:dev
pnpm storefront:dev
```

Then start the gateway if you want the routed URLs:

```bash
docker compose -f docker-compose.dev.yml up
```

Open:

```txt
http://localhost:3003
http://localhost:3008/merchant
http://localhost:3002
```

When using the gateway, the route mapping is typically:

```txt
/merchant -> merchant app
/         -> storefront app
```

Marketing remains direct at `http://localhost:3003`.