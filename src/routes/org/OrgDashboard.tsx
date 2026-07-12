import { useTranslation } from 'react-i18next'
import { useAsync, usePlatform } from '../../state/platform'
import { Card, LinkButton, LoadState, Progress, Stat, useBilingual } from '../../components/ui'

export default function OrgDashboard() {
  const { t } = useTranslation()
  const { api, ids } = usePlatform()
  const tb = useBilingual()
  const { data, loading, error } = useAsync(() => api.getOrgDashboard(ids.orgId), [ids.orgId])

  if (loading || !data) return <LoadState error={error} />

  const usedPct = (data.org.mintedThisMonth / data.org.mintCapPerMonth) * 100

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{data.org.name}</h1>
        <p className="mt-1 text-ink-500">{t('org.dashSub')}</p>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink-500">{tb(data.org.blurb)}</p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label={t('org.activeVols')} value={data.activeVolunteers} />
        <Stat label={t('org.hours')} value={data.hoursLogged} />
        <Stat label={t('org.pending')} value={data.pendingSignoffs} />
        <Stat label={t('org.tier2')} value={data.tier2Volunteers} />
      </div>

      <Card>
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">{t('org.mintBudget')}</h2>
          <span className="text-sm text-ink-500">
            {t('org.mintUsed', {
              used: data.org.mintedThisMonth,
              cap: data.org.mintCapPerMonth,
            })}
          </span>
        </div>
        <div className="mt-3">
          <Progress value={usedPct} />
        </div>
        <p className="mt-3 text-sm leading-relaxed text-ink-500">
          {tb({
            en: 'Your monthly credit budget is anchored to your verified volume, not your own schedule. This keeps every credit anchored to verified service.',
            fr: 'Votre budget mensuel de crédits est ancré à votre volume vérifié, pas à votre propre horaire. Chaque crédit reste ainsi ancré au service vérifié.',
          })}
        </p>
      </Card>

      <div className="flex flex-wrap gap-2">
        <LinkButton to="/org/signoff">{t('nav.signoff')}</LinkButton>
        <LinkButton to="/org/roster" variant="secondary">
          {t('nav.roster')}
        </LinkButton>
        <LinkButton to="/org/shifts" variant="secondary">
          {t('nav.shifts')}
        </LinkButton>
      </div>
    </div>
  )
}
