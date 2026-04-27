import { test, expect } from '@playwright/test'

test('create project from empty dashboard and land on workspace', async ({ page }) => {
  await page.goto('/')

  await page.getByRole('button', { name: '开始第一个故事' }).click()

  const dialog = page.getByRole('dialog', { name: '新建项目' })
  await expect(dialog).toBeVisible()

  await dialog.getByLabel(/标题/).fill('测试项目 · E2E')
  await dialog.getByRole('button', { name: '创建' }).click()

  await page.waitForURL(/\/projects\/[^/]+\/charter$/)
  await expect(page.getByRole('heading', { name: '作品宪章' })).toBeVisible()
  await expect(page.getByRole('button', { name: '保存这版方向' })).toBeVisible()

  await page.getByRole('link', { name: '返回项目' }).click()
  await page.waitForURL(/\/projects\/[^/]+$/)

  await expect(page.getByRole('button', { name: '章节', exact: true })).toBeVisible()
  await expect(page.getByRole('button', { name: '大纲', exact: true })).toBeVisible()
  await expect(page.getByRole('button', { name: '世界观', exact: true })).toBeVisible()
  await expect(page.getByRole('button', { name: '新建章节' })).toBeVisible()
})
