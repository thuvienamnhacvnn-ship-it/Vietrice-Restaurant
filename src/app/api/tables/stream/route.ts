import { hasDatabase } from '@/lib/db'
import { getFloorVersion } from '@/server/floor'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
/**
 * Vercel kills a function at its maximum duration whether or not a stream is
 * still open, so the stream ends itself just short of that. A clean close makes
 * EventSource reconnect on its own; being killed mid-frame does not.
 */
export const maxDuration = 60

const STREAM_MS = 50_000
const POLL_MS = 3_000
/** Comment frames keep proxies from buffering a stream that has gone quiet. */
const HEARTBEAT_MS = 15_000

/**
 * Server-sent events for floor-plan changes.
 *
 * What this is honestly doing: the server polls a cheap fingerprint every few
 * seconds and pushes only when it moves. It is not database-level push. Neon's
 * pooler runs PgBouncer in transaction mode, which cannot hold a LISTEN, and
 * holding a direct connection per viewer on serverless would exhaust the pool
 * long before it became useful. So the polling moved from every browser to one
 * place, and a guest sees a table change within a few seconds instead of on
 * their next click.
 *
 * Cost is worth knowing: every open page holds a function invocation for up to
 * 50 seconds at a time, reconnecting after each. That is fine for a booking
 * page a handful of people have open, and would not be for a page everyone
 * lands on.
 */
export async function GET(request: Request) {
  if (!hasDatabase) {
    // 503 rather than an empty stream: EventSource retries a failed connection
    // on its own, and an open-but-silent stream would look like "nothing has
    // changed" forever.
    return new Response('Floor stream needs a database.', { status: 503 })
  }

  const encoder = new TextEncoder()

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      let open = true
      const close = () => {
        if (!open) return
        open = false
        try {
          controller.close()
        } catch {
          // Already closed by the platform — nothing to do.
        }
      }

      request.signal.addEventListener('abort', close)

      const send = (event: string, data: unknown) => {
        if (!open) return
        controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`))
      }

      try {
        let version = await getFloorVersion()
        send('sync', { version, serverNow: new Date().toISOString() })

        const startedAt = Date.now()
        let lastBeat = startedAt

        while (open && Date.now() - startedAt < STREAM_MS) {
          await new Promise((r) => setTimeout(r, POLL_MS))
          if (!open || request.signal.aborted) break

          const next = await getFloorVersion()
          if (next !== version) {
            version = next
            send('change', { version, serverNow: new Date().toISOString() })
            lastBeat = Date.now()
          } else if (Date.now() - lastBeat >= HEARTBEAT_MS) {
            controller.enqueue(encoder.encode(': keep-alive\n\n'))
            lastBeat = Date.now()
          }
        }
      } catch {
        // A dropped database connection ends this stream; the browser opens a
        // new one, which is a better recovery path than retrying in here.
      } finally {
        close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      // Nginx-style proxies buffer by default, which defeats the whole point.
      'X-Accel-Buffering': 'no',
    },
  })
}
