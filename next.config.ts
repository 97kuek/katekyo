import type { NextConfig } from "next"
import withSerwist from "@serwist/next"

const nextConfig: NextConfig = {
  cacheComponents: true,
  cacheLife: {
    notifications: { stale: 15, revalidate: 30, expire: 5 * 60 },
    active: { stale: 30, revalidate: 60, expire: 60 * 60 },
    reference: { stale: 5 * 60, revalidate: 30 * 60, expire: 24 * 60 * 60 },
  },
  turbopack: {
    root: __dirname,
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "5mb",
    },
  },
}

export default process.env.NODE_ENV === "development"
  ? nextConfig
  : withSerwist({
      swSrc: "src/sw.ts",
      swDest: "public/sw.js",
    })(nextConfig)
