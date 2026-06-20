import type { MetadataRoute } from "next"

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "katekyo - 家庭教師管理",
    short_name: "katekyo",
    description: "家庭教師と生徒のための宿題・成績管理アプリ",
    start_url: "/dashboard",
    display: "standalone",
    orientation: "portrait",
    background_color: "#f9fafb",
    theme_color: "#2e743a",
    icons: [
      { src: "/icon", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon", sizes: "192x192", type: "image/png", purpose: "maskable" },
      { src: "/icon2", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon2", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  }
}
