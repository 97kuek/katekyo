/** 金額を "¥1,234" 形式で表示する */
export function formatCurrency(amount: number): string {
  return `¥${amount.toLocaleString("ja-JP")}`
}
