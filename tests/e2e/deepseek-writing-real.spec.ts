import { test, expect, type Page } from '@playwright/test'

const deepseekApiKey = process.env.E2E_DEEPSEEK_API_KEY

test.describe.configure({ mode: 'serial' })

test.skip(!deepseekApiKey, 'Set E2E_DEEPSEEK_API_KEY to run the real DeepSeek writing flow')

async function createProject(page: Page, title: string) {
  await page.goto('/')
  await page.waitForLoadState('networkidle')

  const emptyBtn = page.getByRole('button', { name: '开始第一个故事' })
  if (await emptyBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
    await emptyBtn.click()
  } else {
    await page.getByRole('button', { name: '新建项目' }).click()
  }

  const dialog = page.getByRole('dialog', { name: '新建项目' })
  await dialog.waitFor({ state: 'visible', timeout: 10000 })
  await dialog.getByLabel('标题 *').fill(title)
  await dialog.getByRole('button', { name: '创建' }).click()
  await page.waitForURL(/\/projects\/[^/?#]+(?:\?.*)?$/, { timeout: 15000 })
  await waitForHMR(page)
}

async function waitForHMR(page: Page) {
  for (let i = 0; i < 20; i++) {
    const compiling = await page.getByText('Compiling').isVisible().catch(() => false)
    if (!compiling) return
    await page.waitForTimeout(500)
  }
}

test('real DeepSeek config can answer a realistic writing prompt', async ({ page, browserName }) => {
  test.skip(browserName !== 'chromium', 'Real-provider verification only runs on Chromium locally.')

  const consoleErrors: string[] = []
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text())
    }
  })

  await createProject(page, `deepseek-real-${Date.now()}`)
  await waitForHMR(page)
  await page.evaluate(async (apiKey) => {
    const openReq = indexedDB.open('inkforge-meta')
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      openReq.onsuccess = () => resolve(openReq.result)
      openReq.onerror = () => reject(openReq.error)
    })

    try {
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction('aiConfig', 'readwrite')
        tx.objectStore('aiConfig').put({
          id: 'config',
          provider: 'openai-compatible',
          apiKey,
          baseUrl: 'https://api.deepseek.com',
          model: 'deepseek-v4-flash',
          availableModels: ['deepseek-v4-flash', 'deepseek-v4-pro'],
        })
        tx.oncomplete = () => resolve()
        tx.onerror = () => reject(tx.error)
      })
    } finally {
      db.close()
    }
  }, deepseekApiKey!)

  await page.reload()
  await page.waitForLoadState('domcontentloaded')
  await waitForHMR(page)
  await expect(page.getByRole('combobox', { name: '选择模型' })).toContainText('deepseek-v4-flash')

  const prompt = '我在写《雾港雨夜》。第一行请先输出“写作链路正常”，然后再用 3 条列点分析女主沈昭的核心矛盾、外在目标和一个适合第一章的开场钩子。最后单独一行输出“END-DEEPSEEK-CHECK”。'
  const chatInput = page.getByPlaceholder('你想写一个什么故事，或者想要什么感觉？')
    .or(page.getByPlaceholder('与墨客聊聊你的故事…'))
  await chatInput.fill(prompt)
  await page.getByRole('button', { name: '发送' }).click()

  const assistantReply = page.locator('div')
    .filter({ hasText: '墨客' })
    .filter({ hasText: 'END-DEEPSEEK-CHECK' })
    .first()
  await expect(assistantReply).toBeVisible({ timeout: 30000 })
  expect(consoleErrors.some((entry) => entry.includes('API 错误 400'))).toBe(false)
})
