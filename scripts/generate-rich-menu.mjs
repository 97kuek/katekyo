// node scripts/generate-rich-menu.mjs
import sharp from 'sharp'

const W = 2500
const H = 843
const TILE_W = Math.floor(W / 3)   // 833
const ICON_PX = 240
const SCALE = ICON_PX / 24
const ICON_Y = (H - ICON_PX) / 2
const COLOR = '#2e743a'   // katekyo primary green
const DIVIDER = '#E5E7EB' // gray-200
const SW = 1.5

function paths(...ds) {
  return ds.map(d =>
    `<path fill="none" stroke="${COLOR}" stroke-width="${SW}" stroke-linecap="round" stroke-linejoin="round" d="${d}"/>`
  ).join('')
}

// Lucide icon paths (24×24 viewBox)
const ICONS = {
  // 宿題
  bookOpen: paths(
    'M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z',
    'M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 0 3-3h7z',
  ),
  // 学習の森
  leaf: paths(
    'M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10z',
    'M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12',
  ),
  // カレンダー
  calendar: [
    `<rect fill="none" stroke="${COLOR}" stroke-width="${SW}" stroke-linecap="round" stroke-linejoin="round" width="18" height="18" x="3" y="4" rx="2"/>`,
    `<line stroke="${COLOR}" stroke-width="${SW}" stroke-linecap="round" x1="16" x2="16" y1="2" y2="6"/>`,
    `<line stroke="${COLOR}" stroke-width="${SW}" stroke-linecap="round" x1="8"  x2="8"  y1="2" y2="6"/>`,
    `<line stroke="${COLOR}" stroke-width="${SW}" stroke-linecap="round" x1="3"  x2="21" y1="10" y2="10"/>`,
    `<circle fill="${COLOR}" cx="8"  cy="14" r="1"/>`,
    `<circle fill="${COLOR}" cx="12" cy="14" r="1"/>`,
    `<circle fill="${COLOR}" cx="16" cy="14" r="1"/>`,
    `<circle fill="${COLOR}" cx="8"  cy="18" r="1"/>`,
    `<circle fill="${COLOR}" cx="12" cy="18" r="1"/>`,
  ].join(''),
  // 提出確認
  clipboardCheck: [
    `<rect fill="none" stroke="${COLOR}" stroke-width="${SW}" stroke-linecap="round" stroke-linejoin="round" width="8" height="4" x="8" y="2" rx="1"/>`,
    `<path fill="none" stroke="${COLOR}" stroke-width="${SW}" stroke-linecap="round" stroke-linejoin="round" d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>`,
    `<path fill="none" stroke="${COLOR}" stroke-width="${SW}" stroke-linecap="round" stroke-linejoin="round" d="m9 14 2 2 4-4"/>`,
  ].join(''),
  // 請求管理
  receipt: [
    `<path fill="none" stroke="${COLOR}" stroke-width="${SW}" stroke-linecap="round" stroke-linejoin="round" d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1z"/>`,
    `<path fill="none" stroke="${COLOR}" stroke-width="${SW}" stroke-linecap="round" d="M14 8H8"/>`,
    `<path fill="none" stroke="${COLOR}" stroke-width="${SW}" stroke-linecap="round" d="M16 12H8"/>`,
    `<path fill="none" stroke="${COLOR}" stroke-width="${SW}" stroke-linecap="round" d="M13 16H8"/>`,
  ].join(''),
}

function buildSVG(tileIcons) {
  const groups = tileIcons.map((svg, i) => {
    const tileX = i * TILE_W
    const tileWidth = i === 2 ? W - TILE_W * 2 : TILE_W
    const cx = tileX + tileWidth / 2
    const ix = cx - ICON_PX / 2
    return `<g transform="translate(${ix},${ICON_Y}) scale(${SCALE})">${svg}</g>`
  }).join('\n  ')

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
  <rect width="${W}" height="${H}" fill="white"/>
  <line x1="${TILE_W}"     y1="60" x2="${TILE_W}"     y2="${H - 60}" stroke="${DIVIDER}" stroke-width="3"/>
  <line x1="${TILE_W * 2}" y1="60" x2="${TILE_W * 2}" y2="${H - 60}" stroke="${DIVIDER}" stroke-width="3"/>
  ${groups}
</svg>`
}

async function generate(filename, tileIcons) {
  const svg = buildSVG(tileIcons)
  const outPath = `public/${filename}`
  await sharp(Buffer.from(svg, 'utf-8')).png().toFile(outPath)
  console.log(`✅ ${outPath}`)
}

await generate('rich-menu-student.png', [ICONS.bookOpen, ICONS.leaf, ICONS.calendar])
await generate('rich-menu-teacher.png', [ICONS.clipboardCheck, ICONS.calendar, ICONS.receipt])
console.log('完了')
