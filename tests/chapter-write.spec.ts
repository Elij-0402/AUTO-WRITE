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
}

test('create chapter from workspace sidebar', async ({ page }) => {
  await createProject(page, '章节测试项目')

  await page.getByRole('button', { name: '新建章节' }).click()

  const input = page.getByPlaceholder('输入章节标题')
  await expect(input).toBeFocused()
  await input.fill('第一章 · 开端')
  await input.press('Enter')

  await expect(page.getByText('第一章 · 开端').first()).toBeVisible()
  await expect(page.getByRole('button', { name: '章节简报' })).toBeVisible()
})
