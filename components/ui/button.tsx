import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

const buttonVariants = cva(
  "inline-flex max-w-[260px] items-center justify-center gap-2 whitespace-nowrap rounded-md border border-[#2563EB]/35 text-sm font-medium tracking-[0.03em] text-primary-foreground shadow-[0_0_0_1px_rgba(37,99,235,0.16),0_0_20px_rgba(37,99,235,0.18)] !transition-[border-color,box-shadow,background-color,color] !duration-200 !ease-[cubic-bezier(0.2,0.9,0.2,1)] hover:border-[#2563EB]/75 hover:shadow-[0_0_0_1px_rgba(37,99,235,0.42),0_0_28px_rgba(37,99,235,0.32),0_0_56px_rgba(37,99,235,0.18)] disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-[#2563EB] focus-visible:ring-[#2563EB]/45 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/90',
        destructive:
          'bg-destructive text-white hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60',
        outline:
          'border-[#2563EB]/45 bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50',
        secondary:
          'bg-secondary text-secondary-foreground hover:bg-secondary/80',
        ghost:
          'hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50',
        link: 'border-0 bg-transparent text-primary shadow-none underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-8 px-3.5 py-1.5 text-[13px] has-[>svg]:px-3',
        sm: 'h-7 rounded-md gap-1.5 px-2.5 text-xs has-[>svg]:px-2',
        lg: 'h-9 rounded-md px-5 text-sm has-[>svg]:px-4',
        icon: 'size-9',
        'icon-sm': 'size-8',
        'icon-lg': 'size-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
)

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<'button'> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot : 'button'

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
