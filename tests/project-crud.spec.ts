import { test, expect } from '@playwright/test'

test('create project from empty dashboard and land on workspace', async ({ page }) => {
  await page.goto('/')

  await page.getByRole('button', { name: '开始第一个故事' }).click()

  const dialog = page.getByRole('dialog', { name: '新建项目' })
  await expect(dialog).toBeVisible()

  await dialog.getByLabel(/标题/).fill('测试项目 · E2E')
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

  await expect(page.getByRole('button', { name: '正文' })).toBeVisible()
  await page.getByRole('button', { name: '大纲' }).click()
  await expect(page.getByLabel('标题')).toBeVisible()
})
