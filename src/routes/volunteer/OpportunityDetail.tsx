import { useTranslation } from 'react-i18next'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useAsync, usePlatform } from '../../state/platform'
import { Badge, Button, Card, LoadState, cx, useBilingual } from '../../components/ui'

export default function OpportunityDetail() {
  const { t } = useTranslation()
  const { id = '' } = useParams()
  const { api, ids, refresh, toast } = usePlatform()
  const tb = useBilingual()
  const navigate = useNavigate()
  const { data, loading, error } = useAsync(() => api.getOpportunity(id), [id])

  if (loading || !data) return <LoadState error={error} />

  const onRegister = async (shiftId: string) => {
    const regId = await api.registerForShift(ids.volunteerId, shiftId)
    refresh()
    toast(t('toast.registered'), 'success')
    navigate(`/volunteer/checkin/${regId}`)
  }

  return (
    <div className="space-y-6">
      <Link to="/volunteer/discover" className="text-sm text-ink-500 hover:text-ink-800">
        &larr; {t('common.back')}
      </Link>

      <div>
        <div className="flex items-center gap-2">
          <Badge tone="brand">{t(`cause.${data.opportunity.category}`)}</Badge>
          <span className="text-sm text-ink-500">{data.org.name}</span>
        </div>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">{tb(data.opportunity.title)}</h1>
      </div>

      <div className="grid gap-5 md:grid-cols-3">
        <Card className="md:col-span-2">
          <h2 className="font-semibold">{t('opp.about')}</h2>
          <p className="mt-2 text-sm leading-relaxed text-ink-600">
            {tb(data.opportunity.description)}
          </p>
          <h3 className="mt-5 text-sm font-semibold text-ink-700">{t('opp.skills')}</h3>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {data.opportunity.skills.map((s) => (
              <Badge key={s}>{s}</Badge>
            ))}
          </div>
        </Card>

        <Card>
          <dl className="space-y-3 text-sm">
            <div>
              <dt className="text-ink-500">{t('opp.location')}</dt>
              <dd className="font-medium text-ink-800">{data.opportunity.locationLabel}</dd>
            </div>
            <div>
              <dt className="text-ink-500">{t('opp.credits')}</dt>
              <dd className="font-medium text-ink-800">{data.shifts[0]?.creditsAward ?? 6}</dd>
            </div>
          </dl>
        </Card>
      </div>

      <Card>
        <h2 className="font-semibold">{t('opp.shifts')}</h2>
        <div className="mt-3 divide-y divide-ink-100">
          {data.shifts.map((s) => {
            const full = s.filled >= s.capacity
            return (
              <div key={s.id} className="flex items-center justify-between gap-3 py-3">
                <div>
                  <div className="font-medium text-ink-900">
                    {s.date} · {s.startTime}-{s.endTime}
                  </div>
                  <div className="mt-0.5 text-xs text-ink-500">
                    {s.hours}h · {t('common.creditsCount', { count: s.creditsAward })} ·{' '}
                    {s.filled}/{s.capacity}
                  </div>
                </div>
                <Button
                  size="sm"
                  variant={full ? 'secondary' : 'primary'}
                  disabled={full}
                  onClick={() => onRegister(s.id)}
                  className={cx(full && 'pointer-events-none')}
                >
                  {full ? t('opp.full') : t('common.register')}
                </Button>
              </div>
            )
          })}
        </div>
      </Card>
    </div>
  )
}
