import { NextResponse } from "next/server";

import { env } from "@/lib/env";

// The cart API authenticates with an X-Cart-Token header, which the backend's
// CORS policy does not list in Access-Control-Allow-Headers — so a browser
// preflight blocks every cart call made straight from the page. Routing them
// through the storefront's own origin sidesteps the preflight entirely, and
// keeps the cart token off a cross-origin request. This mirrors what the
// merchant app already does at /merchant/api/commerce.

// Everything forwarded from here is rooted at the API's public storefront
// surface, so no crafted path can reach another resource. The route's own
// mount point is the constraint.
const apiRoot = "storefront";

// Headers worth carrying in either direction. Anything else (hop-by-hop
// headers, the browser's own Origin/Referer) is dropped rather than relayed.
const forwardedRequestHeaders = [
  "accept",
  "content-type",
  "x-cart-token",
  "x-checkout-token",
  "x-correlation-id",
];

export async function GET(request: Request, context: RouteContext) {
  return forward(request, context);
}

export async function POST(request: Request, context: RouteContext) {
  return forward(request, context);
}

export async function PATCH(request: Request, context: RouteContext) {
  return forward(request, context);
}

export async function PUT(request: Request, context: RouteContext) {
  return forward(request, context);
}

export async function DELETE(request: Request, context: RouteContext) {
  return forward(request, context);
}

type RouteContext = { params: Promise<{ path: string[] }> };

async function forward(request: Request, { params }: RouteContext) {
  const { path } = await params;

  if (!path.length) {
    return NextResponse.json(
      { message: "Unsupported storefront resource", statusCode: 404 },
      { status: 404 },
    );
  }

  const apiBaseUrl = env.INTERNAL_API_URL || env.NEXT_PUBLIC_API_URL;

  if (!apiBaseUrl) {
    return NextResponse.json(
      { message: "Missing INTERNAL_API_URL", statusCode: 500 },
      { status: 500 },
    );
  }

  const targetUrl = new URL(
    `/${apiRoot}/${path.map(encodeURIComponent).join("/")}${new URL(request.url).search}`,
    apiBaseUrl,
  );

  const headers = new Headers();
  forwardedRequestHeaders.forEach((name) => {
    const value = request.headers.get(name);
    if (value) headers.set(name, value);
  });
  headers.set("accept", request.headers.get("accept") ?? "application/json");

  const body =
    request.method === "GET" || request.method === "HEAD"
      ? undefined
      : await request.text();

  let response: Response;

  try {
    response = await fetch(targetUrl, {
      body: body ? body : undefined,
      cache: "no-store",
      headers,
      method: request.method,
    });
  } catch {
    return NextResponse.json(
      { message: "The store is unreachable right now.", statusCode: 502 },
      { status: 502 },
    );
  }

  const contentType = response.headers.get("content-type");
  const payload = contentType?.includes("application/json")
    ? await response.json()
    : await response.text();

  return NextResponse.json(payload, { status: response.status });
}
