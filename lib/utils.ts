export function relativeTime(t: string): string {
  const m = Math.floor((Date.now() - new Date(t).getTime()) / 60000)
  if (m < 1)  return 'たった今'
  if (m < 60) return `${m}分前`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}時間前`
  const d = Math.floor(h / 24)
  if (d < 7)  return `${d}日前`
  return new Date(t).toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' })
}

export function isRecent(t: string | null): boolean {
  return !!t && Date.now() - new Date(t).getTime() < 7 * 864e5
}
