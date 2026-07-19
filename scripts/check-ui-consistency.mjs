import { readFileSync, readdirSync } from "node:fs"
import { extname, join, relative } from "node:path"
import process from "node:process"

const root = process.cwd()
const sourceRoot = join(root, "src")
const errors = []
const rawButtonAllowlist = new Set([
  "src/app/(app)/calendar/calendar-view.tsx",
  "src/app/(app)/homework/[id]/submit/submit-form.tsx",
  "src/app/(app)/subjects/subject-color-editor.tsx",
  "src/app/(app)/subjects/subject-form.tsx",
  "src/components/ui/pending-submit-button.tsx",
  "src/components/ui/segmented-control.tsx",
])

function walk(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name)
    return entry.isDirectory() ? walk(path) : [path]
  })
}

for (const file of walk(sourceRoot).filter((path) => [".ts", ".tsx", ".css"].includes(extname(path)))) {
  if (file.includes(`${join("src", "generated")}`)) continue
  const lines = readFileSync(file, "utf8").split("\n")
  const relativeFile = relative(root, file).split("\\").join("/")
  const source = lines.join("\n")
  if (/next\/font\/google/.test(source)) {
    errors.push(`${relativeFile}: 初期表示を外部Webフォント取得へ依存させずシステムフォントを使用してください`)
  }
  if (/\b(?:window\.)?location\.reload\s*\(/.test(source)) {
    errors.push(`${relativeFile}: 全体リロードではなく局所状態更新またはrouter.refreshを使用してください`)
  }
  if (/\btransition-all\b/.test(source)) {
    errors.push(`${relativeFile}: transition-allではなく変化するプロパティだけを指定してください`)
  }
  if (/<button\b/.test(source) && !rawButtonAllowlist.has(relativeFile)) {
    errors.push(`${relativeFile}: 通常の操作は生の<button>ではなく共通Buttonを使用してください`)
  }
  if (/SwipeableRow|SwipeEditDeleteActions|GradeSwipeRow|SwipeableHomeworkCard/.test(source)) {
    errors.push(`${relativeFile}: 一覧操作をスワイプに隠さず明示ボタンを使用してください`)
  }
  lines.forEach((line, index) => {
    const location = `${relative(root, file)}:${index + 1}`
    if (/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}]/u.test(line)) {
      errors.push(`${location}: Unicode絵文字ではなくテーマアイコンまたは文章を使用してください`)
    }
    if (/\b(?:window\.)?confirm\s*\(/.test(line)) {
      errors.push(`${location}: ブラウザ標準confirmではなくInlineConfirmActionを使用してください`)
    }
    for (const color of ["primary", "warning", "destructive"]) {
      const background = new RegExp(`bg-${color}/\\d+`)
      const sameColorText = new RegExp(`text-${color}(?!-foreground)(?:\\s|["\u0060])`)
      if (background.test(line) && sameColorText.test(line)) {
        errors.push(`${location}: ${color}の淡色背景に同色文字を重ねないでください`)
      }
    }
  })
}

if (errors.length) {
  console.error(`UI consistency checks failed (${errors.length})`)
  for (const error of errors) console.error(`- ${error}`)
  process.exit(1)
}

console.log("UI consistency checks passed")
