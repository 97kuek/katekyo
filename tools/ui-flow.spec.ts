import { execFileSync } from "node:child_process"
import path from "node:path"
import { expect, test, type Page, type TestInfo } from "@playwright/test"
import {
  acceptTermsIfShown,
  assertMobileFormControlsComfortable,
  assertNoHorizontalOverflow,
} from "./ui-audit-helpers"

const baseURL = process.env.UI_AUDIT_BASE_URL ?? "http://localhost:3000"
const password = process.env.UI_AUDIT_PASSWORD ?? "codex-ui-flow-password"
const runId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
const emailPrefix = `codex-ui-flow-${runId}`

function projectSlug(testInfo: TestInfo) {
  return testInfo.project.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")
}

function tomorrowISO() {
  const d = new Date()
  d.setDate(d.getDate() + 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
}

function futureISO(days: number) {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
}

async function registerTeacher(page: Page, email: string) {
  await page.goto(`${baseURL}/register`, { waitUntil: "domcontentloaded" })
  await page.getByLabel("名前").fill("Codex UI Flow Teacher")
  await page.getByLabel("メールアドレス").fill(email)
  await page.getByLabel("パスワード（8文字以上）").fill(password)
  await page.getByRole("button", { name: "登録する" }).click()
  await expect(page).toHaveURL(/\/login/, { timeout: 30_000 })
  await login(page, email)
}

async function registerInvitedStudent(page: Page, inviteUrl: string, email: string) {
  await page.context().clearCookies()
  await page.goto(inviteUrl, { waitUntil: "domcontentloaded" })
  await page.getByLabel("メールアドレス").fill(email)
  await page.getByLabel("パスワード（8文字以上）").fill(password)
  await page.getByRole("button", { name: "アカウントを作成する" }).click()
  await expect(page).toHaveURL(/\/login/, { timeout: 30_000 })
  await login(page, email)
}

async function registerInvitedParent(page: Page, inviteUrl: string, email: string) {
  await page.context().clearCookies()
  await page.goto(inviteUrl, { waitUntil: "domcontentloaded" })
  await page.getByLabel("お名前").fill("Codex UI Flow Parent")
  await page.getByLabel("メールアドレス").fill(email)
  await page.getByLabel("パスワード（8文字以上）").fill(password)
  await page.getByRole("button", { name: "アカウントを作成する" }).click()
  await expect(page).toHaveURL(/\/login/, { timeout: 30_000 })
  await login(page, email)
}

async function login(page: Page, email: string) {
  await page.context().clearCookies()
  await page.goto(`${baseURL}/login`, { waitUntil: "domcontentloaded" })
  await page.getByLabel("メールアドレス").fill(email)
  await page.getByLabel("パスワード").fill(password)
  await page.getByRole("button", { name: "ログイン" }).click()
  await expect(page).toHaveURL(/\/dashboard/, { timeout: 30_000 })
  await acceptTermsIfShown(page)
}

async function assertMainControlUsable(page: Page, locatorName: string | RegExp) {
  const control = page.getByRole("button", { name: locatorName }).first()
  await expect(control).toBeVisible()
  const box = await control.boundingBox()
  expect(box, `main control ${String(locatorName)} has no bounding box`).not.toBeNull()
  expect(box!.width, `main control ${String(locatorName)} is too narrow`).toBeGreaterThanOrEqual(36)
  expect(box!.height, `main control ${String(locatorName)} is too short`).toBeGreaterThanOrEqual(32)
}

function visibleText(page: Page, text: string | RegExp) {
  return page.getByText(text).filter({ visible: true }).first()
}

async function snapshotAndCheck(page: Page, testInfo: TestInfo, name: string) {
  await page.waitForLoadState("networkidle", { timeout: 30_000 }).catch(() => {})
  await acceptTermsIfShown(page)
  await assertNoHorizontalOverflow(page, name, 8)
  await assertMobileFormControlsComfortable(page, name)
  await page.screenshot({
    path: testInfo.outputPath(`${projectSlug(testInfo)}-${name}.png`),
    fullPage: true,
  })
}

async function createInvite(page: Page, studentName: string) {
  await page.goto(`${baseURL}/students/invite`, { waitUntil: "domcontentloaded" })
  await page.getByLabel("生徒の名前").fill(studentName)
  await page.getByLabel("学年").selectOption({ label: "中学1年" })
  await assertMainControlUsable(page, "招待リンクを生成")
  await assertMobileFormControlsComfortable(page, "teacher-invite-form")
  await page.getByRole("button", { name: "招待リンクを生成" }).click()
  await expect(page.getByText("招待リンクが生成されました")).toBeVisible({ timeout: 30_000 })
  return await page.locator('input[readonly]').inputValue()
}

async function createParentInvite(page: Page) {
  await page.goto(`${baseURL}/parent-invite/create`, { waitUntil: "domcontentloaded" })
  await assertMainControlUsable(page, "招待リンクを生成する")
  await page.getByRole("button", { name: "招待リンクを生成する" }).click()
  await expect(page.getByText("招待リンクが生成されました")).toBeVisible({ timeout: 30_000 })
  return await page.locator('input[readonly]').inputValue()
}

async function createSubject(page: Page, subjectName: string) {
  await page.goto(`${baseURL}/settings`, { waitUntil: "domcontentloaded" })
  const subjectInput = page.locator('input[name="name"]').last()
  await subjectInput.scrollIntoViewIfNeeded()
  await subjectInput.fill(subjectName)
  await subjectInput.evaluate((input) => {
    if (!(input instanceof HTMLInputElement) || !input.form) {
      throw new Error("Subject input form was not found.")
    }
    input.form.requestSubmit()
  })
  await expect(page.getByText(subjectName)).toBeVisible({ timeout: 30_000 })
}

async function createMaterial(page: Page, studentName: string, materialName: string, subjectName: string) {
  await page.goto(`${baseURL}/students`, { waitUntil: "domcontentloaded" })
  const desktopStudentRow = page.locator("tbody tr").first()
  if (await desktopStudentRow.isVisible().catch(() => false)) {
    await desktopStudentRow.click()
  } else {
    await visibleText(page, /Student/).click()
  }
  await page.getByRole("link", { name: "教材" }).click()
  await page.getByPlaceholder("教材名（例: チャート式数学）").fill(materialName)
  await page.getByPlaceholder("メモ（任意）").fill("UI flow note")
  await page.getByLabel(subjectName).check()
  await page.getByRole("button", { name: "追加" }).click()
  await expect(page.getByText(materialName)).toBeVisible({ timeout: 30_000 })
}

async function createHomework(page: Page, title: string, description: string, subjectName: string) {
  await page.goto(`${baseURL}/homework/new`, { waitUntil: "domcontentloaded" })
  await page.getByLabel(/タイトル/).fill(title)
  await page.getByLabel("内容（任意）").fill(description)
  await page.getByLabel(/期限/).fill(tomorrowISO())
  await page.getByLabel(subjectName).check()
  await assertMainControlUsable(page, "宿題を作成する")
  await assertMobileFormControlsComfortable(page, "teacher-homework-form")
  await page.getByRole("button", { name: "宿題を作成する" }).click()
  await expect(page).toHaveURL(/\/homework/, { timeout: 30_000 })
  await expect(visibleText(page, title)).toBeVisible({ timeout: 30_000 })
}

async function createGrade(page: Page, testName: string, subjectName: string) {
  await page.goto(`${baseURL}/grades/new`, { waitUntil: "domcontentloaded" })
  await page.getByLabel(/テスト名/).fill(testName)
  await page.getByLabel(/実施日/).fill(futureISO(0))
  await page.getByLabel("得点").fill("82")
  await page.getByLabel("満点").fill("100")
  await page.getByLabel(subjectName).check()
  await assertMainControlUsable(page, "成績を記録する")
  await assertMobileFormControlsComfortable(page, "teacher-grade-form")
  await page.getByRole("button", { name: "成績を記録する" }).click()
  await expect(page).toHaveURL(/\/grades/, { timeout: 30_000 })
  await expect(visibleText(page, testName)).toBeVisible({ timeout: 30_000 })
}

async function createCalendarItems(page: Page, lessonNote: string, calendarHomeworkTitle: string, examName: string) {
  await page.goto(`${baseURL}/calendar`, { waitUntil: "domcontentloaded" })
  await page.getByRole("button", { name: "追加", exact: true }).click()
  await page.getByRole("button", { name: "授業", exact: true }).click()
  await page.getByLabel("時刻").fill("16:30")
  await page.getByLabel("対面").check()
  await page.getByText("詳細設定（時間・料金・科目・繰り返し）", { exact: true }).click()
  await page.getByLabel("時間（分）").fill("75")
  await page.getByLabel("交通費（円・任意）").fill("500")
  await page.getByLabel("メモ（任意）").fill(lessonNote)
  await assertMobileFormControlsComfortable(page, "teacher-calendar-lesson-form")
  await page.getByRole("button", { name: "追加" }).first().click()
  await expect(page.getByText(lessonNote)).toBeVisible({ timeout: 30_000 })

  await page.getByRole("button", { name: "追加", exact: true }).click()
  await page.getByRole("button", { name: "宿題期限", exact: true }).click()
  const calendarHomeworkInput = page.getByPlaceholder("例: 数学 p.30-35")
  await calendarHomeworkInput.fill(calendarHomeworkTitle)
  await assertMobileFormControlsComfortable(page, "teacher-calendar-homework-form")
  await calendarHomeworkInput.evaluate((input) => {
    if (!(input instanceof HTMLInputElement) || !input.form) {
      throw new Error("Calendar homework form was not found.")
    }
    input.form.requestSubmit()
  })
  await expect(visibleText(page, calendarHomeworkTitle)).toBeVisible({ timeout: 30_000 })

  await page.getByRole("button", { name: "追加", exact: true }).click()
  await page.getByRole("button", { name: "テスト", exact: true }).click()
  const examInput = page.getByPlaceholder("例: 英語期末テスト")
  await examInput.fill(examName)
  await assertMobileFormControlsComfortable(page, "teacher-calendar-exam-form")
  await examInput.evaluate((input) => {
    if (!(input instanceof HTMLInputElement) || !input.form) {
      throw new Error("Calendar exam form was not found.")
    }
    input.form.requestSubmit()
  })
  await expect(visibleText(page, examName)).toBeVisible({ timeout: 30_000 })
}

async function submitHomework(page: Page, title: string) {
  await page.goto(`${baseURL}/homework`, { waitUntil: "domcontentloaded" })
  const titleLocator = visibleText(page, title)
  await expect(titleLocator).toBeVisible({ timeout: 30_000 })
  const submitHref = await titleLocator.evaluate((titleElement) => {
    let current = titleElement.parentElement
    while (current && current !== document.body) {
      const link = current.querySelector<HTMLAnchorElement>('a[href$="/submit"]')
      if (link) return link.href
      current = current.parentElement
    }
    throw new Error("Submit link was not found for the homework title.")
  })
  await page.goto(submitHref, { waitUntil: "domcontentloaded" })
  await page.getByRole("button", { name: "ふつう" }).click()
  await page.getByLabel("先生へのコメント（任意）").fill("提出しました。UI flow comment.")
  await assertMainControlUsable(page, "提出する")
  await assertMobileFormControlsComfortable(page, "student-submit-homework-form")
  await page.getByRole("button", { name: "提出する" }).last().click()
  await expect(page).toHaveURL(/\/homework/, { timeout: 30_000 })
  await expect(visibleText(page, title)).toBeVisible({ timeout: 30_000 })
  await expect(page.getByText(/確認中/)).toBeVisible({ timeout: 30_000 })
}

async function approveHomework(page: Page, title: string) {
  await page.goto(`${baseURL}/homework`, { waitUntil: "domcontentloaded" })
  await expect(visibleText(page, title)).toBeVisible({ timeout: 30_000 })
  await page.getByRole("link", { name: "確認する" }).first().click()
  await page.getByLabel("コメント（任意）").fill("確認しました。UI flow feedback.")
  await assertMainControlUsable(page, "承認する")
  await assertMobileFormControlsComfortable(page, "teacher-review-homework-form")
  await page.getByRole("button", { name: "承認する" }).click()
  await expect(page).toHaveURL(/\/homework/, { timeout: 30_000 })
  await expect(visibleText(page, title)).toBeVisible({ timeout: 30_000 })
  await expect(visibleText(page, "承認済み")).toBeVisible({ timeout: 30_000 })
}

test.describe("interactive UI flow audit", () => {
  test.afterAll(() => {
    if (process.env.ALLOW_E2E_CLEANUP !== "1") return

    try {
      execFileSync("node", [path.join(process.cwd(), "scripts/e2e-cleanup.mjs"), emailPrefix], {
        cwd: process.cwd(),
        env: process.env,
        stdio: "inherit",
      })
    } catch (error) {
      console.error("E2E cleanup failed:", error)
    }
  })

  test("teacher, student, and parent workflows stay usable across devices", async ({ page }, testInfo) => {
    test.setTimeout(420_000)

    const slug = projectSlug(testInfo)
    const teacherEmail = `${emailPrefix}-${slug}-teacher@example.com`
    const studentEmail = `${emailPrefix}-${slug}-student@example.com`
    const parentEmail = `${emailPrefix}-${slug}-parent@example.com`
    const studentName = `UI Flow Student ${slug}`
    const subjectName = `UI Flow Math ${slug}`
    const materialName = `UI Flow Material ${slug}`
    const homeworkTitle = `UI Flow Homework ${slug}`
    const gradeName = `UI Flow Exam Result ${slug}`
    const lessonNote = `UI Flow Lesson Note ${slug}`
    const calendarHomeworkTitle = `UI Flow Calendar Homework ${slug}`
    const examName = `UI Flow Calendar Exam ${slug}`

    const consoleErrors: string[] = []
    for (const targetPage of [page]) {
      targetPage.on("console", (msg) => {
        if (msg.type() === "error") consoleErrors.push(msg.text())
      })
      targetPage.on("pageerror", (error) => consoleErrors.push(error.message))
    }

    await registerTeacher(page, teacherEmail)
    await snapshotAndCheck(page, testInfo, "teacher-dashboard")

    await createSubject(page, subjectName)
    await snapshotAndCheck(page, testInfo, "teacher-settings-subject")

    const inviteUrl = await createInvite(page, studentName)
    await snapshotAndCheck(page, testInfo, "teacher-invite-created")

    await registerInvitedStudent(page, inviteUrl, studentEmail)
    await snapshotAndCheck(page, testInfo, "student-dashboard")

    await login(page, teacherEmail)
    await createMaterial(page, studentName, materialName, subjectName)
    await snapshotAndCheck(page, testInfo, "teacher-material")

    await createHomework(page, homeworkTitle, "UI flow homework description", subjectName)
    await snapshotAndCheck(page, testInfo, "teacher-homework-created")

    await createGrade(page, gradeName, subjectName)
    await snapshotAndCheck(page, testInfo, "teacher-grade-created")

    await createCalendarItems(page, lessonNote, calendarHomeworkTitle, examName)
    await snapshotAndCheck(page, testInfo, "teacher-calendar-created")

    await login(page, studentEmail)
    const parentInviteUrl = await createParentInvite(page)
    await snapshotAndCheck(page, testInfo, "student-parent-invite-created")

    await registerInvitedParent(page, parentInviteUrl, parentEmail)
    for (const route of ["dashboard", "homework", "calendar", "grades", "billing", "garden", "more"]) {
      await page.goto(`${baseURL}/${route}`, { waitUntil: "domcontentloaded" })
      await snapshotAndCheck(page, testInfo, `parent-${route}`)
    }

    await login(page, studentEmail)
    await submitHomework(page, homeworkTitle)
    await snapshotAndCheck(page, testInfo, "student-homework-submitted")

    await login(page, teacherEmail)
    await approveHomework(page, homeworkTitle)
    await snapshotAndCheck(page, testInfo, "teacher-homework-approved")

    await login(page, studentEmail)
    await page.goto(`${baseURL}/homework?view=completed`, { waitUntil: "domcontentloaded" })
    await expect(visibleText(page, homeworkTitle)).toBeVisible({ timeout: 30_000 })
    await expect(visibleText(page, "承認済み")).toBeVisible({ timeout: 30_000 })
    await snapshotAndCheck(page, testInfo, "student-homework-approved")

    await login(page, teacherEmail)
    await page.goto(`${baseURL}/dashboard`, { waitUntil: "domcontentloaded" })
    await snapshotAndCheck(page, testInfo, "teacher-dashboard-final")

    expect(consoleErrors).toEqual([])
  })
})
