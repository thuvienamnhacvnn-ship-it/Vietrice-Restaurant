'use client'

import { useEffect, useRef, useState } from 'react'
import { Loader2, Search, Trash2, X } from 'lucide-react'

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

/** Shared input styling, so every admin form looks like one form. */
export const fieldClass =
  'h-9 w-full rounded-lg border border-gold/25 bg-black/40 px-2.5 text-[13px] text-cream placeholder:text-muted/70 focus:border-gold focus:outline-none'

export function Field({
  label,
  hint,
  className,
  children,
}: {
  label: string
  hint?: string
  className?: string
  children: React.ReactNode
}) {
  return (
    <label className={cn('block', className)}>
      <span className="mb-1 block text-[10.5px] font-semibold uppercase tracking-luxe text-gold/80">
        {label}
      </span>
      {children}
      {hint && <span className="mt-0.5 block text-[11px] text-muted">{hint}</span>}
    </label>
  )
}

/**
 * A dialog for the create/edit forms.
 *
 * Deliberately not `window.confirm`/`alert` anywhere in this console: a native
 * dialog blocks the whole page, cannot be styled to say what it is about, and
 * on a tablet propped up in a service station it is the kind of thing that ends
 * a shift's worth of updates. Escape and the backdrop both close it.
 */
export function Modal({
  open,
  title,
  onClose,
  children,
  footer,
}: {
  open: boolean
  title: string
  onClose: () => void
  children: React.ReactNode
  footer?: React.ReactNode
}) {
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    // Focus lands inside the dialog rather than staying on the button behind
    // it, so the keyboard and a screen reader follow the eye.
    panelRef.current?.focus()
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-black/70 p-4 backdrop-blur-sm"
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        className="card-lux my-auto w-full max-w-[560px] p-5 outline-none"
      >
        <div className="flex items-start justify-between gap-4">
          <h2 className="font-display text-lg uppercase tracking-luxe text-gold-light">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="fx-press grid h-7 w-7 shrink-0 place-items-center rounded-md border border-white/15 text-muted hover:border-gold/50 hover:text-gold"
          >
            <X className="h-3.5 w-3.5" aria-hidden />
          </button>
        </div>

        <div className="mt-4">{children}</div>

        {footer && <div className="mt-5 flex flex-wrap justify-end gap-2">{footer}</div>}
      </div>
    </div>
  )
}

/**
 * Delete, behind one deliberate second click.
 *
 * The confirm is inline rather than a dialog because the thing being deleted
 * stays on screen and visible next to the button — which is the actual
 * safeguard. A modal asking "are you sure?" hides the very row it is asking
 * about, and gets clicked through.
 */
export function DeleteButton({
  label,
  confirmLabel,
  disabled,
  onDelete,
}: {
  label: string
  confirmLabel: string
  disabled?: boolean
  onDelete: () => void
}) {
  const [armed, setArmed] = useState(false)

  useEffect(() => {
    if (!armed) return
    // Disarms itself, so a half-pressed delete does not sit waiting for a
    // stray click five minutes later.
    const id = window.setTimeout(() => setArmed(false), 4000)
    return () => window.clearTimeout(id)
  }, [armed])

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => {
        if (armed) {
          onDelete()
          setArmed(false)
        } else {
          setArmed(true)
        }
      }}
      className={cn(
        'fx-press flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-[12px] transition-colors disabled:opacity-40',
        armed
          ? 'border-danger bg-danger/20 text-danger'
          : 'border-danger/35 text-danger/85 hover:bg-danger/10',
      )}
    >
      <Trash2 className="h-3.5 w-3.5" aria-hidden />
      {armed ? confirmLabel : label}
    </button>
  )
}
