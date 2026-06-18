import { defineConfig, devices } from "@playwright/test"

export default defineConfig({
  testDir: "./tools",
  outputDir: "./test-results",
  workers: 1,
  reporter: "line",
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
      name: "iPad Mini",
      use: {
        ...devices["iPad Mini"],
        browserName: "chromium",
      },
    },
  ],
})
