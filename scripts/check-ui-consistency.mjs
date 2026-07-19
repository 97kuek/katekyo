import { readFileSync, readdirSync } from "node:fs"
import { extname, join, relative } from "node:path"
import process from "node:process"

const root = process.cwd()
const sourceRoot = join(root, "src")
const errors = []

function walk(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name)
    return entry.isDirectory() ? walk(path) : [path]
  })
}

for (const file of walk(sourceRoot).filter((path) => [".ts", ".tsx", ".css"].includes(extname(path)))) {
  if (file.includes(`${join("src", "generated")}`)) continue
  const lines = readFileSync(file, "utf8").split("\n")
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
