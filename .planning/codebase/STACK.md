# Tech Stack (InkForge)

## Core
- **Framework**: Next.js 16.2 (App Router)
- **UI Library**: React 19
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS v4

## State Management & Storage
- **Global State**: Zustand
- **Local Database**: Dexie (IndexedDB frontend) - `meta-db` for user/workspace metadata and `project-db` dynamically instantiated for each project
- **Remote DB & Auth**: Supabase (via `@supabase/ssr`)

## Editor & UI
- **Rich Text Editor**: Tiptap (ProseMirror based) with custom extensions
- **UI Primitives**: Radix UI
- **Drag & Drop**: @dnd-kit
- **Layout Panels**: react-resizable-panels
- **Icons**: lucide-react

## Utilities
- **Validation**: Zod + react-hook-form
- **Document Generation**: docx, epub-gen
- **ID Generation**: nanoid

## Testing
- **Test Runner**: Vitest
- **Environment**: jsdom + fake-indexeddb
- **Component Testing**: React Testing Library