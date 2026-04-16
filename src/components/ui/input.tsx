import * as React from "react"

import { cn } from "@/lib/utils"

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-9 w-full rounded-[var(--radius-control)] px-3 py-1 text-[var(--text-sm)]",
          "bg-[hsl(var(--surface-2))] border border-[hsl(var(--border))]",
          "text-foreground placeholder:text-muted-foreground",
          "transition-[border-color,background-color,box-shadow] duration-[var(--dur-fast)]",
          "hover:border-[hsl(var(--border-strong))]",
          "focus-visible:outline-none focus-visible:border-[hsl(var(--accent-amber))]/60 focus-visible:bg-[hsl(var(--surface-3))]",
          "focus-visible:shadow-[0_0_0_3px_hsl(var(--accent-amber)/0.15)]",
          "file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground",
          "disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
