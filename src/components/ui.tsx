import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, type LinkProps } from 'react-router-dom'
import type { Bilingual } from '../api/types'

export function cx(...parts: (string | false | undefined | null)[]): string {
  return parts.filter(Boolean).join(' ')
}

/** Pick the right language for user-generated bilingual content. */
export function useBilingual() {
  const { i18n } = useTranslation()
  return (b: Bilingual) => (i18n.language === 'fr' ? b.fr : b.en)
}

export function Card({
  className,
  flush,
  children,
}: {
  className?: string
  /** Skip the default padding (Tailwind ignores class order, so `p-0` cannot override `p-5`). */
  flush?: boolean
  children: ReactNode
}) {
  return (
    <div
      className={cx(
        'rounded-2xl border border-ink-200 bg-white shadow-card',
        !flush && 'p-5',
        className,
      )}
    >
      {children}
    </div>
  )
}

export function SectionTitle({
  title,
  subtitle,
  action,
}: {
  title: string
  subtitle?: string
  action?: ReactNode
}) {
  return (
    <div className="mb-4 flex items-start justify-between gap-4">
      <div>
        <h2 className="text-xl font-semibold tracking-tight text-ink-900">{title}</h2>
        {subtitle && <p className="mt-1 text-sm leading-relaxed text-ink-500">{subtitle}</p>}
      </div>
      {action}
    </div>
  )
}

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'
type ButtonSize = 'sm' | 'md'

function buttonClasses(variant: ButtonVariant, size: ButtonSize, className?: string): string {
  const base =
    'inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2'
  const sizes = { sm: 'px-3 py-1.5 text-sm', md: 'px-4 py-2.5 text-sm' }
  const variants = {
    primary: 'bg-brand-600 text-white hover:bg-brand-700',
    secondary: 'border border-ink-200 bg-white text-ink-700 hover:bg-ink-50',
    ghost: 'text-ink-600 hover:bg-ink-100',
    danger: 'border border-rose-200 bg-white text-rose-600 hover:bg-rose-50',
  }
  return cx(base, sizes[size], variants[variant], className)
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant
  size?: ButtonSize
}

export function Button({ variant = 'primary', size = 'md', className, ...rest }: ButtonProps) {
  return <button className={buttonClasses(variant, size, className)} {...rest} />
}

/** A router Link styled as a button — avoids nesting a <button> inside an <a>. */
export function LinkButton({
  variant = 'primary',
  size = 'md',
  className,
  ...rest
}: LinkProps & { variant?: ButtonVariant; size?: ButtonSize }) {
  return <Link className={buttonClasses(variant, size, className)} {...rest} />
}

export function Badge({
  children,
  tone = 'neutral',
}: {
  children: ReactNode
  tone?: 'neutral' | 'brand' | 'amber' | 'rose' | 'ink'
}) {
  const tones = {
    neutral: 'bg-ink-100 text-ink-600',
    brand: 'bg-brand-50 text-brand-700',
    amber: 'bg-amber-50 text-amber-700',
    rose: 'bg-rose-50 text-rose-600',
    ink: 'bg-ink-900 text-white',
  }
  return (
    <span
      className={cx(
        'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium',
        tones[tone],
      )}
    >
      {children}
    </span>
  )
}

export function TierBadge({ tier }: { tier: 1 | 2 }) {
  const { t } = useTranslation()
  return tier === 2 ? (
    <Badge tone="brand">{t('common.tier2')}</Badge>
  ) : (
    <Badge tone="neutral">{t('common.tier1')}</Badge>
  )
}

export function Stat({ label, value, hint }: { label: string; value: ReactNode; hint?: string }) {
  return (
    <div className="rounded-xl border border-ink-200 bg-white p-4">
      <div className="text-2xl font-semibold tracking-tight text-ink-900">{value}</div>
      <div className="mt-0.5 text-sm text-ink-500">{label}</div>
      {hint && <div className="mt-1 text-xs text-ink-400">{hint}</div>}
    </div>
  )
}

export function Progress({ value, tone = 'brand' }: { value: number; tone?: 'brand' | 'ink' }) {
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-ink-100">
      <div
        className={cx('h-full rounded-full', tone === 'brand' ? 'bg-brand-500' : 'bg-ink-400')}
        style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
      />
    </div>
  )
}

export function Avatar({ initials }: { initials: string }) {
  return (
    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-100 text-sm font-semibold text-brand-800">
      {initials}
    </div>
  )
}

export function EmptyState({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-2xl border border-dashed border-ink-200 bg-ink-50 p-8 text-center text-sm text-ink-500">
      {children}
    </div>
  )
}

/** Placeholder while a view loads, with a visible message if the loader failed. */
export function LoadState({ error }: { error?: unknown }) {
  const { t } = useTranslation()
  return (
    <div className="py-12 text-center text-sm text-ink-500">
      {error ? t('error.load') : '…'}
    </div>
  )
}
