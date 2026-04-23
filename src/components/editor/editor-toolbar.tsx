'use client'

import { useCallback } from 'react'
import type { Editor } from '@tiptap/react'
import { Bold, Italic, Heading1, Heading2, Heading3 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

interface EditorToolbarProps {
  editor: Editor
}

export function EditorToolbar({ editor }: EditorToolbarProps) {
  const getHeadingLevel = (): number => {
    if (editor.isActive('heading', { level: 1 })) return 1
    if (editor.isActive('heading', { level: 2 })) return 2
    if (editor.isActive('heading', { level: 3 })) return 3
    return 0
  }

  const headingLevel = getHeadingLevel()

  const cycleHeading = useCallback(() => {
    if (headingLevel === 0) {
      editor.chain().focus().toggleHeading({ level: 1 }).run()
    } else if (headingLevel === 1) {
      editor.chain().focus().toggleHeading({ level: 2 }).run()
    } else if (headingLevel === 2) {
      editor.chain().focus().toggleHeading({ level: 3 }).run()
    } else {
      editor.chain().focus().setParagraph().run()
    }
  }, [editor, headingLevel])

  const HeadingIcon = headingLevel === 1
    ? Heading1
    : headingLevel === 2
      ? Heading2
      : headingLevel === 3
        ? Heading3
        : Heading1

  return (
    <div className="editor-toolbar group flex items-center gap-0.5 divider-hair px-3 py-1.5 surface-1 sticky top-0 z-10 opacity-15 hover:opacity-100 transition-opacity duration-300">
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon-sm"
            className={cn(
              'relative',
              editor.isActive('bold') && 'text-[hsl(var(--accent-amber))] after:absolute after:left-1.5 after:right-1.5 after:bottom-0.5 after:h-[2px] after:bg-[hsl(var(--accent-amber))] after:rounded-full'
            )}
            onClick={() => editor.chain().focus().toggleBold().run()}
          >
            <Bold />
          </Button>
        </TooltipTrigger>
        <TooltipContent>加粗 (Ctrl+B)</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon-sm"
            className={cn(
              'relative',
              editor.isActive('italic') && 'text-[hsl(var(--accent-amber))] after:absolute after:left-1.5 after:right-1.5 after:bottom-0.5 after:h-[2px] after:bg-[hsl(var(--accent-amber))] after:rounded-full'
            )}
            onClick={() => editor.chain().focus().toggleItalic().run()}
          >
            <Italic />
          </Button>
        </TooltipTrigger>
        <TooltipContent>斜体 (Ctrl+I)</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon-sm"
            className={cn(
              'relative',
              headingLevel > 0 && 'text-[hsl(var(--accent-amber))] after:absolute after:left-1.5 after:right-1.5 after:bottom-0.5 after:h-[2px] after:bg-[hsl(var(--accent-amber))] after:rounded-full'
            )}
            onClick={cycleHeading}
          >
            <HeadingIcon />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          标题 {headingLevel > 0 ? `H${headingLevel}` : '(点击循环切换)'}
        </TooltipContent>
      </Tooltip>
    </div>
  )
}
