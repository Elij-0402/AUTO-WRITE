import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const repoRoot = process.cwd()

function readRepoFile(relativePath: string) {
  return readFileSync(join(repoRoot, relativePath), 'utf8')
}

describe('design baseline', () => {
  it('keeps the app dark-first and removes the Inter dependency from the root layout', () => {
    const layout = readRepoFile('src/app/layout.tsx')

    expect(layout).toContain("var t=s||'dark'")
    expect(layout).toContain('font-noto-sans-sc')
    expect(layout).not.toContain('Inter(')
    expect(layout).toContain('lxgw-wenkai-webfont')
    expect(layout).toContain('lxgw-neoxihei')
  })

  it('defines the monastic surface tokens without legacy shadow or Linear accent aliases', () => {
    const globals = readRepoFile('src/app/globals.css')

    expect(globals).toContain('--surface-0: 222 10% 6%')
    expect(globals).toContain('--foreground: 36 29% 90%')
    expect(globals).toContain('--accent: 13 55% 51%')
    expect(globals).not.toContain('--ui-shadow')
    expect(globals).not.toContain('--accent-violet')
    expect(globals).not.toContain('--accent-coral')
  })
})
