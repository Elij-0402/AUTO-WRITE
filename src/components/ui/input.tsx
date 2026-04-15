import { forwardRef, type InputHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          'flex h-10 w-full rounded-[10px] border border-stone-300 bg-white px-3 py-2 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-stone-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/20 focus-visible:border-blue-500 disabled:cursor-not-allowed disabled:opacity-50 dark:border-stone-700 dark:bg-stone-950 dark:ring-offset-stone-950 dark:placeholder:text-stone-500 dark:focus-visible:ring-blue-400/20 dark:focus-visible:border-blue-400',
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
