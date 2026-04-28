'use client'

import { useState, useEffect, useRef } from 'react'
import { useAIConfig, AIProvider } from '@/lib/hooks/use-ai-config'
import { validateURLForSSRF, SSRFError } from '@/lib/ai/ssrf-guard'
import { PRESETS, type PresetKey } from '@/lib/ai/config-presets'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { XCircle, ExternalLink } from 'lucide-react'

interface AIOnboardingDialogProps {
  open: boolean
  /** Called when user explicitly skips onboarding */
  onSkip: () => void
  /** Called on successful save */
  onSaveComplete: () => void
}

function errorHint(raw: string): string {
  if (/401|unauthorized/i.test(raw)) return '401 · API Key 可能填写错误或已过期'
  if (/404|not.?found/i.test(raw)) return '404 · 模型名可能拼错或服务不可用'
  if (/429|rate/i.test(raw)) return '429 · 触发速率限制，稍后再试'
  if (/network|fetch|ECONN/i.test(raw)) return '网络错误 · 检查代理或接口地址'
  return raw.slice(0, 120)
}

async function probeEndpoint(
  provider: AIProvider,
  baseUrl: string,
  apiKey: string,
  model: string
): Promise<void> {
  const probeBase = baseUrl.replace(/\/+$/, '')
  if (provider === 'anthropic') {
    const res = await fetch(`${probeBase}/v1/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({ model, max_tokens: 1, messages: [{ role: 'user', content: 'ping' }] }),
    })
    if (!res.ok) {
      const body = await res.text().catch(() => '')
      throw new Error(body.slice(0, 200) || `HTTP ${res.status}`)
    }
  } else {
    const normalized = probeBase.endsWith('/v1') ? probeBase : `${probeBase}/v1`
    const response = await fetch(`${normalized}/models`, {
      headers: { Authorization: `Bearer ${apiKey}` },
    })
    if (!response.ok) {
      const body = await response.text().catch(() => '')
      throw new Error(body.slice(0, 200) || `HTTP ${response.status}`)
    }
  }
}

export function AIOnboardingDialog({ open, onSkip, onSaveComplete }: AIOnboardingDialogProps) {
  const { saveConfig } = useAIConfig()
  const [presetKey, setPresetKey] = useState<PresetKey>('anthropic')
  const [apiKey, setApiKey] = useState('')
  const [model, setModel] = useState(PRESETS.anthropic.defaultModel)
  const [saving, setSaving] = useState(false)
  const [probeError, setProbeError] = useState('')
  const saveCompletedRef = useRef(false)

  useEffect(() => {
    if (open) {
      saveCompletedRef.current = false
      queueMicrotask(() => {
        setProbeError('')
        setApiKey('')
        setPresetKey('anthropic')
        setModel(PRESETS.anthropic.defaultModel)
      })
    }
  }, [open])

  const preset = PRESETS[presetKey]

  function handleProviderChange(next: PresetKey) {
    setPresetKey(next)
    setModel(PRESETS[next].defaultModel)
    setProbeError('')
  }

  async function handleSave() {
    setSaving(true)
    setProbeError('')
    try {
      const probeBase = preset.baseUrl.replace(/\/+$/, '')
      validateURLForSSRF(probeBase)
      await probeEndpoint(preset.storeAs, probeBase, apiKey, model || preset.defaultModel)
    } catch (err) {
      if (err instanceof SSRFError) {
        setProbeError('SSRF 防护：禁止访问内网或云元数据地址')
        setSaving(false)
        return
      }
      const msg = err instanceof Error ? err.message : '连接失败'
      setProbeError(errorHint(msg))
      setSaving(false)
      return
    }
    await saveConfig({
      provider: preset.storeAs,
      apiKey,
      baseUrl: preset.baseUrl,
      model: model || preset.defaultModel,
      availableModels: preset.popularModels,
    })
    saveCompletedRef.current = true
    setSaving(false)
    onSaveComplete()
  }

  function handleEscapeKeyDown(e: KeyboardEvent) {
    if (!saveCompletedRef.current) e.preventDefault()
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function handleInteractOutside(e: any) {
    if (!saveCompletedRef.current) e.preventDefault()
  }

  return (
    <Dialog open={open}>
      <DialogContent
        className="sm:max-w-[460px]"
        onEscapeKeyDown={handleEscapeKeyDown}
        onInteractOutside={handleInteractOutside}
      >
        <DialogHeader>
          <DialogTitle>配置 AI</DialogTitle>
          <DialogDescription>设置你的 AI API Key 以开始使用</DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          {/* 服务商 dropdown */}
          <div className="space-y-1.5">
            <Label htmlFor="onboard-provider">服务商</Label>
            <Select value={presetKey} onValueChange={(v: PresetKey) => handleProviderChange(v)}>
              <SelectTrigger id="onboard-provider">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(PRESETS) as PresetKey[]).map(key => (
                  <SelectItem key={key} value={key}>
                    {PRESETS[key].label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* API Key */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="onboard-apiKey">API Key</Label>
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
              id="onboard-apiKey"
              type="password"
              value={apiKey}
              onChange={e => setApiKey(e.target.value)}
              placeholder={preset.storeAs === 'anthropic' ? 'sk-ant-...' : 'sk-...'}
            />
            <p className="text-[11px] text-muted-foreground">API Key 只保存在本地浏览器，不会上传</p>
          </div>

          {/* 模型 — only shown when apiKey is non-empty */}
          {apiKey && (
            <div className="space-y-1.5">
              <Label htmlFor="onboard-model">模型</Label>
              <div>
                <Input
                  id="onboard-model"
                  type="text"
                  value={model}
                  onChange={e => setModel(e.target.value)}
                  placeholder={preset.defaultModel}
                  className="bg-[hsl(var(--surface-2))] focus-visible:border-[hsl(var(--accent))]"
                />
              </div>
            </div>
          )}

          {/* Probe error */}
          {probeError && (
            <div className="flex items-center gap-2 text-[12px] text-destructive">
              <XCircle className="h-4 w-4 shrink-0" />
              <span>{probeError}</span>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="ghost" onClick={onSkip}>
            跳过
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving || !apiKey}
          >
            {saving ? '保存中…' : '保存'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
