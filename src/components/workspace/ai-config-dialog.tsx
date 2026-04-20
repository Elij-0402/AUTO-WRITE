'use client'

import { useState, useEffect, useRef, useId } from 'react'
import { useAIConfig, AIConfig, AIProvider } from '@/lib/hooks/use-ai-config'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { CheckCircle2, XCircle, ExternalLink, ChevronDown } from 'lucide-react'

interface AIConfigDialogProps {
  projectId: string
  open: boolean
  onClose: () => void
  /** 新用户引导模式：精简内容 + 不可关闭 */
  isOnboarding?: boolean
  /** 引导模式下保存完成后调用关闭弹窗 */
  onSaveComplete?: () => void
}

// 5 个 preset。前端仅作 UI 快捷选择，存储层 map 到 'anthropic' | 'openai-compatible'
type PresetKey = 'anthropic' | 'deepseek' | 'siliconflow' | 'openrouter' | 'custom'

const PRESETS: Record<PresetKey, {
  label: string
  storeAs: AIProvider
  baseUrl: string
  defaultModel: string
  popularModels: string[]
  consoleUrl: string | null
}> = {
  anthropic: {
    label: 'Claude',
    storeAs: 'anthropic',
    baseUrl: 'https://api.anthropic.com',
    defaultModel: 'claude-sonnet-4-20250514',
    popularModels: ['claude-sonnet-4-20250514', 'claude-opus-4-20250514', 'claude-haiku-4-5-20251001'],
    consoleUrl: 'https://console.anthropic.com/settings/keys',
  },
  deepseek: {
    label: 'DeepSeek',
    storeAs: 'openai-compatible',
    baseUrl: 'https://api.deepseek.com',
    defaultModel: 'deepseek-chat',
    popularModels: ['deepseek-chat', 'deepseek-reasoner'],
    consoleUrl: 'https://platform.deepseek.com/api_keys',
  },
  siliconflow: {
    label: '硅基流动',
    storeAs: 'openai-compatible',
    baseUrl: 'https://api.siliconflow.cn',
    defaultModel: 'deepseek-ai/DeepSeek-V3',
    popularModels: ['deepseek-ai/DeepSeek-V3', 'deepseek-ai/DeepSeek-R1', 'Qwen/Qwen2.5-72B-Instruct'],
    consoleUrl: 'https://cloud.siliconflow.cn/account/ak',
  },
  openrouter: {
    label: 'OpenRouter',
    storeAs: 'openai-compatible',
    baseUrl: 'https://openrouter.ai/api',
    defaultModel: 'anthropic/claude-sonnet-4',
    popularModels: ['anthropic/claude-sonnet-4', 'openai/gpt-4o', 'google/gemini-pro-1.5'],
    consoleUrl: 'https://openrouter.ai/keys',
  },
  custom: {
    label: '自定义',
    storeAs: 'openai-compatible',
    baseUrl: '',
    defaultModel: 'gpt-4o',
    popularModels: ['gpt-4o', 'gpt-4o-mini'],
    consoleUrl: null,
  },
}

function detectPreset(config: AIConfig): PresetKey {
  if (config.provider === 'anthropic') return 'anthropic'
  const url = (config.baseUrl || '').toLowerCase()
  if (url.includes('deepseek')) return 'deepseek'
  if (url.includes('siliconflow') || url.includes('silicon')) return 'siliconflow'
  if (url.includes('openrouter')) return 'openrouter'
  return 'custom'
}

function errorHint(raw: string): string {
  if (/401|unauthorized/i.test(raw)) return '401 · API Key 可能填写错误或已过期'
  if (/404|not.?found/i.test(raw)) return '404 · 模型名可能拼错或服务不可用'
  if (/429|rate/i.test(raw)) return '429 · 触发速率限制，稍后再试'
  if (/network|fetch|ECONN/i.test(raw)) return '网络错误 · 检查代理或接口地址'
  return raw.slice(0, 120)
}

export function AIConfigDialog({ projectId, open, onClose, isOnboarding = false, onSaveComplete }: AIConfigDialogProps) {
  const { config, saveConfig } = useAIConfig(projectId)
  const [presetKey, setPresetKey] = useState<PresetKey>('anthropic')
  const [apiKey, setApiKey] = useState('')
  const [model, setModel] = useState('')
  const [customBaseUrl, setCustomBaseUrl] = useState('')
  const [saving, setSaving] = useState(false)
  const [testResult, setTestResult] = useState<'success' | 'error' | null>(null)
  const [testErrorMsg, setTestErrorMsg] = useState('')
  const saveCompletedRef = useRef(false)
  const modelInputId = useId()
  const modelListId = useId()

  useEffect(() => {
    if (open) {
      saveCompletedRef.current = false
      const detected = detectPreset(config)
      setPresetKey(detected)
      setApiKey(config.apiKey ?? '')
      setModel(config.model ?? PRESETS[detected].defaultModel)
      setCustomBaseUrl(detected === 'custom' ? (config.baseUrl ?? '') : '')
      setTestResult(null)
      setTestErrorMsg('')
    }
  }, [open, config])

  const preset = PRESETS[presetKey]

  function handlePresetChange(next: PresetKey) {
    setPresetKey(next)
    setModel(PRESETS[next].defaultModel)
    if (next !== 'custom') setCustomBaseUrl('')
    setTestResult(null)
    setTestErrorMsg('')
  }

  async function handleTest() {
    setTestResult(null)
    setTestErrorMsg('')
    if (!apiKey) {
      setTestErrorMsg('请先填写 API Key')
      setTestResult('error')
      return
    }
    const baseUrl = presetKey === 'custom' ? customBaseUrl : preset.baseUrl
    if (!baseUrl) {
      setTestErrorMsg('请填写接口地址')
      setTestResult('error')
      return
    }

    try {
      const probeBase = baseUrl.replace(/\/+$/, '')
      if (preset.storeAs === 'anthropic') {
        const res = await fetch(`${probeBase}/v1/messages`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01',
            'anthropic-dangerous-direct-browser-access': 'true',
          },
          body: JSON.stringify({ model: model || preset.defaultModel, max_tokens: 1, messages: [{ role: 'user', content: 'ping' }] }),
        })
        if (!res.ok) {
          const body = await res.text().catch(() => '')
          throw new Error(body.slice(0, 200) || `HTTP ${res.status}`)
        }
        setTestResult('success')
      } else {
        const normalized = probeBase.endsWith('/v1') ? probeBase : `${probeBase}/v1`
        const response = await fetch(`${normalized}/models`, {
          headers: { Authorization: `Bearer ${apiKey}` },
        })
        if (!response.ok) {
          const body = await response.text().catch(() => '')
          throw new Error(body.slice(0, 200) || `HTTP ${response.status}`)
        }
        setTestResult('success')
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : '连接失败'
      setTestErrorMsg(errorHint(msg))
      setTestResult('error')
    }
  }

  async function handleSave() {
    setSaving(true)
    const baseUrl = presetKey === 'custom' ? customBaseUrl : preset.baseUrl
    await saveConfig({
      provider: preset.storeAs,
      apiKey,
      baseUrl,
      model: model || preset.defaultModel,
      availableModels: preset.popularModels,
    })
    saveCompletedRef.current = true
    setSaving(false)
    if (isOnboarding && onSaveComplete) {
      onSaveComplete()
    } else {
      onClose()
    }
  }

  function handleEscapeKeyDown(e: KeyboardEvent) {
    if (isOnboarding && !saveCompletedRef.current) e.preventDefault()
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function handleInteractOutside(e: any) {
    if (isOnboarding && !saveCompletedRef.current) e.preventDefault()
  }

  return (
    <Dialog open={open} onOpenChange={openState => { if (!openState && !isOnboarding) onClose() }}>
      <DialogContent
        className="sm:max-w-[460px]"
        onEscapeKeyDown={handleEscapeKeyDown}
        onInteractOutside={handleInteractOutside}
      >
        <DialogHeader>
          <DialogTitle>{isOnboarding ? '配置 AI' : 'AI 设置'}</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          {/* 服务商 chips */}
          <div className="space-y-2">
            <Label>服务商</Label>
            <div className="flex gap-1 p-1 rounded-[var(--radius-control)] bg-[hsl(var(--surface-2))]">
              {(Object.keys(PRESETS) as PresetKey[]).map(key => {
                const p = PRESETS[key]
                const active = presetKey === key
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => handlePresetChange(key)}
                    title={p.label}
                    className={
                      'flex-1 min-w-0 rounded-[var(--radius-control)] px-2 py-1.5 text-[12px] truncate transition-colors ' +
                      (active
                        ? 'bg-[hsl(var(--surface-0))] text-foreground shadow-sm relative before:absolute before:left-0 before:top-0 before:bottom-0 before:w-0.5 before:bg-[hsl(var(--accent))] before:rounded-full'
                        : 'text-muted-foreground hover:text-foreground')
                    }
                  >
                    {p.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* API Key */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="apiKey">API Key</Label>
              {preset.consoleUrl && (
                <a
                  href={preset.consoleUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[11px] text-muted-foreground hover:text-foreground flex items-center gap-0.5"
                >
                  获取 Key <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </div>
            <Input
              id="apiKey"
              type="password"
              value={apiKey}
              onChange={e => setApiKey(e.target.value)}
              placeholder={preset.storeAs === 'anthropic' ? 'sk-ant-...' : 'sk-...'}
            />
            <p className="text-[11px] text-muted-foreground">API Key 只保存在本地浏览器，不会上传</p>
          </div>

          {/* 接口地址（仅 custom） */}
          {presetKey === 'custom' && (
            <div className="space-y-1.5">
              <Label htmlFor="baseUrl">接口地址</Label>
              <Input
                id="baseUrl"
                type="text"
                value={customBaseUrl}
                onChange={e => setCustomBaseUrl(e.target.value)}
                placeholder="https://api.example.com/v1"
              />
            </div>
          )}

          {/* 模型 — datalist combobox */}
          <div className="space-y-1.5">
            <Label htmlFor={modelInputId}>模型</Label>
            <div className="relative">
              <input
                id={modelInputId}
                type="text"
                list={modelListId}
                value={model}
                onChange={e => setModel(e.target.value)}
                placeholder={preset.defaultModel}
                className="w-full h-9 px-3 rounded-[var(--radius-control)] bg-[hsl(var(--surface-2))] border border-[hsl(var(--border))] text-[13px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-[hsl(var(--accent))] transition-colors"
              />
              <datalist id={modelListId}>
                {preset.popularModels.map(m => <option key={m} value={m} />)}
              </datalist>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            </div>
          </div>

          {/* 连接状态 */}
          {testResult === 'success' && (
            <div className="flex items-center gap-2 text-[12px] text-[hsl(var(--success))]">
              <CheckCircle2 className="h-4 w-4" />
              <span>连接正常</span>
            </div>
          )}
          {testResult === 'error' && (
            <div className="flex items-center gap-2 text-[12px] text-[hsl(var(--accent-coral))]">
              <XCircle className="h-4 w-4 shrink-0" />
              <span>{testErrorMsg || '连接失败，请检查配置'}</span>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          {!isOnboarding && (
            <Button variant="ghost" onClick={handleTest} disabled={saving}>
              测试连接
            </Button>
          )}
          <Button
            onClick={handleSave}
            className={isOnboarding ? 'flex-1' : ''}
            disabled={saving || !apiKey}
          >
            {saving ? '保存中…' : '保存'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}