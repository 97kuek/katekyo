"use client"

import { useState } from "react"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts"
import { Button } from "@/components/ui/button"
import { TEST_TYPE_OPTIONS } from "@/lib/test-types"
import { FALLBACK_LINE_COLORS } from "@/lib/subject-colors"
import { scorePercentage } from "@/lib/grade-record"

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

type Subject = { id: string; name: string; color?: string | null }

function computeValue(g: Grade, mode: "score" | "deviation"): number | null {
  if (mode === "score") {
    const percentage = scorePercentage(g.score, g.maxScore)
    return percentage == null ? null : Math.round(percentage)
  }
  return g.deviation
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("ja-JP", { month: "numeric", day: "numeric" })
}

export default function GradeChart({
  grades,
  subjects,
  typeFilter: externalTypeFilter,
}: {
  grades: Grade[]
  subjects: Subject[]
  typeFilter?: string
}) {
  const availableTypes = Array.from(new Set(grades.map((g) => g.testType)))
  const [mode, setMode] = useState<"score" | "deviation">("score")
  const [internalTypeFilter, setInternalTypeFilter] = useState<string>(availableTypes[0] ?? "")
  const [activeSubject, setActiveSubject] = useState<string | null>(null)

  const typeFilter = externalTypeFilter !== undefined ? externalTypeFilter : internalTypeFilter
  const isExternalFilter = externalTypeFilter !== undefined

  const filtered = grades.filter((g) => !typeFilter || g.testType === typeFilter)
  const sorted = [...filtered].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

  const hasScore = sorted.some((g) => computeValue(g, "score") != null)
  const hasDeviation = sorted.some((g) => g.deviation != null)

  const usedSubjectIds = Array.from(new Set(sorted.flatMap((g) => g.subjectIds)))
  const subjectMap = new Map(subjects.map((s) => [s.id, s.name]))
  const colorMap = new Map(subjects.map((s) => [s.id, s.color ?? null]))
  const colorOf = (sid: string, i: number) =>
    colorMap.get(sid) ?? FALLBACK_LINE_COLORS[i % FALLBACK_LINE_COLORS.length]
  const hasSubjects = usedSubjectIds.length > 0

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

  // 長期記録に備えた横スクロール: データ点が多いとき1点あたり幅を確保
  const POINT_W = 56
  const needScroll = chartData.length > 7
  const innerWidth = needScroll ? chartData.length * POINT_W + 48 : undefined

  return (
    <div className="rounded-lg border bg-card p-4 space-y-3">
      {/* コントロール1行 */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        {!isExternalFilter && (
          <div className="flex items-center gap-1 flex-wrap">
            <span className="text-xs text-muted-foreground mr-1">種別</span>
            {TEST_TYPE_OPTIONS.filter(([v]) => availableTypes.includes(v)).map(([value, label]) => (
              <Button
                key={value}
                type="button"
                size="xs"
                variant={typeFilter === value ? "default" : "outline"}
                onClick={() => { setInternalTypeFilter(value); setActiveSubject(null) }}
              >
                {label}
              </Button>
            ))}
          </div>
        )}
        <div className={`flex gap-1 ${isExternalFilter ? "ml-auto" : ""}`}>
          <Button
            type="button"
            size="sm"
            variant={mode === "score" ? "default" : "outline"}
            onClick={() => setMode("score")}
            disabled={!hasScore}
            className="h-7 px-2.5 text-xs"
          >
            点数
          </Button>
          <Button
            type="button"
            size="sm"
            variant={mode === "deviation" ? "default" : "outline"}
            onClick={() => setMode("deviation")}
            disabled={!hasDeviation}
            className="h-7 px-2.5 text-xs"
          >
            偏差値
          </Button>
        </div>
      </div>

      {chartData.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-6">該当するデータがありません</p>
      ) : (
        <>
        <div className={needScroll ? "overflow-x-auto overscroll-x-contain -mx-1 px-1" : ""}>
        <div style={needScroll ? { width: innerWidth } : undefined}>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={chartData} margin={{ top: 4, right: 10, left: -20, bottom: 28 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" tick={{ fontSize: 11 }} angle={-25} textAnchor="end" interval={0} />
            <YAxis
              domain={mode === "deviation" ? [30, 80] : [0, 100]}
              ticks={mode === "deviation" ? [30, 40, 50, 60, 70, 80] : [0, 25, 50, 75, 100]}
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
            {hasSubjects
              ? usedSubjectIds.map((sid, i) => {
                  const dimmed = activeSubject !== null && activeSubject !== sid
                  return (
                    <Line
                      key={sid}
                      type="monotone"
                      dataKey={sid}
                      stroke={colorOf(sid, i)}
                      strokeWidth={dimmed ? 1 : 2.5}
                      strokeOpacity={dimmed ? 0.2 : 1}
                      dot={{ r: dimmed ? 2 : 4 }}
                      activeDot={{ r: 6 }}
                      connectNulls
                    />
                  )
                })
              : (
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="var(--primary)"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
              )}

            {hasSubjects
              ? usedSubjectIds.map((sid, i) => {
                  const dimmed = activeSubject !== null && activeSubject !== sid
                  return (
                    <Line
                      key={`avg_${sid}`}
                      type="monotone"
                      dataKey={`avg_${sid}`}
                      stroke={colorOf(sid, i)}
                      strokeWidth={1}
                      strokeOpacity={dimmed ? 0.15 : 0.6}
                      strokeDasharray="4 4"
                      dot={false}
                      connectNulls
                      legendType="none"
                    />
                  )
                })
              : (
                <Line
                  type="monotone"
                  dataKey="avg"
                  stroke="var(--muted-foreground)"
                  strokeWidth={1}
                  strokeDasharray="4 4"
                  dot={false}
                  name="クラス平均"
                />
              )}
          </LineChart>
        </ResponsiveContainer>
        </div>
        </div>
        {hasSubjects && (
          <div className="flex gap-1.5 overflow-x-auto overscroll-x-contain pt-1 -mx-1 px-1">
            {usedSubjectIds.map((sid, i) => {
              const active = activeSubject === sid
              const dimmed = activeSubject !== null && !active
              return (
                <Button
                  key={sid}
                  type="button"
                  size="xs"
                  variant={active ? "secondary" : "outline"}
                  onClick={() => setActiveSubject((prev) => (prev === sid ? null : sid))}
                  className={dimmed ? "opacity-40" : ""}
                >
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: colorOf(sid, i) }} />
                  {subjectMap.get(sid) ?? sid}
                </Button>
              )
            })}
          </div>
        )}
        </>
      )}
    </div>
  )
}
