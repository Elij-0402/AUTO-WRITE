import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import { ResizablePanelGroup } from './resizable-panel'

// Mock Panel components from react-resizable-panels
vi.mock('react-resizable-panels', () => ({
  Group: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => (
    <div data-testid="panel-group" {...props}>{children}</div>
  ),
  Panel: ({ children, id, className, ...props }: React.PropsWithChildren<{ id: string; className?: string; [key: string]: unknown }>) => (
    <div data-testid={`panel-${id}`} data-panel-props={JSON.stringify(props)} className={className}>{children}</div>
  ),
  Separator: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => (
    <div data-testid="panel-separator" {...props}>{children}</div>
  ),
}))

describe('ResizablePanelGroup', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    cleanup()
  })

  describe('collapseToRail mode', () => {
    it('applies collapsed panel size when collapseToRail=true', () => {
      render(
        <ResizablePanelGroup
          sidebarWidth={240}
          sidebarContent={<div>Sidebar</div>}
          mainContent={<div>Main</div>}
          collapseToRail={true}
        />
      )

      const sidebarProps = JSON.parse(screen.getByTestId('panel-sidebar').getAttribute('data-panel-props') || '{}')
      expect(sidebarProps.defaultSize).toBe(4)
      expect(sidebarProps.minSize).toBe(4)
    })

    it('applies overflow-hidden class when collapseToRail=true', () => {
      render(
        <ResizablePanelGroup
          sidebarWidth={240}
          sidebarContent={<div>Sidebar</div>}
          mainContent={<div>Main</div>}
          collapseToRail={true}
        />
      )

      const sidebar = screen.getByTestId('panel-sidebar')
      expect(sidebar.className).toContain('overflow-hidden')
    })

    it('applies group class when collapseToRail=true', () => {
      render(
        <ResizablePanelGroup
          sidebarWidth={240}
          sidebarContent={<div>Sidebar</div>}
          mainContent={<div>Main</div>}
          collapseToRail={true}
        />
      )

      const sidebar = screen.getByTestId('panel-sidebar')
      expect(sidebar.className).toContain('group')
    })
  })

  describe('default mode (no rail)', () => {
    it('uses default sidebar width when collapseToRail=false', () => {
      render(
        <ResizablePanelGroup
          sidebarWidth={240}
          sidebarContent={<div>Sidebar</div>}
          mainContent={<div>Main</div>}
          collapseToRail={false}
        />
      )

      const sidebarProps = JSON.parse(screen.getByTestId('panel-sidebar').getAttribute('data-panel-props') || '{}')
      expect(sidebarProps.defaultSize).toBe(240)
      expect(sidebarProps.minSize).toBe(200) // MIN_SIDEBAR_WIDTH
    })

    it('does not apply overflow-hidden class when collapseToRail=false', () => {
      render(
        <ResizablePanelGroup
          sidebarWidth={240}
          sidebarContent={<div>Sidebar</div>}
          mainContent={<div>Main</div>}
          collapseToRail={false}
        />
      )

      const sidebar = screen.getByTestId('panel-sidebar')
      expect(sidebar.className).not.toContain('overflow-hidden')
    })

    it('does not apply group class when collapseToRail=false', () => {
      render(
        <ResizablePanelGroup
          sidebarWidth={240}
          sidebarContent={<div>Sidebar</div>}
          mainContent={<div>Main</div>}
          collapseToRail={false}
        />
      )

      const sidebar = screen.getByTestId('panel-sidebar')
      expect(sidebar.className).not.toContain('group')
    })
  })

  describe('showSidebar=false (focus mode)', () => {
    it('renders only main content when showSidebar=false', () => {
      render(
        <ResizablePanelGroup
          sidebarWidth={240}
          sidebarContent={<div>Sidebar</div>}
          mainContent={<div>Main Content</div>}
          showSidebar={false}
        />
      )

      expect(screen.queryByTestId('panel-sidebar')).toBeNull()
      expect(screen.queryByText('Main Content')).toBeInTheDocument()
    })
  })

  describe('custom minSidebarWidth', () => {
    it('respects custom minSidebarWidth prop', () => {
      render(
        <ResizablePanelGroup
          sidebarWidth={240}
          sidebarContent={<div>Sidebar</div>}
          mainContent={<div>Main</div>}
          minSidebarWidth={150}
          collapseToRail={false}
        />
      )

      const sidebarProps = JSON.parse(screen.getByTestId('panel-sidebar').getAttribute('data-panel-props') || '{}')
      expect(sidebarProps.minSize).toBe(150)
    })
  })

  describe('panel structure', () => {
    it('renders all panels and separator', () => {
      render(
        <ResizablePanelGroup
          sidebarWidth={240}
          sidebarContent={<div>Sidebar</div>}
          mainContent={<div>Main</div>}
        />
      )

      expect(screen.getByTestId('panel-group')).toBeInTheDocument()
      expect(screen.getByTestId('panel-sidebar')).toBeInTheDocument()
      expect(screen.getByTestId('panel-main')).toBeInTheDocument()
      expect(screen.getByTestId('panel-separator')).toBeInTheDocument()
    })

    it('renders sidebar and main content correctly', () => {
      render(
        <ResizablePanelGroup
          sidebarWidth={240}
          sidebarContent={<div data-testid="sidebar-content">Sidebar Content</div>}
          mainContent={<div data-testid="main-content">Main Content</div>}
        />
      )

      expect(screen.getByTestId('sidebar-content')).toBeInTheDocument()
      expect(screen.getByTestId('main-content')).toBeInTheDocument()
    })
  })
})
