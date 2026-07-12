import { useTranslation } from 'react-i18next'
import { useAsync, usePlatform } from '../../state/platform'
import { Badge, Button, Card, EmptyState, LoadState, SectionTitle, Stat, useBilingual } from '../../components/ui'

export default function MentorWorkspace() {
  const { t } = useTranslation()
  const { api, ids, refresh, toast } = usePlatform()
  const tb = useBilingual()
  const { data, loading, error } = useAsync(() => api.getMentorWorkspace(ids.mentorId), [ids.mentorId])

  if (loading || !data) return <LoadState error={error} />

  const confirm = async (id: string) => {
    await api.confirmBooking(id)
    refresh()
    toast(t('mentor.confirmed'), 'success')
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{data.profile.name}</h1>
        <p className="mt-0.5 text-ink-500">{tb(data.profile.title)}</p>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink-500">{tb(data.profile.bio)}</p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Stat label={t('mentor.delivered')} value={data.profile.sessionsDelivered} />
        <Stat label={t('mentor.offers')} value={data.offers.length} />
        <Stat label={t('mentor.incoming')} value={data.incoming.length} />
      </div>

      <div>
        <SectionTitle title={t('mentor.offers')} />
        <div className="grid gap-4 md:grid-cols-2">
          {data.offers.map((o) => (
            <Card key={o.id}>
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-semibold text-ink-900">{tb(o.title)}</h3>
                <Badge tone="brand">{t('common.creditsCount', { count: o.creditCost })}</Badge>
              </div>
              <p className="mt-2 text-sm leading-relaxed text-ink-600">{tb(o.blurb)}</p>
            </Card>
          ))}
        </div>
      </div>

      <div>
        <SectionTitle title={t('mentor.incoming')} subtitle={t('mentor.sub')} />
        {data.incoming.length === 0 ? (
          <EmptyState>{t('mentor.noIncoming')}</EmptyState>
        ) : (
          <div className="space-y-2">
            {data.incoming.map((b) => (
              <Card key={b.id} className="flex items-center justify-between py-3">
                <div>
                  <div className="text-sm font-medium text-ink-800">{tb(b.offerTitle)}</div>
                  <div className="text-xs text-ink-500">{t('mentor.from', { name: b.volunteerName })}</div>
                </div>
                {b.status === 'requested' ? (
                  <Button size="sm" onClick={() => confirm(b.id)}>
                    {t('mentor.confirm')}
                  </Button>
                ) : (
                  <Badge tone="brand">{t('mentor.confirmed')}</Badge>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
