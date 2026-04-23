'use client'

import { useRef, useCallback, useEffect } from 'react'
import { cn } from '@/lib/utils'
import {
  Group,
  Panel,
  Separator,
  type GroupImperativeHandle,
  type PanelImperativeHandle,
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
export const DEFAULT_SIDEBAR_WIDTH = 240
/** Minimum sidebar width per D-03 */
export const MIN_SIDEBAR_WIDTH = 200

export interface ResizablePanelGroupProps {
  /** The sidebar width in pixels (from persisted layout or default) */
  sidebarWidth: number
  /** Called when drag ends with new sidebar width in pixels per D-25 */
  onResizeEnd?: (sidebarWidthPx: number) => void
  /** Called on double-click to reset sidebar to default width per D-03 */
  onDoubleClickReset?: () => void
  /** Sidebar panel content */
  sidebarContent: React.ReactNode
  /** Main panel content */
  mainContent: React.ReactNode
  /** Minimum sidebar width in pixels (default: MIN_SIDEBAR_WIDTH) */
  minSidebarWidth?: number
  /** Whether to show the sidebar (false = focus mode) */
  showSidebar?: boolean
  /** Whether to collapse sidebar to a narrow rail (4px) when not hovered */
  collapseToRail?: boolean
  /** Additional CSS class for the panel group container */
  className?: string
}

/**
 * ResizablePanelGroup - Two-panel layout with draggable splitter.
 *
 * Uses react-resizable-panels under the hood for smooth real-time drag.
 * Per D-27: designed for reusability (Phase 5 four-panel layout will reuse).
 * Per D-25: layout saved on drag end via onResizeEnd callback.
 * Per D-03: double-click resets to 280px (not the persisted width).
 */
export function ResizablePanelGroup({
  sidebarWidth,
  onResizeEnd,
  onDoubleClickReset,
  sidebarContent,
  mainContent,
  minSidebarWidth = MIN_SIDEBAR_WIDTH,
  showSidebar = true,
  collapseToRail = false,
  className,
}: ResizablePanelGroupProps) {
  const groupRef = useRef<GroupImperativeHandle>(null)
  const sidebarPanelRef = useRef<PanelImperativeHandle>(null)

  // When sidebarWidth changes externally (e.g., loaded from IndexedDB),
  // update the panel size to match. This prevents the "flash to default" issue
  // where the panel renders at defaultSize and then jumps to persisted size.
  useEffect(() => {
    if (sidebarPanelRef.current && sidebarWidth !== DEFAULT_SIDEBAR_WIDTH) {
      // Only resize if not already at the target size
      const current = sidebarPanelRef.current.getSize()
      if (Math.abs(current.inPixels - sidebarWidth) > 2) {
        sidebarPanelRef.current.resize(sidebarWidth)
      }
    }
  }, [sidebarWidth])

  // Double-click handler: reset sidebar to default 280px per D-03
  const handleDoubleClick = useCallback(() => {
    if (sidebarPanelRef.current) {
      sidebarPanelRef.current.resize(DEFAULT_SIDEBAR_WIDTH)
    }
    if (onDoubleClickReset) {
      onDoubleClickReset()
    }
  }, [onDoubleClickReset])

  // onLayoutChanged fires after pointer release — save layout persistence per D-25
  const handleLayoutChanged = useCallback(() => {
    if (!onResizeEnd || !sidebarPanelRef.current) return
    const size = sidebarPanelRef.current.getSize()
    onResizeEnd(Math.round(size.inPixels))
  }, [onResizeEnd])

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
        panelRef={sidebarPanelRef}
        defaultSize={collapseToRail ? 4 : DEFAULT_SIDEBAR_WIDTH}
        minSize={collapseToRail ? 4 : minSidebarWidth}
        groupResizeBehavior="preserve-pixel-size"
        className={collapseToRail ? 'group relative overflow-hidden' : undefined}
      >
        <div className={cn(
          'h-full flex flex-col overflow-hidden transition-all duration-300',
          collapseToRail && 'w-1 group-hover:w-full'
        )}>
          {sidebarContent}
        </div>
      </Panel>

      {/* Resize handle — hair-thin, expands to amber on hover per Cinematic spec */}
      <Separator
        onDoubleClick={handleDoubleClick}
        className="group relative flex items-center justify-center w-px shrink-0 cursor-col-resize bg-[hsl(var(--border))]"
      >
        <div className="absolute inset-y-0 -left-1.5 -right-1.5 transition-colors duration-150" />
        <div className="absolute inset-y-0 left-0 w-px group-hover:w-[3px] group-hover:bg-[hsl(var(--accent-amber))] group-hover:-left-0 group-active:bg-[hsl(var(--accent-amber))] transition-[width,background-color] duration-150" />
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