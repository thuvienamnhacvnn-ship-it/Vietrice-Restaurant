import { cn } from '@/lib/utils'

/**
 * Section title block used across the public sections: a large display title,
 * an optional handwritten script line, and the lotus divider from the mockups.
 */
export function SectionHeading({
  title,
  script,
  description,
  align = 'left',
  className,
  as: Tag = 'h2',
}: {
  title: string
  script?: string
  description?: string
  align?: 'left' | 'center'
  className?: string
  as?: 'h1' | 'h2'
}) {
  return (
    <div className={cn(align === 'center' && 'text-center', className)}>
      <Tag className="font-display text-[32px] uppercase leading-tight tracking-wider text-gold-gradient sm:text-[40px] lg:text-[46px]">
        {title}
      </Tag>
      {script && (
        <p className="mt-1 font-script text-[26px] leading-tight text-cream/90 sm:text-[30px]">
          {script}
        </p>
      )}
      <div
        className={cn(
          'divider-lotus my-5 max-w-[320px]',
          align === 'center' && 'mx-auto max-w-[380px]',
        )}
      >
        <span aria-hidden className="text-base">
          ❦
        </span>
      </div>
      {description && (
        <p
          className={cn(
            'max-w-xl whitespace-pre-line text-[14.5px] leading-relaxed text-muted',
            align === 'center' && 'mx-auto',
          )}
        >
          {description}
        </p>
      )}
    </div>
  )
}
