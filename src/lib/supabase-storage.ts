import { createClient } from "@supabase/supabase-js"

function getSupabaseAdmin() {
  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error("SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY が設定されていません")
  return createClient(url, key)
}

const BUCKET = "homework-photos"
const SIGNED_URL_TTL_SECONDS = 5 * 60

export function detectImageContentType(buffer: Buffer): "image/jpeg" | "image/png" | "image/webp" | null {
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return "image/jpeg"
  if (buffer.length >= 8 && buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return "image/png"
  if (buffer.length >= 12 && buffer.subarray(0, 4).toString("ascii") === "RIFF" && buffer.subarray(8, 12).toString("ascii") === "WEBP") return "image/webp"
  return null
}

function storagePath(storedValue: string): string | null {
  if (!storedValue.startsWith("http")) return storedValue
  const markers = [`/object/public/${BUCKET}/`, `/object/sign/${BUCKET}/`]
  for (const marker of markers) {
    const index = storedValue.indexOf(marker)
    if (index !== -1) return storedValue.slice(index + marker.length).split("?")[0]
  }
  return null
}

export async function uploadHomeworkPhoto(
  file: File,
  homeworkId: string
): Promise<string | null> {
  const supabase = getSupabaseAdmin()
  const buffer = Buffer.from(await file.arrayBuffer())
  const contentType = detectImageContentType(buffer)
  if (!contentType) throw new Error("Unsupported image content")

  const extension = contentType === "image/jpeg" ? "jpg" : contentType.split("/")[1]
  const path = `homework/${homeworkId}/${Date.now()}.${extension}`
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .upload(path, buffer, { contentType, upsert: false })

  if (error || !data) {
    console.error("homework photo upload failed:", error)
    return null
  }

  // DBには公開URLではなくprivate bucket内のobject pathだけを保存する。
  return data.path
}

export async function createHomeworkPhotoSignedUrl(storedValue: string): Promise<string | null> {
  const path = storagePath(storedValue)
  if (!path) return null
  const { data, error } = await getSupabaseAdmin().storage
    .from(BUCKET)
    .createSignedUrl(path, SIGNED_URL_TTL_SECONDS)
  if (error) {
    console.error("homework photo signed URL failed:", error.message)
    return null
  }
  return data.signedUrl
}

export async function deleteHomeworkPhoto(storedValue: string) {
  const supabase = getSupabaseAdmin()
  const path = storagePath(storedValue)
  if (!path) return
  await supabase.storage.from(BUCKET).remove([path])
}
