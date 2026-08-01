import { z } from 'zod'

/**
 * Pieces shared by the admin content routes — menu, promotions and gallery.
 *
 * They validate the same two things over and over: that a URL points somewhere
 * this restaurant controls, and that a slug is unique. Keeping one copy means a
 * tightened rule tightens everywhere rather than in whichever route someone
 * remembered.
 */

/**
 * A media URL the site itself is responsible for.
 *
 * An arbitrary URL here would let anyone holding a session point the
 * restaurant's banner, menu photographs or gallery at a third-party server —
 * which is both a defacement and a way to have every visitor's browser make a
 * request to someone else's machine.
 */
export const blobUrl = z
  .string()
  .max(500)
  .refine(
    (v) => v.startsWith('/') || /^https:\/\/[a-z0-9-]+\.public\.blob\.vercel-storage\.com\//.test(v),
    'Must be a site-relative path or a Vercel Blob URL.',
  )

/** URL-safe slug from a human name, with diacritics folded rather than dropped. */
export function slugify(input: string): string {
  return (
    input
      .normalize('NFD')
      // Vietnamese đ/Đ has no combining form, so NFD leaves it alone.
      .replace(/[đĐ]/g, 'd')
      // Strips the combining marks NFD just separated out (U+0300–U+036F).
      // The range is written literally; the characters render as nothing.
      .replace(/[̀-ͯ]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 60) || 'item'
  )
}

/**
 * A slug not already in `taken`.
 *
 * Suffixes rather than rejects: two dishes genuinely can share a name across
 * categories, and refusing the second one would make a member of staff invent a
 * worse name to satisfy a database constraint they cannot see.
 */
export function uniqueSlug(name: string, taken: string[]): string {
  const base = slugify(name)
  if (!taken.includes(base)) return base
  let n = 2
  while (taken.includes(`${base}-${n}`)) n += 1
  return `${base}-${n}`
}
