# Gateway Routing

The local gateway uses nginx to route browser traffic to the frontend apps running on host ports.

## Start Apps

Run these from the repo root in separate terminals:

```bash
pnpm marketing:dev
pnpm merchant:dev
pnpm pos:dev
pnpm storefront:dev
```

## Start Gateway

Run this from the repo root:

```bash
docker compose -f docker-compose.prod.yml up nginx
```

## Routes

```txt
http://localhost/merchant -> merchant app on 3000
http://localhost/pos      -> POS app on 3001
http://localhost          -> storefront app on 3002
```

Marketing stays direct:

```txt
http://localhost:3003 -> marketing app
```

Production frontend deployment is documented in [Deployment](./deployment.md).

## Static Assets

```txt
/merchant/_next/static/* -> merchant app
/pos/_next/static/*      -> POS app
/_next/static/*          -> storefront app
```

## Verify

```bash
docker run --rm -v "$PWD/../nginx.conf:/etc/nginx/nginx.conf:ro" nginx:1.27-alpine nginx -t
curl -I http://localhost/merchant
curl -I http://localhost/pos
curl -I http://localhost
```
