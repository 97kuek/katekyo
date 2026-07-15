# ADR-0002: Googleアカウント認証の段階導入

- Status: Proposed
- Date: 2026-07-15

## Context

現在はメールアドレスとbcryptパスワードによるCredentials認証を使用している。Google認証を追加すると、利用者のパスワード管理負担とcredential stuffingの対象を減らせる。一方、katekyoでは先生・生徒・保護者の作成経路とテナント境界が異なり、Googleのメールアドレスだけを根拠に既存アカウントへ自動連結すると、誤連結や招待フローの迂回が起こり得る。

## Proposed Decision

Google認証はCredentialsを直ちに置換せず、追加のログイン手段として段階導入する。

1. GoogleのOIDC `sub` を不変の外部識別子として保存する
2. `email_verified=true` を必須とするが、emailだけをアカウント連結の主キーにしない
3. 既存利用者はCredentialsでログインした設定画面から、再認証を伴ってGoogleを明示連携する
4. 生徒・保護者の初回作成は従来どおり有効な招待トークンを必須とする
5. 先生のGoogle新規登録は、登録確認画面で `teacher` 作成を明示し、既存emailがある場合は自動統合しない
6. 外部IDは `provider + providerSubject` の一意制約を持つ専用モデルでUserへ関連付ける
7. 連携・解除・失敗を監査ログへ記録し、最低1つのログイン手段を残さない解除を禁止する
8. OAuth `state`、PKCE、nonceはAuth.jsの標準フローに委譲し、独自実装しない

## Required Model

概念例。名称とAuth.js Adapter採用は実装時に再レビューする。

```prisma
model AuthIdentity {
  id              String @id @default(uuid())
  userId          String
  provider        String
  providerSubject String
  emailAtLink     String?

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerSubject])
  @@index([userId])
}
```

## Authorization Invariant

Googleは本人確認の手段だけを提供する。`teacher` / `student` / `parent` のrole、`teacherId`、`ParentStudent`、招待トークンによる認可境界はアプリDBを唯一の正本とし、Google profileやhosted domainから推論しない。

## Rollout

1. 外部IDモデル、監査ログ、連携・解除テストを追加
2. 既存利用者向けGoogle連携をリリース
3. 招待受理中のGoogle認証を追加
4. 先生のGoogle新規登録を追加
5. 利用状況と復旧手段を確認後、Credentials縮小の可否を判断

## Consequences

- パスワード依存とフィッシング耐性を改善できる
- Google障害・アカウント喪失時のため、当面はCredentialsまたは復旧手段を維持する
- identity linking、監査、アカウント回復の設計とテストが追加で必要になる
- Google認証を追加しても、ログイン・登録のレート制限は引き続き必要である

