import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  turbopack: {
    root: path.resolve(process.cwd()),
  },
  // Local LAN + ngrok / Cloudflare tunnels (dev HMR / RSC soft navigation)
  allowedDevOrigins: [
    "192.168.1.70",
    "exceeding-penholder-feeble.ngrok-free.dev",
    "*.ngrok-free.dev",
    "*.ngrok-free.app",
    "yukon-rick-deaths-shop.trycloudflare.com",
    "*.trycloudflare.com",
  ],
  async headers() {
    return [
      {
        source: "/service-worker.js",
        headers: [
          {
            key: "Cache-Control",
            value: "no-cache, no-store, must-revalidate",
          },
          { key: "Service-Worker-Allowed", value: "/" },
        ],
      },
      {
        source: "/manifest.webmanifest",
        headers: [
          {
            key: "Cache-Control",
            value: "no-cache, no-store, must-revalidate",
          },
        ],
      },
      {
        source: "/:file(mst-mark-v6|mst-mark|mst-logo|logo|logo-mark|musfira-logo|logo-circle|logo-circle-solid|apple-touch-icon|favicon).:ext(png|ico)",
        headers: [
          {
            key: "Cache-Control",
            value: "no-cache, no-store, must-revalidate",
          },
        ],
      },
      {
        source: "/icons/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "no-cache, no-store, must-revalidate",
          },
        ],
      },
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
