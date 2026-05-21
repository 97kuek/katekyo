import { createClient } from "@supabase/supabase-js"

function getSupabaseAdmin() {
  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error("SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY が設定されていません")
  return createClient(url, key)
}

const BUCKET = "homework-photos"
const TEMP_BUCKET = "temp-materials"
const TEMP_PATH = "temp"

export async function uploadHomeworkPhoto(
  file: File,
  homeworkId: string
): Promise<string | null> {
  const supabase = getSupabaseAdmin()
  const ext = file.type.split("/")[1] || "jpg"
  const path = `homework/${homeworkId}/${Date.now()}.${ext}`

  const buffer = Buffer.from(await file.arrayBuffer())
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .upload(path, buffer, { contentType: file.type, upsert: true })

  if (error || !data) {
    console.error("homework photo upload failed:", error)
    return null
  }

  const { data: { publicUrl } } = supabase.storage.from(BUCKET).getPublicUrl(data.path)
  return publicUrl
}

export async function uploadTempMaterial(file: File): Promise<string | null> {
  const supabase = getSupabaseAdmin()
  const ext = file.type.split("/")[1] || "jpg"
  const path = `${TEMP_PATH}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

  const buffer = Buffer.from(await file.arrayBuffer())
  const { data, error } = await supabase.storage
    .from(TEMP_BUCKET)
    .upload(path, buffer, { contentType: file.type })

  if (error || !data) {
    console.error("temp material upload failed:", error)
    return null
  }

  const { data: { publicUrl } } = supabase.storage.from(TEMP_BUCKET).getPublicUrl(data.path)
  return publicUrl
}

export async function deleteTempMaterialsOlderThan(cutoff: Date): Promise<number> {
  const supabase = getSupabaseAdmin()
  const { data: files, error } = await supabase.storage
    .from(TEMP_BUCKET)
    .list(TEMP_PATH, { limit: 1000, sortBy: { column: "created_at", order: "asc" } })

  if (error || !files || files.length === 0) return 0

  const old = files.filter((f) => f.created_at && new Date(f.created_at) < cutoff)
  if (old.length === 0) return 0

  await supabase.storage.from(TEMP_BUCKET).remove(old.map((f) => `${TEMP_PATH}/${f.name}`))
  return old.length
}

export async function deleteHomeworkPhoto(photoUrl: string) {
  const supabase = getSupabaseAdmin()
  // extract path after "/object/public/homework-photos/"
  const marker = `/object/public/${BUCKET}/`
  const idx = photoUrl.indexOf(marker)
  if (idx === -1) return
  const path = photoUrl.slice(idx + marker.length)
  await supabase.storage.from(BUCKET).remove([path])
}
