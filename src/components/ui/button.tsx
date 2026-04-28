import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

const buttonVariants = cva(
  [
    'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[var(--radius-control)] border text-[13px] font-medium',
    'transition-colors duration-100 ease-[cubic-bezier(0.2,0,0,1)] disabled:pointer-events-none disabled:opacity-40',
    'active:scale-[0.98] active:duration-100',
    '[&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0',
  ].join(' '),
  {
    variants: {
      variant: {
        default: [
          'border-primary bg-primary text-primary-foreground',
          'hover:border-[hsl(var(--accent-dim))] hover:bg-[hsl(var(--accent-dim))]',
        ].join(' '),
        subtle: [
          'border-border bg-[hsl(var(--surface-2))] text-foreground',
          'hover:bg-[hsl(var(--surface-3))] hover:border-[hsl(var(--border-strong))]',
        ].join(' '),
        destructive: [
          'border-destructive bg-transparent text-destructive',
          'hover:bg-destructive/10 hover:text-destructive',
        ].join(' '),
        outline: [
          'border-border bg-transparent text-foreground',
          'hover:bg-[hsl(var(--surface-2))] hover:border-[hsl(var(--border-strong))]',
        ].join(' '),
        secondary: [
          'border-border bg-[hsl(var(--surface-2))] text-foreground',
          'hover:bg-[hsl(var(--surface-3))] hover:border-[hsl(var(--border-strong))]',
        ].join(' '),
        ghost: 'border-transparent bg-transparent text-foreground hover:bg-[hsl(var(--surface-2))]',
        link: 'border-transparent px-0 text-primary underline-offset-4 hover:underline',
        primary: [
          'border-primary bg-primary text-primary-foreground',
          'hover:border-[hsl(var(--accent-dim))] hover:bg-[hsl(var(--accent-dim))]',
        ].join(' '),
      },
      size: {
        default: 'h-9 px-4',
        sm: 'h-8 px-3 text-[13px]',
        lg: 'h-10 px-6',
        icon: 'h-8 w-8 px-0',
        'icon-sm': 'h-7 w-7 px-0 [&_svg]:size-3.5',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
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
    const Comp = asChild ? Slot : 'button'
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = 'Button'

export { Button, buttonVariants }
