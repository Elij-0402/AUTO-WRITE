import { test, expect } from '@playwright/test'

async function openCreateProjectDialog(page: import('@playwright/test').Page) {
  const emptyStateButton = page.getByRole('button', { name: '开始第一个故事' })
  if (await emptyStateButton.isVisible().catch(() => false)) {
    await emptyStateButton.click()
    return
  }

  await page.getByRole('button', { name: '新建项目' }).click()
}

test('create project from empty dashboard and land on workspace', async ({ page }) => {
  await page.goto('/')

  await openCreateProjectDialog(page)

  const dialog = page.getByRole('dialog', { name: '新建项目' })
  await expect(dialog).toBeVisible()

  await dialog.getByPlaceholder('输入小说标题').fill('测试项目 · E2E')
  await dialog.getByRole('button', { name: '创建' }).click()

  await page.waitForURL(/\/projects\/[^/?#]+(?:\?.*)?$/)
  await expect(page.getByText('测试项目 · E2E').first()).toBeVisible()

  await expect(page.getByRole('button', { name: '章节', exact: true })).toBeVisible()
  await expect(page.getByRole('button', { name: '世界观', exact: true })).toBeVisible()
  await expect(page.getByRole('button', { name: '规划', exact: true })).toBeVisible()
  await expect(page.getByRole('button', { name: '新建章节' })).toBeVisible()

  await page.getByRole('button', { name: '新建章节' }).click()
  const input = page.getByPlaceholder('输入章节标题')
  await expect(input).toBeFocused()
  await input.fill('第一章 · 视图切换')
  await input.press('Enter')

  await expect(page.getByText('第一章 · 视图切换').first()).toBeVisible()
  await expect(page.getByRole('button', { name: '章节简报' })).toBeVisible()
  await expect(page.getByRole('button', { name: '对话', exact: true })).toHaveAttribute('aria-pressed', 'true')
  await expect(page.getByRole('button', { name: '起草' })).toBeVisible()
  await expect(page.getByRole('button', { name: '改写' })).toBeVisible()
})
