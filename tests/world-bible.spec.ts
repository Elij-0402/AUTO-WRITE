import { test, expect } from '@playwright/test'

async function createProject(page: import('@playwright/test').Page, title: string) {
  await page.goto('/')
  await page.getByRole('button', { name: '开始第一个故事' }).click()
  const dialog = page.getByRole('dialog', { name: '新建项目' })
  await dialog.getByLabel(/标题/).fill(title)
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
  const characterHeader = page.getByText('角色', { exact: true }).first()
  await expect(characterHeader).toBeVisible()
})
