'use client'

import { useState } from 'react'
import { Check, Loader2, Lock, MapPin } from 'lucide-react'

import { cn } from '@/lib/utils'
import { useAdminI18n } from '@/components/admin/AdminI18n'
import { useAdminAction } from '@/components/admin/useAdminAction'
import { BoardHeader, Busy, ErrorNote } from '@/components/admin/primitives'

export type AdminHour = {
  weekday: number
  isClosed: boolean
  opensAt: string | null
  closesAt: string | null
}

const field =
  'h-9 rounded-md border border-gold/25 bg-black/40 px-2.5 text-[13px] text-cream focus:border-gold focus:outline-none'

export function SettingsBoard({
  hours,
  weekdayNames,
  contact,
}: {
  hours: AdminHour[]
  weekdayNames: Record<number, string>
  contact: { legalName: string; address: string; phone: string; email: string }
}) {
  const { t } = useAdminI18n()
  const { run, busyId, error, refreshing } = useAdminAction('/api/admin/content')

  return (
    <>
      <BoardHeader title={t.settings.title} />

      <ErrorNote message={error} />

      <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <section className="card-lux p-4">
          <h2 className="font-display text-[16px] uppercase tracking-luxe text-gold-light">
            {t.settings.openingHours}
          </h2>

          <ul className="mt-3 space-y-2">
            {hours.map((h) => (
              <HourRow
                key={h.weekday}
                hour={h}
                name={weekdayNames[h.weekday] ?? String(h.weekday)}
                busy={busyId === String(h.weekday)}
                run={run}
              />
            ))}
          </ul>
        </section>

        <div className="space-y-5">
          <section className="card-lux p-4">
            <h2 className="flex items-center gap-2 font-display text-[16px] uppercase tracking-luxe text-gold-light">
              <MapPin className="h-4 w-4" aria-hidden />
              {t.settings.contact}
            </h2>
            <dl className="mt-3 space-y-1.5 text-[13px]">
              <div className="flex gap-2">
                <dt className="w-24 shrink-0 text-muted">{t.common.name}</dt>
                <dd className="text-cream/85">{contact.legalName}</dd>
              </div>
              <div className="flex gap-2">
                <dt className="w-24 shrink-0 text-muted">{t.settings.contact}</dt>
                <dd className="text-cream/85">{contact.address}</dd>
              </div>
              <div className="flex gap-2">
                <dt className="w-24 shrink-0 text-muted">{t.common.phone}</dt>
                <dd className="text-cream/85">{contact.phone}</dd>
              </div>
              <div className="flex gap-2">
                <dt className="w-24 shrink-0 text-muted">{t.common.email}</dt>
                <dd className="break-all text-cream/85">{contact.email}</dd>
              </div>
            </dl>
            <p className="mt-3 rounded-md border border-gold/20 bg-black/25 px-3 py-2 text-[12px] text-muted">
              {t.settings.contactHint}
            </p>
          </section>

          <PasswordSection />
        </div>
      </div>

      {refreshing && <p className="mt-4 text-[12.5px] text-muted">{t.common.refreshing}</p>}
    </>
  )
}

function HourRow({
  hour,
  name,
  busy,
  run,
}: {
  hour: AdminHour
  name: string
  busy: boolean
  run: (id: string, body: unknown) => Promise<boolean>
}) {
  const { t } = useAdminI18n()
  const [opens, setOpens] = useState(hour.opensAt ?? '11:00')
  const [closes, setCloses] = useState(hour.closesAt ?? '23:00')

  const save = (patch: Record<string, unknown>) =>
    run(String(hour.weekday), { entity: 'openingHour', weekday: hour.weekday, ...patch })

  return (
    <li className="flex flex-wrap items-center gap-2">
      <span className="w-28 shrink-0 text-[13px] text-cream/85">{name}</span>

      <button
        type="button"
        disabled={busy}
        onClick={() => save({ isClosed: !hour.isClosed })}
        className={cn(
          'fx-press rounded-md border px-2.5 py-1 text-[12px] transition-colors disabled:opacity-40',
          hour.isClosed
            ? 'border-danger/45 bg-danger/10 text-danger'
            : 'border-success/45 bg-success/10 text-success',
        )}
      >
        {hour.isClosed ? t.settings.closed : t.common.active}
      </button>

      {!hour.isClosed && (
        <>
          <input
            type="time"
            value={opens}
            aria-label={t.settings.opensAt}
            onChange={(e) => setOpens(e.target.value)}
            onBlur={() => opens !== hour.opensAt && save({ opensAt: opens })}
            className={cn(field, 'w-[104px]')}
          />
          <span className="text-muted">–</span>
          <input
            type="time"
            value={closes}
            aria-label={t.settings.closesAt}
            onChange={(e) => setCloses(e.target.value)}
            onBlur={() => closes !== hour.closesAt && save({ closesAt: closes })}
            className={cn(field, 'w-[104px]')}
          />
        </>
      )}

      <Busy show={busy} />
    </li>
  )
}

function PasswordSection() {
  const { t } = useAdminI18n()
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [repeat, setRepeat] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setDone(false)

    if (next.length < 12) return setError(t.settings.passwordTooShort)
    if (next !== repeat) return setError(t.settings.passwordMismatch)

    setBusy(true)
    try {
      const res = await fetch('/api/admin/password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword: current, newPassword: next }),
      })
      const data = (await res.json().catch(() => ({}))) as { error?: string }
      if (!res.ok) {
        setError(data.error ?? t.common.error)
        return
      }
      setDone(true)
      setCurrent('')
      setNext('')
      setRepeat('')
    } catch {
      setError(t.common.error)
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="card-lux p-4">
      <h2 className="flex items-center gap-2 font-display text-[16px] uppercase tracking-luxe text-gold-light">
        <Lock className="h-4 w-4" aria-hidden />
        {t.settings.account}
      </h2>
      <p className="mt-1 text-[12px] text-muted">{t.settings.accountHint}</p>

      <form onSubmit={submit} className="mt-3 space-y-2" noValidate>
        <input
          type="password"
          autoComplete="current-password"
          placeholder={t.settings.currentPassword}
          value={current}
          onChange={(e) => setCurrent(e.target.value)}
          className={cn(field, 'w-full')}
        />
        <input
          type="password"
          autoComplete="new-password"
          placeholder={t.settings.newPassword}
          value={next}
          onChange={(e) => setNext(e.target.value)}
          className={cn(field, 'w-full')}
        />
        <input
          type="password"
          autoComplete="new-password"
          placeholder={t.settings.repeatPassword}
          value={repeat}
          onChange={(e) => setRepeat(e.target.value)}
          className={cn(field, 'w-full')}
        />

        {error && (
          <p role="alert" className="text-[12.5px] text-danger">
            {error}
          </p>
        )}
        {done && (
          <p className="flex items-center gap-1.5 text-[12.5px] text-success">
            <Check className="h-3.5 w-3.5" aria-hidden />
            {t.settings.passwordChanged}
          </p>
        )}

        <button
          type="submit"
          disabled={busy || !current || !next}
          className="fx-press flex items-center gap-2 rounded-md border border-gold/50 bg-gold/12 px-3 py-1.5 text-[12.5px] text-gold-light disabled:opacity-40"
        >
          {busy && <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />}
          {t.settings.changePassword}
        </button>
      </form>
    </section>
  )
}
