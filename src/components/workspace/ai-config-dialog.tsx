'use client'

import { useState, useEffect } from 'react'
import { useAIConfig, AIConfig, AIProvider } from '@/lib/hooks/use-ai-config'
import type { ExperimentFlags } from '@/lib/ai/experiment-flags'
import { providerCapabilities } from '@/lib/ai/experiment-flags'
import type { UiExperimentFlags } from '@/lib/ai/ui-flags'
import { DEFAULT_UI_FLAGS } from '@/lib/ai/ui-flags'
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
        availableModels: config.availableModels ?? [],
        experimentFlags: config.experimentFlags ?? { citations: false, extendedCacheTtl: false, thinking: false },
        uiFlags: config.uiFlags ?? DEFAULT_UI_FLAGS,
      })
      setTestResult(null)
      setErrorMsg('')
      const cached = config.availableModels ?? []
      setModelList(cached)
      setShowModels(cached.length > 0)
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
      availableModels: [],
    }))
    setShowModels(false)
    setModelList([])
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
      const defaultModel = formData.model && models.includes(formData.model) ? formData.model : models[0]
      setFormData(prev => ({ ...prev, model: defaultModel, availableModels: models }))
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
                    className={`relative text-left rounded-[var(--radius-card)] px-3 py-2.5 transition-[box-shadow,background-color] duration-[var(--dur-fast)] ${
                      active
                        ? 'surface-2 film-edge-active'
                        : 'surface-2 film-edge hover:film-edge-active'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 text-[13px] font-medium text-foreground">
                      {p.supportsToolUse && <Sparkles className="h-3 w-3 text-[hsl(var(--accent-amber))]" />}
                      {p.label}
                    </div>
                    <div className="text-[11px] text-muted-foreground mt-1 leading-[1.55]">
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
              className={`flex items-center gap-2 text-[12px] ${
                testResult === 'success' ? 'text-[hsl(var(--accent-jade))]' : 'text-[hsl(var(--accent-coral))]'
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
              <div className="rounded-[var(--radius-card)] surface-2 film-edge p-1 max-h-48 overflow-y-auto">
                {modelList.map(model => (
                  <label
                    key={model}
                    className="flex items-center gap-2 cursor-pointer hover:bg-[hsl(var(--surface-3))] px-2 py-1.5 rounded-[var(--radius-control)]"
                  >
                    <input
                      type="radio"
                      name="model"
                      value={model}
                      checked={formData.model === model}
                      onChange={e => setFormData({ ...formData, model: e.target.value })}
                      className="w-3.5 h-3.5 accent-[hsl(var(--accent-amber))]"
                    />
                    <span className="text-[13px] text-mono">{model}</span>
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

          <ExperimentFlagsSection
            provider={provider}
            flags={formData.experimentFlags ?? { citations: false, extendedCacheTtl: false, thinking: false }}
            onChange={next => setFormData(prev => ({ ...prev, experimentFlags: next }))}
          />

          <UiFlagsSection
            flags={formData.uiFlags ?? DEFAULT_UI_FLAGS}
            onChange={next => setFormData(prev => ({ ...prev, uiFlags: next }))}
          />
        </div>

        <DialogFooter>
          <Button
            variant="subtle"
            onClick={handleDetectModels}
            disabled={testing || !formData.apiKey}
          >
            {testing ? '测试中…' : provider === 'anthropic' ? '验证凭证' : '自动探测模型'}
          </Button>
          <Button onClick={handleSave}>保存</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

interface ExperimentFlagsSectionProps {
  provider: AIProvider
  flags: ExperimentFlags
  onChange: (next: ExperimentFlags) => void
}

const FLAG_LABELS: Record<keyof ExperimentFlags, { label: string; hint: string }> = {
  citations: {
    label: 'Citations API 溯源',
    hint: '强制 AI 将世界观引用标注到具体条目,防止幻觉。Phase C 启用。',
  },
  extendedCacheTtl: {
    label: '1 小时 prompt cache',
    hint: '长写作会话中世界观重用免 token,默认 5 分钟 TTL 延至 1 小时。Phase D 启用。',
  },
  thinking: {
    label: '一致性深度推理 (v1.1 预览)',
    hint: '遇到一致性检查时启用 extended thinking。仅记录实验偏好,实际行为 v1.1 上线。',
  },
}

function ExperimentFlagsSection({ provider, flags, onChange }: ExperimentFlagsSectionProps) {
  const caps = providerCapabilities(provider)
  return (
    <div className="space-y-2">
      <Label>实验性 AI 特性</Label>
      <div className="text-[11px] text-muted-foreground leading-[1.55]">
        Anthropic 2026 原语处于 A/B 测试阶段。记录到分析面板用于对比。
      </div>
      <div className="rounded-[var(--radius-card)] surface-2 film-edge p-2 space-y-1">
        {(Object.keys(FLAG_LABELS) as (keyof ExperimentFlags)[]).map(key => {
          const meta = FLAG_LABELS[key]
          const canEnable = caps[key]
          const checked = canEnable && flags[key]
          return (
            <label
              key={key}
              className={`flex items-start gap-2 px-2 py-1.5 rounded-[var(--radius-control)] ${
                canEnable ? 'cursor-pointer hover:bg-[hsl(var(--surface-3))]' : 'opacity-50'
              }`}
            >
              <input
                type="checkbox"
                checked={checked}
                disabled={!canEnable}
                onChange={e => onChange({ ...flags, [key]: e.target.checked })}
                className="mt-0.5 w-3.5 h-3.5 accent-[hsl(var(--accent-amber))]"
              />
              <div className="flex-1 min-w-0">
                <div className="text-[13px] text-foreground flex items-center gap-1.5">
                  {meta.label}
                  {!canEnable && (
                    <span className="text-[10px] text-muted-foreground">（仅 Anthropic）</span>
                  )}
                </div>
                <div className="text-[11px] text-muted-foreground mt-0.5 leading-[1.55]">
                  {meta.hint}
                </div>
              </div>
            </label>
          )
        })}
      </div>
    </div>
  )
}

interface UiFlagsSectionProps {
  flags: UiExperimentFlags
  onChange: (next: UiExperimentFlags) => void
}

const UI_FLAG_LABELS: Record<keyof UiExperimentFlags, { label: string; hint: string }> = {
  showGenerationPipeline: {
    label: 'AI 章节生成',
    hint: '在工作台和大纲里显示 "生成章节" 入口。v1 默认隐藏,需作者手动勾选。',
  },
  showStyleProfile: {
    label: '文风分析面板',
    hint: '在创作者分析页显示 "文风" 标签页。实验性功能,可能不稳定。',
  },
  showTimelineView: {
    label: '时间线视图',
    hint: '在创作者分析页显示 "时间线" 标签页。实验性功能,可能不稳定。',
  },
}

function UiFlagsSection({ flags, onChange }: UiFlagsSectionProps) {
  return (
    <div className="space-y-2">
      <Label>实验性界面模块</Label>
      <div className="text-[11px] text-muted-foreground leading-[1.55]">
        v1 默认只显示一致性核心工作流。以下模块代码保留但入口隐藏,按需开启。
      </div>
      <div className="rounded-[var(--radius-card)] surface-2 film-edge p-2 space-y-1">
        {(Object.keys(UI_FLAG_LABELS) as (keyof UiExperimentFlags)[]).map(key => {
          const meta = UI_FLAG_LABELS[key]
          const checked = flags[key]
          return (
            <label
              key={key}
              className="flex items-start gap-2 px-2 py-1.5 rounded-[var(--radius-control)] cursor-pointer hover:bg-[hsl(var(--surface-3))]"
            >
              <input
                type="checkbox"
                checked={checked}
                onChange={e => onChange({ ...flags, [key]: e.target.checked })}
                className="mt-0.5 w-3.5 h-3.5 accent-[hsl(var(--accent-amber))]"
              />
              <div className="flex-1 min-w-0">
                <div className="text-[13px] text-foreground">{meta.label}</div>
                <div className="text-[11px] text-muted-foreground mt-0.5 leading-[1.55]">
                  {meta.hint}
                </div>
              </div>
            </label>
          )
        })}
      </div>
    </div>
  )
}
