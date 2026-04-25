import * as React from "react"

import { cn } from "@/lib/utils"

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-9 w-full rounded-sm px-3 py-1 text-[var(--text-sm)]",
          "bg-[hsl(var(--surface-1))] border border-[hsl(var(--border))]",
          "text-foreground placeholder:text-muted-foreground",
          "transition-colors duration-100 ease-out",
          "hover:border-[hsl(var(--border-strong))]",
          "focus-visible:outline-none focus-visible:border-[hsl(var(--primary))]",
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
