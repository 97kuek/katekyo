/** Excel等が数式として解釈する先頭文字を無害化してからCSVセルを引用する。 */
export function escapeCsvCell(value: string | number): string {
  let text = String(value)
  if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`
  return `"${text.replace(/"/g, '""')}"`
}

