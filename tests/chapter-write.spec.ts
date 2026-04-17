import { test, expect } from '@playwright/test'

async function createProject(page: import('@playwright/test').Page, title: string) {
  await page.goto('/')
  await page.getByRole('button', { name: '开始第一个故事' }).click()
  const dialog = page.getByRole('dialog', { name: '新建项目' })
  await dialog.getByLabel(/标题/).fill(title)
  await dialog.getByRole('button', { name: '创建' }).click()
  await page.waitForURL(/\/projects\/[^/]+$/)
}

test('create chapter from workspace sidebar', async ({ page }) => {
  await createProject(page, '章节测试项目')

  await page.getByRole('button', { name: '新建章节' }).click()

  const input = page.getByPlaceholder('输入章节标题')
  await expect(input).toBeFocused()
  await input.fill('第一章 · 开端')
  await input.press('Enter')

  await expect(page.getByText('第一章 · 开端')).toBeVisible()
})
