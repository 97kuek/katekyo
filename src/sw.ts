import type { PrecacheEntry, SerwistGlobalConfig } from "serwist"
import { CacheFirst, ExpirationPlugin, NetworkOnly, Serwist, StaleWhileRevalidate } from "serwist"

declare global {
  interface ServiceWorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined
  }
}

declare const self: ServiceWorkerGlobalScope

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  // 認証済みのHTML/RSC/APIはCache Storageへ保存しない。
  // URLだけをキーにしたブラウザキャッシュは、同じ端末でアカウントを
  // 切り替えた際に別テナントの古い内容を見せる危険があるため、静的資産だけを対象にする。
  runtimeCaching: [
    {
      matcher: ({ request, sameOrigin, url }) =>
        sameOrigin &&
        (request.mode === "navigate" || request.headers.get("RSC") === "1" || url.pathname.startsWith("/api/")),
      handler: new NetworkOnly(),
    },
    {
      matcher: ({ sameOrigin, url }) => sameOrigin && url.pathname.startsWith("/_next/static/"),
      handler: new CacheFirst({
        cacheName: "katekyo-static-assets",
        plugins: [new ExpirationPlugin({ maxEntries: 96, maxAgeSeconds: 30 * 24 * 60 * 60 })],
      }),
    },
    {
      matcher: /\.(?:woff2?|ttf|otf|png|jpg|jpeg|svg|webp|ico)$/i,
      handler: new StaleWhileRevalidate({
        cacheName: "katekyo-media-assets",
        plugins: [new ExpirationPlugin({ maxEntries: 96, maxAgeSeconds: 14 * 24 * 60 * 60 })],
      }),
    },
    {
      matcher: /.*/,
      method: "GET",
      handler: new NetworkOnly(),
    },
  ],
  fallbacks: {
    entries: [
      {
        url: "/offline",
        matcher: ({ request }) => request.mode === "navigate",
      },
    ],
  },
})

serwist.addEventListeners()
