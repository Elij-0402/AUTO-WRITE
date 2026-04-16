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
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { CheckCircle2, XCircle } from 'lucide-react'

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

      let normalizedUrl = formData.baseUrl.trimRight()
      if (normalizedUrl.endsWith('/v1')) {
        normalizedUrl = normalizedUrl.slice(0, -3)
      }
      if (normalizedUrl.endsWith('/')) {
        normalizedUrl = normalizedUrl.slice(0, -1)
      }

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
        <div className="grid gap-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="apiKey">API 密钥</Label>
            <Input
              id="apiKey"
              type="password"
              value={formData.apiKey || ''}
              onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
              placeholder="sk-..."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="baseUrl">接口地址</Label>
            <Input
              id="baseUrl"
              type="text"
              value={formData.baseUrl || ''}
              onChange={(e) => setFormData({ ...formData, baseUrl: e.target.value })}
              placeholder="https://api.openai.com"
            />
          </div>

          {testResult && (
            <div className={`flex items-center gap-2 text-sm ${testResult === 'success' ? 'text-green-600' : 'text-destructive'}`}>
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

          {showModels && modelList.length > 0 && (
            <div className="space-y-2">
              <Label>模型列表</Label>
              <div className="border rounded-md p-1 max-h-48 overflow-y-auto">
                {modelList.map((model) => (
                  <label
                    key={model}
                    className="flex items-center gap-2 cursor-pointer hover:bg-accent px-2 py-1 rounded-sm"
                  >
                    <input
                      type="radio"
                      name="model"
                      value={model}
                      checked={formData.model === model}
                      onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                      className="w-4 h-4 text-primary"
                    />
                    <span className="text-sm">{model}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {!showModels && (
            <div className="space-y-2">
              <Label htmlFor="model">模型</Label>
              <Input
                id="model"
                type="text"
                value={formData.model || ''}
                onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                placeholder="gpt-4 或自动探测"
              />
            </div>
          )}
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleDetectModels}
            disabled={testing || !formData.apiKey || !formData.baseUrl}
          >
            {testing ? '探测中...' : '自动探测模型'}
          </Button>
          <Button onClick={handleSave}>
            保存
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
