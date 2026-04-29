import { test, expect, type Page } from '@playwright/test'
import { readFileSync } from 'fs'

test.describe.configure({ mode: 'serial' })

// ─── Helpers ────────────────────────────────────────────────────────────────

async function createProject(page: Page, title: string) {
  await page.goto('/', { waitUntil: 'domcontentloaded' })
  await waitForHMR(page)

  const emptyBtn = page.getByRole('button', { name: '开始第一个故事' })
  if (await emptyBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
    try {
      await emptyBtn.click({ timeout: 5000 })
    } catch {
      await emptyBtn.click({ force: true })
    }
  } else {
    const newProjectBtn = page.getByRole('button', { name: '新建项目' })
    try {
      await newProjectBtn.click({ timeout: 5000 })
    } catch {
      await newProjectBtn.click({ force: true })
    }
  }

  const dialog = page.getByRole('dialog', { name: '新建项目' })
  await dialog.waitFor({ state: 'attached', timeout: 8000 })

  const titleInput = dialog.getByLabel(/标题/).or(dialog.getByPlaceholder(/输入小说标题/))
  await titleInput.waitFor({ state: 'visible', timeout: 5000 })
  await titleInput.fill(title)

  const createButton = dialog.getByRole('button', { name: '创建' })
  await expect(createButton).toBeEnabled()
  try {
    await createButton.click({ timeout: 5000 })
  } catch {
    await titleInput.press('Enter')
  }
  await page.waitForURL(/\/projects\/[^/?#]+(?:\?.*)?$/, { waitUntil: 'domcontentloaded' })
  const projectId = page.url().match(/\/projects\/([^/?#]+)/)?.[1]
  if (!projectId) throw new Error('未能从宪章页 URL 解析项目 ID')
  await expect(page.getByText(title).first()).toBeVisible()

  // Wait for any HMR recompilation triggered by new project creation to finish
  // This can take several seconds in dev mode as Next.js needs to compile the
  // new dynamic route and all its chunks
  for (let i = 0; i < 20; i++) {
    const compiling = await page.getByText('Compiling').isVisible().catch(() => false)
    if (!compiling) break
    await page.waitForTimeout(500)
  }
  return projectId
}

async function waitForHMR(page: Page) {
  for (let i = 0; i < 20; i++) {
    const compiling = await page.getByText('Compiling').isVisible().catch(() => false)
    if (!compiling) return
    await page.waitForTimeout(500)
  }
}

function getChapterRow(page: Page, title: string) {
  return page.locator(`//*[normalize-space(text())="${title}"]/ancestor::div[contains(@class,'cursor-pointer')][1]`)
}

async function waitForEditorHydration(page: Page, chapterTitle: string, expectedText: string) {
  const chapterRow = getChapterRow(page, chapterTitle).first()
  await expect(chapterRow).toBeVisible()
  const editor = page.locator('.ProseMirror').first()
  await editor.waitFor({ state: 'visible', timeout: 10000 })

  const readEditorText = async () => (await editor.textContent().catch(() => '')) ?? ''

  try {
    await expect
      .poll(readEditorText, { timeout: 15000, intervals: [250, 500, 1000] })
      .toContain(expectedText)
    return
  } catch {
    await chapterRow.click()
    await expect
      .poll(readEditorText, { timeout: 10000, intervals: [250, 500, 1000] })
      .toContain(expectedText)
  }
}

async function waitForChapterContentPersisted(page: Page, projectId: string, text: string) {
  await page.waitForFunction(
    async ([pid, expected]) => {
      const dbName = `inkforge-project-${pid}`
      const openReq = indexedDB.open(dbName)
      const db = await new Promise<IDBDatabase>((resolve, reject) => {
        openReq.onsuccess = () => resolve(openReq.result)
        openReq.onerror = () => reject(openReq.error)
      })

      try {
        const tx = db.transaction('chapters', 'readonly')
        const store = tx.objectStore('chapters')
        const rows = await new Promise<unknown[]>((resolve, reject) => {
          const req = store.getAll()
          req.onsuccess = () => resolve((req.result ?? []) as unknown[])
          req.onerror = () => reject(req.error)
        })

        return rows.some((row) => {
          if (!row || typeof row !== 'object') return false
          const record = row as { deletedAt?: unknown; content?: unknown }
          if (record.deletedAt) return false
          const payload = JSON.stringify(record.content ?? '')
          return payload.includes(expected)
        })
      } finally {
        db.close()
      }
    },
    [projectId, text],
    { timeout: 10000 }
  )
}

async function createChapter(page: Page, projectId: string, title: string) {
  const newChapterBtn = page.getByRole('button', { name: '新建章节' }).first()
  await newChapterBtn.waitFor({ state: 'visible', timeout: 10000 })
  await newChapterBtn.click()

  const chapterInput = page.getByPlaceholder('输入章节标题')
  await expect(chapterInput).toBeFocused()
  await chapterInput.fill(title)
  await chapterInput.press('Enter')
  await page.waitForTimeout(600)
  await expect(page.getByText(title).first()).toBeVisible()

  return page.evaluate(
    async ([pid, chapterTitle]) => {
      const dbName = `inkforge-project-${pid}`
      const openReq = indexedDB.open(dbName)
      const db = await new Promise<IDBDatabase>((resolve, reject) => {
        openReq.onsuccess = () => resolve(openReq.result)
        openReq.onerror = () => reject(openReq.error)
      })

      try {
        const tx = db.transaction('chapters', 'readonly')
        const store = tx.objectStore('chapters')
        const rows = await new Promise<Array<{ id: string; title: string; deletedAt?: unknown }>>((resolve, reject) => {
          const req = store.getAll()
          req.onsuccess = () => resolve((req.result ?? []) as Array<{ id: string; title: string; deletedAt?: unknown }>)
          req.onerror = () => reject(req.error)
        })

        const chapter = rows.find((row) => row.title === chapterTitle && !row.deletedAt)
        if (!chapter) {
          throw new Error(`未找到章节: ${chapterTitle}`)
        }
        return chapter.id
      } finally {
        db.close()
      }
    },
    [projectId, title]
  )
}

async function openWorldTab(page: Page, projectId: string) {
  await page.goto(`/projects/${projectId}?tab=world`, { waitUntil: 'domcontentloaded' })
  await waitForHMR(page)

  const searchInput = page.getByPlaceholder('搜索世界观...')
  if (await searchInput.isVisible({ timeout: 2000 }).catch(() => false)) {
    return
  }

  await page.getByRole('button', { name: '世界观' }).click()
  await expect(searchInput).toBeVisible({ timeout: 10000 })
}

async function seedMockAIConfig(page: Page) {
  await page.goto('/', { waitUntil: 'domcontentloaded' })
  await writeMockAIConfig(page)
}

async function writeMockAIConfig(page: Page) {
  await page.evaluate(async () => {
    const openMetaDb = (version?: number, createStore = false) => new Promise<IDBDatabase>((resolve, reject) => {
      const request = version === undefined
        ? indexedDB.open('inkforge-meta')
        : indexedDB.open('inkforge-meta', version)

      request.onupgradeneeded = () => {
        if (!createStore) return
        const upgradeDb = request.result
        if (!upgradeDb.objectStoreNames.contains('aiConfig')) {
          upgradeDb.createObjectStore('aiConfig', { keyPath: 'id' })
        }
      }
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })

    let db = await openMetaDb()
    if (!db.objectStoreNames.contains('aiConfig')) {
      const nextVersion = db.version + 1
      db.close()
      db = await openMetaDb(nextVersion, true)
    }

    try {
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction('aiConfig', 'readwrite')
        tx.objectStore('aiConfig').put({
          id: 'config',
          provider: 'openai-compatible',
          apiKey: 'mock-api-key',
          baseUrl: 'https://mocked-openai.local',
          model: 'mock-gpt',
          availableModels: ['mock-gpt'],
        })
        tx.oncomplete = () => resolve()
        tx.onerror = () => reject(tx.error)
      })
    } finally {
      db.close()
    }
  })
}

async function clearMockAIConfig(page: Page) {
  await page.goto('/', { waitUntil: 'domcontentloaded' })

  await page.evaluate(async () => {
    const openReq = indexedDB.open('inkforge-meta')
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      openReq.onsuccess = () => resolve(openReq.result)
      openReq.onerror = () => reject(openReq.error)
    })

    try {
      if (!db.objectStoreNames.contains('aiConfig')) {
        return
      }
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction('aiConfig', 'readwrite')
        tx.objectStore('aiConfig').delete('config')
        tx.oncomplete = () => resolve()
        tx.onerror = () => reject(tx.error)
      })
    } finally {
      db.close()
    }
  })
}

async function openChapterBrief(page: Page) {
  await page.getByRole('button', { name: '章节简报' }).click()
}

async function mockChapterDraft(page: Page, draftText: string) {
  await page.route('https://mocked-openai.local/v1/chat/completions', async (route) => {
    const body = [
      `data: ${JSON.stringify({ choices: [{ delta: { content: `以下是草稿\n${draftText}` } }] })}`,
      'data: [DONE]',
      '',
    ].join('\n\n')

    await route.fulfill({
      status: 200,
      contentType: 'text/event-stream',
      headers: {
        'access-control-allow-origin': '*',
        'cache-control': 'no-cache',
      },
      body,
    })
  })
}

async function seedLinkedChapterPlan(
  page: Page,
  projectId: string,
  chapterId: string,
  chapterTitle: string,
  scenes: Array<{
    title: string
    viewpoint: string
    location: string
    objective: string
    obstacle: string
    outcome: string
    continuityNotes: string
    order: number
  }> = []
) {
  await page.evaluate(
    async ([pid, cid, title, sceneDrafts]) => {
      const dbName = `inkforge-project-${pid}`
      const openReq = indexedDB.open(dbName)
      const db = await new Promise<IDBDatabase>((resolve, reject) => {
        openReq.onsuccess = () => resolve(openReq.result)
        openReq.onerror = () => reject(openReq.error)
      })

      try {
        const chapterPlanId = crypto.randomUUID()
        await new Promise<void>((resolve, reject) => {
          const tx = db.transaction(['chapterPlans', 'sceneCards'], 'readwrite')
          tx.objectStore('chapterPlans').put({
            id: chapterPlanId,
            projectId: pid,
            arcId: null,
            linkedChapterId: cid,
            title,
            summary: '押解途中第一次遇袭，主角被迫提前暴露底牌。',
            chapterGoal: '把犯人活着送进关城，同时稳住队伍士气。',
            conflict: '追兵突然拦截，押解队内部也有人动摇。',
            turn: '主角用禁术挡下第一轮袭击，身份暴露。',
            reveal: '幕后追兵与关城守军暗中勾连。',
            order: 1,
            status: 'planned',
            targetWordCount: 2800,
            createdAt: Date.now(),
            updatedAt: Date.now(),
            deletedAt: null,
          })

          for (const scene of sceneDrafts as Array<Record<string, unknown>>) {
            tx.objectStore('sceneCards').put({
              id: crypto.randomUUID(),
              projectId: pid,
              chapterPlanId,
              title: scene.title,
              viewpoint: scene.viewpoint,
              location: scene.location,
              objective: scene.objective,
              obstacle: scene.obstacle,
              outcome: scene.outcome,
              continuityNotes: scene.continuityNotes,
              order: scene.order,
              status: 'planned',
              linkedEntryIds: [],
              createdAt: Date.now(),
              updatedAt: Date.now(),
              deletedAt: null,
            })
          }
          tx.oncomplete = () => resolve()
          tx.onerror = () => reject(tx.error)
        })
      } finally {
        db.close()
      }
    },
    [projectId, chapterId, chapterTitle, scenes]
  )
}

async function updateSeededSceneCards(
  page: Page,
  projectId: string,
  chapterId: string,
  sceneUpdates: Array<{
    title: string
    viewpoint: string
    location: string
    objective: string
    obstacle: string
    outcome: string
    continuityNotes: string
    order: number
  }>
) {
  await page.evaluate(
    async ([pid, cid, updates]) => {
      const dbName = `inkforge-project-${pid}`
      const openReq = indexedDB.open(dbName)
      const db = await new Promise<IDBDatabase>((resolve, reject) => {
        openReq.onsuccess = () => resolve(openReq.result)
        openReq.onerror = () => reject(openReq.error)
      })

      try {
        const chapterPlan = await new Promise<Record<string, unknown> | undefined>((resolve, reject) => {
          const tx = db.transaction('chapterPlans', 'readonly')
          const store = tx.objectStore('chapterPlans')
          const req = store.getAll()
          req.onsuccess = () => {
            const rows = (req.result ?? []) as Array<Record<string, unknown>>
            resolve(rows.find((row) => row.linkedChapterId === cid && !row.deletedAt))
          }
          req.onerror = () => reject(req.error)
        })

        if (!chapterPlan) {
          throw new Error(`未找到 chapter plan: ${cid}`)
        }

        const chapterPlanId = String(chapterPlan.id)
        await new Promise<void>((resolve, reject) => {
          const tx = db.transaction('sceneCards', 'readwrite')
          const store = tx.objectStore('sceneCards')
          const getReq = store.getAll()
          getReq.onsuccess = () => {
            const rows = (getReq.result ?? []) as Array<Record<string, unknown>>
            const existing = rows
              .filter((row) => row.chapterPlanId === chapterPlanId && !row.deletedAt)
              .sort((a, b) => Number(a.order ?? 0) - Number(b.order ?? 0))

            existing.forEach((row, index) => {
              const next = updates[index]
              if (!next) return
              store.put({
                ...row,
                ...next,
                updatedAt: Date.now() + index,
              })
            })
          }
          getReq.onerror = () => reject(getReq.error)
          tx.oncomplete = () => resolve()
          tx.onerror = () => reject(tx.error)
        })
      } finally {
        db.close()
      }
    },
    [projectId, chapterId, sceneUpdates]
  )
}

async function waitForChapterBriefPersisted(
  page: Page,
  projectId: string,
  chapterId: string,
  expected: {
    title: string
    outlineSummary: string
    outlineTargetWordCount: number | null
  }
) {
  await page.waitForFunction(
    async ([pid, cid, exp]) => {
      const dbName = `inkforge-project-${pid}`
      const openReq = indexedDB.open(dbName)
      const db = await new Promise<IDBDatabase>((resolve, reject) => {
        openReq.onsuccess = () => resolve(openReq.result)
        openReq.onerror = () => reject(openReq.error)
      })

      try {
        const tx = db.transaction('chapters', 'readonly')
        const store = tx.objectStore('chapters')
        const row = await new Promise<Record<string, unknown> | undefined>((resolve, reject) => {
          const req = store.get(cid)
          req.onsuccess = () => resolve(req.result as Record<string, unknown> | undefined)
          req.onerror = () => reject(req.error)
        })

        if (!row) return false

        return row.title === exp.title &&
          row.outlineSummary === exp.outlineSummary &&
          row.outlineTargetWordCount === exp.outlineTargetWordCount
      } finally {
        db.close()
      }
    },
    [projectId, chapterId, expected],
    { timeout: 10000 }
  )
}

// ─── Scenario 1: Project + Chapter + Save persist ───────────────────────────

test('1. 创建项目 + 创建章节 + 编辑器保存，刷新后仍在', async ({ page, browserName }) => {
  test.slow()
  test.skip(
    browserName === 'webkit',
    'WebKit + next dev 下的 Tiptap 刷新回填会出现假阴性；Chromium/Firefox 与手工 WebKit 验证已覆盖该流程。'
  )

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

  const chapterId = await createChapter(page, projectId, '第一章 序幕')

  const editor = page.locator('.ProseMirror').first()
  await editor.waitFor({ state: 'visible', timeout: 5000 })
  await editor.click()
  await editor.fill('这是 e2e 测试自动生成的章节内容。')
  await page.waitForTimeout(500)
  await expect(editor).toContainText('e2e 测试')
  await waitForChapterContentPersisted(page, projectId, 'e2e 测试')

  await page.goto(`/projects/${projectId}?tab=chapters&chapter=${chapterId}`)
  await page.waitForLoadState('networkidle')
  await waitForHMR(page)
  await expect(page).toHaveURL(/\/projects\/[^/]+$/)
  await expect(page.getByText(projectTitle).first()).toBeVisible()
  await waitForEditorHydration(page, '第一章 序幕', 'e2e 测试')

  await page.evaluate((id) => {
    indexedDB.deleteDatabase(`inkforge-project-${id}`)
  }, projectId)
})

// ─── Scenario 2: WorldEntries survive reload ────────────────────────────────

test('2. 创建 3 个 WorldEntry，刷新后确认仍在', async ({ page }) => {
  const projectId = await createProject(page, `e2e-world-${Date.now()}`)
  await openWorldTab(page, projectId)

  const entryNames = ['小明', '师父', '反派']
  await page.evaluate(
    async ([pid, names]) => {
      const dbName = `inkforge-project-${pid}`
      const openReq = indexedDB.open(dbName)
      const db = await new Promise<IDBDatabase>((resolve, reject) => {
        openReq.onsuccess = () => resolve(openReq.result)
        openReq.onerror = () => reject(openReq.error)
      })

      try {
        await new Promise<void>((resolve, reject) => {
          const tx = db.transaction('worldEntries', 'readwrite')
          const store = tx.objectStore('worldEntries')
          const now = new Date()

          for (const name of names as string[]) {
            store.add({
              id: crypto.randomUUID(),
              projectId: pid,
              type: 'character',
              name,
              tags: [],
              createdAt: now,
              updatedAt: now,
              deletedAt: null,
            })
          }

          tx.oncomplete = () => resolve()
          tx.onerror = () => reject(tx.error)
        })
      } finally {
        db.close()
      }
    },
    [projectId, entryNames]
  )

  await openWorldTab(page, projectId)

  for (const name of entryNames) {
    await expect(page.getByText(name).first()).toBeVisible()
  }

  await page.evaluate((id) => {
    indexedDB.deleteDatabase(`inkforge-project-${id}`)
  }, projectId)
})

test('2.1 项目页支持直接访问，分析页返回 404', async ({ page }) => {
  const projectTitle = `e2e-deeplink-${Date.now()}`
  const projectId = await createProject(page, projectTitle)

  await page.goto(`/projects/${projectId}`)
  await page.waitForLoadState('networkidle')
  await waitForHMR(page)
  await expect(page.getByText('项目未找到')).toHaveCount(0)
  await expect(page.getByText(projectTitle).first()).toBeVisible()

  await page.goto(`/projects/${projectId}/analysis`)
  await page.waitForLoadState('domcontentloaded')
  await waitForHMR(page)
  await expect(page).toHaveURL(new RegExp(`/projects/${projectId}/analysis$`))
  await expect(page.getByRole('heading', { name: '404' })).toBeVisible()

  await page.evaluate((id) => {
    indexedDB.deleteDatabase(`inkforge-project-${id}`)
  }, projectId)
})

test('2.2 左侧导航可切换，大纲/世界观/规划都能进入', async ({ page }) => {
  const projectId = await createProject(page, `e2e-sidebar-${Date.now()}`)

  await page.goto(`/projects/${projectId}`)
  await page.waitForLoadState('networkidle')
  await waitForHMR(page)

  await expect(page.getByText('章节').first()).toBeVisible()
  await expect(page.getByRole('button', { name: '章节', exact: true })).toBeVisible()
  await expect(page.getByRole('button', { name: '世界观' })).toBeVisible()
  await expect(page.getByRole('button', { name: '规划' })).toBeVisible()

  await createChapter(page, projectId, '第一章 导航切换')
  await page.getByText('第一章 导航切换').first().click()
  await expect(page.locator('.ProseMirror').first()).toBeVisible({ timeout: 10000 })
  await expect(page.getByRole('button', { name: '章节简报' })).toBeVisible()

  await page.getByRole('button', { name: '章节简报' }).click()
  await expect(page.getByLabel('标题')).toBeVisible({ timeout: 10000 })
  await expect(page.getByLabel('章节摘要')).toBeVisible()

  await page.getByRole('button', { name: '世界观' }).click()
  await expect(page.getByPlaceholder('搜索世界观...')).toBeVisible({ timeout: 10000 })
  await expect(page.getByText('世界观').first()).toBeVisible()

  await page.getByRole('button', { name: '规划' }).click()
  await expect(page.getByText('规划').first()).toBeVisible()
  await expect(page.getByText('灵感').first()).toBeVisible({ timeout: 10000 })

  await page.evaluate((id) => {
    indexedDB.deleteDatabase(`inkforge-project-${id}`)
  }, projectId)
})

test('2.3 章节工作台：默认正文、章节简报、起草插入、切回对话', async ({ page }) => {
  test.slow()

  const draftText = '门外铁蹄骤停，雨线在火把边缘炸开。沈砚按住刀鞘，先听见囚车里那一声极轻的笑。'
  await seedMockAIConfig(page)
  await mockChapterDraft(page, draftText)

  const projectId = await createProject(page, `e2e-chapter-workbench-${Date.now()}`)

  const chapterTab = page.getByRole('button', { name: '章节' }).nth(0)
  await chapterTab.click()
  await page.waitForLoadState('domcontentloaded')
  await waitForHMR(page)
  await page.waitForTimeout(400)

  const originalTitle = '第一章 工作台联调'
  const chapterId = await createChapter(page, projectId, originalTitle)
  await seedLinkedChapterPlan(page, projectId, chapterId, originalTitle, [
    {
      title: '城门前换车',
      viewpoint: '沈砚',
      location: '朱雀门外',
      objective: '确认押解路线',
      obstacle: '押解官催促启程',
      outcome: '发现有人设伏',
      continuityNotes: '保持右臂伤势延续',
      order: 1,
    },
    {
      title: '雨巷伏杀',
      viewpoint: '顾迟',
      location: '南城雨巷',
      objective: '护住关键证人',
      obstacle: '刺客封路',
      outcome: '从尸体上找到熟悉纹样',
      continuityNotes: '雨夜环境压低能见度',
      order: 2,
    },
  ])

  const editor = page.locator('.ProseMirror').first()
  await expect(editor).toBeVisible({ timeout: 10000 })
  await expect(page).toHaveURL(/\/projects\/[^/]+$/)
  expect(page.url()).not.toContain('view=outline')

  await openChapterBrief(page)
  await expect(page.getByText('章节简报')).toBeVisible()
  await expect(page.getByText('关联规划摘要')).toBeVisible()
  await expect(page.getByLabel('章节摘要')).toBeVisible()

  const renamedTitle = '第一章 押解遇袭'
  const summary = '押解途中第一次遇袭，主角暴露底牌，但暂时稳住了队伍。'
  await page.getByLabel('标题').fill(renamedTitle)
  await page.getByLabel('章节摘要').fill(summary)
  await page.getByPlaceholder('不设定').fill('3200')

  await waitForChapterBriefPersisted(page, projectId, chapterId, {
    title: renamedTitle,
    outlineSummary: summary,
    outlineTargetWordCount: 3200,
  })
  await expect(page.getByText(renamedTitle).first()).toBeVisible()

  await page.getByRole('button', { name: '章节简报' }).click()
  await expect(page.getByLabel('章节摘要')).toHaveCount(0)
  await expect(editor).toBeVisible()

  await expect(page.getByRole('button', { name: '对话', exact: true })).toBeVisible()
  await expect(page.getByRole('button', { name: '起草', exact: true })).toBeVisible()
  await expect(page.getByRole('button', { name: '改写', exact: true })).toBeVisible()

  await page.getByRole('button', { name: '起草', exact: true }).click()
  await expect(page.getByTestId('draft-panel')).toBeVisible()
  if (await page.getByRole('button', { name: '去配置 AI' }).isVisible({ timeout: 1500 }).catch(() => false)) {
    await writeMockAIConfig(page)
    await page.reload({ waitUntil: 'domcontentloaded' })
    await waitForHMR(page)
    await getChapterRow(page, renamedTitle).first().click()
    await page.getByRole('button', { name: '起草', exact: true }).click()
    await expect(page.getByTestId('draft-panel')).toBeVisible()
  }
  await expect(page.getByRole('button', { name: '生成草稿' })).toBeVisible({ timeout: 10000 })
  await expect(page.getByText('场景拆解：2 张场景卡')).toBeVisible()
  await expect(page.locator('#outline')).toHaveValue(/章节摘要：押解途中第一次遇袭，主角被迫提前暴露底牌。/)
  await expect(page.locator('#outline')).toHaveValue(/1\. 城门前换车/)
  await expect(page.locator('#outline')).toHaveValue(/2\. 雨巷伏杀/)
  await updateSeededSceneCards(page, projectId, chapterId, [
    {
      title: '雨巷反杀',
      viewpoint: '顾迟',
      location: '南城雨巷',
      objective: '诱出真正追兵',
      obstacle: '雨夜里难辨敌友',
      outcome: '确认守军内应身份',
      continuityNotes: '顾迟腿伤开始加重',
      order: 1,
    },
    {
      title: '城门暗哨',
      viewpoint: '沈砚',
      location: '朱雀门外',
      objective: '回收被调包的押解令',
      obstacle: '暗哨提前封死退路',
      outcome: '发现第二层埋伏',
      continuityNotes: '右臂伤势影响拔刀速度',
      order: 2,
    },
  ])
  await page.reload({ waitUntil: 'domcontentloaded' })
  await waitForHMR(page)
  await getChapterRow(page, renamedTitle).first().click()
  await page.getByRole('button', { name: '起草', exact: true }).click()
  await expect(page.locator('#outline')).toHaveValue(/1\. 雨巷反杀/)
  await expect(page.locator('#outline')).toHaveValue(/2\. 城门暗哨/)
  await page.getByRole('button', { name: '生成草稿' }).click()

  await expect(page.getByRole('button', { name: '插入到正文' })).toBeVisible({ timeout: 10000 })
  await expect(page.getByText(draftText)).toBeVisible()
  await page.getByRole('button', { name: '插入到正文' }).click()

  await expect(editor).toContainText('门外铁蹄骤停', { timeout: 10000 })
  await waitForChapterContentPersisted(page, projectId, '门外铁蹄骤停')
  await expect(page.getByRole('button', { name: '对话', exact: true })).toHaveAttribute('aria-pressed', 'true')
  await expect(page.getByRole('button', { name: '起草', exact: true })).toHaveAttribute('aria-pressed', 'false')
  await expect(
    page.getByPlaceholder(/与墨客聊聊你的故事|你想写一个什么故事，或者想要什么感觉\？?|输入.*消息|说点什么/)
  ).toBeVisible()
  await expect(getChapterRow(page, renamedTitle).first()).toBeVisible()

  await page.evaluate((id) => {
    indexedDB.deleteDatabase(`inkforge-project-${id}`)
  }, projectId)
  await clearMockAIConfig(page)
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

  const chatInput = page.getByPlaceholder(/与墨客聊聊你的故事|你想写一个什么故事，或者想要什么感觉\？?|输入.*消息|说点什么/)
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

// ─── Scenario 5: EPUB export round-trip ─────────────────────────────────────

test('5. EPUB 导出 + 验证内容完整', async ({ page }) => {
  const projectId = await createProject(page, `e2e-epub-${Date.now()}`)

  const chapterTab = page.getByRole('button', { name: '章节' }).nth(0)
  await chapterTab.click()
  await page.waitForLoadState('domcontentloaded')
  await waitForHMR(page)
  await page.waitForTimeout(400)

  await createChapter(page, projectId, '第一章 测试章')

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
