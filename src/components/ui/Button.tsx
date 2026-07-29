import { forwardRef } from 'react'
import Link from 'next/link'

import { cn } from '@/lib/utils'

type Variant = 'gold' | 'outline' | 'ghost' | 'danger' | 'success'
type Size = 'sm' | 'md' | 'lg'

const base =
  'fx-shine fx-press inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md font-body font-medium uppercase tracking-luxe ' +
  'transition-all duration-300 disabled:pointer-events-none disabled:opacity-45 ' +
  // Keep the label above the shine sweep.
  '[&>*]:relative [&>*]:z-[2]'

const variants: Record<Variant, string> = {
  // Solid gold — the primary "Reserve Table" action from the mockups.
  gold:
    'bg-gold-gradient text-[#1a1408] shadow-gold hover:shadow-gold-lg hover:brightness-110 active:brightness-95',
  // Hairline gold on transparent — the secondary "View Menu" action.
  outline:
    'border border-gold/55 bg-black/25 text-gold backdrop-blur-sm hover:border-gold hover:bg-gold/10 hover:text-gold-light',
  ghost: 'text-gold/85 hover:bg-gold/10 hover:text-gold-light',
  danger: 'border border-danger/50 bg-danger/12 text-danger hover:bg-danger/22',
  success: 'border border-success/50 bg-success/12 text-success hover:bg-success/22',
}

const sizes: Record<Size, string> = {
  sm: 'h-9 px-4 text-[11px]',
  md: 'h-11 px-6 text-xs',
  lg: 'h-[46px] px-8 text-[13px]',
}

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant
  size?: Size
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant = 'gold', size = 'md', type = 'button', ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      className={cn(base, variants[variant], sizes[size], className)}
      {...props}
    />
  )
})

export type ButtonLinkProps = React.ComponentPropsWithoutRef<typeof Link> & {
  variant?: Variant
  size?: Size
}

/** Same visual language as `Button`, rendered as a real anchor for navigation. */
export function ButtonLink({
  className,
  variant = 'gold',
  size = 'md',
  ...props
}: ButtonLinkProps) {
  return <Link className={cn(base, variants[variant], sizes[size], className)} {...props} />
}
