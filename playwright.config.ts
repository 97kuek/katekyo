import { defineConfig, devices } from "@playwright/test"

export default defineConfig({
  testDir: "./tools",
  outputDir: "./test-results",
  workers: 1,
  reporter: "line",
  webServer: process.env.PLAYWRIGHT_SKIP_WEB_SERVER
    ? undefined
    : {
        command: process.platform === "win32" ? "npm.cmd run dev" : "npm run dev",
        url: "http://localhost:3000/login",
        reuseExistingServer: true,
        timeout: 120_000,
      },
  use: {
    baseURL: process.env.UI_AUDIT_BASE_URL ?? "http://localhost:3000",
    serviceWorkers: "block",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "Desktop Chrome",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "iPhone 13",
      use: {
        ...devices["iPhone 13"],
        browserName: "chromium",
      },
    },
    {
      name: "Mobile 320",
      use: {
        ...devices["iPhone 13"],
        browserName: "chromium",
        viewport: { width: 320, height: 740 },
      },
    },
    {
      name: "iPad Mini",
      use: {
        ...devices["iPad Mini"],
        browserName: "chromium",
      },
    },
  ],
})
