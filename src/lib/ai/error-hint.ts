/**
 * Maps raw API/network error messages to developer-friendly Chinese hints.
 * Used across AI config, onboarding, and wizard mode to give actionable feedback.
 */
export function errorHint(raw: string): string {
  if (/401|unauthorized/i.test(raw)) return '401 · API Key 可能填写错误或已过期'
  if (/404|not.?found/i.test(raw)) return '404 · 模型名可能拼错或服务不可用'
  if (/429|rate/i.test(raw)) return '429 · 触发速率限制，稍后再试'
  if (/network|fetch|ECONN/i.test(raw)) return '网络错误 · 检查代理或接口地址'
  return raw.slice(0, 120)
}
