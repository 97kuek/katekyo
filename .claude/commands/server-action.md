# Server Action 作成

このプロジェクトの Server Action を作成する。

## チェックリスト（全項目必須）

**配置**:
- `src/app/(app)/<feature>/actions.ts` にファイルを作成
- ファイル先頭に `"use server"`

**セキュリティ（この順序で必ず実装）**:
1. `const session = await auth()` → null なら `throw new Error("Unauthorized")`
2. Zod スキーマで全入力を検証（DB アクセス前に `parse`）
3. 全 Prisma クエリに `teacherId: session.user.id` または `studentId` を含める
4. `findFirst({ where: { id } })` のみは禁止 — テナントフィルタを必ず追加

**戻り値**:
```ts
return { success: true }           // 成功
return { success: false, error: "メッセージ" }  // 失敗
```

**ミューテーション後**:
- `revalidatePath("/...")` でキャッシュを更新

## スケルトン

```ts
"use server"

import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { z } from "zod"

const schema = z.object({
  // ... フィールド定義
})

export async function myAction(data: z.infer<typeof schema>) {
  const session = await auth()
  if (!session) throw new Error("Unauthorized")

  const parsed = schema.safeParse(data)
  if (!parsed.success) return { success: false, error: "入力が不正です" }

  await db.someModel.create({
    data: {
      ...parsed.data,
      teacherId: session.user.id,  // テナント絞り込み必須
    },
  })

  revalidatePath("/...")
  return { success: true }
}
```

---

ユーザーが何を実装したいか確認してから実装する。
