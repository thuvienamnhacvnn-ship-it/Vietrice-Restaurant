import { Container } from '@/components/ui/Container'

export type LegalBlock = { heading?: string; body: string[] }

/**
 * Shared shell for the statutory and policy pages.
 *
 * These are reading pages, not part of the 16:9 section rhythm, so they scroll
 * naturally and use a reading-width column rather than the wide grid.
 */
export function LegalPage({
  title,
  updated,
  blocks,
}: {
  title: string
  updated?: string
  blocks: LegalBlock[]
}) {
  return (
    <div className="pt-[var(--header-h)]">
      <Container className="py-14 lg:py-20">
        <h1 className="font-display text-[34px] uppercase leading-tight tracking-wider text-gold-gradient sm:text-[42px]">
          {title}
        </h1>

        <div className="divider-lotus my-6 max-w-[320px]">
          <span aria-hidden className="text-base">
            ❦
          </span>
        </div>

        {updated && <p className="mb-8 text-[12.5px] text-muted">Stand: {updated}</p>}

        <div className="space-y-7">
          {blocks.map((block, i) => (
            <section key={block.heading ?? i}>
              {block.heading && (
                <h2 className="mb-2 font-display text-xl uppercase tracking-wide text-gold-light">
                  {block.heading}
                </h2>
              )}
              {block.body.map((paragraph, j) => (
                <p
                  key={j}
                  className="mb-2 whitespace-pre-line text-[14.5px] leading-relaxed text-cream/80"
                >
                  {paragraph}
                </p>
              ))}
            </section>
          ))}
        </div>
      </Container>
    </div>
  )
}
