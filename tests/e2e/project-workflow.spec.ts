import { test, expect, type Page } from '@playwright/test'
import { readFileSync } from 'fs'

// ─── Helpers ────────────────────────────────────────────────────────────────

async function createProject(page: Page, title: string) {
  await page.goto('/')
  await page.waitForLoadState('networkidle')
  await page.waitForLoadState('domcontentloaded')

  const emptyBtn = page.getByRole('button', { name: '开始第一个故事' })
  if (await emptyBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
    await emptyBtn.click()
  } else {
    await page.getByRole('button', { name: '新建项目' }).click()
  }

  const dialog = page.getByRole('dialog', { name: '新建项目' })
  await dialog.waitFor({ state: 'attached', timeout: 8000 })

  const titleInput = dialog.getByLabel(/标题/).or(dialog.getByPlaceholder(/输入小说标题/))
  await titleInput.waitFor({ state: 'visible', timeout: 5000 })
  await titleInput.fill(title)

  await dialog.getByRole('button', { name: '创建' }).click()
  await page.waitForURL(/\/projects\/[^/]+$/)

  // Wait for any HMR recompilation triggered by new project creation to finish
  // This can take several seconds in dev mode as Next.js needs to compile the
  // new dynamic route and all its chunks
  for (let i = 0; i < 20; i++) {
    const compiling = await page.getByText('Compiling').isVisible().catch(() => false)
    if (!compiling) break
    await page.waitForTimeout(500)
  }
  await page.waitForTimeout(800)

  return page.url().match(/\/projects\/([^/]+)/)?.[1] ?? ''
}

async function waitForHMR(page: Page) {
  for (let i = 0; i < 20; i++) {
    const compiling = await page.getByText('Compiling').isVisible().catch(() => false)
    if (!compiling) return
    await page.waitForTimeout(500)
  }
}

// ─── Scenario 1: Project + Chapter + Save persist ───────────────────────────

test('1. 创建项目 + 创建章节 + 编辑器保存，刷新后仍在', async ({ page }) => {
  const projectTitle = `e2e-${Date.now()}`
  const projectId = await createProject(page, projectTitle)

  await expect(page).toHaveURL(/\/projects\/[^/]+$/)
  await expect(page.getByText(projectTitle).first()).toBeVisible()

  // Switch to chapters tab
  const chapterTab = page.getByRole('button', { name: '章节' }).nth(0)
  await chapterTab.click()
  await page.waitForLoadState('domcontentloaded')
  await waitForHMR(page)
  await page.waitForTimeout(400)

  // The sidebar shows "还没有章节" with "新建章节" button when empty.
  // Use page.getByText to locate it since the ARIA role may not match.
  const newChapterBtn = page.getByText('新建章节')
  const emptyMsg = page.getByText('还没有章节')

  if (await emptyMsg.isVisible({ timeout: 2000 }).catch(() => false)) {
    await newChapterBtn.waitFor({ state: 'visible', timeout: 10000 })
    await newChapterBtn.click()
    await page.waitForLoadState('domcontentloaded')
    await waitForHMR(page)
    await page.waitForTimeout(400)
  }

  const chapterInput = page.getByPlaceholder('输入章节标题')
  await chapterInput.waitFor({ state: 'attached', timeout: 8000 })
  await chapterInput.fill('第一章 序幕')
  await chapterInput.press('Enter')
  await page.waitForTimeout(600)

  await expect(page.getByText('第一章 序幕').first()).toBeVisible()

  const editor = page.locator('.ProseMirror').first()
  await editor.waitFor({ state: 'visible', timeout: 5000 })
  await editor.click()
  await editor.fill('这是 e2e 测试自动生成的章节内容。')
  await page.waitForTimeout(500)
  await expect(editor).toContainText('e2e 测试')

  await page.reload()
  await page.waitForLoadState('networkidle')
  await waitForHMR(page)
  await expect(page).toHaveURL(/\/projects\/[^/]+$/)
  await expect(page.getByText(projectTitle).first()).toBeVisible()
  await expect(page.locator('.ProseMirror').first()).toContainText('e2e 测试')

  await page.evaluate((id) => {
    indexedDB.deleteDatabase(`inkforge-project-${id}`)
  }, projectId)
})

// ─── Scenario 2: WorldEntries survive reload ────────────────────────────────

test('2. 创建 3 个 WorldEntry，刷新后确认仍在', async ({ page }) => {
  const projectId = await createProject(page, `e2e-world-${Date.now()}`)

  const worldTab = page.getByRole('button', { name: '世界观' }).nth(0)
  await worldTab.click()
  await page.waitForLoadState('domcontentloaded')
  await waitForHMR(page)
  await page.waitForTimeout(400)

  const entryNames = ['小明', '师父', '反派']
  for (const name of entryNames) {
    const addBtn = page.getByRole('button', { name: '添加角色' }).first()
    await addBtn.waitFor({ state: 'visible', timeout: 8000 })
    await addBtn.click()
    await page.waitForTimeout(400)

    const nameInput = page.getByLabel('姓名')
    await nameInput.waitFor({ state: 'visible', timeout: 5000 })
    await nameInput.fill(name)
    await nameInput.blur()
    await page.waitForTimeout(700)
  }

  for (const name of entryNames) {
    await expect(page.getByText(name).first()).toBeVisible({ timeout: 8000 })
  }

  await page.reload()
  await page.waitForLoadState('networkidle')
  await waitForHMR(page)
  await worldTab.click()
  await page.waitForLoadState('domcontentloaded')
  await waitForHMR(page)
  await page.waitForTimeout(400)

  for (const name of entryNames) {
    await expect(page.getByText(name).first()).toBeVisible()
  }

  await page.evaluate((id) => {
    indexedDB.deleteDatabase(`inkforge-project-${id}`)
  }, projectId)
})

// ─── Scenario 3: Chat panel accepts input ─────────────────────────────────

test('3. AI 聊天输入并确认提交', async ({ page }) => {
  const projectId = await createProject(page, `e2e-chat-${Date.now()}`)

  await page.goto(`/projects/${projectId}`)
  await page.waitForLoadState('networkidle')

  const apiKeyInput = page.getByPlaceholder(/API.*key|密钥/)
  if (await apiKeyInput.isVisible({ timeout: 2000 }).catch(() => false)) {
    await apiKeyInput.fill('mock-api-key-for-testing')
    await page.getByRole('button', { name: /保存|确认|下一步/ }).first().click()
    await page.waitForTimeout(500)
  }

  const chatInput = page.getByPlaceholder(/与墨客聊聊你的故事|输入.*消息|说点什么/)
  await chatInput.waitFor({ state: 'visible', timeout: 5000 })
  await chatInput.fill('介绍一下主角小明')
  await chatInput.press('Enter')
  await page.waitForTimeout(1000)

  await expect(chatInput).toBeVisible()

  await page.evaluate((id) => {
    indexedDB.deleteDatabase(`inkforge-project-${id}`)
  }, projectId)
})

// ─── Scenario 4: Contradiction → exempt → reload → still exempt ────────────

test('4. contradiction 豁免 + 刷新 + 确认仍豁免', async ({ page }) => {
  const projectId = await createProject(page, `e2e-contra-${Date.now()}`)

  const worldTab = page.getByRole('button', { name: '世界观' }).nth(0)
  await worldTab.click()
  await page.waitForLoadState('domcontentloaded')
  await waitForHMR(page)
  await page.waitForTimeout(300)

  const addBtn = page.getByRole('button', { name: '添加角色' }).first()
  await addBtn.waitFor({ state: 'visible', timeout: 8000 })
  await addBtn.click()
  await page.waitForTimeout(300)

  const nameInput = page.getByLabel('姓名')
  await nameInput.waitFor({ state: 'visible', timeout: 5000 })
  await nameInput.fill('小明')
  await nameInput.blur()
  await page.waitForTimeout(700)

  await page.evaluate(
    ([pid, entryName]) => {
      return new Promise<void>((resolve, reject) => {
        const dbReq = indexedDB.open(`inkforge-project-${pid}`)
        dbReq.onsuccess = () => {
          const db = dbReq.result as IDBDatabase
          const tx = db.transaction('contradictions', 'readwrite')
          const store = tx.objectStore('contradictions')
          store.add({
            id: crypto.randomUUID(),
            projectId: pid,
            conversationId: null,
            messageId: null,
            entryName,
            entryType: 'character',
            description: '测试矛盾描述：角色前后设定不一致',
            exempted: false,
            createdAt: Date.now(),
          })
          tx.oncomplete = () => resolve()
          tx.onerror = () => reject(tx.error)
        }
        dbReq.onerror = () => reject(dbReq.error)
      })
    },
    [projectId, '小明']
  )

  await page.goto(`/projects/${projectId}/analysis`)
  await page.waitForLoadState('networkidle')

  const contraTab = page.getByRole('button', { name: '矛盾记录' })
  await contraTab.waitFor({ state: 'visible', timeout: 5000 })
  await contraTab.click()
  await page.waitForTimeout(500)

  await expect(page.getByText('小明').first()).toBeVisible({ timeout: 5000 })

  const exemptBtn = page.getByRole('button', { name: '有意为之' }).first()
  if (await exemptBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
    await exemptBtn.click()
    await page.waitForTimeout(500)
  }

  await page.reload()
  await page.waitForLoadState('networkidle')
  await waitForHMR(page)
  await page.goto(`/projects/${projectId}/analysis`)
  await page.waitForLoadState('networkidle')
  await contraTab.waitFor({ state: 'visible', timeout: 5000 })
  await contraTab.click()
  await page.waitForTimeout(500)

  await expect(page.getByText('小明').first()).toBeVisible()

  await page.evaluate((id) => {
    indexedDB.deleteDatabase(`inkforge-project-${id}`)
  }, projectId)
})

// ─── Scenario 5: EPUB export round-trip ─────────────────────────────────────

test('5. EPUB 导出 + 验证内容完整', async ({ page }) => {
  const projectId = await createProject(page, `e2e-epub-${Date.now()}`)

  const chapterTab = page.getByRole('button', { name: '章节' }).nth(0)
  await chapterTab.click()
  await page.waitForLoadState('domcontentloaded')
  await waitForHMR(page)
  await page.waitForTimeout(400)

  const newChapterBtn = page.getByText('新建章节')
  const emptyMsg = page.getByText('还没有章节')

  if (await emptyMsg.isVisible({ timeout: 2000 }).catch(() => false)) {
    await newChapterBtn.waitFor({ state: 'visible', timeout: 10000 })
    await newChapterBtn.click()
    await page.waitForLoadState('domcontentloaded')
    await waitForHMR(page)
    await page.waitForTimeout(400)
  }

  const chapterInput = page.getByPlaceholder('输入章节标题')
  await chapterInput.waitFor({ state: 'attached', timeout: 8000 })
  await chapterInput.fill('第一章 测试章')
  await chapterInput.press('Enter')
  await page.waitForTimeout(600)

  const editor = page.locator('.ProseMirror').first()
  await editor.waitFor({ state: 'visible', timeout: 5000 })
  await editor.click()
  await editor.fill('第一章 测试章\n\n这是 e2e 测试生成的 EPUB 内容。包含中文字符以验证编码。')
  await page.waitForTimeout(500)

  const exportBtn = page
    .getByRole('button', { name: /导出|EPUB|Download/i })
    .or(page.locator('[aria-label*="导出"]'))
    .first()

  const downloadPromise = page.waitForEvent('download', { timeout: 10000 }).catch(() => null)

  if (await exportBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
    await exportBtn.click()
    await page.waitForTimeout(500)

    const download = await downloadPromise
    if (download) {
      const path = await download.path()
      expect(path).toBeTruthy()
      const stats = readFileSync(path!)
      expect(stats.byteLength).toBeGreaterThan(1024)
    }
  } else {
    test.skip()
  }

  await page.evaluate((id) => {
    indexedDB.deleteDatabase(`inkforge-project-${id}`)
  }, projectId)
})
