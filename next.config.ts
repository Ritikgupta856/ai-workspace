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
  // Loaded from node_modules at runtime instead of bundled. @napi-rs/canvas is
  // a native module that polyfills DOMMatrix for pdf.js; without it listed,
  // the Vercel function ships without it and PDF parsing crashes.
  serverExternalPackages: ["pdf-parse", "pdfjs-dist", "@napi-rs/canvas"],
};

export default nextConfig;
