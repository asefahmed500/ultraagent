import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Dynamic MongoDB-backed pages are rendered per request in this build.
  cacheComponents: false,
  partialPrefetching: false,
  serverExternalPackages: ["mongoose"],
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
