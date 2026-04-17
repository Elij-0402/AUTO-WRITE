import { test, expect } from '@playwright/test'

async function createProject(page: import('@playwright/test').Page, title: string) {
  await page.goto('/')
  await page.getByRole('button', { name: '开始第一个故事' }).click()
  const dialog = page.getByRole('dialog', { name: '新建项目' })
  await dialog.getByLabel(/标题/).fill(title)
  await dialog.getByRole('button', { name: '创建' }).click()
  await page.waitForURL(/\/projects\/[^/]+$/)
}

test('add character entry via world bible tab', async ({ page }) => {
  await createProject(page, '世界观测试项目')

  await page.getByRole('button', { name: '世界观' }).first().click()

  await page.getByRole('button', { name: '还没有角色，点击添加' }).click()

  await expect(page.getByPlaceholder('搜索世界观...')).toBeVisible()
  const characterHeader = page.getByText('角色', { exact: true }).first()
  await expect(characterHeader).toBeVisible()
})
