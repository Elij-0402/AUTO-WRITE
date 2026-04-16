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
    <div className="editor-toolbar flex items-center gap-0.5 border-b px-3 py-1.5 bg-background sticky top-0 z-10">
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              'h-8 w-8',
              editor.isActive('bold') && 'bg-accent text-accent-foreground'
            )}
            onClick={() => editor.chain().focus().toggleBold().run()}
          >
            <Bold className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>加粗 (Ctrl+B)</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              'h-8 w-8',
              editor.isActive('italic') && 'bg-accent text-accent-foreground'
            )}
            onClick={() => editor.chain().focus().toggleItalic().run()}
          >
            <Italic className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>斜体 (Ctrl+I)</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              'h-8 w-8',
              headingLevel > 0 && 'bg-accent text-accent-foreground'
            )}
            onClick={cycleHeading}
          >
            <HeadingIcon className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          标题 {headingLevel > 0 ? `H${headingLevel}` : '(点击循环切换)'}
        </TooltipContent>
      </Tooltip>
    </div>
  )
}
