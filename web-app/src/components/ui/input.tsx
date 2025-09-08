import * as React from 'react'

import { cn } from '@/lib/utils'

function Input({ className, type, ...props }: React.ComponentProps<'input'>) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        'placeholder:text-main-view-fg/50 border-main-view-fg/20 flex h-10 w-full min-w-0 rounded-lg border bg-transparent px-4 py-2 shadow-sm transition-all duration-200 outline-none disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 text-sm',
        'focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:ring-offset-1',
        'hover:border-main-view-fg/30 hover:shadow-md',
        'aria-invalid:ring-destructive/20 aria-invalid:border-destructive',
        '[&::-webkit-inner-spin-button]:appearance-none',
        className
      )}
      {...props}
    />
  )
}

export { Input }
