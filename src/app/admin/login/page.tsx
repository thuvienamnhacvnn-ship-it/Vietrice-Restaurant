'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Loader2, Lock } from 'lucide-react'

import { Button } from '@/components/ui/Button'
import { Logo } from '@/components/ui/Logo'

export default function AdminLoginPage() {
  const router = useRouter()
  const params = useSearchParams()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const data = (await res.json()) as { error?: string }
      if (!res.ok) {
        setError(data.error ?? 'Anmeldung fehlgeschlagen.')
        return
      }
      router.replace(params.get('next') || '/admin')
      router.refresh()
    } catch {
      setError('Anmeldung fehlgeschlagen.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="flex min-h-[100svh] items-center justify-center bg-background px-4">
      <div className="card-lux w-full max-w-sm p-7">
        <div className="flex justify-center">
          <Logo layout="stacked" size="lg" asLink={false} />
        </div>

        <div className="divider-lotus my-6">
          <span aria-hidden className="text-sm">
            ❦
          </span>
        </div>

        <h1 className="flex items-center justify-center gap-2 font-display text-xl uppercase tracking-luxe text-gold-light">
          <Lock className="h-4 w-4" aria-hidden />
          Admin
        </h1>

        <form onSubmit={onSubmit} className="mt-6 space-y-4" noValidate>
          <div>
            <label htmlFor="email" className="mb-1.5 block text-[12px] text-muted">
              E-Mail
            </label>
            <input
              id="email"
              type="email"
              autoComplete="username"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-11 w-full rounded-lg border border-gold/25 bg-black/40 px-3 text-[13.5px] text-cream focus:border-gold focus:outline-none"
            />
          </div>

          <div>
            <label htmlFor="password" className="mb-1.5 block text-[12px] text-muted">
              Passwort
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-11 w-full rounded-lg border border-gold/25 bg-black/40 px-3 text-[13.5px] text-cream focus:border-gold focus:outline-none"
            />
          </div>

          {error && (
            <p
              role="alert"
              className="rounded-lg border border-danger/40 bg-danger/10 px-3 py-2.5 text-[13px] text-danger"
            >
              {error}
            </p>
          )}

          <Button type="submit" size="lg" className="w-full" disabled={busy}>
            {busy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
            Anmelden
          </Button>
        </form>
      </div>
    </main>
  )
}
