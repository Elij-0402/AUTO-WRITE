'use client'

import { useState, useEffect } from 'react'
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
import { CheckCircle2, Sparkles, XCircle } from 'lucide-react'

interface AIConfigDialogProps {
  projectId: string
  open: boolean
  onClose: () => void
}

interface ProviderPreset {
  label: string
  description: string
  defaultBaseUrl: string
  defaultModel: string
  supportsToolUse: boolean
}

const PROVIDER_PRESETS: Record<AIProvider, ProviderPreset> = {
  anthropic: {
    label: 'Anthropic Claude',
    description:
      '原生 Claude API。支持 prompt caching（世界观重复注入自动省 token）与结构化 tool use（更准的建议/矛盾检测）。',
    defaultBaseUrl: 'https://api.anthropic.com',
    defaultModel: 'claude-sonnet-4-5',
    supportsToolUse: true,
  },
  'openai-compatible': {
    label: 'OpenAI 兼容协议',
    description:
      '任何 OpenAI /chat/completions 兼容端点（OpenAI、DeepSeek、SiliconFlow、本地 LiteLLM 等）。建议使用回退到正则解析，精度较低。',
    defaultBaseUrl: 'https://api.openai.com',
    defaultModel: 'gpt-4',
    supportsToolUse: false,
  },
}

export function AIConfigDialog({ projectId, open, onClose }: AIConfigDialogProps) {
  const { config, saveConfig } = useAIConfig(projectId)
  const [formData, setFormData] = useState<Partial<AIConfig>>({})
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<'success' | 'error' | null>(null)
  const [modelList, setModelList] = useState<string[]>([])
  const [showModels, setShowModels] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string>('')

  useEffect(() => {
    if (open) {
      setFormData({
        provider: config.provider,
        apiKey: config.apiKey,
        baseUrl: config.baseUrl,
        model: config.model,
      })
      setTestResult(null)
      setErrorMsg('')
      setShowModels(false)
      setModelList([])
    }
  }, [open, config])

  const provider: AIProvider = formData.provider ?? 'anthropic'
  const preset = PROVIDER_PRESETS[provider]

  const handleProviderChange = (next: AIProvider) => {
    const nextPreset = PROVIDER_PRESETS[next]
    setFormData(prev => ({
      ...prev,
      provider: next,
      baseUrl: prev.baseUrl || nextPreset.defaultBaseUrl,
      model: nextPreset.defaultModel,
    }))
    setShowModels(false)
    setTestResult(null)
  }

  const handleDetectModels = async () => {
    setTesting(true)
    setTestResult(null)
    setErrorMsg('')
    setModelList([])

    try {
      if (!formData.apiKey) {
        setErrorMsg('请先填写 API Key')
        return
      }
      if (provider === 'openai-compatible' && !formData.baseUrl) {
        setErrorMsg('OpenAI 兼容模式需要填写 Base URL')
        return
      }

      if (provider === 'anthropic') {
        // Anthropic doesn't expose a /v1/models list over BYOK — skip detection
        // and just verify the key works by requesting a 1-token message.
        const probeBase = (formData.baseUrl || preset.defaultBaseUrl).replace(/\/+$/, '')
        const res = await fetch(`${probeBase}/v1/messages`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': formData.apiKey,
            'anthropic-version': '2023-06-01',
            'anthropic-dangerous-direct-browser-access': 'true',
          },
          body: JSON.stringify({
            model: formData.model || preset.defaultModel,
            max_tokens: 1,
            messages: [{ role: 'user', content: 'ping' }],
          }),
        })
        if (!res.ok) {
          const body = await res.text().catch(() => '')
          throw new Error(body.slice(0, 200) || `HTTP ${res.status}`)
        }
        setTestResult('success')
        return
      }

      const base = (formData.baseUrl || preset.defaultBaseUrl).replace(/\/+$/, '')
      const normalized = base.endsWith('/v1') ? base : `${base}/v1`
      const response = await fetch(`${normalized}/models`, {
        headers: { Authorization: `Bearer ${formData.apiKey}` },
      })
      if (!response.ok) {
        const body = await response.json().catch(() => ({}))
        throw new Error(body.error?.message || `HTTP ${response.status}`)
      }
      const data = await response.json()
      const models = (data?.data ?? []).map((m: { id: string }) => m.id)
      if (models.length === 0) {
        setErrorMsg('未找到任何模型，请检查 API 凭证')
        setTestResult('error')
        return
      }
      setModelList(models)
      setShowModels(true)
      setTestResult('success')
      if (!formData.model) setFormData(prev => ({ ...prev, model: models[0] }))
    } catch (error) {
      const msg = error instanceof Error ? error.message : '连接失败'
      setErrorMsg(msg)
      setTestResult('error')
    } finally {
      setTesting(false)
    }
  }

  const handleSave = async () => {
    await saveConfig({ ...formData, provider })
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>AI 设置</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          <div className="space-y-2">
            <Label>Provider</Label>
            <div className="grid grid-cols-2 gap-2">
              {(Object.keys(PROVIDER_PRESETS) as AIProvider[]).map(key => {
                const p = PROVIDER_PRESETS[key]
                const active = provider === key
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => handleProviderChange(key)}
                    className={`text-left border rounded-md px-3 py-2 transition-colors ${
                      active
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:bg-accent'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 text-sm font-medium">
                      {p.supportsToolUse && <Sparkles className="h-3 w-3 text-primary" />}
                      {p.label}
                    </div>
                    <div className="text-[11px] text-muted-foreground mt-0.5 leading-snug">
                      {p.description}
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="apiKey">API 密钥</Label>
            <Input
              id="apiKey"
              type="password"
              value={formData.apiKey || ''}
              onChange={e => setFormData({ ...formData, apiKey: e.target.value })}
              placeholder={provider === 'anthropic' ? 'sk-ant-...' : 'sk-...'}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="baseUrl">
              接口地址
              <span className="text-[11px] text-muted-foreground ml-1">
                （留空使用默认 {preset.defaultBaseUrl}）
              </span>
            </Label>
            <Input
              id="baseUrl"
              type="text"
              value={formData.baseUrl || ''}
              onChange={e => setFormData({ ...formData, baseUrl: e.target.value })}
              placeholder={preset.defaultBaseUrl}
            />
          </div>

          {testResult && (
            <div
              className={`flex items-center gap-2 text-sm ${
                testResult === 'success' ? 'text-green-600' : 'text-destructive'
              }`}
            >
              {testResult === 'success' ? (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  <span>已成功连接</span>
                </>
              ) : (
                <>
                  <XCircle className="h-4 w-4" />
                  <span>{errorMsg || '连接失败，请检查配置'}</span>
                </>
              )}
            </div>
          )}

          {showModels && modelList.length > 0 ? (
            <div className="space-y-2">
              <Label>模型列表</Label>
              <div className="border rounded-md p-1 max-h-48 overflow-y-auto">
                {modelList.map(model => (
                  <label
                    key={model}
                    className="flex items-center gap-2 cursor-pointer hover:bg-accent px-2 py-1 rounded-sm"
                  >
                    <input
                      type="radio"
                      name="model"
                      value={model}
                      checked={formData.model === model}
                      onChange={e => setFormData({ ...formData, model: e.target.value })}
                      className="w-4 h-4 text-primary"
                    />
                    <span className="text-sm">{model}</span>
                  </label>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="model">模型</Label>
              <Input
                id="model"
                type="text"
                value={formData.model || ''}
                onChange={e => setFormData({ ...formData, model: e.target.value })}
                placeholder={preset.defaultModel}
              />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleDetectModels}
            disabled={testing || !formData.apiKey}
          >
            {testing ? '测试中...' : provider === 'anthropic' ? '验证凭证' : '自动探测模型'}
          </Button>
          <Button onClick={handleSave}>保存</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
