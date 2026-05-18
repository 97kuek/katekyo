"use client"

import type { GardenItemType } from "@/lib/garden-utils"

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

// ---- Platform --------------------------------------------------------------

function Platform() {
  const bx = 0,    by = 256
  const rx = 256,  ry = 128
  const lx = -256, ly = 128
  return (
    <g>
      <polygon
        points={`${rx},${ry} ${bx},${by} ${bx},${by + DEPTH} ${rx},${ry + DEPTH}`}
        fill="#9c7040"
      />
      <polygon
        points={`${lx},${ly} ${bx},${by} ${bx},${by + DEPTH} ${lx},${ly + DEPTH}`}
        fill="#7a5028"
      />
      <line x1={lx} y1={ly + DEPTH} x2={bx} y2={by + DEPTH} stroke="#5e3c18" strokeWidth={1.5} />
      <line x1={rx} y1={ry + DEPTH} x2={bx} y2={by + DEPTH} stroke="#5e3c18" strokeWidth={1.5} />
    </g>
  )
}

// ---- Tiles -----------------------------------------------------------------

const TILE_COLORS = ["#78d068", "#82d870", "#70c862", "#7dd474", "#76cc66"]

function Tile({ col, row }: { col: number; row: number }) {
  const { cx, cy } = iso(col, row)
  const seed = col * 7 + row * 13
  const fill = TILE_COLORS[seed % TILE_COLORS.length]
  const top    = `${cx},${cy}`
  const right  = `${cx + TILE_W / 2},${cy + TILE_H / 2}`
  const bottom = `${cx},${cy + TILE_H}`
  const left   = `${cx - TILE_W / 2},${cy + TILE_H / 2}`
  const hx1 = cx + ((seed % 5) - 2) * 7
  const hy1 = cy + TILE_H / 2 + ((seed % 3) - 1) * 4
  const hx2 = cx + ((seed % 4) - 2) * 9
  const hy2 = cy + TILE_H / 2 + ((seed % 6) - 3) * 3
  return (
    <g>
      <polygon points={`${top} ${right} ${bottom} ${left}`} fill={fill} />
      <line x1={cx} y1={cy} x2={cx - TILE_W / 2} y2={cy + TILE_H / 2} stroke="rgba(255,255,255,0.18)" strokeWidth={1} />
      <circle cx={hx1} cy={hy1} r={3.5} fill="rgba(255,255,255,0.11)" />
      <circle cx={hx2} cy={hy2} r={2.5} fill="rgba(255,255,255,0.07)" />
    </g>
  )
}

// ---- Healthy items ---------------------------------------------------------

function Tree({ cx, cy, delay = "0s" }: { cx: number; cy: number; delay?: string }) {
  const ax = cx, ay = cy + TILE_H / 2
  return (
    <g style={{ animation: `treeSway 4s ease-in-out ${delay} infinite`, transformOrigin: `${ax}px ${ay}px` }}>
      <ellipse cx={ax + 6} cy={ay - 1} rx={17} ry={5.5} fill="rgba(0,0,0,0.13)" />
      <rect x={ax - 3.5} y={ay - 22} width={7} height={22} rx={2} fill="#7c4a1e" />
      <rect x={ax - 3.5} y={ay - 22} width={3} height={22} rx={1.5} fill="#a0622a" />
      <polygon points={`${ax},${ay - 50} ${ax - 22},${ay - 22} ${ax + 22},${ay - 22}`} fill="#2d6e38" />
      <polygon points={`${ax},${ay - 50} ${ax - 22},${ay - 22} ${ax},${ay - 22}`}       fill="#3d9048" />
      <polygon points={`${ax},${ay - 66} ${ax - 16},${ay - 46} ${ax + 16},${ay - 46}`} fill="#358040" />
      <polygon points={`${ax},${ay - 66} ${ax - 16},${ay - 46} ${ax},${ay - 46}`}       fill="#46a854" />
      <polygon points={`${ax},${ay - 78} ${ax - 11},${ay - 63} ${ax + 11},${ay - 63}`} fill="#3a9248" />
      <polygon points={`${ax},${ay - 78} ${ax - 11},${ay - 63} ${ax},${ay - 63}`}       fill="#50b862" />
      <circle cx={ax} cy={ay - 79} r={2.5} fill="#4daa5e" />
    </g>
  )
}

function Bush({ cx, cy, delay = "0s" }: { cx: number; cy: number; delay?: string }) {
  const ax = cx, ay = cy + TILE_H / 2
  return (
    <g style={{ animation: `bushSway 5s ease-in-out ${delay} infinite`, transformOrigin: `${ax}px ${ay}px` }}>
      <ellipse cx={ax + 5} cy={ay - 1} rx={18} ry={5} fill="rgba(0,0,0,0.11)" />
      <ellipse cx={ax - 9}  cy={ay - 11} rx={12} ry={10} fill="#2a7a3a" />
      <ellipse cx={ax + 9}  cy={ay - 11} rx={12} ry={10} fill="#2a7a3a" />
      <ellipse cx={ax}      cy={ay - 18} rx={14} ry={12} fill="#339e48" />
      <ellipse cx={ax - 2}  cy={ay - 21} rx={6}  ry={4}  fill="#48be62" />
      <ellipse cx={ax - 10} cy={ay - 13} rx={4}  ry={3}  fill="#3aac52" />
    </g>
  )
}

function Flower({ cx, cy, delay = "0s" }: { cx: number; cy: number; delay?: string }) {
  const ax = cx, ay = cy + TILE_H / 2
  const petals = [0, 60, 120, 180, 240, 300].map(deg => {
    const rad = (deg * Math.PI) / 180
    return <ellipse key={deg} cx={ax + Math.cos(rad) * 7} cy={ay - 24 + Math.sin(rad) * 7} rx={4.5} ry={4.5} fill="#fbb6ce" />
  })
  return (
    <g style={{ animation: `flowerSway 3s ease-in-out ${delay} infinite`, transformOrigin: `${ax}px ${ay}px` }}>
      <ellipse cx={ax + 3} cy={ay - 1} rx={9} ry={3} fill="rgba(0,0,0,0.08)" />
      <path d={`M ${ax} ${ay} Q ${ax - 3} ${ay - 12} ${ax} ${ay - 18}`} stroke="#4ade80" strokeWidth={2.5} fill="none" strokeLinecap="round" />
      <ellipse cx={ax - 6} cy={ay - 13} rx={6} ry={2.5} fill="#22c55e" transform={`rotate(-35 ${ax - 6} ${ay - 13})`} />
      {petals}
      <circle cx={ax} cy={ay - 24} r={5}   fill="#fde047" />
      <circle cx={ax} cy={ay - 24} r={2.5} fill="#fbbf24" />
    </g>
  )
}

// ---- Rare items ------------------------------------------------------------

function Cherry({ cx, cy, delay = "0s" }: { cx: number; cy: number; delay?: string }) {
  const ax = cx, ay = cy + TILE_H / 2
  return (
    <g style={{ animation: `treeSway 4.5s ease-in-out ${delay} infinite`, transformOrigin: `${ax}px ${ay}px` }}>
      <ellipse cx={ax + 7} cy={ay - 1} rx={20} ry={6} fill="rgba(0,0,0,0.12)" />
      <rect x={ax - 3} y={ay - 22} width={6} height={22} rx={2} fill="#9b6b4a" />
      <rect x={ax - 3} y={ay - 22} width={2.5} height={22} rx={1.5} fill="#c08060" />
      {/* Lower blossom clusters */}
      <ellipse cx={ax - 14} cy={ay - 30} rx={14} ry={12} fill="#f9a8c9" />
      <ellipse cx={ax + 14} cy={ay - 30} rx={14} ry={12} fill="#f9a8c9" />
      <ellipse cx={ax}      cy={ay - 32} rx={16} ry={13} fill="#fbbcd8" />
      {/* Upper clusters */}
      <ellipse cx={ax - 9}  cy={ay - 48} rx={11} ry={9}  fill="#f9a8c9" />
      <ellipse cx={ax + 9}  cy={ay - 48} rx={11} ry={9}  fill="#f9a8c9" />
      <ellipse cx={ax}      cy={ay - 56} rx={12} ry={10} fill="#fbbcd8" />
      <ellipse cx={ax}      cy={ay - 62} rx={7}  ry={5}  fill="#ffd0e8" />
      {/* Flower highlights */}
      <circle cx={ax - 12} cy={ay - 28} r={3}   fill="rgba(255,255,255,0.6)" />
      <circle cx={ax + 10} cy={ay - 26} r={2.5} fill="rgba(255,255,255,0.6)" />
      <circle cx={ax - 5}  cy={ay - 48} r={3}   fill="rgba(255,255,255,0.6)" />
      <circle cx={ax + 6}  cy={ay - 52} r={2}   fill="rgba(255,255,255,0.5)" />
    </g>
  )
}

function BigTree({ cx, cy, delay = "0s" }: { cx: number; cy: number; delay?: string }) {
  const ax = cx, ay = cy + TILE_H / 2
  return (
    <g style={{ animation: `bigTreeSway 6s ease-in-out ${delay} infinite`, transformOrigin: `${ax}px ${ay}px` }}>
      <ellipse cx={ax + 9} cy={ay - 1} rx={24} ry={8} fill="rgba(0,0,0,0.17)" />
      {/* Wide trunk */}
      <rect x={ax - 5} y={ay - 30} width={10} height={30} rx={3} fill="#6b3d1e" />
      <rect x={ax - 5} y={ay - 30} width={4}  height={30} rx={2} fill="#8c5228" />
      {/* 5-layer canopy */}
      <polygon points={`${ax},${ay - 62} ${ax - 30},${ay - 30} ${ax + 30},${ay - 30}`} fill="#1a5222" />
      <polygon points={`${ax},${ay - 62} ${ax - 30},${ay - 30} ${ax},${ay - 30}`}       fill="#276834" />
      <polygon points={`${ax},${ay - 80} ${ax - 23},${ay - 58} ${ax + 23},${ay - 58}`} fill="#1f6028" />
      <polygon points={`${ax},${ay - 80} ${ax - 23},${ay - 58} ${ax},${ay - 58}`}       fill="#2e7a38" />
      <polygon points={`${ax},${ay - 95} ${ax - 17},${ay - 76} ${ax + 17},${ay - 76}`} fill="#256630" />
      <polygon points={`${ax},${ay - 95} ${ax - 17},${ay - 76} ${ax},${ay - 76}`}       fill="#348040" />
      <polygon points={`${ax},${ay - 106} ${ax - 11},${ay - 91} ${ax + 11},${ay - 91}`} fill="#2a6e38" />
      <polygon points={`${ax},${ay - 106} ${ax - 11},${ay - 91} ${ax},${ay - 91}`}      fill="#3a8a48" />
      <polygon points={`${ax},${ay - 114} ${ax - 6},${ay - 103} ${ax + 6},${ay - 103}`} fill="#2e7840" />
      <circle cx={ax} cy={ay - 115} r={3.5} fill="#3c9050" />
    </g>
  )
}

// ---- Wilted items ----------------------------------------------------------
// 枯れ色: 乾いた茶褐色・黄褐色を使用し、通常の緑と明確に区別できるようにする

function WiltedTree({ cx, cy }: { cx: number; cy: number }) {
  const ax = cx, ay = cy + TILE_H / 2
  return (
    <g opacity={0.58}>
      <ellipse cx={ax + 5} cy={ay - 1} rx={11} ry={3.5} fill="rgba(0,0,0,0.06)" />
      <rect x={ax - 3.5} y={ay - 18} width={7} height={18} rx={2} fill="#5c3a18" />
      <rect x={ax - 3.5} y={ay - 18} width={2.5} height={18} rx={1.5} fill="#7a4e24" />
      {/* 乾燥した黄茶色の枯れ葉 */}
      <polygon points={`${ax},${ay - 40} ${ax - 17},${ay - 22} ${ax + 17},${ay - 22}`} fill="#a07e28" />
      <polygon points={`${ax},${ay - 40} ${ax - 17},${ay - 22} ${ax},${ay - 22}`}       fill="#b48e30" />
      <polygon points={`${ax},${ay - 52} ${ax - 11},${ay - 38} ${ax + 11},${ay - 38}`} fill="#a87e20" />
      <polygon points={`${ax},${ay - 52} ${ax - 11},${ay - 38} ${ax},${ay - 38}`}       fill="#ba9028" />
      <polygon points={`${ax},${ay - 60} ${ax - 6},${ay - 50} ${ax + 6},${ay - 50}`}   fill="#a07c20" />
      <circle cx={ax} cy={ay - 61} r={2} fill="#b08828" />
    </g>
  )
}

function WiltedBush({ cx, cy }: { cx: number; cy: number }) {
  const ax = cx, ay = cy + TILE_H / 2
  return (
    <g opacity={0.58}>
      <ellipse cx={ax + 3} cy={ay - 1} rx={12} ry={3.5} fill="rgba(0,0,0,0.06)" />
      {/* 潰れて黄茶色に枯れた茂み */}
      <ellipse cx={ax - 7} cy={ay - 8}  rx={9}  ry={7}  fill="#8a7820" />
      <ellipse cx={ax + 7} cy={ay - 8}  rx={9}  ry={7}  fill="#8a7820" />
      <ellipse cx={ax}     cy={ay - 13} rx={11} ry={8}  fill="#a08c28" />
      <ellipse cx={ax - 1} cy={ay - 15} rx={4}  ry={3}  fill="#b09a30" />
    </g>
  )
}

function WiltedFlower({ cx, cy }: { cx: number; cy: number }) {
  const ax = cx, ay = cy + TILE_H / 2
  // 茎がしなだれて頭が大きく傾いた枯れ花
  const hx = ax + 9, hy = ay - 11
  const petals = [0, 60, 120, 180, 240, 300].map(deg => {
    const rad = (deg * Math.PI) / 180
    return <ellipse key={deg} cx={hx + Math.cos(rad) * 5.5} cy={hy + Math.sin(rad) * 5.5} rx={3.5} ry={3.5} fill="#c4a840" />
  })
  return (
    <g opacity={0.58}>
      <ellipse cx={ax + 5} cy={ay - 1} rx={7} ry={2.5} fill="rgba(0,0,0,0.05)" />
      {/* しなだれた茎 */}
      <path d={`M ${ax} ${ay} Q ${ax + 14} ${ay - 6} ${hx} ${hy}`} stroke="#7a8830" strokeWidth={2.5} fill="none" strokeLinecap="round" />
      {/* 垂れ下がった葉 */}
      <ellipse cx={ax + 7} cy={ay - 5} rx={5} ry={2} fill="#7a8830" transform={`rotate(35 ${ax + 7} ${ay - 5})`} />
      {petals}
      <circle cx={hx} cy={hy} r={4.5} fill="#c4a840" />
      <circle cx={hx} cy={hy} r={2.2} fill="#a88828" />
    </g>
  )
}

function WiltedCherry({ cx, cy }: { cx: number; cy: number }) {
  const ax = cx, ay = cy + TILE_H / 2
  return (
    <g opacity={0.58}>
      <ellipse cx={ax + 5} cy={ay - 1} rx={14} ry={4} fill="rgba(0,0,0,0.07)" />
      <rect x={ax - 3} y={ay - 20} width={6} height={20} rx={2} fill="#6a4830" />
      {/* 枯れた桜: ピンクから乾いた茶ピンクへ */}
      <ellipse cx={ax - 11} cy={ay - 26} rx={11} ry={8}  fill="#b89070" />
      <ellipse cx={ax + 11} cy={ay - 26} rx={11} ry={8}  fill="#b89070" />
      <ellipse cx={ax}      cy={ay - 28} rx={12} ry={9}  fill="#c8a07e" />
      <ellipse cx={ax - 6}  cy={ay - 41} rx={8}  ry={6}  fill="#b89070" />
      <ellipse cx={ax + 6}  cy={ay - 41} rx={8}  ry={6}  fill="#b89070" />
      <ellipse cx={ax}      cy={ay - 47} rx={7}  ry={5}  fill="#c8a07e" />
    </g>
  )
}

function WiltedBigTree({ cx, cy }: { cx: number; cy: number }) {
  const ax = cx, ay = cy + TILE_H / 2
  return (
    <g opacity={0.58}>
      <ellipse cx={ax + 6} cy={ay - 1} rx={15} ry={5} fill="rgba(0,0,0,0.08)" />
      <rect x={ax - 5} y={ay - 26} width={10} height={26} rx={3} fill="#4a3010" />
      <rect x={ax - 5} y={ay - 26} width={3.5} height={26} rx={2} fill="#6a4820" />
      {/* 乾いた黄茶色の枯れ枝 */}
      <polygon points={`${ax},${ay - 55} ${ax - 24},${ay - 26} ${ax + 24},${ay - 26}`} fill="#987020" />
      <polygon points={`${ax},${ay - 55} ${ax - 24},${ay - 26} ${ax},${ay - 26}`}       fill="#a88028" />
      <polygon points={`${ax},${ay - 70} ${ax - 17},${ay - 49} ${ax + 17},${ay - 49}`} fill="#a07820" />
      <polygon points={`${ax},${ay - 70} ${ax - 17},${ay - 49} ${ax},${ay - 49}`}       fill="#b08830" />
      <polygon points={`${ax},${ay - 81} ${ax - 12},${ay - 65} ${ax + 12},${ay - 65}`} fill="#a07820" />
      <polygon points={`${ax},${ay - 81} ${ax - 12},${ay - 65} ${ax},${ay - 65}`}       fill="#b08828" />
      <polygon points={`${ax},${ay - 89} ${ax - 7},${ay - 77} ${ax + 7},${ay - 77}`}   fill="#987020" />
      <circle cx={ax} cy={ay - 90} r={3} fill="#a07820" />
    </g>
  )
}

// ---- Main canvas -----------------------------------------------------------

type Item = { x: number; y: number; itemType: GardenItemType; withered: boolean }

export default function GardenCanvas({ items }: { items: Item[] }) {
  const itemMap = new Map(items.map((i) => [`${i.x},${i.y}`, i]))

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
        viewBox="-280 -130 560 450"
        width="100%"
        className="max-w-full select-none"
        aria-label="学習の森"
      >
        <style>{`
          @keyframes treeSway {
            0%, 100% { transform: rotate(-1.2deg); }
            50%       { transform: rotate(1.2deg); }
          }
          @keyframes bushSway {
            0%, 100% { transform: rotate(-0.8deg); }
            50%       { transform: rotate(0.8deg); }
          }
          @keyframes flowerSway {
            0%, 100% { transform: rotate(-3deg); }
            50%       { transform: rotate(3deg); }
          }
          @keyframes bigTreeSway {
            0%, 100% { transform: rotate(-0.7deg); }
            50%       { transform: rotate(0.7deg); }
          }
        `}</style>
        <Platform />
        {cells.map(({ col, row }) => (
          <Tile key={`t-${col}-${row}`} col={col} row={row} />
        ))}
        {cells.map(({ col, row }) => {
          const item = itemMap.get(`${col},${row}`)
          if (!item) return null
          const { cx, cy } = iso(col, row)
          const { itemType, withered } = item
          const delay = `${((col * 3 + row * 7) % 12) * 0.35}s`
          if (itemType === "tree")     return withered ? <WiltedTree    key={`i-${col}-${row}`} cx={cx} cy={cy} /> : <Tree    key={`i-${col}-${row}`} cx={cx} cy={cy} delay={delay} />
          if (itemType === "bush")     return withered ? <WiltedBush    key={`i-${col}-${row}`} cx={cx} cy={cy} /> : <Bush    key={`i-${col}-${row}`} cx={cx} cy={cy} delay={delay} />
          if (itemType === "cherry")   return withered ? <WiltedCherry  key={`i-${col}-${row}`} cx={cx} cy={cy} /> : <Cherry  key={`i-${col}-${row}`} cx={cx} cy={cy} delay={delay} />
          if (itemType === "big_tree") return withered ? <WiltedBigTree key={`i-${col}-${row}`} cx={cx} cy={cy} /> : <BigTree key={`i-${col}-${row}`} cx={cx} cy={cy} delay={delay} />
          return                              withered ? <WiltedFlower  key={`i-${col}-${row}`} cx={cx} cy={cy} /> : <Flower  key={`i-${col}-${row}`} cx={cx} cy={cy} delay={delay} />
        })}
      </svg>
    </div>
  )
}
