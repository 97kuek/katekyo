# Prisma マイグレーション

このプロジェクトで Prisma スキーマを変更・適用する。

## 手順

1. `prisma/schema.prisma` を編集（変更内容を確認）
2. マイグレーション実行:
   ```bash
   npx prisma migrate dev --name <変更内容を表す名前>
   ```
   - 例: `add-homework-photo-flag`, `add-line-user-id-to-user`
   - マイグレーションファイルが `prisma/migrations/` に生成される
   - Prisma Client も自動で再生成される（`prisma generate` 不要）
3. 生成された SQL を確認してから `yes` で確定
4. 本番環境への適用は:
   ```bash
   npx prisma migrate deploy
   ```
5. データ確認: `npx prisma studio`

## 注意

- `migrate dev` は開発 DB に対して実行する。本番には `migrate deploy`
- カラム削除・型変更など破壊的変更は生成 SQL を必ず読んでから確定
- `npm run build` には `prisma generate` が含まれるので再生成は通常不要

---

変更したいスキーマ内容をユーザーに確認してから実装する。
