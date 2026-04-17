import * as React from "react"

import { cn } from "@/lib/utils"

const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.ComponentProps<"textarea">
>(({ className, ...props }, ref) => {
  return (
    <textarea
      className={cn(
        "flex min-h-[72px] w-full rounded-[var(--radius-control)] px-3 py-2 text-[var(--text-sm)] leading-[1.65]",
        "bg-[hsl(var(--surface-2))] border border-[hsl(var(--border))]",
        "text-foreground placeholder:text-muted-foreground",
        "transition-[border-color,background-color,box-shadow] duration-[var(--dur-fast)]",
        "hover:border-[hsl(var(--border-strong))]",
        "focus-visible:outline-none focus-visible:bg-[hsl(var(--surface-3))]",
        "disabled:cursor-not-allowed disabled:opacity-50",
        "resize-y",
        className
      )}
      ref={ref}
      {...props}
    />
  )
})
Textarea.displayName = "Textarea"

export { Textarea }
