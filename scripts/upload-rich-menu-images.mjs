// node scripts/upload-rich-menu-images.mjs
import { readFileSync } from 'fs'
import { config } from 'dotenv'

config({ path: '.env.local' })

const TOKEN = process.env.LINE_CHANNEL_ACCESS_TOKEN
const TEACHER_ID = process.env.LINE_RICH_MENU_TEACHER_ID
const STUDENT_ID = process.env.LINE_RICH_MENU_STUDENT_ID

if (!TOKEN || !TEACHER_ID || !STUDENT_ID) {
  console.error('環境変数が不足しています: LINE_CHANNEL_ACCESS_TOKEN, LINE_RICH_MENU_TEACHER_ID, LINE_RICH_MENU_STUDENT_ID')
  process.exit(1)
}

async function uploadImage(richMenuId, pngPath) {
  const image = readFileSync(pngPath)
  const res = await fetch(`https://api-data.line.me/v2/bot/richmenu/${richMenuId}/content`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${TOKEN}`,
      'Content-Type': 'image/png',
    },
    body: image,
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`${res.status}: ${text}`)
  }
  console.log(`✅ ${pngPath} → ${richMenuId}`)
}

await uploadImage(TEACHER_ID, 'public/rich-menu-teacher.png')
await uploadImage(STUDENT_ID, 'public/rich-menu-student.png')
console.log('完了')
