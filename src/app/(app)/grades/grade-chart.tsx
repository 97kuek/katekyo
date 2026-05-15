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

type Grade = {
  id: string
  testName: string
  testType: string
  date: string
  score: number | null
  maxScore: number | null
  deviation: number | null
}

export default function GradeChart({ grades }: { grades: Grade[] }) {
  const [mode, setMode] = useState<"score" | "deviation">("score")
  const [typeFilter, setTypeFilter] = useState<string>("")

  const filtered = typeFilter ? grades.filter((g) => g.testType === typeFilter) : grades

  const sorted = [...filtered].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  )

  const data = sorted.map((g) => {
    const scoreVal =
      g.score != null && g.maxScore != null
        ? Math.round((g.score / g.maxScore) * 100)
        : g.score
    const label = `${new Date(g.date).toLocaleDateString("ja-JP", {
      month: "numeric",
      day: "numeric",
    })} ${g.testName}`
    return { name: label, score: scoreVal, deviation: g.deviation }
  })

  const hasScore = data.some((d) => d.score != null)
  const hasDeviation = data.some((d) => d.deviation != null)
  const chartData = data.filter((d) => (mode === "score" ? d.score != null : d.deviation != null))

  const availableTypes = Array.from(new Set(grades.map((g) => g.testType)))

  if (!hasScore && !hasDeviation) return null

  return (
    <div className="rounded-lg border bg-white p-5 space-y-4">
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

      {availableTypes.length > 1 && (
        <div className="flex gap-1.5 flex-wrap">
          <button
            type="button"
            onClick={() => setTypeFilter("")}
            className={`px-2.5 py-1 rounded-md text-xs border transition-colors ${typeFilter === "" ? "bg-primary text-primary-foreground border-primary" : "bg-white text-muted-foreground border-input hover:bg-gray-50"}`}
          >
            すべて
          </button>
          {TEST_TYPE_OPTIONS.filter(([v]) => availableTypes.includes(v)).map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setTypeFilter(value)}
              className={`px-2.5 py-1 rounded-md text-xs border transition-colors ${typeFilter === value ? "bg-primary text-primary-foreground border-primary" : "bg-white text-muted-foreground border-input hover:bg-gray-50"}`}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      {chartData.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-6">
          該当するデータがありません
        </p>
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 50 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="name"
              tick={{ fontSize: 11 }}
              angle={-35}
              textAnchor="end"
              interval={0}
            />
            <YAxis
              domain={mode === "deviation" ? [30, 80] : [0, 100]}
              tick={{ fontSize: 11 }}
              unit={mode === "score" ? "%" : ""}
            />
            <Tooltip
              formatter={(value) =>
                value != null
                  ? mode === "score"
                    ? [`${value}%`, ""]
                    : [`偏差値 ${value}`, ""]
                  : ["-", ""]
              }
            />
            <Line
              type="monotone"
              dataKey={mode === "score" ? "score" : "deviation"}
              stroke="#2563eb"
              strokeWidth={2}
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}
