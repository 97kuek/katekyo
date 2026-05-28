"use client"

import { useState } from "react"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"
import { Button } from "@/components/ui/button"
import { TEST_TYPE_OPTIONS } from "@/lib/test-types"

type Grade = {
  id: string
  testName: string
  testType: string
  date: string
  score: number | null
  maxScore: number | null
  avgScore: number | null
  deviation: number | null
  subjectIds: string[]
}

type Subject = { id: string; name: string }

const LINE_COLORS = ["#2563eb", "#16a34a", "#dc2626", "#d97706", "#7c3aed", "#0891b2"]

function computeValue(g: Grade, mode: "score" | "deviation"): number | null {
  if (mode === "score") {
    if (g.score != null && g.maxScore != null) return Math.round((g.score / g.maxScore) * 100)
    return g.score
  }
  return g.deviation
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("ja-JP", { month: "numeric", day: "numeric" })
}

export default function GradeChart({
  grades,
  subjects,
}: {
  grades: Grade[]
  subjects: Subject[]
}) {
  const availableTypes = Array.from(new Set(grades.map((g) => g.testType)))
  const [mode, setMode] = useState<"score" | "deviation">("score")
  const [typeFilter, setTypeFilter] = useState<string>(availableTypes[0] ?? "")
  const [activeSubject, setActiveSubject] = useState<string | null>(null)

  const filtered = grades.filter((g) => g.testType === typeFilter)
  const sorted = [...filtered].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

  const hasScore = sorted.some((g) => computeValue(g, "score") != null)
  const hasDeviation = sorted.some((g) => g.deviation != null)

  // 科目別複数ライン
  const usedSubjectIds = Array.from(new Set(sorted.flatMap((g) => g.subjectIds)))
  const subjectMap = new Map(subjects.map((s) => [s.id, s.name]))
  const hasSubjects = usedSubjectIds.length > 0

  // データ構築
  const allDates = Array.from(new Set(sorted.map((g) => g.date)))

  const chartData = allDates.map((date) => {
    const gradesOnDate = sorted.filter((g) => g.date === date)
    const row: Record<string, string | number | null> = {
      name: formatDate(date),
      testName: gradesOnDate[0].testName,
    }
    if (hasSubjects) {
      for (const sid of usedSubjectIds) {
        const g = gradesOnDate.find((g) => g.subjectIds.includes(sid))
        row[sid] = g ? (computeValue(g, mode) ?? null) : null
        if (g?.avgScore != null && g.maxScore != null && mode === "score") {
          row[`avg_${sid}`] = Math.round((g.avgScore / g.maxScore) * 100)
        } else if (g?.avgScore != null && mode === "score") {
          row[`avg_${sid}`] = g.avgScore
        }
      }
    } else {
      const g = gradesOnDate[0]
      row["value"] = computeValue(g, mode) ?? null
      if (g?.avgScore != null && g.maxScore != null && mode === "score") {
        row["avg"] = Math.round((g.avgScore / g.maxScore) * 100)
      } else if (g?.avgScore != null && mode === "score") {
        row["avg"] = g.avgScore
      }
    }
    return row
  })

  if (!hasScore && !hasDeviation) return null

  return (
    <div className="rounded-lg border bg-card p-5 space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <p className="text-sm font-medium">成績推移</p>
        <div className="flex gap-1.5 flex-wrap">
          <Button
            type="button"
            size="sm"
            variant={mode === "score" ? "default" : "outline"}
            onClick={() => setMode("score")}
            disabled={!hasScore}
          >
            点数
          </Button>
          <Button
            type="button"
            size="sm"
            variant={mode === "deviation" ? "default" : "outline"}
            onClick={() => setMode("deviation")}
            disabled={!hasDeviation}
          >
            偏差値
          </Button>
        </div>
      </div>

      <div className="flex gap-1.5 flex-wrap">
        {TEST_TYPE_OPTIONS.filter(([v]) => availableTypes.includes(v)).map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => { setTypeFilter(value); setActiveSubject(null) }}
            className={`px-2.5 py-1 rounded-md text-xs border transition-colors ${typeFilter === value ? "bg-primary text-primary-foreground border-primary" : "bg-card text-muted-foreground border-input hover:bg-muted"}`}
          >
            {label}
          </button>
        ))}
      </div>

      {chartData.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-6">該当するデータがありません</p>
      ) : (
        <ResponsiveContainer width="100%" height={hasSubjects ? 260 : 220}>
          <LineChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 30 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" tick={{ fontSize: 11 }} angle={-25} textAnchor="end" interval={0} />
            <YAxis
              domain={mode === "deviation" ? [30, 80] : ["auto", "auto"]}
              tick={{ fontSize: 11 }}
              unit={mode === "score" ? "%" : ""}
            />
            <Tooltip
              labelFormatter={(label, payload) => {
                const testName = payload?.[0]?.payload?.testName
                return testName ? `${label}　${testName}` : label
              }}
              formatter={(value, name) => {
                if (value == null) return ["-", name]
                const nameStr = String(name)
                if (nameStr.startsWith("avg_") || nameStr === "avg") {
                  const subjectName = nameStr.startsWith("avg_")
                    ? `平均(${subjectMap.get(nameStr.slice(4)) ?? ""})`
                    : "クラス平均"
                  return [`${value}%`, subjectName]
                }
                const label = subjectMap.get(nameStr) ?? "得点"
                return mode === "score" ? [`${value}%`, label] : [`偏差値 ${value}`, label]
              }}
            />
            {hasSubjects && (
              <Legend
                formatter={(v) => subjectMap.get(v) ?? v}
                onClick={(data) => {
                  const key = data.dataKey as string
                  setActiveSubject((prev) => (prev === key ? null : key))
                }}
                wrapperStyle={{ cursor: "pointer" }}
              />
            )}

            {hasSubjects
              ? usedSubjectIds.map((sid, i) => {
                  const dimmed = activeSubject !== null && activeSubject !== sid
                  return (
                    <Line
                      key={sid}
                      type="monotone"
                      dataKey={sid}
                      stroke={LINE_COLORS[i % LINE_COLORS.length]}
                      strokeWidth={dimmed ? 1 : 2.5}
                      strokeOpacity={dimmed ? 0.2 : 1}
                      dot={{ r: dimmed ? 2 : 4 }}
                      activeDot={{ r: 6 }}
                      connectNulls={false}
                    />
                  )
                })
              : (
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="#2563eb"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
              )}

            {/* クラス平均ライン（点線） */}
            {hasSubjects
              ? usedSubjectIds.map((sid, i) => {
                  const dimmed = activeSubject !== null && activeSubject !== sid
                  return (
                    <Line
                      key={`avg_${sid}`}
                      type="monotone"
                      dataKey={`avg_${sid}`}
                      stroke={LINE_COLORS[i % LINE_COLORS.length]}
                      strokeWidth={1}
                      strokeOpacity={dimmed ? 0.15 : 0.6}
                      strokeDasharray="4 4"
                      dot={false}
                      connectNulls={false}
                      legendType="none"
                    />
                  )
                })
              : (
                <Line
                  type="monotone"
                  dataKey="avg"
                  stroke="#94a3b8"
                  strokeWidth={1}
                  strokeDasharray="4 4"
                  dot={false}
                  name="クラス平均"
                />
              )}
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}
