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

各 `.puml` から生成した `.svg` も同じディレクトリに配置している。PNG はローカル確認用の生成物として `.gitignore` 対象にする。

レンダリング例:

```bash
plantuml -tsvg docs/diagrams/*.puml
```
