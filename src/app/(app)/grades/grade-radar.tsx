"use client"

import { useState } from "react"
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts"
import { Select } from "@/components/ui/select"

type Grade = {
  id: string
  testName: string
  testType: string
  date: string
  score: number | null
  maxScore: number | null
  deviation: number | null
  subjectIds: string[]
}

type Subject = { id: string; name: string }

/**
 * 同じテスト名でグループ化し、科目別の得点をレーダーチャートで表示する。
 * 得点%（score/maxScore）優先、無ければ偏差値。科目が3つ以上揃ったテストのみ対象。
 */
export default function GradeRadar({ grades, subjects }: { grades: Grade[]; subjects: Subject[] }) {
  const subjectMap = new Map(subjects.map((s) => [s.id, s.name]))

  // テスト名でグループ化
  const groups = new Map<string, Grade[]>()
  for (const g of grades) {
    const arr = groups.get(g.testName) ?? []
    arr.push(g)
    groups.set(g.testName, arr)
  }

  const qualifying = Array.from(groups.entries())
    .map(([testName, gs]) => {
      const points: { subject: string; value: number }[] = []
      const seen = new Set<string>()
      for (const g of gs) {
        const value =
          g.score != null && g.maxScore != null
            ? Math.round((g.score / g.maxScore) * 100)
            : g.deviation
        if (value == null) continue
        for (const sid of g.subjectIds) {
          if (seen.has(sid)) continue
          seen.add(sid)
          points.push({ subject: subjectMap.get(sid) ?? sid, value })
        }
      }
      return { testName, date: gs[0].date, points }
    })
    .filter((x) => x.points.length >= 3)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  const [selected, setSelected] = useState(0)
  if (qualifying.length === 0) return null

  const current = qualifying[Math.min(selected, qualifying.length - 1)]

  return (
    <div className="rounded-lg border bg-card p-4 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-medium">科目バランス</p>
        {qualifying.length > 1 ? (
          <Select
            value={selected}
            onChange={(e) => setSelected(Number(e.target.value))}
            containerClassName="min-w-0 max-w-44"
            className="md:h-8 md:text-xs"
          >
            {qualifying.map((q, i) => (
              <option key={q.testName} value={i}>
                {q.testName}
              </option>
            ))}
          </Select>
        ) : (
          <span className="text-xs text-muted-foreground truncate">{current.testName}</span>
        )}
      </div>
      <ResponsiveContainer width="100%" height={240}>
        <RadarChart data={current.points} margin={{ top: 8, right: 8, bottom: 8, left: 8 }}>
          <PolarGrid stroke="var(--border)" />
          <PolarAngleAxis dataKey="subject" tick={{ fontSize: 12, fill: "var(--muted-foreground)" }} />
          <PolarRadiusAxis domain={[0, 100]} tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} />
          <Radar
            dataKey="value"
            stroke="var(--primary)"
            fill="var(--primary)"
            fillOpacity={0.3}
            dot={{ r: 3, fill: "var(--primary)" }}
          />
          <Tooltip formatter={(value) => [String(value), "得点"]} />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  )
}
