# セキュリティ設計・監査記録

## セキュリティ境界

- 認証: Auth.js Credentials / 連携済みGoogle OIDC + JWT session
- 先生: `session.user.id` を `teacherId` として全テナントデータを分離
- 生徒: `Student.userId` から解決した `studentId` だけを操作
- 保護者: `ParentStudent(parentId, studentId)` に存在する生徒だけを閲覧
- Cron・管理API: `CRON_SECRET` のBearer token
- LINE Webhook: `x-line-signature` のHMAC検証
- QStash Webhook: QStash署名検証

クライアント表示や `proxy.ts` は補助境界であり、データアクセスの認可はServer Action、Server Component、Route Handlerで必ず再検証する。

## 2026-07-15 監査で実装した対策

| リスク | 対策 |
| --- | --- |
| `CRON_SECRET` 未設定時に `Bearer undefined` を受理 | 未設定をfail closedにし、全Cron・管理APIで定数時間比較の共通ガードを使用 |
| Garden内部関数がServer Actionとして公開 | `"use server"` を除去し、認可済みサーバー処理だけから呼ぶ内部関数へ変更 |
| LINE連携コードの総当たり | `Math.random` 6桁からCSPRNG 48bitコードへ変更し、期限条件付きで原子的に消費 |
| CSV Formula Injection | 危険な先頭文字を無害化してからCSV引用 |
| 偽Meet URL | HTTPSかつhostnameが厳密に `meet.google.com` の場合だけ保存 |
| 招待期限のTOCTOU | transaction内の条件付き消費にも `expiresAt > now` を追加 |
| 提出写真の公開 | private bucketのobject pathを保存し、認可済みページで5分の署名URLを生成 |
| 画像MIME偽装・SVG | JPEG/PNG/WebPのmagic bytesをサーバーで検証 |
| bcryptコスト不統一 | 新規登録・招待経路をcost 12へ統一 |
| proxyの曖昧なprefix | 完全一致またはslash境界だけをパスprefixとして扱う |
| 別テナントの科目ID注入 | 全書き込み経路で科目IDの `teacherId` 所有を共通検証し、重複除去 |

## 提出写真の運用

Supabase Storageの `homework-photos` bucketはPrivateにする。DBの `Homework.photoUrl` には新規データではURLではなくobject pathを保存する。既存のPublic URLもpathへ変換して署名URLを生成できるが、bucket自体をPrivateへ変更するまで既知URLからの直接アクセスは止まらない。

## 既知の残存リスク

| 優先度 | リスク | 推奨対応 |
| --- | --- | --- |
| High | Credentialsログイン・先生登録に分散レート制限がない | Upstash等でIP+正規化email単位の制限、指数backoff、監査ログを導入 |
| Medium | テナント整合性が主にアプリのwhere条件へ依存 | `Student(id, teacherId)` と子モデルの複合FK、またはDB RLSを段階導入 |
| Low/Medium | `subjectIds` は書き込み時検証済みだがDBのFKを持たない | 将来join modelへ移行し、DBでも参照整合性を強制 |
| Medium | JWTのrole変更・停止を即時失効できない | `sessionVersion` / `disabledAt` と短いmaxAgeを導入 |
| Medium | LINE Webhookの試行回数・イベントリプレイ記録がない | LINE user単位の失敗制限と `webhookEventId` の一意保存 |
| Medium | リマインダー送信前claim後の外部送信失敗で再試行しない | outboxと送信状態を導入 |
| Low | 一部の所有確認と更新が別クエリ | `updateMany/deleteMany` に権限境界を含めて原子化 |

残存リスクを変更する場合は [要件トレーサビリティ](traceability.md) と [テスト戦略](testing-strategy.md) を同じPRで更新する。

## Googleアカウント認証

Google認証の移行第1段階を実装済み。Googleは認証手段であり、roleやテナント所属を決める認可の正本にはしない。

- OIDC `sub` を `provider + providerSubject` として保存し、メール一致では統合しない
- 既存Credentialsログイン後に、10分有効のHttpOnly連携intentを発行して明示連携する
- intentの生トークンはDBへ保存せずSHA-256ハッシュだけを保存する
- `email_verified=true` を必須とし、OAuthのstate・PKCE・nonceはAuth.jsへ委譲する
- `IdentityAccess` がGoogle本人情報とアプリ内プロフィールの許可関係を保持する
- 連携・解除・Googleログイン成功を `AuthAuditLog` に記録する

生徒・保護者の新規招待でのGoogle利用と、保護者が生徒プロフィールを代理利用するプロフィール選択は次段階とする。設計と導入順序は [ADR-0002](adr/0002-google-authentication.md) を参照する。
