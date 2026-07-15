# 要件トレーサビリティ

この表は、利用価値から業務ルール、設計、実装、テストまでの到達経路を示す。詳細仕様を複製せず、正本への索引として使う。

## 初期マトリクス

| ユースケース | 主要要件・ルール | UML | 主な実装 | 自動テスト | 状態 |
| --- | --- | --- | --- | --- | --- |
| UC-01 生徒招待 | FR-INV-01、BR-INV-01、NFR-SEC-01、NFR-SEC-02 | usecase、sequence-invite-student | `(app)/students/invite`、`(auth)/invite/[token]` | T-E2E-01、T-INV-01、T-SEC-01 | Partial |
| UC-02 保護者招待 | FR-INV-02、BR-INV-01、NFR-SEC-01、NFR-SEC-02 | usecase、sequence-invite-parent | `invite-parent`、`parent-invite` | T-INV-01、T-SEC-02 | Partial |
| UC-03〜06 宿題 | FR-HW-01、FR-HW-02、FR-HW-03、BR-HW-01 | activity、sequence、communication、state-homework | `(app)/homework`、`lib/garden/actions.ts` | T-VAL-01、T-E2E-01、T-HW-01、T-SEC-01 | Partial |
| UC-07〜08 授業 | FR-LSN-01、BR-LSN-01 | component、sequence-lesson-billing | `(app)/calendar/actions.ts` | T-VAL-01、T-E2E-01、T-BIL-01、T-SEC-01 | Partial |
| UC-09 請求 | FR-BIL-01、BR-BIL-01 | component、sequence-lesson-billing | `(app)/billing`、`lib/billing.ts` | T-E2E-01、T-BIL-01、T-SEC-01 | Partial |
| UC-10〜11 成績 | FR-GRD-01 | usecase、class | `(app)/grades` | T-E2E-01、T-SEC-01、T-SEC-02 | Partial |
| UC-12 Garden | FR-GDN-01、BR-GDN-01 | class、homework activity | `(app)/garden`、`lib/garden` | T-GDN-01、T-E2E-01 | Covered |
| UC-13 テスト予定 | FR-LSN-01 | usecase、class | `(app)/calendar/actions.ts` | T-VAL-01、T-SEC-01 | Partial |
| UC-14 LINE連携 | FR-NTF-01 | component、deployment | `app/api/line`、`lib/line.ts` | T-NTF-01、T-SEC-02 | Gap |
| UC-15 Meet通知 | FR-NTF-02、NFR-REL-01 | sequence-lesson-reminder、deployment | `app/api/cron`、`app/api/webhooks`、`lib/qstash.ts` | T-NTF-01、T-NTF-02 | Partial |
| UC-04〜05 提出写真 | NFR-SEC-03 | sequence-homework-submit | `lib/supabase-storage.ts`、`homework/[id]` | T-STO-01 | Covered |
| 管理API | NFR-SEC-04 | component、deployment | `lib/request-auth.ts`、`app/api/cron` | T-API-01 | Covered |

`Gap` は仕様未実装を意味せず、追跡可能な自動テストまたは設計図が不足している状態を示す。

## 完了条件

行を `Covered` にするには、次をすべて満たす。

1. ユースケースと受入条件が現行実装に一致する
2. 業務ルールと認可境界に安定したIDがある
3. 複雑な相互作用または状態変化がUMLで説明されている
4. 実装入口が現行パスで参照されている
5. P0の拒否条件を含む自動テストが存在する
