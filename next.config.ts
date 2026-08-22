import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // ── Next.js 16.3: Instant Navigations (opt-in) ──────────────────────────
  // cacheComponents: prerender a static UI shell so navigations are instant.
  cacheComponents: true,
  // partialPrefetching: bundle smaller, reusable prefetches to cut requests.
  partialPrefetching: true,

  images: {
    remotePatterns: [
      { hostname: "i.pravatar.cc" },
      { hostname: "images.unsplash.com" },
      { hostname: "lh3.googleusercontent.com" },
      { hostname: "avatars.githubusercontent.com" },
    ],
  },
  serverExternalPackages: ["pdfjs-dist"],
};

export default nextConfig;
