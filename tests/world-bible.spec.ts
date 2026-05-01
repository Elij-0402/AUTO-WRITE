import { test, expect } from '@playwright/test'

async function openCreateProjectDialog(page: import('@playwright/test').Page) {
  const emptyStateButton = page.getByRole('button', { name: '开始第一个故事' })
  if (await emptyStateButton.isVisible().catch(() => false)) {
    await emptyStateButton.click()
    return
  }

  await page.getByRole('button', { name: '新建项目' }).click()
}

async function createProject(page: import('@playwright/test').Page, title: string) {
  await page.goto('/')
  await openCreateProjectDialog(page)
  const dialog = page.getByRole('dialog', { name: '新建项目' })
  await dialog.getByPlaceholder('输入小说标题').fill(title)
  await dialog.getByRole('button', { name: '创建' }).click()
  await page.waitForURL(/\/projects\/[^/?#]+(?:\?.*)?$/)
  const projectId = page.url().match(/\/projects\/([^/?#]+)/)?.[1]
  if (!projectId) throw new Error('未能从宪章页 URL 解析项目 ID')
  await expect(page.getByText(title).first()).toBeVisible()
  return projectId
}

test('add character entry via world bible tab', async ({ page }) => {
  const projectId = await createProject(page, '世界观测试项目')

  await page.goto(`/projects/${projectId}?tab=world`)
  await page.waitForLoadState('domcontentloaded')

  await expect(page.getByPlaceholder('搜索世界观...')).toBeVisible()
  await page.getByRole('button', { name: '添加角色' }).click()
  const nameInput = page.getByLabel('姓名')
  await expect(nameInput).toBeVisible()
  await expect(nameInput).toHaveValue('未命名角色')
})
