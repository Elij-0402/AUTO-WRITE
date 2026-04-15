'use client'

import { useState } from 'react'
import { useAIConfig, AIConfig } from '@/lib/hooks/use-ai-config'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'

interface AIConfigDialogProps {
  projectId: string
  open: boolean
  onClose: () => void
}

export function AIConfigDialog({ projectId, open, onClose }: AIConfigDialogProps) {
  const { config, saveConfig } = useAIConfig(projectId)
  const [formData, setFormData] = useState<Partial<AIConfig>>({
    apiKey: config.apiKey,
    baseUrl: config.baseUrl,
    model: config.model || 'gpt-4'
  })
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<'success' | 'error' | null>(null)
  const [modelList, setModelList] = useState<string[]>([])
  const [showModels, setShowModels] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string>('')

  const handleDetectModels = async () => {
    setTesting(true)
    setTestResult(null)
    setErrorMsg('')
    setModelList([])
    
    try {
      if (!formData.baseUrl || !formData.apiKey) {
        setErrorMsg('请先填写 Base URL 和 API Key')
        setTesting(false)
        return
      }

      // 标准化 baseUrl（移除末尾的 /v1 或 /）
      let normalizedUrl = formData.baseUrl.trimRight()
      if (normalizedUrl.endsWith('/v1')) {
        normalizedUrl = normalizedUrl.slice(0, -3)
      }
      if (normalizedUrl.endsWith('/')) {
        normalizedUrl = normalizedUrl.slice(0, -1)
      }

      // 调用 models API（OpenAI 兼容格式）
      const response = await fetch(`${normalizedUrl}/v1/models`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${formData.apiKey}`
        }
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error?.message || `HTTP ${response.status}`)
      }

      let data
      try {
        data = await response.json()
      } catch (parseError) {
        throw new Error('服务器返回无效的 JSON 响应')
      }

      const models = data?.data?.map((m: any) => m.id) || []
      
      if (models.length === 0) {
        setErrorMsg('未找到任何模型，请检查 API 凭证')
        setTestResult('error')
      } else {
        setModelList(models)
        setShowModels(true)
        setTestResult('success')
        // 自动选择第一个模型
        if (models.length > 0 && !formData.model) {
          setFormData(prev => ({ ...prev, model: models[0] }))
        }
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : '连接失败'
      setErrorMsg(msg)
      setTestResult('error')
    } finally {
      setTesting(false)
    }
  }

  const handleSave = async () => {
    await saveConfig(formData)
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>AI 设置</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <label htmlFor="apiKey" className="text-right text-sm">
              API Key
            </label>
            <Input
              id="apiKey"
              type="password"
              value={formData.apiKey || ''}
              onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
              placeholder="sk-..."
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <label htmlFor="baseUrl" className="text-right text-sm">
              Base URL
            </label>
            <Input
              id="baseUrl"
              type="text"
              value={formData.baseUrl || ''}
              onChange={(e) => setFormData({ ...formData, baseUrl: e.target.value })}
              placeholder="https://api.openai.com"
              className="col-span-3"
            />
          </div>

          {/* 模型探测结果 */}
          {testResult && (
            <div className={testResult === 'success' ? 'text-green-600 text-sm' : 'text-red-600 text-sm'}>
              {testResult === 'success' ? '✓ 已成功连接' : `✗ ${errorMsg || '连接失败，请检查配置'}`}
            </div>
          )}

          {/* 模型列表选择 */}
          {showModels && modelList.length > 0 && (
            <div className="grid grid-cols-4 items-start gap-4">
              <label className="text-right text-sm">模型列表</label>
              <div className="col-span-3 border border-stone-300 dark:border-stone-700 rounded-lg p-2 max-h-48 overflow-y-auto">
                {modelList.map((model) => (
                  <div key={model} className="py-1">
                    <label className="flex items-center gap-2 cursor-pointer hover:bg-stone-100 dark:hover:bg-stone-800 px-2 py-1 rounded">
                      <input
                        type="radio"
                        name="model"
                        value={model}
                        checked={formData.model === model}
                        onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                        className="w-4 h-4"
                      />
                      <span className="text-sm">{model}</span>
                    </label>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 手动模型输入（备选） */}
          {!showModels && (
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="model" className="text-right text-sm">
                模型
              </label>
              <Input
                id="model"
                type="text"
                value={formData.model || ''}
                onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                placeholder="gpt-4 或自动探测"
                className="col-span-3"
              />
            </div>
          )}
        </div>
        <DialogFooter>
          <button
            type="button"
            onClick={handleDetectModels}
            disabled={testing || !formData.apiKey || !formData.baseUrl}
            className="px-4 py-2 text-sm border border-stone-300 dark:border-stone-700 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 disabled:opacity-50"
          >
            {testing ? '探测中...' : '自动探测模型'}
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            保存
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
