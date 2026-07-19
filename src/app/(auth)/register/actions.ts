"use server"

import { db } from "@/lib/db"
import bcrypt from "bcryptjs"
import { redirect } from "next/navigation"
import { z } from "zod"
import { normalizeEmailInput } from "@/lib/input-normalization"

const schema = z.object({
  name: z.string().min(1, "名前を入力してください"),
  email: z.string().email("有効なメールアドレスを入力してください"),
  password: z.string().min(8, "パスワードは8文字以上で入力してください"),
})

export async function registerTeacher(
  _prevState: { error: string },
  formData: FormData
) {
  const result = schema.safeParse({
    name: formData.get("name"),
    email: normalizeEmailInput(formData.get("email")),
    password: formData.get("password"),
  })

  if (!result.success) {
    return { error: result.error.issues[0].message }
  }

  const { name, email, password } = result.data

  const existing = await db.user.findFirst({ where: { email: { equals: email, mode: "insensitive" } } })
  if (existing) {
    return { error: "このメールアドレスは既に使用されています" }
  }

  const hashed = await bcrypt.hash(password, 12)
  await db.user.create({
    data: { name, email, password: hashed, role: "teacher" },
  })

  redirect("/login?registered=1")
}
