"use client"

import type { GardenItemType } from "@/lib/garden/utils"
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

// ---- Palette ---------------------------------------------------------------
// フラットシェーディング（セルシェード）。グラデーションは使わず、
// ベース／陰／ハイライトの段階的なベタ塗りで自然な立体感を出す。

// アプリのブランドカラー（primary = oklch(0.50 0.115 147) の渋い緑）に合わせ、
// hue 147 を基調にしたトーン・オン・トーンで統一。彩度・影を抑えてモダンに。
const SHADOW = "rgba(0,0,0,0.07)"

const LEAF = "oklch(0.64 0.145 147)"
const LEAF_HI = "oklch(0.74 0.15 147)"
const LEAF_SH = "oklch(0.53 0.12 147)"
const TRUNK = "oklch(0.58 0.062 70)"
const TRUNK_SH = "oklch(0.47 0.056 68)"
const BLOSSOM = "oklch(0.83 0.075 350)"
const BLOSSOM_HI = "oklch(0.89 0.055 350)"
const BLOSSOM_SH = "oklch(0.75 0.085 350)"
const PETAL = "oklch(0.83 0.075 350)"
const PETAL_SH = "oklch(0.75 0.085 350)"
const CENTER = "oklch(0.84 0.135 85)"
const CENTER_SH = "oklch(0.76 0.13 82)"
const STEM = "oklch(0.57 0.125 147)"
const BAMBOO = "oklch(0.71 0.145 140)"
const BAMBOO_SH = "oklch(0.59 0.12 140)"
const BAMBOO_NODE = "oklch(0.49 0.10 140)"
const SASA = "oklch(0.68 0.135 143)"
const SASA_SH = "oklch(0.58 0.115 143)"
const CAP = "oklch(0.65 0.16 22)"
const CAP_FRONT = "oklch(0.57 0.15 22)"
const MSTEM = "oklch(0.96 0.012 90)"
const MSTEM_SH = "oklch(0.89 0.014 90)"

const TILE_TOP = "oklch(0.75 0.12 147)"
const TILE_DARK = "oklch(0.71 0.12 147)"
const SOIL_R = "oklch(0.61 0.062 68)"
const SOIL_L = "oklch(0.52 0.058 66)"
const SOIL_EDGE = "oklch(0.45 0.05 66)"

// 枯れ色（くすんだ黄土系・hue 95 で緑と区別）
const W_LEAF = "oklch(0.74 0.09 95)"
const W_LEAF_HI = "oklch(0.82 0.085 95)"
const W_LEAF_SH = "oklch(0.64 0.08 92)"
const W_TRUNK = "oklch(0.53 0.05 70)"
const W_TRUNK_SH = "oklch(0.43 0.045 68)"
const W_BLOSSOM = "oklch(0.79 0.045 75)"
const W_BLOSSOM_SH = "oklch(0.70 0.045 72)"
const W_BAMBOO = "oklch(0.70 0.075 110)"
const W_BAMBOO_SH = "oklch(0.59 0.065 108)"
const W_CAP = "oklch(0.64 0.06 25)"
const W_MSTEM = "oklch(0.88 0.02 88)"

// ---- Shared helpers --------------------------------------------------------

// 接地影（やわらかいベタ楕円）
function GroundShadow({ cx, cy, rx, ry }: { cx: number; cy: number; rx: number; ry: number }) {
  return <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill={SHADOW} />
}

type Blob = [x: number, y: number, rx: number, ry: number]

// 重なる葉の塊をセルシェードで描く。
// 先に陰色を少し下にずらして敷き、上にベース色を重ねると、
// 下側に陰がはみ出て自然な立体感が出る（輪郭線・グラデは使わない）。
function ShadedBlobs({ blobs, base, shade }: { blobs: Blob[]; base: string; shade: string }) {
  return (
    <>
      {blobs.map(([x, y, rx, ry], i) => (
        <ellipse key={`s${i}`} cx={x} cy={y + 3} rx={rx} ry={ry} fill={shade} />
      ))}
      {blobs.map(([x, y, rx, ry], i) => (
        <ellipse key={`b${i}`} cx={x} cy={y - 1} rx={rx} ry={ry} fill={base} />
      ))}
    </>
  )
}

// 円柱風の幹（左がベース・右が陰の2トーン）
function Trunk({ x, y, w, h, base, shade }: { x: number; y: number; w: number; h: number; base: string; shade: string }) {
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx={w / 2.5} fill={base} />
      <rect x={x + w * 0.55} y={y} width={w * 0.45} height={h} rx={w / 3} fill={shade} />
    </g>
  )
}

// ---- Platform --------------------------------------------------------------

function Platform() {
  const bx = 0,    by = 256
  const rx = 256,  ry = 128
  const lx = -256, ly = 128
  return (
    <g>
      <polygon points={`${rx},${ry} ${bx},${by} ${bx},${by + DEPTH} ${rx},${ry + DEPTH}`} fill={SOIL_R} />
      <polygon points={`${lx},${ly} ${bx},${by} ${bx},${by + DEPTH} ${lx},${ly + DEPTH}`} fill={SOIL_L} />
      <line x1={lx} y1={ly + DEPTH} x2={bx} y2={by + DEPTH} stroke={SOIL_EDGE} strokeWidth={1.5} />
      <line x1={rx} y1={ry + DEPTH} x2={bx} y2={by + DEPTH} stroke={SOIL_EDGE} strokeWidth={1.5} />
    </g>
  )
}

// ---- Tiles -----------------------------------------------------------------

function Tile({ col, row }: { col: number; row: number }) {
  const { cx, cy } = iso(col, row)
  const seed = col * 7 + row * 13
  const top    = `${cx},${cy}`
  const right  = `${cx + TILE_W / 2},${cy + TILE_H / 2}`
  const bottom = `${cx},${cy + TILE_H}`
  const left   = `${cx - TILE_W / 2},${cy + TILE_H / 2}`
  // 市松状にわずかな明暗を付けて芝のムラを表現
  const dark = (col + row) % 2 === 0
  // 芝の小さな束（一部のタイルのみ）
  const tuft = seed % 3 === 0
  const tx = cx + ((seed % 5) - 2) * 6
  const ty = cy + TILE_H / 2 + ((seed % 3) - 1) * 3
  return (
    <g>
      <polygon points={`${top} ${right} ${bottom} ${left}`} fill={TILE_TOP} />
      {dark && <polygon points={`${top} ${right} ${bottom} ${left}`} fill={TILE_DARK} />}
      {tuft && (
        <g stroke={LEAF_SH} strokeWidth={1.3} strokeLinecap="round" opacity={0.55}>
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
      <GroundShadow cx={ax + 4} cy={ay} rx={17} ry={5} />
      <Trunk x={ax - 3.5} y={ay - 22} w={7} h={24} base={TRUNK} shade={TRUNK_SH} />
      <ShadedBlobs
        blobs={[
          [ax,      ay - 36, 17, 15],
          [ax - 11, ay - 31, 11, 10],
          [ax + 11, ay - 31, 11, 10],
          [ax - 1,  ay - 50, 12, 11],
        ]}
        base={LEAF} shade={LEAF_SH}
      />
      <ellipse cx={ax - 4} cy={ay - 46} rx={9} ry={7.5} fill={LEAF_HI} opacity={0.7} />
    </g>
  )
}

function Bush({ cx, cy, delay = "0s" }: { cx: number; cy: number; delay?: string }) {
  const ax = cx, ay = cy + TILE_H / 2
  return (
    <g style={{ animation: `bushSway 5s ease-in-out ${delay} infinite`, transformOrigin: `${ax}px ${ay}px` }}>
      <GroundShadow cx={ax + 4} cy={ay} rx={17} ry={5} />
      <ShadedBlobs
        blobs={[
          [ax,      ay - 14, 16, 13],
          [ax - 10, ay - 9,  11, 9],
          [ax + 10, ay - 9,  11, 9],
        ]}
        base={LEAF} shade={LEAF_SH}
      />
      <ellipse cx={ax - 4} cy={ay - 17} rx={7} ry={5.5} fill={LEAF_HI} opacity={0.65} />
    </g>
  )
}

function Flower({ cx, cy, delay = "0s" }: { cx: number; cy: number; delay?: string }) {
  const ax = cx, ay = cy + TILE_H / 2
  const positions = [0, 60, 120, 180, 240, 300].map(deg => {
    const rad = (deg * Math.PI) / 180
    return { px: ax + Math.cos(rad) * 7, py: ay - 24 + Math.sin(rad) * 7 }
  })
  return (
    <g style={{ animation: `flowerSway 3s ease-in-out ${delay} infinite`, transformOrigin: `${ax}px ${ay}px` }}>
      <GroundShadow cx={ax + 2} cy={ay} rx={9} ry={3} />
      <path d={`M ${ax} ${ay} Q ${ax - 3} ${ay - 12} ${ax} ${ay - 18}`} stroke={STEM} strokeWidth={2.5} fill="none" strokeLinecap="round" />
      <ellipse cx={ax - 6} cy={ay - 13} rx={6} ry={2.6} fill={STEM} transform={`rotate(-35 ${ax - 6} ${ay - 13})`} />
      {positions.map(({ px, py }, i) => <circle key={`s${i}`} cx={px} cy={py + 1.5} r={5} fill={PETAL_SH} />)}
      {positions.map(({ px, py }, i) => <circle key={`p${i}`} cx={px} cy={py} r={5} fill={PETAL} />)}
      <circle cx={ax} cy={ay - 23.5} r={4.5} fill={CENTER} />
      <path d={`M ${ax - 4.5} ${ay - 22} A 4.5 4.5 0 0 0 ${ax + 4.5} ${ay - 22} Z`} fill={CENTER_SH} />
    </g>
  )
}

// ---- Rare items ------------------------------------------------------------

function Cherry({ cx, cy, delay = "0s" }: { cx: number; cy: number; delay?: string }) {
  const ax = cx, ay = cy + TILE_H / 2
  return (
    <g style={{ animation: `treeSway 4.5s ease-in-out ${delay} infinite`, transformOrigin: `${ax}px ${ay}px` }}>
      <GroundShadow cx={ax + 5} cy={ay} rx={19} ry={6} />
      <Trunk x={ax - 3.5} y={ay - 22} w={7} h={24} base={TRUNK} shade={TRUNK_SH} />
      <ShadedBlobs
        blobs={[
          [ax,      ay - 34, 18, 14],
          [ax - 13, ay - 29, 12, 10],
          [ax + 13, ay - 29, 12, 10],
          [ax - 1,  ay - 50, 13, 11],
        ]}
        base={BLOSSOM} shade={BLOSSOM_SH}
      />
      <ellipse cx={ax - 5} cy={ay - 46} rx={8} ry={6.5} fill={BLOSSOM_HI} opacity={0.8} />
    </g>
  )
}

function BigTree({ cx, cy, delay = "0s" }: { cx: number; cy: number; delay?: string }) {
  const ax = cx, ay = cy + TILE_H / 2
  return (
    <g style={{ animation: `bigTreeSway 6s ease-in-out ${delay} infinite`, transformOrigin: `${ax}px ${ay}px` }}>
      <GroundShadow cx={ax + 7} cy={ay} rx={24} ry={7} />
      <Trunk x={ax - 5} y={ay - 30} w={10} h={32} base={TRUNK} shade={TRUNK_SH} />
      <ShadedBlobs
        blobs={[
          [ax,      ay - 46, 21, 18],
          [ax - 15, ay - 40, 14, 13],
          [ax + 15, ay - 40, 14, 13],
          [ax - 1,  ay - 66, 15, 14],
        ]}
        base={LEAF} shade={LEAF_SH}
      />
      <ellipse cx={ax - 6} cy={ay - 62} rx={10} ry={8.5} fill={LEAF_HI} opacity={0.7} />
    </g>
  )
}

// ---- New rare items --------------------------------------------------------

function Bamboo({ cx, cy, delay = "0s" }: { cx: number; cy: number; delay?: string }) {
  const ax = cx, ay = cy + TILE_H / 2
  return (
    <g style={{ animation: `treeSway 5s ease-in-out ${delay} infinite`, transformOrigin: `${ax}px ${ay}px` }}>
      <GroundShadow cx={ax + 3} cy={ay} rx={9} ry={3} />
      {/* 笹の葉（後ろ） */}
      <ellipse cx={ax - 14} cy={ay - 52} rx={13} ry={4} fill={SASA} transform={`rotate(-30 ${ax - 14} ${ay - 52})`} />
      <ellipse cx={ax + 14} cy={ay - 48} rx={13} ry={4} fill={SASA_SH} transform={`rotate(30 ${ax + 14} ${ay - 48})`} />
      <ellipse cx={ax - 10} cy={ay - 64} rx={11} ry={3.5} fill={SASA} transform={`rotate(-20 ${ax - 10} ${ay - 64})`} />
      <ellipse cx={ax + 10} cy={ay - 61} rx={11} ry={3.5} fill={SASA_SH} transform={`rotate(20 ${ax + 10} ${ay - 61})`} />
      {/* 稈（左ベース・右陰） */}
      <rect x={ax - 3.5} y={ay - 60} width={7} height={60} rx={3} fill={BAMBOO} />
      <rect x={ax + 0.5} y={ay - 60} width={3} height={60} rx={1.5} fill={BAMBOO_SH} />
      {/* 節 */}
      <line x1={ax - 4} y1={ay - 22} x2={ax + 4} y2={ay - 22} stroke={BAMBOO_NODE} strokeWidth={3} strokeLinecap="round" />
      <line x1={ax - 4} y1={ay - 42} x2={ax + 4} y2={ay - 42} stroke={BAMBOO_NODE} strokeWidth={3} strokeLinecap="round" />
    </g>
  )
}

function Mushroom({ cx, cy, delay = "0s" }: { cx: number; cy: number; delay?: string }) {
  const ax = cx, ay = cy + TILE_H / 2
  return (
    <g style={{ animation: `flowerSway 4s ease-in-out ${delay} infinite`, transformOrigin: `${ax}px ${ay}px` }}>
      <GroundShadow cx={ax + 2} cy={ay} rx={12} ry={3.5} />
      {/* 柄（左ベース・右陰） */}
      <rect x={ax - 6} y={ay - 17} width={12} height={12} rx={5} fill={MSTEM} />
      <rect x={ax + 1} y={ay - 17} width={5} height={12} rx={2.5} fill={MSTEM_SH} />
      {/* 傘（上面ベース＋前面の陰） */}
      <ellipse cx={ax} cy={ay - 23} rx={18} ry={12} fill={CAP} />
      <path d={`M ${ax - 18} ${ay - 22} A 18 12 0 0 0 ${ax + 18} ${ay - 22} Z`} fill={CAP_FRONT} />
      {/* 斑点・ハイライト */}
      <ellipse cx={ax - 6} cy={ay - 28} rx={4.5} ry={3} fill="rgba(255,255,255,0.3)" />
      <circle cx={ax - 6} cy={ay - 27} r={3} fill="#fff" />
      <circle cx={ax + 7} cy={ay - 25} r={2.4} fill="#fff" />
      <circle cx={ax + 1} cy={ay - 20} r={2} fill="#fff" />
      <circle cx={ax - 11} cy={ay - 21} r={1.8} fill="#fff" />
    </g>
  )
}

// ---- Wilted items ----------------------------------------------------------
// 枯れ色: 乾いた黄茶色で通常の緑と明確に区別する

function WiltedTree({ cx, cy }: { cx: number; cy: number }) {
  const ax = cx, ay = cy + TILE_H / 2
  return (
    <g opacity={0.62}>
      <GroundShadow cx={ax + 4} cy={ay} rx={14} ry={4} />
      <Trunk x={ax - 3.5} y={ay - 18} w={7} h={18} base={W_TRUNK} shade={W_TRUNK_SH} />
      <ShadedBlobs
        blobs={[
          [ax - 9, ay - 30, 11, 9],
          [ax + 9, ay - 30, 11, 9],
          [ax,     ay - 34, 12, 10],
          [ax,     ay - 46, 9,  8],
        ]}
        base={W_LEAF} shade={W_LEAF_SH}
      />
      <ellipse cx={ax - 5} cy={ay - 47} rx={4} ry={3} fill={W_LEAF_HI} opacity={0.7} />
    </g>
  )
}

function WiltedBush({ cx, cy }: { cx: number; cy: number }) {
  const ax = cx, ay = cy + TILE_H / 2
  return (
    <g opacity={0.62}>
      <GroundShadow cx={ax + 3} cy={ay} rx={13} ry={4} />
      <ShadedBlobs
        blobs={[
          [ax - 7, ay - 8,  9,  7],
          [ax + 7, ay - 8,  9,  7],
          [ax,     ay - 13, 11, 8],
        ]}
        base={W_LEAF} shade={W_LEAF_SH}
      />
    </g>
  )
}

function WiltedFlower({ cx, cy }: { cx: number; cy: number }) {
  const ax = cx, ay = cy + TILE_H / 2
  // 茎がしなだれて頭が傾いた枯れ花
  const hx = ax + 9, hy = ay - 11
  const petals = [0, 60, 120, 180, 240, 300].map(deg => {
    const rad = (deg * Math.PI) / 180
    return <circle key={deg} cx={hx + Math.cos(rad) * 5.5} cy={hy + Math.sin(rad) * 5.5} r={3.5} fill={W_LEAF} />
  })
  return (
    <g opacity={0.62}>
      <GroundShadow cx={ax + 5} cy={ay} rx={7} ry={2.5} />
      <path d={`M ${ax} ${ay} Q ${ax + 14} ${ay - 6} ${hx} ${hy}`} stroke={W_LEAF_SH} strokeWidth={2.5} fill="none" strokeLinecap="round" />
      {petals}
      <circle cx={hx} cy={hy} r={4} fill={CENTER} opacity={0.85} />
    </g>
  )
}

function WiltedCherry({ cx, cy }: { cx: number; cy: number }) {
  const ax = cx, ay = cy + TILE_H / 2
  return (
    <g opacity={0.62}>
      <GroundShadow cx={ax + 5} cy={ay} rx={15} ry={4.5} />
      <Trunk x={ax - 3.5} y={ay - 20} w={7} h={20} base={W_TRUNK} shade={W_TRUNK_SH} />
      <ShadedBlobs
        blobs={[
          [ax - 11, ay - 26, 11, 8],
          [ax + 11, ay - 26, 11, 8],
          [ax,      ay - 28, 12, 9],
          [ax - 6,  ay - 41, 8,  6],
          [ax + 6,  ay - 41, 8,  6],
          [ax,      ay - 47, 7,  5],
        ]}
        base={W_BLOSSOM} shade={W_BLOSSOM_SH}
      />
    </g>
  )
}

function WiltedBigTree({ cx, cy }: { cx: number; cy: number }) {
  const ax = cx, ay = cy + TILE_H / 2
  return (
    <g opacity={0.62}>
      <GroundShadow cx={ax + 6} cy={ay} rx={20} ry={6} />
      <Trunk x={ax - 5} y={ay - 26} w={10} h={26} base={W_TRUNK} shade={W_TRUNK_SH} />
      <ShadedBlobs
        blobs={[
          [ax - 13, ay - 36, 14, 12],
          [ax + 13, ay - 36, 14, 12],
          [ax,      ay - 40, 17, 14],
          [ax - 7,  ay - 54, 11, 10],
          [ax + 7,  ay - 54, 11, 10],
          [ax,      ay - 63, 11, 10],
        ]}
        base={W_LEAF} shade={W_LEAF_SH}
      />
    </g>
  )
}

function WiltedBamboo({ cx, cy }: { cx: number; cy: number }) {
  const ax = cx, ay = cy + TILE_H / 2
  return (
    <g opacity={0.62}>
      <GroundShadow cx={ax + 3} cy={ay} rx={6} ry={2} />
      <ellipse cx={ax - 12} cy={ay - 51} rx={11} ry={3.5} fill={W_BAMBOO} transform={`rotate(-30 ${ax - 12} ${ay - 51})`} />
      <ellipse cx={ax + 12} cy={ay - 48} rx={11} ry={3.5} fill={W_BAMBOO_SH} transform={`rotate(30 ${ax + 12} ${ay - 48})`} />
      <rect x={ax - 3.5} y={ay - 60} width={7} height={60} rx={3} fill={W_BAMBOO} />
      <rect x={ax + 0.5} y={ay - 60} width={3} height={60} rx={1.5} fill={W_BAMBOO_SH} />
      <line x1={ax - 4} y1={ay - 22} x2={ax + 4} y2={ay - 22} stroke={W_BAMBOO_SH} strokeWidth={3} strokeLinecap="round" />
      <line x1={ax - 4} y1={ay - 42} x2={ax + 4} y2={ay - 42} stroke={W_BAMBOO_SH} strokeWidth={3} strokeLinecap="round" />
    </g>
  )
}

function WiltedMushroom({ cx, cy }: { cx: number; cy: number }) {
  const ax = cx, ay = cy + TILE_H / 2
  return (
    <g opacity={0.62}>
      <GroundShadow cx={ax + 2} cy={ay} rx={9} ry={3} />
      <rect x={ax - 5} y={ay - 16} width={10} height={11} rx={4.5} fill={W_MSTEM} />
      <ellipse cx={ax} cy={ay - 23} rx={15} ry={10} fill={W_CAP} />
      <path d={`M ${ax - 15} ${ay - 22} A 15 10 0 0 0 ${ax + 15} ${ay - 22} Z`} fill="#9c6060" />
      <circle cx={ax - 5} cy={ay - 26} r={2.5} fill="#e8ddcd" />
      <circle cx={ax + 6} cy={ay - 24} r={2} fill="#e8ddcd" />
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
  // milestone が変わったらレンダー中に derived state として再同期する
  // （effect 内の同期 setState を避ける React 推奨パターン）
  const [prevMilestone, setPrevMilestone] = useState(milestone)
  if (milestone !== prevMilestone) {
    setPrevMilestone(milestone)
    setShowSparkle(!!milestone)
  }
  useEffect(() => {
    if (!milestone) return
    const t = setTimeout(() => setShowSparkle(false), 4000)
    return () => clearTimeout(t)
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
