/**
 * Lightweight "time ago" formatter for Chinese UI.
 * Avoids pulling in date-fns/dayjs for one label.
 */
export function formatDistanceToNow(date: Date | number): string {
  const then = typeof date === 'number' ? date : date.getTime()
  const diffMs = Date.now() - then
  const abs = Math.abs(diffMs)
  const future = diffMs < 0

  const sec = Math.round(abs / 1000)
  if (sec < 60) return future ? '即将' : '刚刚'
  const min = Math.round(sec / 60)
  if (min < 60) return `${min} 分钟${future ? '后' : '前'}`
  const hr = Math.round(min / 60)
  if (hr < 24) return `${hr} 小时${future ? '后' : '前'}`
  const day = Math.round(hr / 24)
  if (day < 30) return `${day} 天${future ? '后' : '前'}`
  const mo = Math.round(day / 30)
  if (mo < 12) return `${mo} 个月${future ? '后' : '前'}`
  const yr = Math.round(mo / 12)
  return `${yr} 年${future ? '后' : '前'}`
}
