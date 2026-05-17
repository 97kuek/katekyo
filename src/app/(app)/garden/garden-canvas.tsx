"use client"

import type { GardenItemType } from "@/generated/prisma/enums"

const TILE_W = 64
const TILE_H = 32
const GRID = 8

// Isometric projection: (col, row) → screen (cx, cy) where cy is the tile's top vertex
function iso(col: number, row: number) {
  return {
    cx: (col - row) * (TILE_W / 2),
    cy: (col + row) * (TILE_H / 2),
  }
}

// ---- Tile ---------------------------------------------------------------

function Tile({ col, row }: { col: number; row: number }) {
  const { cx, cy } = iso(col, row)
  const pts = [
    `${cx},${cy}`,
    `${cx + TILE_W / 2},${cy + TILE_H / 2}`,
    `${cx},${cy + TILE_H}`,
    `${cx - TILE_W / 2},${cy + TILE_H / 2}`,
  ].join(" ")
  return (
    <polygon
      points={pts}
      fill="#86efac"
      stroke="#4ade80"
      strokeWidth={0.5}
    />
  )
}

// ---- Items --------------------------------------------------------------

function Tree({ cx, cy }: { cx: number; cy: number }) {
  // anchor = tile center (cx, cy + TILE_H/2)
  const ax = cx
  const ay = cy + TILE_H / 2
  return (
    <g>
      {/* trunk */}
      <rect x={ax - 3} y={ay - 20} width={6} height={18} rx={1} fill="#166534" />
      {/* lower canopy */}
      <polygon
        points={`${ax},${ay - 46} ${ax - 19},${ay - 20} ${ax + 19},${ay - 20}`}
        fill="#15803d"
      />
      {/* upper canopy */}
      <polygon
        points={`${ax},${ay - 64} ${ax - 13},${ay - 44} ${ax + 13},${ay - 44}`}
        fill="#16a34a"
      />
    </g>
  )
}

function Bush({ cx, cy }: { cx: number; cy: number }) {
  const ax = cx
  const ay = cy + TILE_H / 2
  return (
    <g>
      <ellipse cx={ax - 7} cy={ay - 12} rx={11} ry={9} fill="#16a34a" />
      <ellipse cx={ax + 7} cy={ay - 12} rx={11} ry={9} fill="#16a34a" />
      <ellipse cx={ax} cy={ay - 17} rx={13} ry={11} fill="#22c55e" />
    </g>
  )
}

function Flower({ cx, cy }: { cx: number; cy: number }) {
  const ax = cx
  const ay = cy + TILE_H / 2
  return (
    <g>
      {/* stem */}
      <line x1={ax} y1={ay} x2={ax} y2={ay - 18} stroke="#4ade80" strokeWidth={2} strokeLinecap="round" />
      {/* petals */}
      <circle cx={ax} cy={ay - 24} r={7} fill="#f9a8d4" />
      {/* center */}
      <circle cx={ax} cy={ay - 24} r={3} fill="#fde047" />
    </g>
  )
}

// ---- Main canvas --------------------------------------------------------

type Item = { x: number; y: number; itemType: GardenItemType }

export default function GardenCanvas({ items }: { items: Item[] }) {
  // build a lookup for fast access
  const itemMap = new Map(items.map((i) => [`${i.x},${i.y}`, i.itemType]))

  // generate all grid cells sorted back-to-front (ascending col+row)
  const cells: { col: number; row: number }[] = []
  for (let col = 0; col < GRID; col++) {
    for (let row = 0; row < GRID; row++) {
      cells.push({ col, row })
    }
  }
  cells.sort((a, b) => a.col + a.row - (b.col + b.row))

  return (
    <div className="w-full overflow-x-auto">
      <svg
        viewBox="-272 -84 544 368"
        width="100%"
        className="max-w-full select-none"
        aria-label="学習の森"
      >
        {/* Tiles pass */}
        {cells.map(({ col, row }) => (
          <Tile key={`t-${col}-${row}`} col={col} row={row} />
        ))}

        {/* Items pass (drawn after all tiles so they render on top) */}
        {cells.map(({ col, row }) => {
          const itemType = itemMap.get(`${col},${row}`)
          if (!itemType) return null
          const { cx, cy } = iso(col, row)
          if (itemType === "tree") return <Tree key={`i-${col}-${row}`} cx={cx} cy={cy} />
          if (itemType === "bush") return <Bush key={`i-${col}-${row}`} cx={cx} cy={cy} />
          return <Flower key={`i-${col}-${row}`} cx={cx} cy={cy} />
        })}
      </svg>
    </div>
  )
}
