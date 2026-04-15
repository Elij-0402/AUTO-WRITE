# InkForge UI Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign InkForge's entire UI from zinc-gray tool aesthetic to a warm, modern, breathable writing workspace with stone color palette and blue accent.

**Architecture:** Systematic color migration (zinc → stone, gray → stone), layout restructuring (auth page split-panel, dashboard sidebar nav), and spacing/typography refinements. Changes flow bottom-up: design system primitives first, then page-level layouts.

**Tech Stack:** Next.js, Tailwind CSS v4, Radix UI, Tiptap, class-variance-authority

---

### Task 1: Update Global CSS and Design Tokens

**Files:**
- Modify: `src/app/globals.css`

- [ ] **Step 1: Update CSS custom properties**

```css
@import "tailwindcss";

:root {
  --background: #fafaf9;
  --foreground: #1c1917;
}

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --font-sans: var(--font-noto-sans-sc), "Noto Sans SC", "PingFang SC",
    "Microsoft YaHei", "Hiragino Sans GB", sans-serif;
}

@media (prefers-color-scheme: dark) {
  :root {
    --background: #0c0a09;
    --foreground: #fafaf9;
  }
}

body {
  background: var(--background);
  color: var(--foreground);
  font-family: var(--font-sans);
  line-height: 1.8;
}

input,
textarea {
  ime-mode: active;
}
```

- [ ] **Step 2: Verify dev server starts**

Run: `npm run dev`
Expected: No errors, page loads with stone-50 background (#fafaf9)

- [ ] **Step 3: Commit**

```bash
git add src/app/globals.css
git commit -m "feat(ui): update global CSS tokens from zinc to stone palette"
```

---

### Task 2: Update UI Primitives — Button

**Files:**
- Modify: `src/components/ui/button.tsx`

- [ ] **Step 1: Update button variants to blue accent + stone**

Replace the `buttonVariants` cva definition:

```tsx
const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 rounded-lg text-sm font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        primary: 'bg-blue-500 text-white hover:bg-blue-600 dark:bg-blue-500 dark:hover:bg-blue-600',
        secondary: 'bg-stone-100 text-stone-900 hover:bg-stone-200 dark:bg-stone-800 dark:text-stone-50 dark:hover:bg-stone-700',
        danger: 'bg-red-500 text-white hover:bg-red-600 dark:bg-red-500 dark:hover:bg-red-600',
        ghost: 'hover:bg-stone-100 text-stone-600 dark:hover:bg-stone-800 dark:text-stone-400',
      },
      size: {
        sm: 'h-8 px-3 text-xs',
        md: 'h-10 px-4 text-sm',
        lg: 'h-12 px-6 text-base',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  }
)
```

- [ ] **Step 2: Commit**

```bash
git add src/components/ui/button.tsx
git commit -m "feat(ui): update Button to blue accent with stone secondary"
```

---

### Task 3: Update UI Primitives — Dialog

**Files:**
- Modify: `src/components/ui/dialog.tsx`

- [ ] **Step 1: Update DialogOverlay backdrop**

Change the overlay className from:
```
'fixed inset-0 z-50 bg-black/80 ...'
```
to:
```
'fixed inset-0 z-50 bg-black/40 backdrop-blur-sm ...'
```

- [ ] **Step 2: Update DialogContent styling**

Replace all `zinc` references with `stone`, update border-radius to `rounded-xl`, and enhance shadow:

- `border-zinc-200` → `border-stone-200`
- `dark:border-zinc-800` → `dark:border-stone-800`
- `dark:bg-zinc-950` → `dark:bg-stone-950`
- `sm:rounded-lg` → `sm:rounded-xl`
- Add `shadow-xl` to the shadow

- [ ] **Step 3: Update DialogClose ring colors**

- `ring-offset-white` stays
- `focus:ring-zinc-950` → `focus:ring-stone-950`
- `dark:ring-offset-zinc-950` → `dark:ring-offset-stone-950`
- `dark:focus:ring-zinc-300` → `dark:focus:ring-stone-300`
- `data-[state=open]:bg-zinc-100` → `data-[state=open]:bg-stone-100`
- `data-[state=open]:text-zinc-500` → `data-[state=open]:text-stone-500`
- `dark:data-[state=open]:bg-zinc-800` → `dark:data-[state=open]:bg-stone-800`
- `dark:data-[state=open]:text-zinc-400` → `dark:data-[state=open]:text-stone-400`

- [ ] **Step 4: Update DialogDescription**

- `text-zinc-500 dark:text-zinc-400` → `text-stone-500 dark:text-stone-400`

- [ ] **Step 5: Commit**

```bash
git add src/components/ui/dialog.tsx
git commit -m "feat(ui): update Dialog to stone palette with blur overlay"
```

---

### Task 4: Update UI Primitives — Input and Textarea

**Files:**
- Modify: `src/components/ui/input.tsx`
- Modify: `src/components/ui/textarea.tsx`

- [ ] **Step 1: Update Input component**

Replace the className string — change all `zinc` → `stone`, update ring focus to blue, update border-radius to `rounded-[10px]`:

```tsx
'flex h-10 w-full rounded-[10px] border border-stone-300 bg-white px-3 py-2 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-stone-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/20 focus-visible:border-blue-500 disabled:cursor-not-allowed disabled:opacity-50 dark:border-stone-700 dark:bg-stone-950 dark:ring-offset-stone-950 dark:placeholder:text-stone-500 dark:focus-visible:ring-blue-400/20 dark:focus-visible:border-blue-400'
```

- [ ] **Step 2: Update Textarea component**

Same changes as Input — `zinc` → `stone`, blue focus ring, `rounded-[10px]`:

```tsx
'flex min-h-[80px] w-full rounded-[10px] border border-stone-300 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-stone-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/20 focus-visible:border-blue-500 disabled:cursor-not-allowed disabled:opacity-50 dark:border-stone-700 dark:bg-stone-950 dark:ring-offset-stone-950 dark:placeholder:text-stone-500 dark:focus-visible:ring-blue-400/20 dark:focus-visible:border-blue-400'
```

- [ ] **Step 3: Commit**

```bash
git add src/components/ui/input.tsx src/components/ui/textarea.tsx
git commit -m "feat(ui): update Input/Textarea to stone palette with blue focus"
```

---

### Task 5: Redesign Auth Page — Split Panel Layout

**Files:**
- Modify: `src/app/auth/page.tsx`

- [ ] **Step 1: Rewrite the auth page layout**

Replace the entire return JSX with a left-right split layout:

```tsx
return (
  <div className="min-h-screen flex">
    {/* Left brand panel */}
    <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-500 to-blue-700 flex-col items-center justify-center text-white p-12">
      <div className="mb-6">
        {/* InkForge logo placeholder */}
        <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
          <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
          </svg>
        </div>
      </div>
      <h1 className="text-3xl font-bold mb-3">InkForge</h1>
      <p className="text-blue-100 text-lg text-center">AI 驱动的小说创作工作台</p>
    </div>

    {/* Right form panel */}
    <div className="flex-1 flex items-center justify-center bg-white dark:bg-stone-950 p-8">
      <div className="max-w-md w-full space-y-8">
        {/* Tab toggle */}
        <div className="flex border-b border-stone-200 dark:border-stone-800">
          <button
            type="button"
            onClick={() => { setMode('login'); setError(null); setSuccess(null) }}
            className={`flex-1 pb-4 text-center font-medium ${
              mode === 'login'
                ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400'
                : 'text-stone-500 hover:text-stone-700 dark:text-stone-400 dark:hover:text-stone-300'
            }`}
          >
            登录
          </button>
          <button
            type="button"
            onClick={() => { setMode('register'); setError(null); setSuccess(null) }}
            className={`flex-1 pb-4 text-center font-medium ${
              mode === 'register'
                ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400'
                : 'text-stone-500 hover:text-stone-700 dark:text-stone-400 dark:hover:text-stone-300'
            }`}
          >
            注册
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-stone-700 dark:text-stone-300">
              邮箱
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              className="mt-1 block w-full px-3 py-2 border border-stone-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-50"
              placeholder="your@email.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-stone-700 dark:text-stone-300">
              密码
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              minLength={6}
              className="mt-1 block w-full px-3 py-2 border border-stone-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-50"
            />
          </div>

          {mode === 'login' && (
            <div className="text-right">
              <a href="/auth/forgot-password" className="text-sm text-blue-500 hover:text-blue-600">
                忘记密码？
              </a>
            </div>
          )}

          {error && (
            <div className="text-red-500 text-sm text-center">{error}</div>
          )}

          {success && (
            <div className="text-green-500 text-sm text-center">{success}</div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-xl text-sm font-medium text-white bg-blue-500 hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-colors duration-150"
          >
            {loading ? '处理中...' : mode === 'login' ? '登录' : '注册'}
          </button>
        </form>
      </div>
    </div>
  </div>
)
```

- [ ] **Step 2: Verify in browser**

Run: `npm run dev`, navigate to `/auth`
Expected: Left side blue gradient with brand, right side clean form, responsive (left panel hidden on small screens)

- [ ] **Step 3: Commit**

```bash
git add src/app/auth/page.tsx
git commit -m "feat(ui): redesign auth page with split-panel layout"
```

---

### Task 6: Redesign Project Dashboard with Sidebar Navigation

**Files:**
- Modify: `src/app/page.tsx`
- Modify: `src/components/project/project-dashboard.tsx`

- [ ] **Step 1: Update page.tsx background**

Change `bg-zinc-50 dark:bg-zinc-950` to `bg-stone-50 dark:bg-stone-950`:

```tsx
return (
  <main className="min-h-screen bg-stone-50 dark:bg-stone-950">
    <ProjectDashboard />
  </main>
)
```

- [ ] **Step 2: Add sidebar navigation to ProjectDashboard**

Wrap the dashboard content in a sidebar layout. Replace the current return in the project list case (after `if (!projects || projects.length === 0)` block) with:

```tsx
return (
  <div className="flex min-h-screen">
    {/* Left sidebar navigation */}
    <aside className="w-60 bg-white dark:bg-stone-900 border-r border-stone-200 dark:border-stone-800 flex flex-col">
      {/* Logo */}
      <div className="p-4 flex items-center gap-2">
        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
          <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
          </svg>
        </div>
        <span className="font-bold text-stone-900 dark:text-stone-50">InkForge</span>
      </div>

      {/* Navigation items */}
      <nav className="flex-1 px-3 py-2 space-y-1">
        <button className="w-full flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
          我的作品
        </button>
        <button className="w-full flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg text-stone-600 hover:bg-stone-100 dark:text-stone-400 dark:hover:bg-stone-800">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          最近编辑
        </button>
        <button className="w-full flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg text-stone-600 hover:bg-stone-100 dark:text-stone-400 dark:hover:bg-stone-800">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
          回收站
        </button>
      </nav>

      {/* Bottom: user area */}
      <div className="p-3 border-t border-stone-200 dark:border-stone-800">
        <div className="flex items-center gap-2 px-3 py-2 text-sm text-stone-600 dark:text-stone-400">
          <div className="w-7 h-7 bg-stone-200 dark:bg-stone-700 rounded-full" />
          <span>账户</span>
        </div>
      </div>
    </aside>

    {/* Main content area */}
    <div className="flex-1 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-stone-900 dark:text-stone-50">
            我的作品
          </h1>
          <Button onClick={() => setCreateModalOpen(true)}>
            <Plus className="h-4 w-4" />
            新建项目
          </Button>
        </div>

        {/* Project card grid */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {projects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              onEdit={() => router.push(`/projects/${project.id}`)}
              onDelete={() => handleDeleteClick(project.id)}
            />
          ))}
        </div>
      </div>

      {/* Modals */}
      <CreateProjectModal
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
        onSubmit={handleCreateProject}
      />

      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>删除项目</DialogTitle>
            <DialogDescription>
              确定要删除「{projectToDeleteData?.title}」吗？
            </DialogDescription>
          </DialogHeader>
          <p className="text-sm text-stone-500 dark:text-stone-400">
            删除后可在回收站中恢复
          </p>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setDeleteConfirmOpen(false)}>
              取消
            </Button>
            <Button variant="danger" onClick={handleConfirmDelete}>
              删除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  </div>
)
```

Also update the empty state wrapper to include the sidebar:

```tsx
if (!projects || projects.length === 0) {
  return (
    <div className="flex min-h-screen">
      {/* Same sidebar as above */}
      <aside className="w-60 bg-white dark:bg-stone-900 border-r border-stone-200 dark:border-stone-800 flex flex-col">
        {/* ... same sidebar content ... */}
      </aside>
      <div className="flex-1">
        <EmptyDashboard onCreateProject={() => setCreateModalOpen(true)} />
        <CreateProjectModal ... />
      </div>
    </div>
  )
}
```

Note: Since the sidebar is duplicated between empty and non-empty states, extract it into a `DashboardSidebar` component at the top of the file or as a local component.

- [ ] **Step 3: Verify in browser**

Navigate to dashboard. Expected: Left sidebar with logo, nav items (我的作品 highlighted blue), and card grid on right.

- [ ] **Step 4: Commit**

```bash
git add src/app/page.tsx src/components/project/project-dashboard.tsx
git commit -m "feat(ui): add sidebar navigation to project dashboard"
```

---

### Task 7: Redesign Project Card

**Files:**
- Modify: `src/components/project/project-card.tsx`

- [ ] **Step 1: Update gradient to softer pastels**

Replace `getGradientFromId` function — change saturation from 70% to 40% and lightness from 60%/45% to 80%/70%:

```tsx
function getGradientFromId(id: string): string {
  let hash = 0
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash)
  }
  const hue = Math.abs(hash) % 360
  return `linear-gradient(135deg, hsl(${hue}, 40%, 80%), hsl(${(hue + 45) % 360}, 40%, 70%))`
}
```

- [ ] **Step 2: Update card container classes**

Change the outer div from:
```
"group relative flex flex-col overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm transition-shadow hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900 cursor-pointer"
```
to:
```
"group relative flex flex-col overflow-hidden rounded-xl border border-stone-200 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.05)] transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 dark:border-stone-800 dark:bg-stone-900 cursor-pointer"
```

- [ ] **Step 3: Update gradient height**

Change `h-36` to `h-20` (80px) for the gradient bar.

- [ ] **Step 4: Update all zinc references to stone**

Throughout the file, replace:
- `text-zinc-900` → `text-stone-900`
- `dark:text-zinc-50` → `dark:text-stone-50`
- `border-zinc-300` → `border-stone-300`
- `dark:border-zinc-600` → `dark:border-stone-700`
- `focus:ring-zinc-400` → `focus:ring-blue-400`
- `text-zinc-700` → `text-stone-700`
- `dark:text-zinc-300` → `dark:text-stone-300`
- `bg-zinc-100` → `bg-stone-100`
- `dark:bg-zinc-800` → `dark:bg-stone-800`
- `text-zinc-500` → `text-stone-500`
- `dark:text-zinc-400` → `dark:text-stone-400`
- `hover:bg-zinc-100` → `hover:bg-stone-100`
- `dark:hover:bg-zinc-700` → `dark:hover:bg-stone-700`
- `hover:text-zinc-600` → `hover:text-stone-600`
- `dark:hover:text-zinc-300` → `dark:hover:text-stone-300`
- `border-zinc-200` → `border-stone-200`
- `dark:border-zinc-700` → `dark:border-stone-700`
- `dark:bg-zinc-800` (menu dropdown) → `dark:bg-stone-800`

- [ ] **Step 5: Update title to 14px semibold**

Change title `text-base font-semibold` to `text-sm font-semibold` (14px).

- [ ] **Step 6: Update three-dot menu button**

Keep the existing styling but ensure the button container uses:
```
"flex h-8 w-8 items-center justify-center rounded-full bg-white/50 text-stone-700 opacity-0 transition-opacity group-hover:opacity-100 hover:bg-white/80 dark:bg-stone-800/50 dark:text-stone-300 dark:hover:bg-stone-800/80"
```

- [ ] **Step 7: Commit**

```bash
git add src/components/project/project-card.tsx
git commit -m "feat(ui): redesign project cards with soft pastels and stone palette"
```

---

### Task 8: Update Empty Dashboard

**Files:**
- Modify: `src/components/project/empty-dashboard.tsx`

- [ ] **Step 1: Update all zinc references to stone**

```tsx
export function EmptyDashboard({ onCreateProject }: EmptyDashboardProps) {
  return (
    <div className="flex flex-col items-center justify-center py-24 px-4">
      <div className="mb-8 flex h-32 w-32 items-center justify-center rounded-full bg-stone-100 dark:bg-stone-800">
        <BookOpen className="h-16 w-16 text-stone-400 dark:text-stone-500" />
      </div>
      <h2 className="mb-2 text-2xl font-semibold text-stone-900 dark:text-stone-50">
        创建你的第一本小说
      </h2>
      <p className="mb-8 text-stone-500 dark:text-stone-400">
        开始你的写作之旅
      </p>
      <Button size="lg" onClick={onCreateProject}>
        新建项目
      </Button>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/project/empty-dashboard.tsx
git commit -m "feat(ui): update empty dashboard to stone palette"
```

---

### Task 9: Redesign Workspace Top Bar

**Files:**
- Modify: `src/app/projects/[id]/page.tsx`

- [ ] **Step 1: Update top bar styling**

Change the top bar div (around line 240) from:
```
"h-12 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex items-center justify-end px-4 gap-2"
```
to:
```
"h-12 border-b border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 flex items-center justify-end px-4 gap-2"
```

- [ ] **Step 2: Update all toolbar button classes**

For AI settings button, focus mode button, and theme toggle button — change all `zinc` references to `stone`:
- `hover:bg-zinc-100` → `hover:bg-stone-100`
- `dark:hover:bg-zinc-800` → `dark:hover:bg-stone-800`
- `text-zinc-500` → `text-stone-500`
- `hover:text-zinc-900` → `hover:text-stone-900`
- `dark:hover:text-zinc-100` → `dark:hover:text-stone-100`
- `bg-zinc-200 dark:bg-zinc-700` → `bg-stone-200 dark:bg-stone-700`
- `text-zinc-900 dark:text-zinc-100` → `text-stone-900 dark:text-stone-100`

Also add icon button background: Each icon button should use `rounded-md` with a subtle stone-100 background on hover. The icon buttons should be 26x26-ish (the existing `p-2 rounded-lg` is close, keep it).

- [ ] **Step 3: Update save status text**

In `EditorWithStatus`, change:
```
"text-xs text-zinc-400 p-2 text-right dark:text-zinc-500"
```
to:
```
"text-xs text-stone-400 p-2 text-right dark:text-stone-500"
```

- [ ] **Step 4: Update Placeholder component**

Change all `zinc` → `stone`:
- `text-zinc-400 dark:text-zinc-500` → `text-stone-400 dark:text-stone-500`
- `text-zinc-300 dark:text-zinc-600` → `text-stone-300 dark:text-stone-600`

- [ ] **Step 5: Commit**

```bash
git add src/app/projects/[id]/page.tsx
git commit -m "feat(ui): update workspace top bar and placeholders to stone palette"
```

---

### Task 10: Redesign Chapter Sidebar

**Files:**
- Modify: `src/components/chapter/chapter-sidebar.tsx`

- [ ] **Step 1: Update tab styling**

Replace the `tabClasses` function to use blue accent for selected tab:

```tsx
const tabClasses = (tab: ActiveTab) =>
  `flex-1 py-2 text-center text-sm font-medium transition-colors border-b-2 ${
    activeTab === tab
      ? 'border-blue-500 text-blue-600 dark:border-blue-400 dark:text-blue-400'
      : 'border-transparent text-stone-400 hover:text-stone-600 dark:hover:text-stone-300'
  }`
```

- [ ] **Step 2: Update all zinc references to stone**

Throughout the file:
- `border-zinc-200 dark:border-zinc-800` → `border-stone-200 dark:border-stone-800`
- `text-zinc-400` → `text-stone-400`
- Loading state: `text-zinc-400` → `text-stone-400`
- Empty state text: `text-zinc-400` → `text-stone-400`

- [ ] **Step 3: Commit**

```bash
git add src/components/chapter/chapter-sidebar.tsx
git commit -m "feat(ui): update chapter sidebar tabs to blue accent"
```

---

### Task 11: Redesign Chapter Row

**Files:**
- Modify: `src/components/chapter/chapter-row.tsx`

- [ ] **Step 1: Update active/hover states**

Change the row container classes — active state uses blue-tinted background with left border:

Replace the className logic:
```tsx
className={`
  group flex items-center gap-1 px-2 py-2 border-b border-stone-100 dark:border-stone-800
  cursor-pointer transition-colors
  ${isActive
    ? 'bg-blue-50 border-l-[3px] border-l-blue-500 dark:bg-blue-500/10 dark:border-l-blue-400'
    : 'hover:bg-stone-50 dark:hover:bg-stone-800/50'}
  ${isDragging ? 'opacity-50 shadow-lg z-50' : ''}
`}
```

- [ ] **Step 2: Update all zinc references to stone**

Throughout the file:
- `text-zinc-300` → `text-stone-300`
- `hover:text-zinc-500` → `hover:text-stone-500`
- `dark:text-zinc-600` → `dark:text-stone-600`
- `dark:hover:text-zinc-400` → `dark:hover:text-stone-400`
- `text-zinc-400` → `text-stone-400` (chapter number, word count)
- `text-zinc-700 dark:text-zinc-300` → `text-stone-700 dark:text-stone-300` (title)
- `text-zinc-900 dark:text-zinc-100` → `text-stone-900 dark:text-stone-100`
- `border-zinc-300` → `border-stone-300`
- `dark:border-zinc-600` → `dark:border-stone-700`
- `focus:ring-zinc-400` → `focus:ring-blue-400`
- `hover:text-zinc-600` → `hover:text-stone-600`
- `hover:bg-zinc-200` → `hover:bg-stone-200`
- `dark:hover:bg-zinc-700` → `dark:hover:bg-stone-700`
- `dark:hover:text-zinc-300` → `dark:hover:text-stone-300`
- Status badge draft: `bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400` → `bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-400`

- [ ] **Step 3: Update word count color for active state**

When `isActive`, word count should be blue:
```tsx
<span className={`flex-shrink-0 text-xs ${isActive ? 'text-blue-500 dark:text-blue-400' : 'text-stone-400'}`}>
  {chapter.wordCount.toLocaleString()}字
</span>
```

- [ ] **Step 4: Commit**

```bash
git add src/components/chapter/chapter-row.tsx
git commit -m "feat(ui): redesign chapter rows with blue active state and stone palette"
```

---

### Task 12: Update Create Chapter Input

**Files:**
- Modify: `src/components/chapter/create-chapter-input.tsx`

- [ ] **Step 1: Update button and input styling**

For the collapsed button:
```tsx
"flex w-full items-center gap-2 px-3 py-2 text-sm text-stone-500 hover:text-stone-700 hover:bg-stone-100 dark:text-stone-400 dark:hover:text-stone-200 dark:hover:bg-stone-800 transition-colors"
```

For the expanded container border:
```tsx
"px-3 py-2 border-t border-stone-100 dark:border-stone-800"
```

For the input:
```tsx
"w-full rounded-lg border border-dashed border-blue-300 bg-blue-50/50 px-3 py-1.5 text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-blue-400/30 focus:border-blue-500 dark:border-blue-500/30 dark:bg-blue-500/5 dark:text-stone-100 dark:placeholder:text-stone-500"
```

- [ ] **Step 2: Commit**

```bash
git add src/components/chapter/create-chapter-input.tsx
git commit -m "feat(ui): update create chapter input with blue dashed border"
```

---

### Task 13: Update Editor Toolbar and CSS

**Files:**
- Modify: `src/components/editor/editor-toolbar.tsx`
- Modify: `src/components/editor/editor.css`

- [ ] **Step 1: Update editor toolbar**

Change toolbar container:
```tsx
"editor-toolbar flex items-center gap-1 border-b border-stone-200 dark:border-stone-800 px-4 py-2 bg-white dark:bg-stone-950 sticky top-0 z-10"
```

Change button classes from `hover:bg-zinc-100 dark:hover:bg-zinc-800` / `bg-zinc-200 dark:bg-zinc-700` to:
```tsx
`p-2 rounded-lg bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors ${
  editor.isActive('bold') ? 'bg-stone-200 dark:bg-stone-700 text-blue-600 dark:text-blue-400' : ''
}`
```

Apply same pattern for italic and heading buttons. Active state adds blue text.

- [ ] **Step 2: Update editor.css**

Replace the entire file with stone palette and blue selection:

```css
/* Tiptap editor styles */

.tiptap {
  font-family: var(--font-noto-sans-sc), ui-sans-serif, system-ui, sans-serif;
  font-size: 16px;
  line-height: 2.0;
  color: #1c1917;
  background: #fff;
}

.dark .tiptap {
  color: #fafaf9;
  background: #0c0a09;
}

.tiptap p.is-editor-empty:first-child::before {
  content: attr(data-placeholder);
  float: left;
  color: #a8a29e;
  pointer-events: none;
  height: 0;
}

.dark .tiptap p.is-editor-empty:first-child::before {
  color: #57534e;
}

.tiptap:focus {
  outline: none;
}

.tiptap .selection,
.tiptap ::selection {
  background-color: rgba(59, 130, 246, 0.2);
}

.dark .tiptap .selection,
.dark .tiptap ::selection {
  background-color: rgba(96, 165, 250, 0.3);
}

.tiptap p {
  margin-bottom: 1em;
}

.tiptap p:last-child {
  margin-bottom: 0;
}

.tiptap h1 {
  font-size: 2em;
  font-weight: 700;
  margin-bottom: 0.5em;
  margin-top: 1em;
}

.tiptap h2 {
  font-size: 1.5em;
  font-weight: 600;
  margin-bottom: 0.5em;
  margin-top: 1em;
}

.tiptap h3 {
  font-size: 1.25em;
  font-weight: 600;
  margin-bottom: 0.5em;
  margin-top: 1em;
}

.tiptap strong {
  font-weight: 600;
}

.tiptap em {
  font-style: italic;
}

.tiptap hr {
  border: none;
  border-top: 1px solid #e7e5e4;
  margin: 2em 0;
}

.dark .tiptap hr {
  border-top-color: #292524;
}

.tiptap blockquote {
  border-left: 3px solid #e7e5e4;
  padding-left: 1em;
  margin-left: 0;
  color: #57534e;
}

.dark .tiptap blockquote {
  border-left-color: #292524;
  color: #a8a29e;
}
```

- [ ] **Step 3: Update editor padding**

In `src/components/editor/editor.tsx`, update the inner padding div:
```tsx
<div className="max-w-[640px] mx-auto px-10 py-7">
```
(px-10 = 40px, py-7 = 28px per spec)

- [ ] **Step 4: Commit**

```bash
git add src/components/editor/editor-toolbar.tsx src/components/editor/editor.css src/components/editor/editor.tsx
git commit -m "feat(ui): update editor toolbar, CSS to stone palette with line-height 2.0"
```

---

### Task 14: Redesign AI Chat Panel

**Files:**
- Modify: `src/components/workspace/ai-chat-panel.tsx`
- Modify: `src/components/workspace/message-bubble.tsx`

- [ ] **Step 1: Update AI chat panel container**

Change all `zinc` to `stone` in `ai-chat-panel.tsx`:
- `bg-white dark:bg-zinc-900` → `bg-white dark:bg-stone-900`
- `bg-zinc-800` (toast) → `bg-stone-800`
- `text-zinc-400 dark:text-zinc-500` → `text-stone-400 dark:text-stone-500`
- `text-zinc-300 dark:text-zinc-600` → `text-stone-300 dark:text-stone-600`
- `bg-zinc-100 dark:bg-zinc-800` (loading) → `bg-stone-100 dark:bg-stone-800`
- `text-zinc-400` (loading) → `text-stone-400`
- `border-zinc-200 dark:border-zinc-700` (input area border) → `border-stone-200 dark:border-stone-800`
- Input textarea: `border-zinc-300 dark:border-zinc-600` → `border-stone-300 dark:border-stone-700`, `dark:bg-zinc-800` → `dark:bg-stone-800`

Update send button to `rounded-[10px]` and size `w-8 h-8`:
```tsx
<button
  onClick={handleSend}
  disabled={!input.trim() || loading}
  className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-blue-500 text-white rounded-[10px] hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
>
  <Send className="w-4 h-4" />
</button>
```

Update input textarea to `rounded-[10px]`.

- [ ] **Step 2: Update message bubble styling**

In `message-bubble.tsx`, update bubble shapes per spec:

```tsx
export function MessageBubble({ message, onInsertDraft }: MessageBubbleProps) {
  const isUser = message.role === 'user'
  const time = new Date(message.timestamp).toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit'
  })

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-2`}>
      <div className={`max-w-[80%] p-3 ${
        isUser
          ? 'bg-blue-500 text-white rounded-[12px_12px_4px_12px]'
          : 'bg-white dark:bg-stone-800 shadow-sm rounded-[12px_12px_12px_4px]'
      }`}>
        <div className="text-sm whitespace-pre-wrap">{message.content}</div>
        <div className={`text-xs mt-1 ${isUser ? 'text-blue-100' : 'text-stone-400'}`}>
          {time}
        </div>

        {!isUser && message.hasDraft && message.draftId && (
          <DraftCard
            draftId={message.draftId}
            content={message.content}
            onInsert={() => onInsertDraft?.(message.draftId!, message.content)}
          />
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/workspace/ai-chat-panel.tsx src/components/workspace/message-bubble.tsx
git commit -m "feat(ui): redesign AI chat panel with custom bubble shapes"
```

---

### Task 15: Update Panel Separators

**Files:**
- Modify: `src/app/projects/[id]/page.tsx`

- [ ] **Step 1: Update separator styling**

Change both separator instances from `bg-zinc-200` / `dark:bg-zinc-800` to `bg-stone-200` / `dark:bg-stone-800`, and soften the hover/active blue:

```tsx
<Separator
  onDoubleClick={handleSidebarDoubleClickReset}
  className="group relative flex items-center justify-center w-1 shrink-0 cursor-col-resize"
>
  <div className="absolute inset-y-0 -left-1 -right-1 group-hover:bg-blue-400/10 group-active:bg-blue-500/15 transition-colors" />
  <div className="w-px h-full bg-stone-200 group-hover:bg-blue-300 dark:bg-stone-800 group-hover:dark:bg-blue-500/50 group-active:bg-blue-400 group-active:dark:bg-blue-400/60 transition-colors" />
</Separator>
```

Apply same update to both separators (sidebar and chat panel).

- [ ] **Step 2: Update sidebar default width**

In `src/components/workspace/resizable-panel.tsx:22`, change:
```tsx
export const DEFAULT_SIDEBAR_WIDTH = 280
```
to:
```tsx
export const DEFAULT_SIDEBAR_WIDTH = 240
```

- [ ] **Step 3: Update chat panel default width**

Change `DEFAULT_CHAT_PANEL_WIDTH` from 320 to 300.

- [ ] **Step 4: Commit**

```bash
git add src/app/projects/[id]/page.tsx
git commit -m "feat(ui): soften panel separators and update default widths"
```

---

### Task 16: Sweep Remaining zinc/gray References

**Files:**
- Multiple files — find and replace remaining zinc/gray occurrences

- [ ] **Step 1: Search for remaining zinc references**

Run: `grep -r "zinc" src/components/ src/app/ --include="*.tsx" --include="*.css" -l`

For each file found, replace `zinc` with `stone` (except where it's part of `prose-zinc` in editor.tsx — that should stay or change to `prose-stone`).

- [ ] **Step 2: Search for remaining gray references in component files**

Run: `grep -r "gray-" src/components/ src/app/ --include="*.tsx" -l`

Replace `gray` → `stone` in any remaining files.

- [ ] **Step 3: Update prose class in editor.tsx**

Change `prose-zinc dark:prose-invert` to `prose-stone dark:prose-invert` in the editor attributes.

- [ ] **Step 4: Commit**

```bash
git add -u src/
git commit -m "feat(ui): sweep remaining zinc/gray references to stone"
```

---

### Task 17: Build Verification and Dark Mode Check

- [ ] **Step 1: Run build**

Run: `npm run build`
Expected: No errors

- [ ] **Step 2: Visual verification checklist**

Run: `npm run dev` and check:
1. Auth page: left-right split, blue gradient left, clean form right
2. Dashboard: sidebar nav + card grid, hover animations on cards
3. Workspace: editor line-height 2.0, toolbar with stone buttons
4. AI chat: custom bubble shapes, blue user messages, white/stone AI messages
5. Dark mode toggle: all pages correct colors (stone-950 backgrounds, stone-50 text)
6. Panel separators: subtle blue on hover, smooth resize

- [ ] **Step 3: Commit any fixes**

```bash
git add -u src/
git commit -m "fix(ui): address visual issues found during verification"
```

---

## Verification

1. `npm run dev` — start dev server, no errors
2. Check `/auth` — left-right split panel, blue gradient brand area, form with stone borders and blue focus
3. Check `/` (dashboard) — sidebar navigation with blue active state, card grid with soft gradients, hover lift animation
4. Check `/projects/[id]` — 240px sidebar with blue tab indicator, editor with 2.0 line height and 40px padding, AI chat with shaped bubbles
5. Toggle dark mode on every page — all backgrounds stone-950, text stone-50, borders stone-800
6. Resize panels — subtle blue hover indicator on separators
7. `npm run build` — no build errors
