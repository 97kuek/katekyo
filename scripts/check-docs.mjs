import { existsSync, readdirSync, readFileSync, statSync } from "node:fs"
import { dirname, extname, join, relative, resolve } from "node:path"
import process from "node:process"

const root = process.cwd()
const docsRoot = join(root, "docs")
const errors = []

function walk(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name)
    return entry.isDirectory() ? walk(path) : [path]
  })
}

function report(file, message) {
  errors.push(`${relative(root, file)}: ${message}`)
}

function slugify(heading) {
  return heading
    .trim()
    .toLowerCase()
    .replace(/[`*_~]/g, "")
    .replace(/[^\p{L}\p{N}\s-]/gu, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
}

const markdownFiles = [
  join(root, "README.md"),
  join(root, "AGENTS.md"),
  ...walk(docsRoot).filter((file) => extname(file) === ".md"),
]

const anchorCache = new Map()
function anchorsFor(file) {
  if (!anchorCache.has(file)) {
    const anchors = new Set(
      readFileSync(file, "utf8")
        .split("\n")
        .filter((line) => /^#{1,6}\s+/.test(line))
        .map((line) => slugify(line.replace(/^#{1,6}\s+/, ""))),
    )
    anchorCache.set(file, anchors)
  }
  return anchorCache.get(file)
}

for (const file of markdownFiles) {
  const content = readFileSync(file, "utf8")
  const links = content.matchAll(/(?<!!)\[[^\]]*\]\(([^)]+)\)/g)
  for (const match of links) {
    const rawTarget = match[1].trim().replace(/^<|>$/g, "")
    if (!rawTarget || /^(https?:|mailto:)/.test(rawTarget)) continue

    const [pathPart, rawAnchor] = rawTarget.split("#", 2)
    const target = pathPart ? resolve(dirname(file), decodeURI(pathPart)) : file
    if (!existsSync(target)) {
      report(file, `リンク先が存在しません: ${rawTarget}`)
      continue
    }
    if (rawAnchor && statSync(target).isFile() && extname(target) === ".md") {
      const anchor = decodeURI(rawAnchor).toLowerCase()
      if (!anchorsFor(target).has(anchor)) {
        report(file, `見出しアンカーが存在しません: ${rawTarget}`)
      }
    }
  }
}

const diagramRoot = join(docsRoot, "diagrams")
const diagramReadme = readFileSync(join(diagramRoot, "README.md"), "utf8")
const diagrams = walk(diagramRoot).filter((file) => extname(file) === ".puml")
for (const file of diagrams) {
  const source = readFileSync(file, "utf8")
  const starts = source.match(/@startuml/g)?.length ?? 0
  const ends = source.match(/@enduml/g)?.length ?? 0
  if (starts !== 1 || ends !== 1) report(file, "@startuml と @enduml は1組必要です")
  if (!/^title\s+.+/m.test(source)) report(file, "title が必要です")
  if (!/^' Related:\s+.+/m.test(source)) report(file, "関連する要件・ユースケースIDのコメントが必要です")
  if (!diagramReadme.includes(`\`${file.split("/").at(-1)}\``)) {
    report(file, "docs/diagrams/README.md の一覧にありません")
  }
}

const requirements = readFileSync(join(docsRoot, "requirements.md"), "utf8")
const traceability = readFileSync(join(docsRoot, "traceability.md"), "utf8")
const testingStrategy = readFileSync(join(docsRoot, "testing-strategy.md"), "utf8")
const requirementIds = new Set(requirements.match(/\b(?:FR|BR|NFR)-[A-Z]+-\d{2}\b/g) ?? [])
for (const id of requirementIds) {
  if (!traceability.includes(id)) {
    report(join(docsRoot, "traceability.md"), `${id} がトレーサビリティ表にありません`)
  }
}

for (const testId of new Set(traceability.match(/\bT-[A-Z]+-\d{2}\b/g) ?? [])) {
  if (!testingStrategy.includes(`| ${testId} |`)) {
    report(join(docsRoot, "traceability.md"), `${testId} がテストシナリオカタログにありません`)
  }
}

const apiSpec = readFileSync(join(docsRoot, "api-spec.md"), "utf8")
const actionFiles = walk(join(root, "src", "app")).filter((file) => file.endsWith("actions.ts"))
for (const file of actionFiles) {
  const source = readFileSync(file, "utf8")
  const exports = source.matchAll(/export\s+async\s+function\s+([A-Za-z][A-Za-z0-9]*)/g)
  for (const match of exports) {
    const action = match[1]
    if (!apiSpec.includes(`\`${action}\``)) {
      report(file, `${action} が docs/api-spec.md にありません`)
    }
  }
}

const routeFiles = walk(join(root, "src", "app", "api")).filter((file) => file.endsWith("route.ts"))
for (const file of routeFiles) {
  const route = `/${relative(join(root, "src", "app"), dirname(file)).replaceAll("\\", "/")}`
  if (!apiSpec.includes(`\`${route}\``)) {
    report(file, `${route} が docs/api-spec.md にありません`)
  }
}

const prismaSchema = readFileSync(join(root, "prisma", "schema.prisma"), "utf8")
const classDiagram = readFileSync(join(diagramRoot, "class-diagram.puml"), "utf8")
for (const match of prismaSchema.matchAll(/^(model|enum)\s+([A-Za-z][A-Za-z0-9]*)\s*\{/gm)) {
  const [, kind, name] = match
  const umlKind = kind === "model" ? "class" : "enum"
  if (!classDiagram.includes(`${umlKind} ${name} {`)) {
    report(join(diagramRoot, "class-diagram.puml"), `Prisma ${kind} ${name} がクラス図にありません`)
  }
}

if (errors.length > 0) {
  console.error(`Documentation checks failed (${errors.length})`)
  for (const error of errors) console.error(`- ${error}`)
  process.exit(1)
}

console.log(`Documentation checks passed: ${markdownFiles.length} Markdown files, ${diagrams.length} PlantUML files`)
