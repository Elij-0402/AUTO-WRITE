# MCP-Driven E2E Bug Fix & Verification — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Set up Next.js devtools MCP + Playwright MCP, detect and fix all build/runtime/type errors, then E2E verify every page flow.

**Architecture:** Configure two MCP servers (next-devtools for error detection, Playwright for browser testing). Use MCP `get_errors` in a detect-fix-verify loop. Validate all 7 user flows via Playwright browser automation.

**Tech Stack:** Next.js 16.2.3 (native MCP), next-devtools-mcp, @anthropic-ai/playwright-mcp, Playwright

---

### Task 1: Create MCP Configuration

**Files:**
- Create: `.mcp.json`
- Modify: `.gitignore`

- [ ] **Step 1: Create `.mcp.json` at project root**

```json
{
  "mcpServers": {
    "next-devtools": {
      "command": "npx",
      "args": ["-y", "next-devtools-mcp@latest"]
    },
    "playwright": {
      "command": "npx",
      "args": ["-y", "@anthropic-ai/playwright-mcp@latest"]
    }
  }
}
```

- [ ] **Step 2: Add `.mcp.json` to `.gitignore`**

MCP config contains local tool references — append to `.gitignore`:

```
# MCP configuration (local tooling)
.mcp.json
```

- [ ] **Step 3: Commit**

```bash
git add .mcp.json .gitignore
git commit -m "chore: add MCP configuration for next-devtools and playwright"
```

---

### Task 2: Start Dev Server and Initial MCP Error Detection

**Files:** None modified — diagnostic task

- [ ] **Step 1: Start Next.js dev server in background**

```bash
npm run dev
```

Wait for `Ready in Xms` output confirming compilation succeeded.

- [ ] **Step 2: Use MCP `get_errors` to retrieve all current errors**

Call the `next-devtools` MCP server's `get_errors` tool. This returns:
- Build errors (compilation failures)
- Type errors (TypeScript)
- Runtime errors (hydration, JS exceptions)

Record every error with its source file and error message.

- [ ] **Step 3: Use MCP `get_routes` to verify route integrity**

Call `get_routes` and confirm these routes exist:
- `/` (Dashboard)
- `/auth` (Auth page)
- `/auth/forgot-password` (Password reset)
- `/auth/callback` (OAuth callback route)
- `/projects/[id]` (Project workspace)

Record any missing or unexpected routes.

- [ ] **Step 4: Use MCP `get_project_metadata` to capture project baseline**

Record the project structure and dev server URL for reference.

---

### Task 3: Fix Detected Build and Type Errors

**Files:** Depends on errors detected — likely candidates below

**Known issue from code review — React hooks violation in `ai-chat-panel.tsx:179`:**

The `handleCheckDuplicate` function calls `useWorldEntries(projectId)` inside a callback, which violates React's rules of hooks. Hooks must be called at the top level of a component, not inside callbacks.

- [ ] **Step 1: Fix hooks violation in `src/components/workspace/ai-chat-panel.tsx`**

Find this code at line 169-183:

```typescript
  // Handle checking for duplicate entry names per D-22
  const handleCheckDuplicate = async (name: string): Promise<WorldEntry | null> => {
    const allEntries = [
      ...entriesByType.character,
      ...entriesByType.location,
      ...entriesByType.rule,
      ...entriesByType.timeline
    ]
    const existing = allEntries.find(e => e.name === name)
    if (existing) {
      // Fetch full entry
      const { getEntryById } = useWorldEntries(projectId)
      return await getEntryById(existing.id) || null
    }
    return null
  }
```

Replace with (uses `entriesByType` already available from the hook at component top level, and directly queries Dexie for the full entry):

```typescript
  // Handle checking for duplicate entry names per D-22
  const handleCheckDuplicate = async (name: string): Promise<WorldEntry | null> => {
    const allEntries = [
      ...entriesByType.character,
      ...entriesByType.location,
      ...entriesByType.rule,
      ...entriesByType.timeline
    ]
    const existing = allEntries.find(e => e.name === name)
    if (existing) {
      const db = createProjectDB(projectId)
      const entry = await db.table('worldEntries').get(existing.id)
      return entry || null
    }
    return null
  }
```

Add the import at the top of the file if not already present:

```typescript
import { createProjectDB } from '@/lib/db/project-db'
```

- [ ] **Step 2: Fix any additional errors reported by MCP `get_errors`**

For each error:
1. Read the source file at the line indicated
2. Identify root cause
3. Apply minimal fix
4. Save file and wait for hot-reload

- [ ] **Step 3: Re-run MCP `get_errors` to confirm zero errors**

Call `get_errors` again. Expected: no errors returned.

If errors remain, repeat Step 2 until clean.

- [ ] **Step 4: Commit all fixes**

```bash
git add -A
git commit -m "fix: resolve build/type/runtime errors detected by MCP"
```

---

### Task 4: Fix Runtime Errors Detected via Browser Navigation

**Files:** Depends on runtime errors found

- [ ] **Step 1: Use Playwright to navigate to `/auth` page**

Open `http://localhost:3000/auth` in the browser via Playwright MCP. Take a screenshot. Check for:
- Page renders without errors
- Login/register tabs visible
- Form fields present
- Chinese text renders with correct font

- [ ] **Step 2: Navigate to `/` (Dashboard)**

Since auth is required, this will redirect to `/auth`. Verify:
- Redirect happens correctly
- No console errors
- URL contains `returnUrl` parameter

- [ ] **Step 3: Check browser console logs for errors**

Use MCP `get_logs` to retrieve browser console output. Record any errors or warnings.

- [ ] **Step 4: Fix any runtime errors found**

For each runtime error:
1. Identify the source component
2. Read the relevant source file
3. Apply fix
4. Verify via Playwright screenshot that the error is resolved

- [ ] **Step 5: Commit runtime fixes**

```bash
git add -A
git commit -m "fix: resolve runtime errors found during browser navigation"
```

---

### Task 5: E2E Verify Auth Flow

**Files:** None modified — verification task

- [ ] **Step 1: Verify `/auth` page renders correctly**

Via Playwright:
1. Navigate to `http://localhost:3000/auth`
2. Screenshot the login form
3. Verify: page title, email input, password input, submit button, tab toggle all visible

- [ ] **Step 2: Verify tab switching between login and register**

1. Click the "注册" tab
2. Screenshot
3. Verify: form still present, button text changed to "注册"
4. Click "登录" tab
5. Verify: button text changed back to "登录"

- [ ] **Step 3: Verify form validation**

1. Submit empty form
2. Verify: HTML5 validation prevents submission (required fields)
3. Enter invalid email, verify validation message

- [ ] **Step 4: Verify forgot password link**

1. Click "忘记密码？" link
2. Verify: navigates to `/auth/forgot-password`
3. Screenshot the page

---

### Task 6: E2E Verify Dashboard Flow

**Files:** None modified — verification task

Note: Dashboard requires auth. If Supabase is not configured with real credentials, the dashboard may show errors related to auth. Test what's accessible.

- [ ] **Step 1: Navigate to dashboard**

1. Navigate to `http://localhost:3000/`
2. If redirected to `/auth`, note this is expected behavior
3. Screenshot the result

- [ ] **Step 2: Check for JavaScript errors on dashboard load**

Use `get_errors` and browser console logs. Record any client-side errors.

- [ ] **Step 3: Document auth-gated flows**

If the dashboard is behind auth and Supabase isn't configured, document which flows cannot be tested end-to-end in this session and note them as manual verification items.

---

### Task 7: E2E Verify Project Workspace (if accessible)

**Files:** None modified — verification task

- [ ] **Step 1: Attempt to access a project workspace**

Navigate to `http://localhost:3000/projects/test-id`. Screenshot the result.

- [ ] **Step 2: Verify workspace layout renders**

If accessible, check:
- Left sidebar with 3 tabs (chapters, outline, world bible)
- Center editor area with placeholder message
- Right AI chat panel
- Top bar with settings, focus mode, theme toggle icons

- [ ] **Step 3: Verify theme toggle works**

1. Click the theme toggle button (moon/sun icon)
2. Screenshot
3. Verify: dark/light mode switches

- [ ] **Step 4: Verify focus mode toggle**

1. Click the focus mode button
2. Screenshot
3. Verify: sidebar and chat panel hidden, only editor visible

---

### Task 8: Final MCP Verification and Summary

**Files:** None modified — verification task

- [ ] **Step 1: Run final `get_errors` check**

Call MCP `get_errors`. Expected: zero errors across all pages.

- [ ] **Step 2: Run final `get_routes` check**

Call MCP `get_routes`. Verify all expected routes are present.

- [ ] **Step 3: Compile verification summary**

Create a summary of:
- Total errors found and fixed
- All E2E flows tested with pass/fail status
- Any flows that couldn't be tested (e.g., auth-gated) with reason
- Screenshots taken as evidence

- [ ] **Step 4: Final commit if any remaining changes**

```bash
git add -A
git commit -m "chore: complete MCP-driven E2E verification"
```
