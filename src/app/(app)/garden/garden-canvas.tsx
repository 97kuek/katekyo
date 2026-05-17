"use client"

type GardenItemType = "tree" | "bush" | "flower"

const TILE_W = 64
const TILE_H = 32
const GRID = 8
const DEPTH = 24

function iso(col: number, row: number) {
  return {
    cx: (col - row) * (TILE_W / 2),
    cy: (col + row) * (TILE_H / 2),
  }
}

// ---- Platform (isometric box base) ----------------------------------------

function Platform() {
  // Four corners of the 8×8 grid top face in screen coords
  const bx = 0,   by = 256   // bottom vertex
  const rx = 256, ry = 128   // right vertex
  const lx = -256, ly = 128  // left vertex
  return (
    <g>
      {/* Right face (lighter) */}
      <polygon
        points={`${rx},${ry} ${bx},${by} ${bx},${by + DEPTH} ${rx},${ry + DEPTH}`}
        fill="#9c7040"
      />
      {/* Left face (darker) */}
      <polygon
        points={`${lx},${ly} ${bx},${by} ${bx},${by + DEPTH} ${lx},${ly + DEPTH}`}
        fill="#7a5028"
      />
      {/* Bottom edge stripe */}
      <line x1={lx} y1={ly + DEPTH} x2={bx} y2={by + DEPTH} stroke="#5e3c18" strokeWidth={1.5} />
      <line x1={rx} y1={ry + DEPTH} x2={bx} y2={by + DEPTH} stroke="#5e3c18" strokeWidth={1.5} />
    </g>
  )
}

// ---- Grass tile with subtle color variation + texture ----------------------

const TILE_COLORS = ["#78d068", "#82d870", "#70c862", "#7dd474", "#76cc66"]

function Tile({ col, row }: { col: number; row: number }) {
  const { cx, cy } = iso(col, row)
  const seed = col * 7 + row * 13
  const fill = TILE_COLORS[seed % TILE_COLORS.length]

  const top    = `${cx},${cy}`
  const right  = `${cx + TILE_W / 2},${cy + TILE_H / 2}`
  const bottom = `${cx},${cy + TILE_H}`
  const left   = `${cx - TILE_W / 2},${cy + TILE_H / 2}`

  // Deterministic highlight positions per tile
  const hx1 = cx + ((seed % 5) - 2) * 7
  const hy1 = cy + TILE_H / 2 + ((seed % 3) - 1) * 4
  const hx2 = cx + ((seed % 4) - 2) * 9
  const hy2 = cy + TILE_H / 2 + ((seed % 6) - 3) * 3

  return (
    <g>
      <polygon points={`${top} ${right} ${bottom} ${left}`} fill={fill} />
      {/* Left edge highlight (simulates top-lit look) */}
      <line
        x1={cx} y1={cy}
        x2={cx - TILE_W / 2} y2={cy + TILE_H / 2}
        stroke="rgba(255,255,255,0.18)" strokeWidth={1}
      />
      {/* Grass texture spots */}
      <circle cx={hx1} cy={hy1} r={3.5} fill="rgba(255,255,255,0.11)" />
      <circle cx={hx2} cy={hy2} r={2.5} fill="rgba(255,255,255,0.07)" />
    </g>
  )
}

// ---- Tree ------------------------------------------------------------------

function Tree({ cx, cy }: { cx: number; cy: number }) {
  const ax = cx
  const ay = cy + TILE_H / 2
  return (
    <g>
      {/* Ground shadow */}
      <ellipse cx={ax + 6} cy={ay - 1} rx={17} ry={5.5} fill="rgba(0,0,0,0.13)" />

      {/* Trunk — right (shadow) side darker, left side lighter */}
      <rect x={ax - 3.5} y={ay - 22} width={7} height={22} rx={2} fill="#7c4a1e" />
      <rect x={ax - 3.5} y={ay - 22} width={3} height={22} rx={1.5} fill="#a0622a" />

      {/* Layer 1 — widest/darkest, left half lighter */}
      <polygon points={`${ax},${ay - 50} ${ax - 22},${ay - 22} ${ax + 22},${ay - 22}`} fill="#2d6e38" />
      <polygon points={`${ax},${ay - 50} ${ax - 22},${ay - 22} ${ax},${ay - 22}`}       fill="#3d9048" />

      {/* Layer 2 */}
      <polygon points={`${ax},${ay - 66} ${ax - 16},${ay - 46} ${ax + 16},${ay - 46}`} fill="#358040" />
      <polygon points={`${ax},${ay - 66} ${ax - 16},${ay - 46} ${ax},${ay - 46}`}       fill="#46a854" />

      {/* Layer 3 — top */}
      <polygon points={`${ax},${ay - 78} ${ax - 11},${ay - 63} ${ax + 11},${ay - 63}`} fill="#3a9248" />
      <polygon points={`${ax},${ay - 78} ${ax - 11},${ay - 63} ${ax},${ay - 63}`}       fill="#50b862" />

      {/* Tip */}
      <circle cx={ax} cy={ay - 79} r={2.5} fill="#4daa5e" />
    </g>
  )
}

// ---- Bush ------------------------------------------------------------------

function Bush({ cx, cy }: { cx: number; cy: number }) {
  const ax = cx
  const ay = cy + TILE_H / 2
  return (
    <g>
      {/* Ground shadow */}
      <ellipse cx={ax + 5} cy={ay - 1} rx={18} ry={5} fill="rgba(0,0,0,0.11)" />

      {/* Base clusters */}
      <ellipse cx={ax - 9}  cy={ay - 11} rx={12} ry={10} fill="#2a7a3a" />
      <ellipse cx={ax + 9}  cy={ay - 11} rx={12} ry={10} fill="#2a7a3a" />
      <ellipse cx={ax}      cy={ay - 18} rx={14} ry={12} fill="#339e48" />

      {/* Highlights */}
      <ellipse cx={ax - 2}  cy={ay - 21} rx={6}  ry={4}  fill="#48be62" />
      <ellipse cx={ax - 10} cy={ay - 13} rx={4}  ry={3}  fill="#3aac52" />
    </g>
  )
}

// ---- Flower ----------------------------------------------------------------

function Flower({ cx, cy }: { cx: number; cy: number }) {
  const ax = cx
  const ay = cy + TILE_H / 2
  const petals = [0, 60, 120, 180, 240, 300].map(deg => {
    const rad = (deg * Math.PI) / 180
    return (
      <ellipse
        key={deg}
        cx={ax + Math.cos(rad) * 7}
        cy={ay - 24 + Math.sin(rad) * 7}
        rx={4.5}
        ry={4.5}
        fill="#fbb6ce"
      />
    )
  })
  return (
    <g>
      {/* Ground shadow */}
      <ellipse cx={ax + 3} cy={ay - 1} rx={9} ry={3} fill="rgba(0,0,0,0.08)" />

      {/* Stem (slight curve) */}
      <path
        d={`M ${ax} ${ay} Q ${ax - 3} ${ay - 12} ${ax} ${ay - 18}`}
        stroke="#4ade80" strokeWidth={2.5} fill="none" strokeLinecap="round"
      />
      {/* Leaf */}
      <ellipse
        cx={ax - 6} cy={ay - 13}
        rx={6} ry={2.5}
        fill="#22c55e"
        transform={`rotate(-35 ${ax - 6} ${ay - 13})`}
      />

      {/* Petals */}
      {petals}

      {/* Center */}
      <circle cx={ax} cy={ay - 24} r={5}   fill="#fde047" />
      <circle cx={ax} cy={ay - 24} r={2.5} fill="#fbbf24" />
    </g>
  )
}

// ---- Main canvas -----------------------------------------------------------

type Item = { x: number; y: number; itemType: GardenItemType }

export default function GardenCanvas({ items }: { items: Item[] }) {
  const itemMap = new Map(items.map((i) => [`${i.x},${i.y}`, i.itemType]))

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
        viewBox="-280 -105 560 415"
        width="100%"
        className="max-w-full select-none"
        aria-label="学習の森"
      >
        {/* Platform sides drawn first (behind everything) */}
        <Platform />

        {/* Grass tiles (back-to-front) */}
        {cells.map(({ col, row }) => (
          <Tile key={`t-${col}-${row}`} col={col} row={row} />
        ))}

        {/* Items (back-to-front, on top of tiles) */}
        {cells.map(({ col, row }) => {
          const itemType = itemMap.get(`${col},${row}`)
          if (!itemType) return null
          const { cx, cy } = iso(col, row)
          if (itemType === "tree")   return <Tree   key={`i-${col}-${row}`} cx={cx} cy={cy} />
          if (itemType === "bush")   return <Bush   key={`i-${col}-${row}`} cx={cx} cy={cy} />
          return                            <Flower key={`i-${col}-${row}`} cx={cx} cy={cy} />
        })}
      </svg>
    </div>
  )
}
