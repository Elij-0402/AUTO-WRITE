'use client'

import { Component, type ErrorInfo, type ReactNode } from 'react'

interface Props {
  label: string
  children: ReactNode
}

interface State {
  error: Error | null
}

export class PanelErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error(`[PanelErrorBoundary:${this.props.label}]`, error, info.componentStack)
  }

  handleReset = (): void => {
    this.setState({ error: null })
  }

  render(): ReactNode {
    if (!this.state.error) return this.props.children

    return (
      <div className="h-full flex items-center justify-center p-6 surface-0">
        <div className="max-w-sm text-center space-y-3">
          <p className="text-[15px] font-semibold text-foreground">
            {this.props.label}暂时不可用
          </p>
          <p className="text-[12px] text-muted-foreground leading-relaxed">
            {this.state.error.message || '出现了意料之外的错误'}
          </p>
          <div className="flex items-center justify-center gap-2 pt-1">
            <button
              onClick={this.handleReset}
              className="px-3 py-1.5 text-[12px] rounded-[var(--radius-control)] border border-border hover:bg-[hsl(var(--surface-2))] transition-colors"
            >
              重试
            </button>
            <button
              onClick={() => location.reload()}
              className="px-3 py-1.5 text-[12px] rounded-[var(--radius-control)] border border-border hover:bg-[hsl(var(--surface-2))] transition-colors"
            >
              刷新页面
            </button>
          </div>
        </div>
      </div>
    )
  }
}
