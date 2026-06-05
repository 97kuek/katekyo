"use client"

import type { GardenItemType } from "@/lib/garden-utils"
import { useState, useEffect } from "react"

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

// ---- Gradients & shared defs ----------------------------------------------
// 立体感は SVG グラデーションで表現。接地影はぼかしフィルタの代わりに
// 放射グラデーション（中心濃→外側透明）で軽量に柔らかく見せる。

function GardenDefs() {
  return (
    <defs>
      {/* 接地影（やわらかい） */}
      <radialGradient id="gShadow" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="rgba(0,0,0,0.30)" />
        <stop offset="65%" stopColor="rgba(0,0,0,0.16)" />
        <stop offset="100%" stopColor="rgba(0,0,0,0)" />
      </radialGradient>
      {/* 葉（光源は左上） */}
      <radialGradient id="gLeafA" cx="36%" cy="28%" r="80%">
        <stop offset="0%" stopColor="#74d182" />
        <stop offset="50%" stopColor="#43a052" />
        <stop offset="100%" stopColor="#236430" />
      </radialGradient>
      <radialGradient id="gLeafB" cx="36%" cy="26%" r="82%">
        <stop offset="0%" stopColor="#5fc06f" />
        <stop offset="50%" stopColor="#318240" />
        <stop offset="100%" stopColor="#184f1f" />
      </radialGradient>
      <radialGradient id="gBush" cx="36%" cy="30%" r="80%">
        <stop offset="0%" stopColor="#5fce72" />
        <stop offset="55%" stopColor="#37a44e" />
        <stop offset="100%" stopColor="#1f7233" />
      </radialGradient>
      {/* 幹（円柱風: 端が暗く中央が明るい） */}
      <linearGradient id="gTrunk" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stopColor="#583512" />
        <stop offset="38%" stopColor="#a0682e" />
        <stop offset="64%" stopColor="#7c4a1e" />
        <stop offset="100%" stopColor="#4c2c10" />
      </linearGradient>
      {/* 桜・花の花びら */}
      <radialGradient id="gBlossom" cx="38%" cy="30%" r="78%">
        <stop offset="0%" stopColor="#ffe1ee" />
        <stop offset="55%" stopColor="#f9a8c9" />
        <stop offset="100%" stopColor="#e87bab" />
      </radialGradient>
      <radialGradient id="gPetal" cx="40%" cy="32%" r="75%">
        <stop offset="0%" stopColor="#fde3ec" />
        <stop offset="60%" stopColor="#fbb6ce" />
        <stop offset="100%" stopColor="#f386af" />
      </radialGradient>
      {/* 竹（円柱風） */}
      <linearGradient id="gBamboo" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stopColor="#3f7016" />
        <stop offset="40%" stopColor="#79bd3a" />
        <stop offset="70%" stopColor="#5a9a2a" />
        <stop offset="100%" stopColor="#3a6014" />
      </linearGradient>
      {/* きのこの傘 */}
      <radialGradient id="gCap" cx="38%" cy="26%" r="80%">
        <stop offset="0%" stopColor="#ff8585" />
        <stop offset="55%" stopColor="#e53e3e" />
        <stop offset="100%" stopColor="#a82828" />
      </radialGradient>
      {/* タイル（上方向に明るい芝） */}
      <linearGradient id="gTile" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#84db72" />
        <stop offset="100%" stopColor="#5fb653" />
      </linearGradient>
    </defs>
  )
}

// 共通の接地影
function GroundShadow({ cx, cy, rx, ry }: { cx: number; cy: number; rx: number; ry: number }) {
  return <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill="url(#gShadow)" />
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

function Tile({ col, row }: { col: number; row: number }) {
  const { cx, cy } = iso(col, row)
  const seed = col * 7 + row * 13
  // 市松状に明暗を付けて立体感（色は gTile グラデーションをベースにわずかに変化）
  const tint = (col + row) % 2 === 0 ? 0.06 : 0
  const top    = `${cx},${cy}`
  const right  = `${cx + TILE_W / 2},${cy + TILE_H / 2}`
  const bottom = `${cx},${cy + TILE_H}`
  const left   = `${cx - TILE_W / 2},${cy + TILE_H / 2}`
  // 芝の小さな束（一部のタイルのみ・軽量）
  const tuft = seed % 3 === 0
  const tx = cx + ((seed % 5) - 2) * 6
  const ty = cy + TILE_H / 2 + ((seed % 3) - 1) * 3
  return (
    <g>
      <polygon points={`${top} ${right} ${bottom} ${left}`} fill="url(#gTile)" />
      {tint > 0 && <polygon points={`${top} ${right} ${bottom} ${left}`} fill="rgba(20,80,30,0.07)" />}
      {/* 左上辺のハイライトで稜線を強調 */}
      <line x1={cx} y1={cy} x2={cx - TILE_W / 2} y2={cy + TILE_H / 2} stroke="rgba(255,255,255,0.20)" strokeWidth={1} />
      <line x1={cx} y1={cy} x2={cx + TILE_W / 2} y2={cy + TILE_H / 2} stroke="rgba(255,255,255,0.10)" strokeWidth={1} />
      {tuft && (
        <g stroke="#3f9a4c" strokeWidth={1.1} strokeLinecap="round" opacity={0.55}>
          <line x1={tx} y1={ty} x2={tx - 2} y2={ty - 4} />
          <line x1={tx} y1={ty} x2={tx} y2={ty - 5} />
          <line x1={tx} y1={ty} x2={tx + 2} y2={ty - 4} />
        </g>
      )}
    </g>
  )
}

// ---- Healthy items ---------------------------------------------------------

function Tree({ cx, cy, delay = "0s" }: { cx: number; cy: number; delay?: string }) {
  const ax = cx, ay = cy + TILE_H / 2
  return (
    <g style={{ animation: `treeSway 4s ease-in-out ${delay} infinite`, transformOrigin: `${ax}px ${ay}px` }}>
      <GroundShadow cx={ax + 4} cy={ay} rx={18} ry={6} />
      <rect x={ax - 3} y={ay - 22} width={6} height={23} rx={3} fill="url(#gTrunk)" />
      {/* 丸みのある葉の塊（重ねて立体的に） */}
      <ellipse cx={ax - 10} cy={ay - 32} rx={13} ry={12} fill="url(#gLeafA)" />
      <ellipse cx={ax + 10} cy={ay - 32} rx={13} ry={12} fill="url(#gLeafA)" />
      <ellipse cx={ax}      cy={ay - 30} rx={15} ry={13} fill="url(#gLeafA)" />
      <ellipse cx={ax}      cy={ay - 46} rx={14} ry={13} fill="url(#gLeafA)" />
      {/* ハイライト（左上） */}
      <ellipse cx={ax - 6}  cy={ay - 47} rx={6}   ry={5}   fill="rgba(255,255,255,0.26)" />
      <ellipse cx={ax - 12} cy={ay - 34} rx={4}   ry={3.5} fill="rgba(255,255,255,0.16)" />
    </g>
  )
}

function Bush({ cx, cy, delay = "0s" }: { cx: number; cy: number; delay?: string }) {
  const ax = cx, ay = cy + TILE_H / 2
  return (
    <g style={{ animation: `bushSway 5s ease-in-out ${delay} infinite`, transformOrigin: `${ax}px ${ay}px` }}>
      <GroundShadow cx={ax + 4} cy={ay} rx={18} ry={5.5} />
      <ellipse cx={ax - 9} cy={ay - 10} rx={12} ry={10} fill="url(#gBush)" />
      <ellipse cx={ax + 9} cy={ay - 10} rx={12} ry={10} fill="url(#gBush)" />
      <ellipse cx={ax}     cy={ay - 16} rx={14} ry={12} fill="url(#gBush)" />
      <ellipse cx={ax - 3} cy={ay - 19} rx={5}  ry={4}  fill="rgba(255,255,255,0.24)" />
      <ellipse cx={ax - 10} cy={ay - 12} rx={3.5} ry={3} fill="rgba(255,255,255,0.15)" />
    </g>
  )
}

function Flower({ cx, cy, delay = "0s" }: { cx: number; cy: number; delay?: string }) {
  const ax = cx, ay = cy + TILE_H / 2
  const petals = [0, 60, 120, 180, 240, 300].map(deg => {
    const rad = (deg * Math.PI) / 180
    return <ellipse key={deg} cx={ax + Math.cos(rad) * 7} cy={ay - 24 + Math.sin(rad) * 7} rx={5} ry={5} fill="url(#gPetal)" />
  })
  return (
    <g style={{ animation: `flowerSway 3s ease-in-out ${delay} infinite`, transformOrigin: `${ax}px ${ay}px` }}>
      <GroundShadow cx={ax + 2} cy={ay} rx={9} ry={3} />
      <path d={`M ${ax} ${ay} Q ${ax - 3} ${ay - 12} ${ax} ${ay - 18}`} stroke="#3f9a4c" strokeWidth={2.5} fill="none" strokeLinecap="round" />
      <ellipse cx={ax - 6} cy={ay - 13} rx={6} ry={2.5} fill="#2e8b46" transform={`rotate(-35 ${ax - 6} ${ay - 13})`} />
      {petals}
      <circle cx={ax} cy={ay - 24} r={5}   fill="#fde047" />
      <circle cx={ax - 1.5} cy={ay - 25.5} r={2} fill="#fff3b0" />
      <circle cx={ax} cy={ay - 24} r={2.4} fill="#f59e0b" />
    </g>
  )
}

// ---- Rare items ------------------------------------------------------------

function Cherry({ cx, cy, delay = "0s" }: { cx: number; cy: number; delay?: string }) {
  const ax = cx, ay = cy + TILE_H / 2
  return (
    <g style={{ animation: `treeSway 4.5s ease-in-out ${delay} infinite`, transformOrigin: `${ax}px ${ay}px` }}>
      <GroundShadow cx={ax + 5} cy={ay} rx={20} ry={6.5} />
      <rect x={ax - 3} y={ay - 22} width={6} height={23} rx={3} fill="url(#gTrunk)" />
      {/* 丸い花房（グラデーションで立体的に） */}
      <ellipse cx={ax - 13} cy={ay - 30} rx={13} ry={11} fill="url(#gBlossom)" />
      <ellipse cx={ax + 13} cy={ay - 30} rx={13} ry={11} fill="url(#gBlossom)" />
      <ellipse cx={ax}      cy={ay - 32} rx={16} ry={13} fill="url(#gBlossom)" />
      <ellipse cx={ax - 8}  cy={ay - 46} rx={11} ry={9}  fill="url(#gBlossom)" />
      <ellipse cx={ax + 8}  cy={ay - 46} rx={11} ry={9}  fill="url(#gBlossom)" />
      <ellipse cx={ax}      cy={ay - 54} rx={12} ry={10} fill="url(#gBlossom)" />
      {/* ハイライト・花弁の点 */}
      <circle cx={ax - 9} cy={ay - 48} r={2.6} fill="rgba(255,255,255,0.7)" />
      <circle cx={ax + 8} cy={ay - 30} r={2.2} fill="rgba(255,255,255,0.6)" />
      <circle cx={ax - 2} cy={ay - 56} r={2}   fill="rgba(255,255,255,0.6)" />
      <circle cx={ax - 13} cy={ay - 26} r={2}  fill="rgba(255,255,255,0.45)" />
    </g>
  )
}

function BigTree({ cx, cy, delay = "0s" }: { cx: number; cy: number; delay?: string }) {
  const ax = cx, ay = cy + TILE_H / 2
  return (
    <g style={{ animation: `bigTreeSway 6s ease-in-out ${delay} infinite`, transformOrigin: `${ax}px ${ay}px` }}>
      <GroundShadow cx={ax + 7} cy={ay} rx={25} ry={8} />
      {/* 太い幹 */}
      <rect x={ax - 5} y={ay - 30} width={10} height={31} rx={3.5} fill="url(#gTrunk)" />
      {/* 丸い葉の塊を積み上げた大きな樹冠 */}
      <ellipse cx={ax - 14} cy={ay - 40} rx={16} ry={14} fill="url(#gLeafB)" />
      <ellipse cx={ax + 14} cy={ay - 40} rx={16} ry={14} fill="url(#gLeafB)" />
      <ellipse cx={ax}      cy={ay - 44} rx={19} ry={16} fill="url(#gLeafB)" />
      <ellipse cx={ax - 8}  cy={ay - 60} rx={13} ry={12} fill="url(#gLeafB)" />
      <ellipse cx={ax + 8}  cy={ay - 60} rx={13} ry={12} fill="url(#gLeafB)" />
      <ellipse cx={ax}      cy={ay - 70} rx={13} ry={12} fill="url(#gLeafB)" />
      {/* ハイライト */}
      <ellipse cx={ax - 8}  cy={ay - 66} rx={6} ry={5} fill="rgba(255,255,255,0.22)" />
      <ellipse cx={ax - 15} cy={ay - 44} rx={5} ry={4} fill="rgba(255,255,255,0.14)" />
    </g>
  )
}

// ---- New rare items --------------------------------------------------------

function Bamboo({ cx, cy, delay = "0s" }: { cx: number; cy: number; delay?: string }) {
  const ax = cx, ay = cy + TILE_H / 2
  return (
    <g style={{ animation: `treeSway 5s ease-in-out ${delay} infinite`, transformOrigin: `${ax}px ${ay}px` }}>
      <GroundShadow cx={ax + 3} cy={ay} rx={9} ry={3} />
      {/* 円柱状の節（グラデーション） */}
      <rect x={ax - 3} y={ay - 20} width={6} height={20} rx={2} fill="url(#gBamboo)" />
      <rect x={ax - 3} y={ay - 40} width={6} height={20} rx={2} fill="url(#gBamboo)" />
      <rect x={ax - 3} y={ay - 60} width={6} height={20} rx={2} fill="url(#gBamboo)" />
      <rect x={ax - 4} y={ay - 22} width={8} height={3} rx={1} fill="#356e16" />
      <rect x={ax - 4} y={ay - 42} width={8} height={3} rx={1} fill="#356e16" />
      <rect x={ax - 4} y={ay - 62} width={8} height={3} rx={1} fill="#356e16" />
      {/* 縦ハイライト */}
      <rect x={ax - 1.5} y={ay - 60} width={1.6} height={59} rx={1} fill="rgba(255,255,255,0.28)" />
      {/* 笹の葉 */}
      <ellipse cx={ax - 14} cy={ay - 52} rx={13} ry={4} fill="#56b84e" transform={`rotate(-30 ${ax - 14} ${ay - 52})`} />
      <ellipse cx={ax + 14} cy={ay - 48} rx={13} ry={4} fill="#56b84e" transform={`rotate(30 ${ax + 14} ${ay - 48})`} />
      <ellipse cx={ax - 10} cy={ay - 64} rx={11} ry={3.5} fill="#6cca60" transform={`rotate(-20 ${ax - 10} ${ay - 64})`} />
      <ellipse cx={ax + 10} cy={ay - 61} rx={11} ry={3.5} fill="#6cca60" transform={`rotate(20 ${ax + 10} ${ay - 61})`} />
    </g>
  )
}

function Mushroom({ cx, cy, delay = "0s" }: { cx: number; cy: number; delay?: string }) {
  const ax = cx, ay = cy + TILE_H / 2
  return (
    <g style={{ animation: `flowerSway 4s ease-in-out ${delay} infinite`, transformOrigin: `${ax}px ${ay}px` }}>
      <GroundShadow cx={ax + 2} cy={ay} rx={12} ry={3.5} />
      {/* 柄（中央が明るい円柱） */}
      <rect x={ax - 6} y={ay - 17} width={12} height={11} rx={4} fill="#efe7d6" />
      <rect x={ax - 6} y={ay - 17} width={4.5} height={11} rx={2} fill="#fbf6ec" />
      {/* 傘（ドーム + 前面の縁） */}
      <ellipse cx={ax} cy={ay - 23} rx={18} ry={12} fill="url(#gCap)" />
      <ellipse cx={ax} cy={ay - 16} rx={18} ry={4.5} fill="#a82828" />
      {/* 斑点・ハイライト */}
      <ellipse cx={ax - 7} cy={ay - 28} rx={5} ry={3.5} fill="rgba(255,255,255,0.55)" />
      <circle cx={ax - 5} cy={ay - 27} r={3} fill="rgba(255,255,255,0.9)" />
      <circle cx={ax + 7} cy={ay - 27} r={2.6} fill="rgba(255,255,255,0.85)" />
      <circle cx={ax + 1} cy={ay - 21} r={2.1} fill="rgba(255,255,255,0.78)" />
      <circle cx={ax - 12} cy={ay - 21} r={1.8} fill="rgba(255,255,255,0.7)" />
      <circle cx={ax + 12} cy={ay - 22} r={1.8} fill="rgba(255,255,255,0.7)" />
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

function WiltedBamboo({ cx, cy }: { cx: number; cy: number }) {
  const ax = cx, ay = cy + TILE_H / 2
  return (
    <g opacity={0.58}>
      <ellipse cx={ax + 3} cy={ay - 1} rx={6} ry={2} fill="rgba(0,0,0,0.05)" />
      <rect x={ax - 3} y={ay - 20} width={6} height={20} rx={2} fill="#8a8a40" />
      <rect x={ax - 3} y={ay - 40} width={6} height={20} rx={2} fill="#7a7a38" />
      <rect x={ax - 3} y={ay - 60} width={6} height={20} rx={2} fill="#8a8a40" />
      <rect x={ax - 4} y={ay - 22} width={8} height={3} rx={1} fill="#6a6a30" />
      <rect x={ax - 4} y={ay - 42} width={8} height={3} rx={1} fill="#6a6a30" />
      <ellipse cx={ax - 12} cy={ay - 51} rx={11} ry={3.5} fill="#9a9a48" transform={`rotate(-30 ${ax - 12} ${ay - 51})`} />
      <ellipse cx={ax + 12} cy={ay - 48} rx={11} ry={3.5} fill="#9a9a48" transform={`rotate(30 ${ax + 12} ${ay - 48})`} />
    </g>
  )
}

function WiltedMushroom({ cx, cy }: { cx: number; cy: number }) {
  const ax = cx, ay = cy + TILE_H / 2
  return (
    <g opacity={0.58}>
      <ellipse cx={ax + 2} cy={ay - 1} rx={9} ry={3} fill="rgba(0,0,0,0.05)" />
      <ellipse cx={ax} cy={ay - 10} rx={6} ry={4} fill="#d4c8b8" />
      <rect x={ax - 5} y={ay - 17} width={10} height={9} rx={3} fill="#ccc0b0" />
      <ellipse cx={ax} cy={ay - 24} rx={15} ry={9} fill="#b07070" />
      <ellipse cx={ax} cy={ay - 22} rx={15} ry={10} fill="#a06060" />
      <circle cx={ax - 5} cy={ay - 26} r={2.5} fill="rgba(220,200,190,0.7)" />
      <circle cx={ax + 6} cy={ay - 25} r={2} fill="rgba(220,200,190,0.7)" />
      <ellipse cx={ax} cy={ay - 16} rx={15} ry={3} fill="#906050" />
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

// ---- Seasonal overlay -------------------------------------------------------

type Season = "spring" | "may" | "rainy" | "summer" | "september" | "autumn" | "winter"

function getSeason(): Season {
  const m = new Date().getMonth() // 0-indexed
  if (m === 2 || m === 3) return "spring"   // 3-4月: 春（桜）
  if (m === 4)            return "may"      // 5月:   演出なし
  if (m === 5)            return "rainy"    // 6月:   梅雨
  if (m === 6 || m === 7) return "summer"   // 7-8月: 夏（蛍）
  if (m === 8)            return "september"// 9月:   秋雨
  if (m === 9 || m === 10) return "autumn"  // 10-11月: 秋（紅葉）
  return "winter"                           // 12-2月: 冬（雪）
}

const SPRING_PETALS = [
  { x: -180, y: -80,  r: 5, dur: "6s",   delay: "0s",   fill: "#fbb6ce" },
  { x: -80,  y: -110, r: 4, dur: "7s",   delay: "1.5s", fill: "#f9a8d4" },
  { x: 50,   y: -100, r: 5, dur: "8s",   delay: "3s",   fill: "#fbcfe8" },
  { x: 180,  y: -70,  r: 4, dur: "6.5s", delay: "4.5s", fill: "#fbb6ce" },
  { x: -220, y: 40,   r: 5, dur: "7.5s", delay: "0.7s", fill: "#f9a8d4" },
  { x: 120,  y: 20,   r: 4, dur: "8.5s", delay: "2.2s", fill: "#fbb6ce" },
  { x: -100, y: 150,  r: 5, dur: "7s",   delay: "5s",   fill: "#fbcfe8" },
  { x: 220,  y: 130,  r: 4, dur: "6s",   delay: "3.8s", fill: "#fbb6ce" },
  { x: 0,    y: -60,  r: 5, dur: "8s",   delay: "1.8s", fill: "#f9a8d4" },
  { x: -150, y: 220,  r: 4, dur: "7.5s", delay: "4s",   fill: "#fbb6ce" },
]
const FIREFLIES = [
  { x: -120, y: -50,  dur: "2.5s", delay: "0s" },
  { x: 80,   y: -70,  dur: "3s",   delay: "1s" },
  { x: 200,  y: -30,  dur: "2.8s", delay: "2s" },
  { x: -200, y: 100,  dur: "3.5s", delay: "0.5s" },
  { x: 140,  y: 180,  dur: "2.5s", delay: "1.8s" },
  { x: -50,  y: 80,   dur: "3s",   delay: "3s" },
  { x: 50,   y: 240,  dur: "2.8s", delay: "0.8s" },
  { x: -160, y: 200,  dur: "3.2s", delay: "2.3s" },
]
const AUTUMN_LEAVES = [
  { x: -160, y: -90,  dur: "7s",   delay: "0s",   fill: "#f97316" },
  { x: 0,    y: -120, dur: "8s",   delay: "1.5s", fill: "#dc2626" },
  { x: 140,  y: -80,  dur: "7.5s", delay: "3s",   fill: "#b45309" },
  { x: -240, y: 30,   dur: "6.5s", delay: "4.5s", fill: "#f97316" },
  { x: 200,  y: 50,   dur: "8.5s", delay: "0.7s", fill: "#dc2626" },
  { x: -80,  y: 200,  dur: "7s",   delay: "2.2s", fill: "#b45309" },
  { x: 160,  y: 220,  dur: "8s",   delay: "5s",   fill: "#f97316" },
  { x: -20,  y: 280,  dur: "6.5s", delay: "3.8s", fill: "#dc2626" },
  { x: 80,   y: 130,  dur: "7.5s", delay: "1.8s", fill: "#b45309" },
  { x: -180, y: 300,  dur: "7s",   delay: "4s",   fill: "#f97316" },
]
const DANDELION_SEEDS = [
  { x: -200, y: 200,  dur: "7s",   delay: "0s"   },
  { x: -120, y: 260,  dur: "8s",   delay: "1.2s" },
  { x: -50,  y: 180,  dur: "7.5s", delay: "2.5s" },
  { x: 30,   y: 300,  dur: "8.5s", delay: "0.4s" },
  { x: 110,  y: 220,  dur: "7s",   delay: "1.8s" },
  { x: 190,  y: 280,  dur: "8s",   delay: "3.2s" },
  { x: -170, y: 310,  dur: "7.5s", delay: "0.8s" },
  { x: 60,   y: 160,  dur: "8.5s", delay: "2.0s" },
  { x: 150,  y: 140,  dur: "7s",   delay: "3.8s" },
  { x: -80,  y: 130,  dur: "8s",   delay: "1.5s" },
]
const RAINY_DROPS = [
  { x: -220, dur: "1.4s", delay: "0s"   },
  { x: -160, dur: "1.6s", delay: "0.3s" },
  { x: -100, dur: "1.5s", delay: "0.8s" },
  { x: -40,  dur: "1.3s", delay: "0.1s" },
  { x: 20,   dur: "1.6s", delay: "0.5s" },
  { x: 80,   dur: "1.4s", delay: "1.0s" },
  { x: 140,  dur: "1.5s", delay: "0.2s" },
  { x: 200,  dur: "1.3s", delay: "0.7s" },
  { x: -180, dur: "1.6s", delay: "1.2s" },
  { x: -60,  dur: "1.4s", delay: "0.4s" },
  { x: 50,   dur: "1.5s", delay: "0.9s" },
  { x: 170,  dur: "1.3s", delay: "0.6s" },
]
const SEPTEMBER_DROPS = [
  { x: -200, dur: "2.2s", delay: "0s"   },
  { x: -110, dur: "2.4s", delay: "0.6s" },
  { x: -30,  dur: "2.3s", delay: "1.3s" },
  { x: 60,   dur: "2.2s", delay: "0.3s" },
  { x: 150,  dur: "2.5s", delay: "0.9s" },
  { x: 230,  dur: "2.3s", delay: "1.6s" },
  { x: -160, dur: "2.4s", delay: "1.1s" },
  { x: 100,  dur: "2.2s", delay: "0.5s" },
]
const SNOWFLAKES = [
  { x: -200, y: -100, dur: "8s",   delay: "0s" },
  { x: -80,  y: -120, dur: "9s",   delay: "1.5s" },
  { x: 60,   y: -110, dur: "8.5s", delay: "3s" },
  { x: 200,  y: -90,  dur: "9.5s", delay: "4.5s" },
  { x: -240, y: 60,   dur: "8s",   delay: "0.7s" },
  { x: 140,  y: 80,   dur: "9s",   delay: "2.2s" },
  { x: -120, y: 200,  dur: "8.5s", delay: "5s" },
  { x: 240,  y: 180,  dur: "9s",   delay: "3.8s" },
  { x: 0,    y: 300,  dur: "8s",   delay: "1.8s" },
  { x: -160, y: 320,  dur: "9.5s", delay: "4s" },
]

function SeasonalOverlay({ season }: { season: Season }) {
  if (season === "spring") {
    return <>
      {SPRING_PETALS.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r={p.r} fill={p.fill} opacity={0}
          style={{ animation: `petalDrift ${p.dur} ease-in-out ${p.delay} infinite` }} />
      ))}
    </>
  }
  if (season === "may") {
    return <>
      {DANDELION_SEEDS.map((d, i) => (
        <g key={i} opacity={0} style={{ animation: `dandelionFloat ${d.dur} ease-in-out ${d.delay} infinite` }}>
          <circle cx={d.x} cy={d.y} r={2.5} fill="rgba(255,255,255,0.9)" />
          <line x1={d.x} y1={d.y} x2={d.x}     y2={d.y + 6} stroke="rgba(200,200,180,0.7)" strokeWidth={0.8} />
          <line x1={d.x} y1={d.y} x2={d.x - 4} y2={d.y + 4} stroke="rgba(200,200,180,0.6)" strokeWidth={0.7} />
          <line x1={d.x} y1={d.y} x2={d.x + 4} y2={d.y + 4} stroke="rgba(200,200,180,0.6)" strokeWidth={0.7} />
        </g>
      ))}
    </>
  }
  if (season === "rainy") {
    return <>
      {RAINY_DROPS.map((d, i) => (
        <line key={i} x1={d.x} y1={-130} x2={d.x + 3} y2={-116}
          stroke="rgba(120,160,210,0.65)" strokeWidth={1.5} opacity={0}
          style={{ animation: `rainDrop ${d.dur} linear ${d.delay} infinite` }} />
      ))}
    </>
  }
  if (season === "summer") {
    return <>
      {FIREFLIES.map((f, i) => (
        <g key={i}>
          <circle cx={f.x} cy={f.y} r={3} fill="#fef08a"
            style={{ animation: `fireflyGlow ${f.dur} ease-in-out ${f.delay} infinite` }} />
          <circle cx={f.x} cy={f.y} r={7} fill="rgba(254,240,138,0.18)"
            style={{ animation: `fireflyGlow ${f.dur} ease-in-out ${f.delay} infinite` }} />
        </g>
      ))}
    </>
  }
  if (season === "september") {
    return <>
      {SEPTEMBER_DROPS.map((d, i) => (
        <line key={i} x1={d.x} y1={-130} x2={d.x + 1} y2={-122}
          stroke="rgba(150,180,215,0.45)" strokeWidth={1} opacity={0}
          style={{ animation: `rainDropLight ${d.dur} linear ${d.delay} infinite` }} />
      ))}
    </>
  }
  if (season === "autumn") {
    return <>
      {AUTUMN_LEAVES.map((l, i) => (
        <ellipse key={i} cx={l.x} cy={l.y} rx={7} ry={3.5} fill={l.fill} opacity={0}
          style={{ animation: `leafFall ${l.dur} ease-in-out ${l.delay} infinite` }} />
      ))}
    </>
  }
  return <>
    {SNOWFLAKES.map((s, i) => (
      <circle key={i} cx={s.x} cy={s.y} r={3} fill="white"
        stroke="rgba(200,220,255,0.5)" strokeWidth={0.5} opacity={0}
        style={{ animation: `snowFall ${s.dur} linear ${s.delay} infinite` }} />
    ))}
  </>
}

// ---- Main canvas -----------------------------------------------------------

type Item = { x: number; y: number; itemType: GardenItemType; withered: boolean }

export default function GardenCanvas({ items, milestone }: { items: Item[]; milestone?: number }) {
  const [showSparkle, setShowSparkle] = useState(!!milestone)
  useEffect(() => {
    if (milestone) {
      setShowSparkle(true)
      const t = setTimeout(() => setShowSparkle(false), 4000)
      return () => clearTimeout(t)
    }
  }, [milestone])

  const season = getSeason()
  const itemMap = new Map(items.map((item) => [`${item.x},${item.y}`, item]))

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
          @keyframes petalDrift {
            0%   { opacity: 0;    transform: translate(0, -20px) rotate(0deg); }
            15%  { opacity: 0.75; }
            85%  { opacity: 0.6; }
            100% { opacity: 0;    transform: translate(25px, 70px) rotate(30deg); }
          }
          @keyframes fireflyGlow {
            0%, 100% { opacity: 0.12; transform: scale(0.8); }
            50%       { opacity: 0.9;  transform: scale(1.2); }
          }
          @keyframes leafFall {
            0%   { opacity: 0;    transform: translate(0, -30px) rotate(0deg); }
            15%  { opacity: 0.8; }
            85%  { opacity: 0.65; }
            100% { opacity: 0;    transform: translate(15px, 90px) rotate(200deg); }
          }
          @keyframes snowFall {
            0%   { opacity: 0;    transform: translateY(-40px); }
            15%  { opacity: 0.85; }
            85%  { opacity: 0.75; }
            100% { opacity: 0;    transform: translateY(120px); }
          }
          @keyframes dandelionFloat {
            0%   { opacity: 0;    transform: translate(0, 0); }
            10%  { opacity: 0.85; }
            85%  { opacity: 0.7; }
            100% { opacity: 0;    transform: translate(20px, -180px); }
          }
          @keyframes rainDrop {
            0%   { opacity: 0;    transform: translateY(0); }
            8%   { opacity: 0.7; }
            90%  { opacity: 0.7; }
            100% { opacity: 0;    transform: translateY(460px); }
          }
          @keyframes rainDropLight {
            0%   { opacity: 0;    transform: translateY(0); }
            8%   { opacity: 0.5; }
            90%  { opacity: 0.5; }
            100% { opacity: 0;    transform: translateY(460px); }
          }
          @keyframes sparkleIn {
            0%   { opacity: 0; transform: scale(0) rotate(0deg); }
            40%  { opacity: 1; transform: scale(1.3) rotate(180deg); }
            100% { opacity: 0; transform: scale(1) rotate(360deg); }
          }
          @keyframes sparkleText {
            0%   { opacity: 0; transform: translateY(10px); }
            30%  { opacity: 1; transform: translateY(-5px); }
            70%  { opacity: 1; transform: translateY(-5px); }
            100% { opacity: 0; transform: translateY(-20px); }
          }
        `}</style>
        <GardenDefs />
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
          if (itemType === "bamboo")   return withered ? <WiltedBamboo  key={`i-${col}-${row}`} cx={cx} cy={cy} /> : <Bamboo  key={`i-${col}-${row}`} cx={cx} cy={cy} delay={delay} />
          if (itemType === "mushroom") return withered ? <WiltedMushroom key={`i-${col}-${row}`} cx={cx} cy={cy} /> : <Mushroom key={`i-${col}-${row}`} cx={cx} cy={cy} delay={delay} />
          return                              withered ? <WiltedFlower  key={`i-${col}-${row}`} cx={cx} cy={cy} /> : <Flower  key={`i-${col}-${row}`} cx={cx} cy={cy} delay={delay} />
        })}
        <SeasonalOverlay season={season} />
        {showSparkle && milestone && (
          <g>
            {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => {
              const rad = (angle * Math.PI) / 180
              return (
                <line
                  key={i}
                  x1={Math.cos(rad) * 15}
                  y1={Math.sin(rad) * 15 - 50}
                  x2={Math.cos(rad) * 55}
                  y2={Math.sin(rad) * 55 - 50}
                  stroke="#fbbf24"
                  strokeWidth={4}
                  strokeLinecap="round"
                  opacity={0}
                  style={{ animation: `sparkleIn 1.2s ease-out ${i * 0.06}s forwards` }}
                />
              )
            })}
            <circle cx={0} cy={-50} r={12} fill="#fde68a" opacity={0}
              style={{ animation: "sparkleIn 0.8s ease-out forwards" }} />
            <text x={0} y={-115} textAnchor="middle" fontSize={14} fontWeight="bold" fill="#d97706" opacity={0}
              style={{ animation: "sparkleText 2.5s ease-out 0.3s forwards" }}>
              {milestone}個達成！
            </text>
          </g>
        )}
      </svg>
    </div>
  )
}
