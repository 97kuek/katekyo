import { expect, test, type Page } from "@playwright/test"
import {
  acceptTermsIfShown,
  assertMobileFormControlsComfortable,
  assertNoHorizontalOverflow,
} from "./ui-audit-helpers"

const baseURL = process.env.UI_AUDIT_BASE_URL ?? "http://localhost:3000"
const email =
  process.env.UI_AUDIT_EMAIL ??
  `codex-ui-audit-${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`
const password = process.env.UI_AUDIT_PASSWORD ?? "codex-ui-audit-password"

const routes = ["/dashboard", "/students", "/homework", "/grades", "/calendar", "/billing", "/settings"]

async function login(page: Page) {
  await page.goto(`${baseURL}/register`, { waitUntil: "domcontentloaded" })
  await page.getByLabel("名前").fill("Codex UI Audit")
  await page.getByLabel("メールアドレス").fill(email)
  await page.getByLabel("パスワード（8文字以上）").fill(password)
  await page.getByRole("button", { name: "登録する" }).click()
  await expect(page).toHaveURL(/\/login/, { timeout: 30_000 })

  await page.getByLabel("メールアドレス").fill(email)
  await page.getByLabel("パスワード").fill(password)
  await page.getByRole("button", { name: "ログイン" }).click()

  await expect(page).toHaveURL(/\/dashboard/, { timeout: 30_000 })
  await acceptTermsIfShown(page)
}

test.describe("responsive UI audit", () => {
  test("teacher routes render without obvious overflow", async ({ page }, testInfo) => {
    test.setTimeout(180_000)

    const consoleErrors: string[] = []
    page.on("console", (msg) => {
      if (msg.type() === "error") consoleErrors.push(msg.text())
    })

    await login(page)

    for (const route of routes) {
      await page.goto(`${baseURL}${route}`, { waitUntil: "domcontentloaded" })
      await page.waitForLoadState("networkidle", { timeout: 30_000 }).catch(() => {})
      await acceptTermsIfShown(page)
      await page.screenshot({
        path: testInfo.outputPath(`${testInfo.project.name}-${route.replaceAll("/", "_") || "root"}.png`),
        fullPage: true,
      })

      await assertNoHorizontalOverflow(page, route)
      await assertMobileFormControlsComfortable(page, route)
    }

    expect(consoleErrors).toEqual([])
  })
})
