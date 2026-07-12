import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { SignoffItem } from '../../api/PlatformAPI'
import { useAsync, usePlatform } from '../../state/platform'
import { Avatar, Badge, Button, Card, EmptyState, LoadState, SectionTitle, cx, useBilingual } from '../../components/ui'

export default function SignoffQueue() {
  const { t } = useTranslation()
  const { api, ids } = usePlatform()
  const { data, loading, error } = useAsync(() => api.getSignoffQueue(ids.orgId), [ids.orgId])

  if (loading || !data) return <LoadState error={error} />

  return (
    <div className="space-y-6">
      <SectionTitle title={t('org.signoffTitle')} subtitle={t('org.signoffSub')} />
      {data.length === 0 ? (
        <EmptyState>{t('org.queueEmpty')}</EmptyState>
      ) : (
        <div className="space-y-3">
          {data.map((item) => (
            <SignoffCard key={item.registrationId} item={item} />
          ))}
        </div>
      )}
    </div>
  )
}

function SignoffCard({ item }: { item: SignoffItem }) {
  const { t } = useTranslation()
  const { api, refresh, toast } = usePlatform()
  const tb = useBilingual()
  const [meaningful, setMeaningful] = useState(true)
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)

  const approve = async () => {
    setBusy(true)
    const res = await api.approveCheckIn(item.registrationId, { meaningful, note })
    refresh()
    if (res.capExceeded) toast(t('toast.capExceeded'), 'warn')
    else toast(t('toast.minted', { n: res.mintedCredits }), 'success')
    if (res.crossedThreshold) setTimeout(() => toast(t('toast.crossed'), 'success'), 300)
  }

  const reject = async () => {
    setBusy(true)
    await api.rejectCheckIn(item.registrationId)
    refresh()
    toast(t('toast.rejected'), 'info')
  }

  return (
    <Card>
      <div className="flex items-start gap-4">
        <Avatar initials={item.account.avatarInitials} />
        <div className="min-w-0 flex-1">
          <div className="font-medium text-ink-900">{item.account.name}</div>
          <div className="mt-0.5 text-sm text-ink-500">
            {tb(item.opportunity.title)} · {item.shift.date} · {item.shift.hours}h
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            <Badge tone={item.insideGeofence ? 'brand' : 'rose'}>
              {item.insideGeofence ? t('org.geofenceOk') : t('org.geofenceNo')}
            </Badge>
            <Badge tone={item.secondKeyConfirmed ? 'brand' : 'amber'}>
              {item.secondKeyConfirmed ? t('org.secondKeyYes') : t('org.secondKeyNo')}
            </Badge>
            <Badge tone="neutral">
              +{t('common.creditsCount', { count: item.shift.creditsAward })}
            </Badge>
          </div>
        </div>
      </div>

      <div className="mt-5 space-y-3.5 border-t border-ink-100 pt-5">
        <div className="flex gap-2">
          <button
            onClick={() => setMeaningful(true)}
            className={cx(
              'flex-1 rounded-lg border px-3 py-2 text-sm font-medium',
              meaningful
                ? 'border-brand-500 bg-brand-50 text-brand-700'
                : 'border-ink-200 text-ink-500 hover:bg-ink-50',
            )}
          >
            {t('org.meaningful')}
          </button>
          <button
            onClick={() => setMeaningful(false)}
            className={cx(
              'flex-1 rounded-lg border px-3 py-2 text-sm font-medium',
              !meaningful
                ? 'border-ink-400 bg-ink-100 text-ink-700'
                : 'border-ink-200 text-ink-500 hover:bg-ink-50',
            )}
          >
            {t('org.presentOnly')}
          </button>
        </div>
        <input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder={t('org.notePlaceholder')}
          className="w-full rounded-lg border border-ink-200 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/25"
        />
        <div className="flex gap-2">
          <Button onClick={approve} disabled={busy}>
            {t('common.approve')}
          </Button>
          <Button variant="danger" onClick={reject} disabled={busy}>
            {t('common.reject')}
          </Button>
        </div>
      </div>
    </Card>
  )
}
