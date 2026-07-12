import { useTranslation } from 'react-i18next'
import { Link, useParams } from 'react-router-dom'
import { useAsync, usePlatform } from '../../state/platform'
import { Badge, Button, Card, EmptyState, LinkButton, LoadState, cx, useBilingual } from '../../components/ui'

export default function CheckIn() {
  const { t } = useTranslation()
  const { regId = '' } = useParams()
  const { api, refresh } = usePlatform()
  const tb = useBilingual()
  const { data, loading, error } = useAsync(() => api.getCheckIn(regId), [regId])

  if (loading) return <LoadState error={error} />
  if (!data)
    return (
      <div className="mx-auto max-w-xl space-y-4">
        <EmptyState>{t('checkin.notFound')}</EmptyState>
        <div className="text-center">
          <LinkButton to="/volunteer" variant="secondary" size="sm">
            {t('checkin.back')}
          </LinkButton>
        </div>
      </div>
    )

  const inside = data.status === 'inside_geofence'
  const awaiting = data.status === 'awaiting_signoff'
  const approved = data.status === 'approved'
  const rejected = data.status === 'rejected'
  const onSite = inside || awaiting || approved

  const arrive = async () => {
    await api.simulateArrival(regId)
    refresh()
  }
  const checkout = async () => {
    await api.checkOut(regId)
    refresh()
  }

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <Link to="/volunteer" className="text-sm text-ink-500 hover:text-ink-800">
        &larr; {t('checkin.back')}
      </Link>

      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{t('checkin.title')}</h1>
        <p className="mt-1 text-ink-500">{t('checkin.for', { org: data.org.name })}</p>
        <p className="mt-1 text-sm text-ink-500">
          {tb(data.opportunity.title)} · {data.shift.date} · {data.shift.startTime}-
          {data.shift.endTime}
        </p>
      </div>

      <Card>
        {/* Mock geofence visual: the ring stays empty; the caption lives below it. */}
        <div className="relative flex h-44 items-center justify-center overflow-hidden rounded-xl bg-ink-100">
          <div
            className={cx(
              'h-24 w-24 rounded-full border-2 border-dashed',
              onSite ? 'border-brand-500 bg-brand-50' : 'border-ink-300',
            )}
          />
          <span
            className={cx(
              'absolute inset-x-0 bottom-3 text-center text-xs font-medium',
              onSite ? 'text-brand-700' : 'text-ink-500',
            )}
          >
            {onSite ? t('checkin.inside') : data.opportunity.locationLabel}
          </span>
          <div
            className={cx(
              'absolute h-4 w-4 rounded-full border-2 border-white shadow transition-all duration-500',
              onSite ? 'left-1/2 top-1/2 -ml-2 -mt-2 bg-brand-600' : 'right-6 top-4 bg-ink-400',
            )}
          />
        </div>

        <p className="mt-4 text-sm leading-relaxed text-ink-500">{t('checkin.geoExplain')}</p>

        <div className="mt-5">
          {data.status === 'registered' && <Button onClick={arrive}>{t('checkin.simulate')}</Button>}

          {inside && (
            <div className="space-y-3">
              <Badge tone="brand">{t('checkin.inside')}</Badge>
              <div>
                <Button onClick={checkout}>{t('checkin.checkout')}</Button>
              </div>
            </div>
          )}

          {awaiting && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
              {t('checkin.awaiting')}
            </div>
          )}

          {approved && (
            <div className="space-y-3">
              <div className="rounded-xl border border-brand-200 bg-brand-50 p-4 text-sm text-brand-800">
                {t('checkin.approved')}
              </div>
              <div className="flex gap-2">
                <LinkButton size="sm" to="/volunteer/credits">
                  {t('nav.credits')}
                </LinkButton>
                <LinkButton size="sm" variant="secondary" to="/volunteer/passport">
                  {t('nav.passport')}
                </LinkButton>
              </div>
            </div>
          )}

          {rejected && (
            <div className="space-y-3">
              <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
                {t('checkin.rejected')}
              </div>
              <LinkButton size="sm" variant="secondary" to="/volunteer/discover">
                {t('nav.discover')}
              </LinkButton>
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}
