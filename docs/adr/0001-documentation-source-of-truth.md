# ADR-0001: 文書の正本と追跡性

- Status: Accepted
- Date: 2026-07-15

## Context

機能説明、旧仕様書、実装計画、アーキテクチャ文書に同じ情報が分散し、実装後も計画書表現や古いパスが残っている。PlantUMLは存在するが、要件、実装、テストとの対応が明示されていない。

## Decision

- `docs/README.md` を文書体系の入口とする
- Product、Requirements、Architecture、Domain、Interface、Quality、Decisionごとに正本を1つ定める
- `UC-`、`FR-`、`BR-`、`NFR-`、`T-` のIDで追跡する
- PlantUMLソースを図の正本とし、SVGは生成成果物とする
- 重要な仕様変更では、コードと関連文書・テストを同じPRで更新する
- 旧文書は正本へ統合した後にHistoricalとしてアーカイブする

## Consequences

- 変更時に確認する範囲が明確になり、古い記述を検出しやすくなる
- 要件からテストまでの不足を可視化できる
- IDと生成物を維持する作業が増えるため、リンク・PlantUML・参照パスのCI検証を追加する

