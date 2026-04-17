import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  [
    "inline-flex items-center justify-center gap-2 whitespace-nowrap",
    "rounded-[var(--radius-control)] text-[14px] font-medium",
    "transition-colors duration-[var(--dur-fast)] ease-[cubic-bezier(0.4,0,0.2,1)]",
    "disabled:pointer-events-none disabled:opacity-40",
    "[&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  ].join(" "),
  {
    variants: {
      variant: {
        default: [
          "bg-primary text-primary-foreground",
          "hover:bg-primary/90",
        ].join(" "),
        subtle: [
          "bg-[hsl(var(--surface-2))] text-foreground border border-border",
          "hover:bg-[hsl(var(--surface-3))] hover:border-[hsl(var(--border-strong))]",
        ].join(" "),
        destructive: [
          "bg-destructive text-destructive-foreground",
          "hover:bg-destructive/90",
        ].join(" "),
        outline: [
          "bg-transparent text-foreground border border-border",
          "hover:bg-[hsl(var(--surface-2))] hover:border-[hsl(var(--border-strong))]",
        ].join(" "),
        secondary: [
          "bg-[hsl(var(--surface-2))] text-foreground",
          "hover:bg-[hsl(var(--surface-3))]",
        ].join(" "),
        ghost: "bg-transparent hover:bg-[hsl(var(--surface-2))] text-foreground/90 hover:text-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        amber: [
          "bg-primary text-primary-foreground",
          "hover:bg-primary/90",
        ].join(" "),
        jade: [
          "bg-[hsl(var(--accent-jade))]/12 text-[hsl(var(--accent-jade))] border border-[hsl(var(--accent-jade))]/30",
          "hover:bg-[hsl(var(--accent-jade))]/20",
        ].join(" "),
      },
      size: {
        default: "h-9 px-4",
        sm: "h-8 px-3 text-[13px]",
        lg: "h-10 px-6",
        icon: "h-8 w-8",
        "icon-sm": "h-7 w-7 [&_svg]:size-3.5",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
