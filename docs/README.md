# katekyo ドキュメントガイド

このディレクトリは、katekyo の要件、設計、実装契約、品質保証、運用判断の正本を管理する。
同じ情報を複数の文書へコピーせず、詳細は正本へリンクする。

## 読み方

| 読者・目的 | 最初に読む文書 | 次に読む文書 |
| --- | --- | --- |
| 機能の全体像を知る | [ユースケース](usecases.md) | [機能要件](requirements.md) |
| 実装・レビューをする | [アーキテクチャ](architecture.md) | [API仕様](api-spec.md)、[データモデル](data-models.md) |
| DBや認可を変更する | [データモデル](data-models.md) | [トレーサビリティ](traceability.md)、[テスト戦略](testing-strategy.md) |
| UIを変更する | [デザインシステム](DESIGN.md) | [アーキテクチャ](architecture.md) |
| テストを追加する | [テスト戦略](testing-strategy.md) | [トレーサビリティ](traceability.md) |
| 設計判断を記録する | [ADR](adr/README.md) | [文書運用規約](documentation-guide.md) |
| 開発環境を準備する | [開発ガイド](CONTRIBUTING.md) | [ルートREADME](../README.md) |

## 正本の構成

| 分類 | 正本 | 責務 |
| --- | --- | --- |
| Product | [usecases.md](usecases.md) | アクター、利用シナリオ、事前条件、事後条件 |
| Requirements | [requirements.md](requirements.md) | 機能要件、業務ルール、認可、受入条件 |
| Architecture | [architecture.md](architecture.md) | システム境界、構成、依存関係、実行方式 |
| Domain | [data-models.md](data-models.md) | Prismaモデル、関連、制約、テナント境界 |
| Interface | [api-spec.md](api-spec.md) | Server Actions、Route Handlers、入出力、エラー |
| UX | [DESIGN.md](DESIGN.md) | UIトークン、コンポーネント、レスポンシブ規約 |
| Quality | [testing-strategy.md](testing-strategy.md) | テストレベル、品質ゲート、非機能検証 |
| Security | [security.md](security.md) | 認証・認可境界、外部公開面、監査結果、残存リスク |
| Traceability | [traceability.md](traceability.md) | 要件、UML、実装、テストの対応関係 |
| Decisions | [adr/](adr/README.md) | 重要な設計判断とその背景 |
| Operations | [CONTRIBUTING.md](CONTRIBUTING.md) | セットアップ、変更手順、検証コマンド |

## 補足設計・運用仕様

| 文書 | 状態 | 正本との関係 |
| --- | --- | --- |
| [保護者アカウント設計](parent-account-spec.md) | Supporting | 招待・ページ構成・セキュリティの補足 |
| [LINE通知](line-notification-plan.md) | Canonical supplement | LINE固有のメッセージと運用 |
| [Meetリマインダー](meet-reminder-plan.md) | Canonical supplement | QStashとcronの運用 |
| [初期仕様](archived/legacy-spec.md) | Historical | 現行仕様として参照禁止 |

## UML

[diagrams/](diagrams/README.md) では、図の目的と抽象度を分けて管理する。

- ユースケース図: システムが提供する価値とアクター
- コンテキスト／コンポーネント図: システム境界と依存関係
- クラス図: 永続化されるドメイン構造
- 状態遷移図: 状態を持つ集約の許可された遷移
- シーケンス図: 認証、認可、永続化、外部通知の順序
- 配置図: Vercel、PostgreSQL、外部サービスの実行時関係

`.puml` を編集元とし、同名の `.svg` をレビュー用成果物とする。

## 文書ステータス

| 状態 | 意味 |
| --- | --- |
| Canonical | 現行仕様の正本。実装変更と同じPRで更新する |
| Supporting | 正本を補足する資料。正本と矛盾してはならない |
| Historical | 過去の判断・旧仕様。現行仕様として参照しない |
| Draft | 未確定の提案。実装済みとはみなさない |

初期仕様は [archived/legacy-spec.md](archived/legacy-spec.md) へ移動済みで、現行仕様として参照しない。LINE通知とMeetリマインダーの旧計画書は、正本との責務を分離した設計・運用仕様として維持する。
詳細な更新規約は [documentation-guide.md](documentation-guide.md) を参照する。
