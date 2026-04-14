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

  const handleSave = async () => {
    await saveConfig(formData)
    onClose()
  }

  const handleTest = async () => {
    setTesting(true)
    setTestResult(null)
    try {
      const response = await fetch(formData.baseUrl!, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${formData.apiKey}`
        },
        body: JSON.stringify({
          model: formData.model || 'gpt-4',
          messages: [{ role: 'user', content: 'test' }],
          max_tokens: 5
        })
      })
      if (response.ok) {
        setTestResult('success')
      } else {
        setTestResult('error')
      }
    } catch {
      setTestResult('error')
    }
    setTesting(false)
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
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
              value={formData.apiKey}
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
              value={formData.baseUrl}
              onChange={(e) => setFormData({ ...formData, baseUrl: e.target.value })}
              placeholder="https://api.openai.com/v1"
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <label htmlFor="model" className="text-right text-sm">
              Model
            </label>
            <Input
              id="model"
              type="text"
              value={formData.model}
              onChange={(e) => setFormData({ ...formData, model: e.target.value })}
              placeholder="gpt-4"
              className="col-span-3"
            />
          </div>
          {testResult && (
            <div className={testResult === 'success' ? 'text-green-600' : 'text-red-600'}>
              {testResult === 'success' ? '✓ 连接成功' : '✗ 连接失败，请检查配置'}
            </div>
          )}
        </div>
        <DialogFooter>
          <button
            type="button"
            onClick={handleTest}
            disabled={testing || !formData.apiKey || !formData.baseUrl}
            className="px-4 py-2 text-sm border border-zinc-300 dark:border-zinc-700 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-50"
          >
            {testing ? '测试中...' : '测试连接'}
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
