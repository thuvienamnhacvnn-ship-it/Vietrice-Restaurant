import { cn } from '@/lib/utils'

/**
 * Page gutter. `wide` matches the mockups' near-full-bleed 16:9 desktop layout;
 * `default` is used for reading-width content.
 */
export function Container({
  className,
  wide = false,
  as: Tag = 'div',
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { wide?: boolean; as?: React.ElementType }) {
  return (
    <Tag
      className={cn(
        'mx-auto w-full px-4 sm:px-6 lg:px-10',
        wide ? 'max-w-[1720px]' : 'max-w-[1240px]',
        className,
      )}
      {...props}
    />
  )
}
