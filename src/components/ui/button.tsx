import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  [
    "inline-flex items-center justify-center gap-2 whitespace-nowrap",
    "rounded-[var(--radius-control)] text-sm font-medium",
    "transition-[background-color,color,box-shadow,transform] duration-[var(--dur-fast)] ease-[cubic-bezier(0.4,0,0.2,1)]",
    "disabled:pointer-events-none disabled:opacity-40",
    "[&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  ].join(" "),
  {
    variants: {
      variant: {
        default: [
          "bg-[hsl(var(--accent-amber))] text-[hsl(var(--primary-foreground))]",
          "shadow-[inset_0_1px_0_hsl(0_0%_100%/0.2),0_1px_2px_hsl(0_0%_0%/0.4)]",
          "hover:bg-[hsl(var(--accent-amber))]/90 hover:-translate-y-[0.5px]",
          "active:translate-y-0",
        ].join(" "),
        subtle: [
          "surface-2 text-foreground border border-[hsl(var(--border))]",
          "hover:surface-3 hover:border-[hsl(var(--border-strong))]",
        ].join(" "),
        destructive: [
          "bg-[hsl(var(--accent-coral))] text-white",
          "hover:bg-[hsl(var(--accent-coral))]/90",
        ].join(" "),
        outline: [
          "bg-transparent text-foreground border border-[hsl(var(--border-strong))]",
          "hover:bg-[hsl(var(--surface-3))] hover:border-[hsl(var(--accent-amber))]/40",
        ].join(" "),
        secondary: [
          "surface-2 text-foreground",
          "hover:surface-3",
        ].join(" "),
        ghost: "bg-transparent hover:bg-[hsl(var(--surface-3))] text-foreground/90 hover:text-foreground",
        link: "text-[hsl(var(--accent-amber))] underline-offset-4 hover:underline",
        amber: [
          "bg-[hsl(var(--accent-amber))] text-[hsl(var(--primary-foreground))]",
          "hover:bg-[hsl(var(--accent-amber))]/90",
        ].join(" "),
        jade: [
          "bg-[hsl(var(--accent-jade))]/15 text-[hsl(var(--accent-jade))] border border-[hsl(var(--accent-jade))]/40",
          "hover:bg-[hsl(var(--accent-jade))]/22",
        ].join(" "),
      },
      size: {
        default: "h-9 px-4",
        sm: "h-7 px-2.5 text-xs rounded-[var(--radius-control)]",
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
