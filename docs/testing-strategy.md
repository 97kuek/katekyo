# テスト戦略

## 品質目標

katekyo では、画面の表示だけでなく、マルチテナント境界、ロール認可、状態遷移、請求計算、外部通知の失敗分離を主要な品質特性とする。

## テストレベル

| レベル | 主な対象 | 実行環境 | 例 |
| --- | --- | --- | --- |
| Static | 型、Lint、依存規約、文書参照 | CI | TypeScript、ESLint、Markdownリンク |
| Unit | 純粋関数、Zod、状態判定 | Vitest | 料金計算、期限表示、Garden抽選 |
| Integration | Server Action、Route Handler、Prisma、認可 | Vitest + テストDB | テナント条件、トランザクション、状態競合 |
| Contract | 外部サービス境界 | HTTPモック／署名fixture | LINE、QStash、Supabase、Cron認証 |
| E2E | ロール別の重要ユーザーフロー | Playwright | 招待、宿題提出・承認、請求閲覧 |

E2EだけでDB・外部API依存を網羅しない。分岐の多い認可とエラー処理は、より高速で原因を特定しやすいIntegration／Contractテストへ寄せる。

## リスクベースの優先順位

### P0: 必ず自動化する

- 別テナントのIDを指定しても参照・更新・削除できない
- `student` と `parent` が先生専用Actionを実行できない
- 保護者は紐づく生徒だけ閲覧でき、書き込みできない
- 宿題の不正な状態遷移を拒否する
- 招待トークンの期限切れ、再利用、別テナント流用を拒否する
- 請求対象は完了済み授業だけで、料金計算が一貫する

### P1: 主要回帰として自動化する

- 宿題作成、提出、差し戻し、再提出、承認
- 授業作成、更新、完了、未完了解除
- 成績登録、編集、閲覧権限
- LINE／QStash障害時も主データの整合性が保たれる
- Cron／Webhookの署名またはBearer認証

### P2: 代表ケースを自動化する

- レスポンシブ表示、スワイプ、safe-area
- ローディング、空状態、エラー表示
- PWAとオフラインページ

## 認可テストの共通マトリクス

各読み書き操作に対して最低限、次の主体を検証する。

| 主体 | 期待結果 |
| --- | --- |
| 未認証 | ログイン要求または認証エラー |
| 同一テナントの先生 | 仕様で許可されたCRUD |
| 別テナントの先生 | not found相当。対象の存在を漏らさない |
| 対象生徒 | 生徒に許可された操作のみ |
| 別生徒 | 拒否 |
| 紐づく保護者 | 閲覧のみ |
| 紐づかない保護者 | 拒否 |

## テスト設計ルール

- テスト名に関連する `UC-`、`FR-`、`BR-`、`NFR-` のいずれかを含める
- DBテストはテナントAとテナントBを同時に用意し、越境しないことを検証する
- 失敗系ではエラーだけでなく、DBが変更されていないことも検証する
- 日時、乱数、外部APIは固定可能な境界へ分離する
- 外部APIの実通信を通常のCIでは行わない
- E2Eはロール別の価値あるフローに限定し、細かな入力分岐は下位レベルで検証する

## テストシナリオカタログ

| ID | 優先度 | 対象 | レベル | 現在の証跡 | 状態 |
| --- | --- | --- | --- | --- | --- |
| T-VAL-01 | P1 | 宿題・授業・パスワード等の入力境界 | Unit | `src/lib/validation.test.ts` | Covered |
| T-DATE-01 | P1 | JST基準の日付・期限表示 | Unit | `src/lib/date-utils.test.ts` | Covered |
| T-GDN-01 | P1 | 得点・偏差値からGardenアイテムを決定 | Unit | `src/lib/garden/utils.test.ts` | Covered |
| T-E2E-01 | P1 | 先生登録、生徒招待、宿題・成績等の主要フロー | E2E | `tools/ui-flow.spec.ts` | Covered |
| T-UI-01 | P2 | 主要画面のoverflowとフォーム操作性 | E2E | `tools/ui-audit.spec.ts` | Covered |
| T-SEC-01 | P0 | 別テナントの先生による参照・更新・削除を拒否 | Integration | 追加予定 | Gap |
| T-SEC-02 | P0 | 生徒・保護者のロール外操作を拒否 | Integration | 追加予定 | Gap |
| T-INV-01 | P0 | 招待の期限切れ、再利用、別対象への流用を拒否 | Integration | 追加予定 | Gap |
| T-HW-01 | P0 | 宿題の許可・不許可状態遷移 | Unit/Integration | 追加予定 | Gap |
| T-BIL-01 | P0 | 完了授業だけを請求対象にし料金を正しく計算 | Unit/Integration | 追加予定 | Gap |
| T-NTF-01 | P1 | LINE失敗時も主処理の整合性を維持 | Contract | 追加予定 | Gap |
| T-NTF-02 | P0 | Cron・Webhook認証とリマインダー冪等性 | Contract/Integration | 追加予定 | Gap |
| T-API-01 | P0 | Bearer秘密値の未設定・不一致を拒否 | Unit | `src/lib/request-auth.test.ts` | Covered |
| T-STO-01 | P0 | 画像magic bytes検証とprivate署名URL方式 | Unit/Review | `src/lib/supabase-storage.test.ts` | Covered |

`Gap` は品質上の既知リスクとして扱う。機能変更が該当領域へ触れる場合、同じPRでCoveredへ移すか、未対応理由をレビューへ明記する。

## 品質ゲート

変更範囲に応じ、次の順で実行する。

```bash
npm run lint
npx tsc --noEmit
npm test
npx playwright test
npm run build
```

Prisma変更時は `prisma generate` とmigration SQLのレビューを追加する。文書のみの変更でも、リンク、PlantUML構文、生成SVG差分の検証を最終的にCIへ組み込む。
