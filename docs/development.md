# 開発ガイド

## ブランチ戦略

GitHub Flow をベースにしたシンプルな運用。

```
main
 └─ feature/xxx    新機能
 └─ fix/xxx        バグ修正
 └─ chore/xxx      依存更新・設定変更・リファクタリング
 └─ docs/xxx       ドキュメントのみの変更
```

### ルール

- `main` は常にデプロイ可能な状態を保つ
- 作業は必ずブランチを切ってから行う
- `main` への直接プッシュは禁止
- マージは PR 経由で行う（レビュー済みであること）
- ブランチ名は英語・ケバブケースで書く

### ブランチ名の例

```
feature/homework-submission
feature/grade-chart
fix/invite-token-expiry
chore/update-prisma
docs/add-api-spec
```

---

## コミットメッセージ

[Conventional Commits](https://www.conventionalcommits.org/) に従う。

### フォーマット

```
<type>: <概要（英語・現在形）>

[本文（任意）]
```

### type 一覧

| type | 使いどころ |
|---|---|
| `feat` | 新機能の追加 |
| `fix` | バグ修正 |
| `chore` | ビルド・依存・設定変更（機能に影響しない） |
| `docs` | ドキュメントのみの変更 |
| `refactor` | 動作を変えないコードの整理 |
| `test` | テストの追加・修正 |
| `style` | フォーマット・空白・セミコロン等（ロジックに影響しない） |

### コミットメッセージの例

```
feat: add homework submission flow
feat: display grade history chart
fix: reject expired invite tokens correctly
chore: install shadcn/ui and configure theme
docs: update API endpoint list in spec
refactor: extract auth session helper
```

### NG例

```
# ❌ 曖昧すぎる
fix: fix bug
update: update stuff

# ❌ 日本語（英語統一）
feat: 宿題提出機能を追加

# ❌ type なし
add grade chart
```

---

## PR ワークフロー

1. `main` から作業ブランチを切る
   ```bash
   git switch -c feature/xxx
   ```
2. 細かくコミットを積む（WIPでもOK）
3. 完了したら GitHub に push
   ```bash
   git push -u origin feature/xxx
   ```
4. PR を作成し、概要・動作確認方法を記載する
5. セルフレビューして `main` にマージ
6. ブランチを削除する

---

## 開発環境セットアップ

```bash
# 依存インストール
npm install

# 環境変数設定
cp .env.example .env.local
# .env.local を編集して各値を入力

# DBマイグレーション
npx prisma migrate dev

# 開発サーバー起動
npm run dev
```

## 便利コマンド

```bash
npm run dev            # 開発サーバー（Turbopack）
npm run build          # 本番ビルド
npm run lint           # ESLint チェック
npx prisma studio      # DB GUI ブラウザで確認
npx prisma migrate dev --name <name>  # マイグレーション作成
npx prisma generate    # Prisma Client 再生成
```
