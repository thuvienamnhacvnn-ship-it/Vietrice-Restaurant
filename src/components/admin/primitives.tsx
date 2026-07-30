'use client'

import { Loader2, Search } from 'lucide-react'

import { cn } from '@/lib/utils'

/** Title + one-line summary, shared by every admin board. */
export function BoardHeader({
  title,
  summary,
  children,
}: {
  title: string
  summary?: string
  children?: React.ReactNode
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="font-display text-2xl uppercase tracking-luxe text-gold-light">{title}</h1>
        {summary && <p className="mt-1 text-[12.5px] text-muted">{summary}</p>}
      </div>
      {children}
    </div>
  )
}

export function SearchInput({
  value,
  onChange,
  placeholder,
}: {
  value: string
  onChange: (next: string) => void
  placeholder: string
}) {
  return (
    <label className="relative">
      <Search
        className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
        aria-hidden
      />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-10 w-[260px] rounded-lg border border-gold/25 bg-black/40 pl-9 pr-3 text-[13px] text-cream placeholder:text-muted/70 focus:border-gold focus:outline-none"
      />
    </label>
  )
}

export function FilterPills<T extends string>({
  options,
  value,
  onChange,
  label,
  count,
}: {
  options: readonly T[]
  value: T
  onChange: (next: T) => void
  label: (key: T) => string
  count?: (key: T) => number | undefined
}) {
  return (
    <ul className="mt-4 flex flex-wrap gap-2">
      {options.map((key) => (
        <li key={key}>
          <button
            type="button"
            onClick={() => onChange(key)}
            className={cn(
              'fx-press flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[12px] transition-colors',
              key === value
                ? 'border-gold bg-gold/12 text-gold-light'
                : 'border-gold/25 text-cream/70 hover:border-gold/55 hover:text-gold',
            )}
          >
            {label(key)}
            {count && <span className="tabular-nums text-muted">{count(key) ?? 0}</span>}
          </button>
        </li>
      ))}
    </ul>
  )
}

/** A labelled on/off control that says what it is, not just that it is on. */
export function Toggle({
  on,
  onLabel,
  offLabel,
  onClick,
  disabled,
  tone = 'gold',
}: {
  on: boolean
  onLabel: string
  offLabel: string
  onClick: () => void
  disabled?: boolean
  tone?: 'gold' | 'success'
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={on}
      className={cn(
        'fx-press rounded-md border px-2.5 py-1 text-[12px] transition-colors disabled:opacity-40',
        on
          ? tone === 'success'
            ? 'border-success/50 bg-success/10 text-success'
            : 'border-gold/50 bg-gold/10 text-gold-light'
          : 'border-white/15 text-muted hover:border-gold/40 hover:text-gold',
      )}
    >
      {on ? onLabel : offLabel}
    </button>
  )
}

export function Busy({ show }: { show: boolean }) {
  if (!show) return null
  return <Loader2 className="h-4 w-4 animate-spin self-center text-gold" aria-hidden />
}

export function ErrorNote({ message }: { message: string | null }) {
  if (!message) return null
  return (
    <p
      role="alert"
      className="mt-4 rounded-lg border border-danger/40 bg-danger/10 px-4 py-2.5 text-[13px] text-danger"
    >
      {message}
    </p>
  )
}

export function EmptyNote({ message }: { message: string }) {
  return <p className="card-lux mt-5 p-8 text-center text-[13px] text-muted">{message}</p>
}
