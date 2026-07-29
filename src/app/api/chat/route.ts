import { NextResponse } from 'next/server'
import { z } from 'zod'

import { isLocale, defaultLocale } from '@/i18n/config'
import { getAIProvider, type ChatMessage } from '@/lib/ai/provider'

export const dynamic = 'force-dynamic'

const bodySchema = z.object({
  locale: z.string().optional(),
  messages: z
    .array(
      z.object({
        role: z.enum(['user', 'assistant', 'system']),
        content: z.string().trim().min(1).max(2000),
      }),
    )
    .min(1)
    .max(40),
})

export async function POST(request: Request) {
  let payload: unknown
  try {
    payload = await request.json()
  } catch {
    return NextResponse.json({ error: 'Malformed request body.' }, { status: 400 })
  }

  const parsed = bodySchema.safeParse(payload)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validation failed.' }, { status: 422 })
  }

  const locale = isLocale(parsed.data.locale) ? parsed.data.locale : defaultLocale
  const provider = getAIProvider()

  const response = await provider.chat(parsed.data.messages as ChatMessage[], {
    locale,
    now: new Date(),
  })

  return NextResponse.json(response, { headers: { 'Cache-Control': 'no-store' } })
}
