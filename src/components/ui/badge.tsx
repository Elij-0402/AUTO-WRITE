import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2 py-0.5 text-[var(--text-xs)] font-medium leading-none transition-colors",
  {
    variants: {
      variant: {
        default:
          "border-[hsl(var(--accent-amber))]/40 bg-[hsl(var(--accent-amber))]/10 text-[hsl(var(--accent-amber))]",
        secondary:
          "border-[hsl(var(--border))] surface-3 text-muted-foreground",
        destructive:
          "border-[hsl(var(--accent-coral))]/40 bg-[hsl(var(--accent-coral))]/10 text-[hsl(var(--accent-coral))]",
        outline:
          "border-[hsl(var(--border-strong))] bg-transparent text-foreground",
        amber:
          "border-[hsl(var(--accent-amber))]/40 bg-[hsl(var(--accent-amber))]/10 text-[hsl(var(--accent-amber))]",
        jade:
          "border-[hsl(var(--accent-jade))]/40 bg-[hsl(var(--accent-jade))]/10 text-[hsl(var(--accent-jade))]",
        violet:
          "border-[hsl(var(--accent-violet))]/40 bg-[hsl(var(--accent-violet))]/10 text-[hsl(var(--accent-violet))]",
        coral:
          "border-[hsl(var(--accent-coral))]/40 bg-[hsl(var(--accent-coral))]/10 text-[hsl(var(--accent-coral))]",
      },
    },
    defaultVariants: {
      variant: "secondary",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
