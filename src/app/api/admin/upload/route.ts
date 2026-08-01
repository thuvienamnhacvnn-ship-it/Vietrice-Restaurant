import { NextResponse } from 'next/server'
import { handleUpload, type HandleUploadBody } from '@vercel/blob/client'

import { readSession } from '@/lib/auth'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/avif']
const MB = 1024 * 1024

/**
 * What may be uploaded, and where.
 *
 * An allow-list of folders rather than a free-for-all: the token this route
 * mints is handed to a browser, and a browser can be told to do anything. Tying
 * each folder to its own content types and size cap means a leaked token can at
 * worst put a slightly-too-large photo in the gallery, not park a payload of
 * arbitrary bytes on the restaurant's storage.
 *
 * Dish videos allow images too — the poster frame is cut from the clip and
 * stored beside it, so it lands in the same folder.
 */
const RULES = [
  {
    prefix: 'dish-videos/',
    types: ['video/mp4', 'video/webm', ...IMAGE_TYPES],
    maxBytes: 50 * MB,
  },
  { prefix: 'menu-images/', types: IMAGE_TYPES, maxBytes: 8 * MB },
  { prefix: 'promotions/', types: IMAGE_TYPES, maxBytes: 8 * MB },
  { prefix: 'gallery/', types: IMAGE_TYPES, maxBytes: 12 * MB },
] as const

/**
 * Issue a one-shot token so the browser can upload straight to Vercel Blob.
 *
 * The file never passes through this route. Vercel's serverless functions cap a
 * request body at 4.5 MB, which a video clears easily and a phone photo often
 * does; the client-upload flow exists precisely to avoid that ceiling. What
 * this endpoint does is authorise.
 */
export async function POST(request: Request) {
  const session = await readSession()
  if (!session) return NextResponse.json({ error: 'Unauthorised.' }, { status: 401 })

  const body = (await request.json()) as HandleUploadBody

  try {
    const result = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname) => {
        // Re-checked inside the callback: this is the moment the token is
        // minted, and it must not rely on the outer check still holding.
        const current = await readSession()
        if (!current) throw new Error('Unauthorised.')

        const rule = RULES.find((r) => pathname.startsWith(r.prefix))
        if (!rule) {
          throw new Error(`Uploads are restricted to ${RULES.map((r) => r.prefix).join(', ')}.`)
        }

        return {
          allowedContentTypes: [...rule.types],
          maximumSizeInBytes: rule.maxBytes,
          addRandomSuffix: true,
          tokenPayload: JSON.stringify({ userId: current.userId, name: current.name }),
        }
      },
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        // Blob calls this from its own infrastructure, so it does not fire for
        // a localhost dev server. The client writes the URL onto the row it
        // belongs to once the upload resolves; this is only the audit trail.
        const actor = tokenPayload
          ? (JSON.parse(tokenPayload) as { userId?: string; name?: string })
          : {}
        await prisma.auditLog.create({
          data: {
            actorId: actor.userId ?? null,
            actorName: actor.name ?? 'System',
            action: 'media.upload',
            entity: 'Blob',
            after: { url: blob.url, pathname: blob.pathname },
          },
        })
      },
    })

    return NextResponse.json(result)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Upload failed.'
    console.error('[admin/upload] token failed', err)
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
