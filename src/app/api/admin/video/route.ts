import { NextResponse } from 'next/server'
import { handleUpload, type HandleUploadBody } from '@vercel/blob/client'

import { readSession } from '@/lib/auth'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

/**
 * Issue a one-shot token so the browser can upload a dish video straight to
 * Vercel Blob.
 *
 * The file never passes through this route. Vercel's serverless functions cap
 * a request body at 4.5 MB, which a video clears easily; the client-upload flow
 * exists precisely to avoid that ceiling. What this endpoint does is
 * authorise — it refuses without an admin session, pins the content type to
 * video, and caps the size, so a leaked URL cannot be used to park arbitrary
 * files on the restaurant's storage.
 */
const MAX_BYTES = 50 * 1024 * 1024

export async function POST(request: Request) {
  const session = await readSession()
  if (!session) return NextResponse.json({ error: 'Unauthorised.' }, { status: 401 })

  const body = (await request.json()) as HandleUploadBody

  try {
    const result = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname) => {
        // Re-check inside the callback: this is the point the token is minted,
        // and it must not depend on the outer check still holding.
        const current = await readSession()
        if (!current) throw new Error('Unauthorised.')
        if (!pathname.startsWith('dish-videos/')) {
          throw new Error('Uploads are restricted to dish-videos/.')
        }
        return {
          allowedContentTypes: ['video/mp4', 'video/webm'],
          maximumSizeInBytes: MAX_BYTES,
          addRandomSuffix: true,
          tokenPayload: JSON.stringify({ userId: current.userId, name: current.name }),
        }
      },
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        // Blob calls this from its own infrastructure, so it does not fire for
        // a localhost dev server. The client writes the URL to the dish itself
        // after the upload resolves; this is only the audit trail.
        const actor = tokenPayload
          ? (JSON.parse(tokenPayload) as { userId?: string; name?: string })
          : {}
        await prisma.auditLog.create({
          data: {
            actorId: actor.userId ?? null,
            actorName: actor.name ?? 'System',
            action: 'video.upload',
            entity: 'MenuItem',
            after: { url: blob.url, pathname: blob.pathname },
          },
        })
      },
    })

    return NextResponse.json(result)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Upload failed.'
    console.error('[admin/video] upload token failed', err)
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
