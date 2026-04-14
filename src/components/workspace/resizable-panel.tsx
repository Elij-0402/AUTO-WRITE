'use client'

import { useRef, useCallback } from 'react'
import {
  Group,
  Panel,
  Separator,
  type GroupImperativeHandle,
} from 'react-resizable-panels'

/**
 * Reusable resizable panel system for the InkForge workspace.
 * Per D-02: Phase 3 uses 2-panel layout, Phase 5 will reuse for 4-panel.
 * Per D-01: Drag splitter between panels.
 * Per D-04: Real-time resize (native to react-resizable-panels).
 * Per D-06: cursor: col-resize on handle hover.
 * Per D-03: Double-click to reset sidebar to default 280px.
 */

/** Default sidebar width matching current fixed layout per D-05 */
export const DEFAULT_SIDEBAR_WIDTH = 280
/** Minimum sidebar width per D-03 */
export const MIN_SIDEBAR_WIDTH = 200

export interface ResizablePanelGroupProps {
  /** The sidebar width in pixels (from persisted layout or default) */
  sidebarWidth: number
  /** Called when drag ends with new sidebar width in pixels */
  onResizeEnd?: (sidebarWidthPx: number) => void
  /** Called on double-click to reset sidebar to default width */
  onDoubleClickReset?: () => void
  /** Sidebar panel content */
  sidebarContent: React.ReactNode
  /** Main panel content */
  mainContent: React.ReactNode
  /** Minimum sidebar width in pixels (default: MIN_SIDEBAR_WIDTH) */
  minSidebarWidth?: number
  /** Default sidebar width in pixels (default: DEFAULT_SIDEBAR_WIDTH) */
  defaultSidebarWidth?: number
  /** Whether to show the sidebar (false = focus mode) */
  showSidebar?: boolean
  /** Additional CSS class for the panel group container */
  className?: string
}

/**
 * ResizablePanelGroup - Two-panel layout with draggable splitter.
 *
 * Uses react-resizable-panels under the hood for smooth real-time drag.
 * Exposes callbacks for layout persistence.
 * Per D-27: designed for reusability (Phase 5 four-panel layout will reuse).
 */
export function ResizablePanelGroup({
  sidebarWidth,
  onResizeEnd,
  onDoubleClickReset,
  sidebarContent,
  mainContent,
  minSidebarWidth = MIN_SIDEBAR_WIDTH,
  defaultSidebarWidth = DEFAULT_SIDEBAR_WIDTH,
  showSidebar = true,
  className,
}: ResizablePanelGroupProps) {
  const groupRef = useRef<GroupImperativeHandle>(null)

  // Double-click handler: reset sidebar to default size
  const handleDoubleClick = useCallback(() => {
    if (onDoubleClickReset) {
      onDoubleClickReset()
    }
  }, [onDoubleClickReset])

  // onLayoutChanged fires after pointer release — perfect for persisting layout
  const handleLayoutChanged = useCallback(
    (layout: { [id: string]: number }) => {
      if (!onResizeEnd) return
      // layout maps panel id -> flex-grow value
      // We need to compute the actual sidebar width from the layout
      // The library uses flex-grow, so we need to calculate from DOM
      // Use groupRef to get actual sizes
      if (groupRef.current) {
        const currentLayout = groupRef.current.getLayout()
        // currentLayout maps panel id -> flexGrow value
        // We need to compute pixels from the ratio
        const ids = Object.keys(currentLayout)
        if (ids.length >= 2) {
          const sidebarFlex = Object.values(currentLayout)[0]
          const totalFlex = Object.values(currentLayout).reduce((a: number, b: number) => a + b, 0) as number
          if (totalFlex > 0 && typeof window !== 'undefined') {
            const viewportWidth = window.innerWidth
            const sidebarPx = Math.round((sidebarFlex / totalFlex) * viewportWidth)
            onResizeEnd(sidebarPx)
          }
        }
      }
    },
    [onResizeEnd]
  )

  if (!showSidebar) {
    // Focus mode: only show main content
    return (
      <div className={`flex-1 flex flex-col overflow-hidden ${className || ''}`}>
        {mainContent}
      </div>
    )
  }

  return (
    <Group
      groupRef={groupRef}
      orientation="horizontal"
      onLayoutChanged={handleLayoutChanged}
      className={className}
    >
      {/* Sidebar panel per D-01, D-04 */}
      <Panel
        id="sidebar"
        defaultSize={sidebarWidth}
        minSize={minSidebarWidth}
      >
        <div className="h-full flex flex-col overflow-hidden">
          {sidebarContent}
        </div>
      </Panel>

      {/* Resize handle per D-01, D-06 */}
      <Separator onDoubleClick={handleDoubleClick} className="group relative flex items-center justify-center w-1 shrink-0" >
        <div className="absolute inset-y-0 -left-1 -right-1 group-hover:bg-blue-400/20 group-active:bg-blue-500/30 transition-colors" />
        <div className="w-1 h-full bg-zinc-200 group-hover:bg-blue-400 dark:bg-zinc-800 group-hover:dark:bg-blue-500 group-active:bg-blue-500 group-active:dark:bg-blue-400 transition-colors cursor-col-resize" />
      </Separator>

      {/* Main content panel */}
      <Panel id="main" groupResizeBehavior="preserve-relative-size">
        <div className="h-full flex flex-col overflow-hidden">
          {mainContent}
        </div>
      </Panel>
    </Group>
  )
}

// Re-export library components for Phase 5 four-panel layout reusability per D-27
export { Group, Panel, Separator }