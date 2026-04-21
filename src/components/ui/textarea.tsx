import * as React from "react"

import { cn } from "@/lib/utils"

const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.ComponentProps<"textarea">
>(({ className, ...props }, ref) => {
  return (
    <textarea
      className={cn(
        "flex min-h-[72px] w-full rounded-sm px-3 py-2 text-[var(--text-sm)] leading-[1.5]",
        "bg-[hsl(var(--surface-1))] border border-[hsl(var(--border))]",
        "text-foreground placeholder:text-muted-foreground",
        "transition-colors duration-100 ease-out",
        "hover:border-[hsl(var(--border-strong))]",
        "focus-visible:outline-none focus-visible:border-[hsl(var(--primary))]",
        "focus-visible:shadow-[0_0_0_3px_hsl(var(--primary)/0.15)]",
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
