import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const appDir = dirname(fileURLToPath(import.meta.url));
const workspaceRoot = join(appDir, "../..");

/** @type {import('next').NextConfig} */
const nextConfig = {
  allowedDevOrigins: ["127.0.0.1", "squishy-platter-pusher.ngrok-free.dev"],
  images: {
    remotePatterns: [
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
