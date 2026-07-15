# PlantUML diagrams

このディレクトリには、katekyo の主要な設計図を PlantUML 形式で置く。

| ファイル | 内容 |
| --- | --- |
| `usecase-diagram.puml` | 先生・生徒・保護者・外部サービスのユースケース図 |
| `class-diagram.puml` | Prisma モデルを中心にした主要ドメインのクラス図 |
| `object-diagram.puml` | 1先生テナント内の具体例オブジェクト図 |
| `activity-homework-review.puml` | 宿題作成から提出・承認/差し戻しまでのアクティビティ図 |
| `sequence-homework-submit.puml` | 生徒が宿題を提出するシーケンス図 |
| `communication-homework-review.puml` | 先生が宿題をレビューするコミュニケーション図 |
| `state-homework.puml` | 宿題集約の許可された状態遷移と権限条件 |
| `component-architecture.puml` | Next.js内の論理コンポーネントと依存方向 |
| `deployment.puml` | Vercel・DB・LINE・QStash・Storageの実行時配置 |
| `sequence-invite-student.puml` | 招待トークン検証から生徒テナント紐付けまでのシーケンス図 |
| `sequence-invite-parent.puml` | 保護者招待と読み取り権限の紐づけシーケンス図 |
| `sequence-lesson-billing.puml` | 授業完了から月次請求・入金管理までのシーケンス図 |
| `sequence-lesson-reminder.puml` | QStashとcronが共存する授業リマインダーのシーケンス図 |

既存図にはGitHub上で確認しやすい `.svg` も配置している。`.svg` が未生成でも `.puml` を設計の正本とし、リリース前または図のレビュー時にレンダリングする。PNG はローカル確認用の生成物として `.gitignore` 対象にする。

`.puml` が編集元の正本であり、`.svg` はレビューとGitHub表示のための生成物とする。図の変更では関連する `UC-`、`FR-`、`BR-`、`NFR-` IDをコメントに記載する。記法とレビュー基準は [文書運用規約](../documentation-guide.md) を参照する。

レンダリング例:

```bash
plantuml -tsvg docs/diagrams/*.puml
npm run docs:check
```

CIでは `docs:check` に加えて `plantuml -checkonly` を実行し、PlantUML構文を検証する。
