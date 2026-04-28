import * as React from 'react'

import { cn } from '@/lib/utils'

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<'input'>>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          'flex h-9 w-full rounded-[var(--radius-control)] border px-3 py-1 text-[var(--text-sm)]',
          'border-[hsl(var(--input))] bg-[hsl(var(--surface-2))] text-foreground placeholder:text-[hsl(var(--faint))]',
          'transition-colors duration-100 ease-[cubic-bezier(0.2,0,0,1)] hover:border-[hsl(var(--border-strong))]',
          'focus-visible:outline-none focus-visible:border-[hsl(var(--accent))] focus-visible:bg-[hsl(var(--surface-1))]',
          'file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground',
          'disabled:cursor-not-allowed disabled:opacity-50',
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = 'Input'

export { Input }
