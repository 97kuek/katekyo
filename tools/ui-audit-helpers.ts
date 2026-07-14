import { expect, type Page } from "@playwright/test"

export async function acceptTermsIfShown(page: Page) {
  const dialog = page.getByRole("dialog", { name: "利用規約への同意" })
  await dialog.waitFor({ state: "visible", timeout: 5_000 }).catch(() => {})

  if (await dialog.isVisible().catch(() => false)) {
    await dialog.locator('input[type="checkbox"]').check({ force: true })
    await dialog.getByRole("button", { name: "同意してはじめる" }).click()
    await expect(dialog).toBeHidden({ timeout: 30_000 })
  }
}

export async function findHorizontalOverflow(page: Page, maxItems = 12) {
  return await page.evaluate((limit) => {
    const viewportWidth = document.documentElement.clientWidth
    return Array.from(document.body.querySelectorAll<HTMLElement>("*"))
      .filter((el) => {
        const rect = el.getBoundingClientRect()
        return rect.width > 0 && (rect.right > viewportWidth + 1 || rect.left < -1)
      })
      .slice(0, limit)
      .map((el) => ({
        tag: el.tagName.toLowerCase(),
        className: String(el.className).slice(0, 160),
        text: (el.textContent ?? "").replace(/\s+/g, " ").trim().slice(0, 80),
        left: Math.round(el.getBoundingClientRect().left),
        right: Math.round(el.getBoundingClientRect().right),
        viewportWidth,
      }))
  }, maxItems)
}

export async function findCrampedMobileFormControls(page: Page, maxItems = 12) {
  return await page.evaluate((limit) => {
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
      .slice(0, limit)
  }, maxItems)
}

export async function assertNoHorizontalOverflow(page: Page, label: string, maxItems = 12) {
  const overflow = await findHorizontalOverflow(page, maxItems)
  expect(overflow, `${label} has horizontal overflow`).toEqual([])
}

export async function assertMobileFormControlsComfortable(page: Page, label: string, maxItems = 12) {
  const issues = await findCrampedMobileFormControls(page, maxItems)
  expect(issues, `${label} has cramped mobile form controls`).toEqual([])
}
