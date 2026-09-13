import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const appDir = dirname(fileURLToPath(import.meta.url));
const workspaceRoot = join(appDir, "../..");

// Product/category media is served directly by the backend API (e.g.
// `${NEXT_PUBLIC_API_URL}/files/...`), so next/image needs that host
// allow-listed. The API URL's host varies per environment, and locally it
// may be reached as either "localhost" or "127.0.0.1" regardless of which
// port it's running on.
const apiUrl = new URL(process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000");

/** @type {import('next').NextConfig} */
const nextConfig = {
  allowedDevOrigins: ["127.0.0.1", "localhost"],
  images: {
    // Next's SSRF guard refuses to fetch any upstream image whose hostname
    // resolves to a private/loopback IP (localhost/127.0.0.1 always does).
    // The backend only serves media from a private address in local dev —
    // in a real deployment NEXT_PUBLIC_API_URL points at a public host, so
    // this only relaxes the guard where it would otherwise always trip.
    dangerouslyAllowLocalIP: process.env.NODE_ENV !== "production",
    remotePatterns: [
      { protocol: "http", hostname: "localhost" },
      { protocol: "http", hostname: "127.0.0.1" },
      {
        protocol: apiUrl.protocol.replace(/:$/, ""),
        hostname: apiUrl.hostname,
        ...(apiUrl.port ? { port: apiUrl.port } : {}),
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "d3nhsn9xe1wma5.cloudfront.net"
      }
    ],
  },
  output: "standalone",
  outputFileTracingRoot: workspaceRoot,
  transpilePackages: [
    "@repo/api-client",
    "@repo/auth-client",
    "@repo/query-client",
    "@repo/types",
    "@repo/ui",
  ],
};

export default nextConfig;
