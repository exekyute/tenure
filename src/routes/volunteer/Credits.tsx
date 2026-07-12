import { useTranslation } from 'react-i18next'
import { useAsync, usePlatform } from '../../state/platform'
import { Badge, Button, Card, EmptyState, LoadState, SectionTitle, Stat, useBilingual } from '../../components/ui'

export default function Credits() {
  const { t } = useTranslation()
  const { api, ids, refresh, toast } = usePlatform()
  const tb = useBilingual()
  const { data, loading, error } = useAsync(() => api.getCredits(ids.volunteerId), [ids.volunteerId])

  if (loading || !data) return <LoadState error={error} />

  const redeem = async (offerId: string) => {
    const ok = await api.redeemReward(ids.volunteerId, offerId)
    refresh()
    toast(ok ? t('credits.redeemed') : t('credits.declined'), ok ? 'success' : 'warn')
  }

  return (
    <div className="space-y-6">
      <SectionTitle title={t('credits.title')} subtitle={t('credits.sub')} />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Stat label={t('common.available')} value={data.available} />
        <Stat label={t('common.escrow')} value={data.escrow} />
        <Stat label={t('common.spent')} value={data.spent} />
      </div>

      <Card className="bg-brand-50/60">
        <p className="text-sm leading-relaxed text-ink-700">{t('credits.how')}</p>
      </Card>

      {/* Catalog */}
      <div>
        <SectionTitle title={t('credits.catalog')} />
        <div className="grid gap-4 md:grid-cols-2">
          {data.offers.map((o) => {
            const affordable = data.available >= o.creditCost
            const disabled = o.locked || !affordable
            return (
              <Card key={o.id}>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-semibold text-ink-900">{tb(o.title)}</h3>
                    <p className="mt-0.5 text-xs text-ink-500">
                      {o.mentorName} · {tb(o.mentorTitle)}
                    </p>
                  </div>
                  <Badge tone={o.kind === 'mentorship' ? 'brand' : 'neutral'}>
                    {t(`kind.${o.kind}`)}
                  </Badge>
                </div>
                <p className="mt-2 text-sm leading-relaxed text-ink-600">{tb(o.blurb)}</p>
                <div className="mt-4 flex items-center justify-between">
                  <span className="text-sm font-semibold text-ink-900">
                    {t('common.creditsCount', { count: o.creditCost })}
                  </span>
                  <Button size="sm" disabled={disabled} onClick={() => redeem(o.id)}>
                    {t('common.redeem')}
                  </Button>
                </div>
                {o.locked && (
                  <p className="mt-2 text-xs text-amber-700">{t('credits.requires')}</p>
                )}
                {!o.locked && !affordable && (
                  <p className="mt-2 text-xs text-ink-500">{t('credits.cantAfford')}</p>
                )}
              </Card>
            )
          })}
        </div>
      </div>

      {/* Sessions */}
      <div>
        <SectionTitle title={t('credits.bookings')} />
        {data.bookings.length === 0 ? (
          <EmptyState>{t('credits.noBookings')}</EmptyState>
        ) : (
          <div className="space-y-2">
            {data.bookings.map((b) => (
              <Card key={b.id} className="flex items-center justify-between py-3">
                <span className="text-sm font-medium text-ink-800">{tb(b.offerTitle)}</span>
                <Badge tone={b.status === 'requested' ? 'amber' : 'brand'}>
                  {t(`bookingStatus.${b.status}`)}
                </Badge>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Ledger */}
      <div>
        <SectionTitle title={t('credits.ledger')} />
        <Card flush className="divide-y divide-ink-100">
          {data.ledger.map((l) => (
            <div key={l.id} className="flex items-center justify-between px-5 py-3">
              <div>
                <div className="text-sm font-medium text-ink-800">{tb(l.label)}</div>
                <div className="mt-0.5 text-xs text-ink-500">
                  {l.date} ·{' '}
                  {l.type === 'mint'
                    ? l.vested
                      ? t('credits.mint')
                      : t('common.escrow')
                    : t('credits.spend')}
                </div>
              </div>
              <span
                className={
                  'text-sm font-semibold ' + (l.amount >= 0 ? 'text-brand-700' : 'text-ink-500')
                }
              >
                {l.amount >= 0 ? '+' : ''}
                {l.amount}
              </span>
            </div>
          ))}
        </Card>
      </div>
    </div>
  )
}
