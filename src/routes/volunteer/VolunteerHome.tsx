import { useTranslation } from 'react-i18next'
import { useAsync, usePlatform } from '../../state/platform'
import { Badge, Card, LinkButton, LoadState, Progress, Stat, useBilingual } from '../../components/ui'

export default function VolunteerHome() {
  const { t } = useTranslation()
  const { api, ids } = usePlatform()
  const tb = useBilingual()
  const { data, loading, error } = useAsync(
    () => api.getVolunteerHome(ids.volunteerId),
    [ids.volunteerId],
  )

  if (loading || !data) return <LoadState error={error} />

  const statusKey =
    data.nextShift?.status === 'inside_geofence'
      ? 'home.statusInside'
      : data.nextShift?.status === 'awaiting_signoff'
        ? 'home.statusAwaiting'
        : 'home.statusRegistered'
  const statusTone =
    data.nextShift?.status === 'inside_geofence'
      ? ('brand' as const)
      : data.nextShift?.status === 'awaiting_signoff'
        ? ('amber' as const)
        : ('neutral' as const)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          {t('home.greeting', { name: data.account.name.split(' ')[0] })}
        </h1>
        <p className="mt-1 text-ink-500">{t('home.sub')}</p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Stat label={t('home.available')} value={data.creditsAvailable} />
        <Stat label={t('home.escrow')} value={data.creditsEscrow} />
        <Stat label={t('home.attendance')} value={data.attendanceHours} />
        <Stat label={t('home.records')} value={data.verifiedRecords} />
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <Card>
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">{t('home.integrity')}</h2>
            <span className="text-2xl font-semibold tracking-tight text-brand-700">
              {data.integrity.score}
            </span>
          </div>
          <div className="mt-3">
            <Progress value={data.integrity.score} />
          </div>
          <p className="mt-3 text-sm leading-relaxed text-ink-500">
            {tb({
              en: 'Built from continuity and depth, not raw hours.',
              fr: 'Construit sur la continuité et la profondeur, pas les heures brutes.',
            })}
          </p>
          <LinkButton to="/volunteer/passport" variant="secondary" size="sm" className="mt-4">
            {t('home.viewPassport')}
          </LinkButton>
        </Card>

        <Card>
          <h2 className="font-semibold">{t('home.nextShift')}</h2>
          {data.nextShift ? (
            <div className="mt-3">
              <div className="flex items-center justify-between gap-2">
                <span className="font-medium text-ink-900">
                  {tb(data.nextShift.opportunity.title)}
                </span>
                <Badge tone={statusTone}>{t(statusKey)}</Badge>
              </div>
              <p className="mt-1 text-sm text-ink-500">{data.nextShift.org.name}</p>
              <p className="mt-1 text-sm text-ink-500">
                {data.nextShift.shift.date} · {data.nextShift.shift.startTime}-
                {data.nextShift.shift.endTime}
              </p>
              <div className="mt-5 flex gap-2.5">
                <LinkButton size="sm" to={`/volunteer/checkin/${data.nextShift.registrationId}`}>
                  {t('home.goCheckIn')}
                </LinkButton>
                <LinkButton variant="ghost" size="sm" to="/volunteer/credits">
                  {t('home.viewCredits')}
                </LinkButton>
              </div>
            </div>
          ) : (
            <p className="mt-3 text-sm text-ink-500">{t('home.noShift')}</p>
          )}
        </Card>
      </div>
    </div>
  )
}
