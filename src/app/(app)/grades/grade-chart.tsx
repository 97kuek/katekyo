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

type Grade = {
  id: string
  testName: string
  date: string
  score: number | null
  maxScore: number | null
  deviation: number | null
}

export default function GradeChart({ grades }: { grades: Grade[] }) {
  const [mode, setMode] = useState<"score" | "deviation">("score")

  const sorted = [...grades].sort(
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

  if (!hasScore && !hasDeviation) return null

  return (
    <div className="rounded-lg border bg-white p-5 space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">成績推移</p>
        <div className="flex gap-1.5">
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
    </div>
  )
}
