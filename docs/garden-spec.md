# 学習の森 — 機能設計書

> ブランチ: `feature/garden`  
> ステータス: 設計中

---

## 概要

宿題が先生に承認されるたび、生徒の「森」にアイテムが1つ自動で育つ。  
完了した宿題の数が「育った森」として目に見える形で積み上がり、学習継続のモチベーションを支援する。

### 設計方針

- **ゲーム性は最小限** — 生徒が操作することは何もない。承認されれば育つだけ
- **家庭教師アプリの主目的を損なわない** — 森はあくまでご褒美。宿題・成績の邪魔をしない
- **取り返しがつかない感** — 植えたアイテムは削除・移動不可。努力の軌跡として残る

---

## ゲームルール

| トリガー | 効果 |
|---|---|
| 先生が宿題を **承認** | 森にアイテム1つ自動追加 |

- 追加されるアイテムの種類・位置はランダム
- 生徒側に操作は一切なし（配置・削除・移動すべて不可）
- グリッドが埋まった場合 → 将来の拡張（次のエリアへ）として保留

### アイテム種類と出現率

| 種類 | キー | 出現率 |
|---|---|---|
| 大木 | `tree` | 40% |
| 低木 | `bush` | 35% |
| 花 | `flower` | 25% |

出現率は調整可能。現状は主観的なバランス値。

---

## データモデル

### 新規 Prisma モデル

```prisma
enum GardenItemType {
  tree
  bush
  flower
}

model GardenItem {
  id        String         @id @default(uuid())
  studentId String
  x         Int            // 0–7（8×8グリッド）
  y         Int            // 0–7
  itemType  GardenItemType
  createdAt DateTime       @default(now())

  student Student @relation(fields: [studentId], references: [id], onDelete: Cascade)

  @@unique([studentId, x, y])
  @@index([studentId])
}
```

### Student モデルへの追加

```prisma
// Student モデルに追加
gardenItems GardenItem[]
```

---

## ページ設計

| ルート | 対象 | 説明 |
|---|---|---|
| `/garden` | 生徒のみ | 自分の森を閲覧 |

先生側への森の閲覧機能は当初スコープ外（必要なら `/students/[id]/garden` として後日追加）。

### `/garden` ページ構成

```
[ 🌲 学習の森 ]          ← ページタイトル
[ 承認済み: 12件 ]        ← バッジ（総アイテム数）
                          
[ ＿＿＿＿＿＿＿＿ ]
[ |  アイソメトリック  | ]  ← 8×8グリッド
[ |   森の描画       | ]
[ |________________| ]

[ 宿題を完了すると森が育ちます ]  ← 空のとき or 説明文
```

---

## 実装ロジック

### アイテム追加（`reviewHomework` action に追記）

`status: "approved"` の確定時に以下を実行：

```ts
// 1. 既存アイテムの座標を取得
const existing = await db.gardenItem.findMany({
  where: { studentId: homework.studentId },
  select: { x: true, y: true },
})

// 2. 空きセルを列挙
const occupied = new Set(existing.map(({ x, y }) => `${x},${y}`))
const empty: [number, number][] = []
for (let x = 0; x < 8; x++) {
  for (let y = 0; y < 8; y++) {
    if (!occupied.has(`${x},${y}`)) empty.push([x, y])
  }
}

// 3. 空きがあればランダム配置
if (empty.length > 0) {
  const [x, y] = empty[Math.floor(Math.random() * empty.length)]
  const types: GardenItemType[] = [
    "tree", "tree", "tree", "tree",   // 40%
    "bush", "bush", "bush",            // 30%（35%は10分率では難しいので近似）
    "flower", "flower", "flower",      // 30%
  ]
  const itemType = types[Math.floor(Math.random() * types.length)]
  await db.gardenItem.create({
    data: { studentId: homework.studentId, x, y, itemType },
  })
}
```

---

## UI / 描画方針

### アイソメトリック CSS アプローチ

依存ライブラリなし。CSS の `transform` でグリッドを傾けてアイソメトリック表現を実現する。

```css
/* グリッドコンテナ */
.grid {
  transform: rotateX(60deg) rotateZ(-45deg);
  transform-style: preserve-3d;
}

/* 各セル */
.cell {
  width: 48px;
  height: 48px;
}
```

アイテムは絵文字（🌲🌿🌸）またはインラインSVGで表示。  
絵文字は手軽だが見た目の統一感が下がる。SVGスプライトが望ましい。

### 代替案: 平面グリッド

実装コストを下げる場合、アイソメトリックをやめて単純な2Dグリッドにする選択肢もある。  
画像のような見栄えを優先する場合はアイソメトリックを維持する。

---

## ナビゲーション追加

既存のボトムナビ・サイドバーに「森」リンクを追加（生徒のみ表示）。

- アイコン: `TreePine`（lucide-react）
- 表示ラベル: `森`

---

## 実装ステップ

1. `GardenItem` モデル + マイグレーション
2. `reviewHomework` action にアイテム追加ロジックを追記
3. `/garden` Server Component ページ作成（データフェッチ）
4. CSS アイソメトリックグリッドコンポーネント作成
5. ボトムナビ・サイドバーに「森」リンク追加（生徒のみ）
6. 動作確認 → `main` にマージ

---

## 未解決事項 / 今後の拡張

- グリッドが64マス埋まった後の挙動（次エリア？ 特別演出？）
- SVGスプライト vs 絵文字の最終決定
- 先生が生徒の森を見る機能（`/students/[id]/garden`）
- 期限内提出ボーナスアイテム（レアな花など）
