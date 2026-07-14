import { expect, test, type Page } from "@playwright/test"

const baseURL = process.env.UI_AUDIT_BASE_URL ?? "http://localhost:3000"
const email =
  process.env.UI_AUDIT_EMAIL ??
  `codex-ui-audit-${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`
const password = process.env.UI_AUDIT_PASSWORD ?? "codex-ui-audit-password"

const routes = ["/dashboard", "/students", "/homework", "/grades", "/calendar", "/billing", "/settings"]

async function acceptTermsIfShown(page: Page) {
  const dialog = page.getByRole("dialog", { name: "利用規約への同意" })
  await dialog.waitFor({ state: "visible", timeout: 5_000 }).catch(() => {})

  if (await dialog.isVisible().catch(() => false)) {
    await dialog.locator('input[type="checkbox"]').check({ force: true })
    await dialog.getByRole("button", { name: "同意してはじめる" }).click()
    await expect(dialog).toBeHidden({ timeout: 30_000 })
  }
}

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

async function findHorizontalOverflow(page: Page) {
  return await page.evaluate(() => {
    const viewportWidth = document.documentElement.clientWidth
    const overflowing = Array.from(document.body.querySelectorAll<HTMLElement>("*"))
      .filter((el) => {
        const rect = el.getBoundingClientRect()
        return rect.width > 0 && (rect.right > viewportWidth + 1 || rect.left < -1)
      })
      .slice(0, 12)
      .map((el) => ({
        tag: el.tagName.toLowerCase(),
        className: String(el.className).slice(0, 160),
        text: (el.textContent ?? "").replace(/\s+/g, " ").trim().slice(0, 80),
        left: Math.round(el.getBoundingClientRect().left),
        right: Math.round(el.getBoundingClientRect().right),
        viewportWidth,
      }))

    return overflowing
  })
}

async function findCrampedMobileFormControls(page: Page) {
  return await page.evaluate(() => {
    if (document.documentElement.clientWidth >= 640) return []

    const selector = [
      'input:not([type="hidden"]):not([type="checkbox"]):not([type="radio"]):not([type="file"])',
      "textarea",
      "select",
    ].join(",")

    return Array.from(document.querySelectorAll<HTMLElement>(selector))
      .filter((el) => {
        const rect = el.getBoundingClientRect()
        const style = window.getComputedStyle(el)
        return (
          rect.width > 0 &&
          rect.height > 0 &&
          style.visibility !== "hidden" &&
          style.display !== "none" &&
          !el.closest("[aria-hidden='true']")
        )
      })
      .map((el) => {
        const rect = el.getBoundingClientRect()
        const style = window.getComputedStyle(el)
        return {
          tag: el.tagName.toLowerCase(),
          type: el.getAttribute("type"),
          name: el.getAttribute("name"),
          id: el.id,
          className: String(el.className).slice(0, 160),
          height: Math.round(rect.height),
          fontSize: Number.parseFloat(style.fontSize),
        }
      })
      .filter((control) => control.height < 40 || control.fontSize < 16)
      .slice(0, 12)
  })
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

      const overflow = await findHorizontalOverflow(page)
      expect(overflow, `${route} has horizontal overflow`).toEqual([])
      const crampedControls = await findCrampedMobileFormControls(page)
      expect(crampedControls, `${route} has cramped mobile form controls`).toEqual([])
    }

    expect(consoleErrors).toEqual([])
  })
})
