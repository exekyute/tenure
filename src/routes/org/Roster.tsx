import { useTranslation } from 'react-i18next'
import { useAsync, usePlatform } from '../../state/platform'
import { Avatar, Card, EmptyState, LoadState, SectionTitle, TierBadge } from '../../components/ui'

export default function Roster() {
  const { t } = useTranslation()
  const { api, ids } = usePlatform()
  const { data, loading, error } = useAsync(() => api.getRoster(ids.orgId), [ids.orgId])

  if (loading || !data) return <LoadState error={error} />

  return (
    <div className="space-y-5">
      <SectionTitle title={t('org.rosterTitle')} subtitle={t('org.rosterSub')} />

      {data.length === 0 ? (
        <EmptyState>{t('org.rosterEmpty')}</EmptyState>
      ) : (
        <div className="space-y-3">
          {data.map((row) => (
            <Card key={row.account.id} className="flex items-center gap-4">
              <Avatar initials={row.account.avatarInitials} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-ink-900">{row.account.name}</span>
                  <TierBadge tier={row.relationship.tier} />
                </div>
                <div className="mt-0.5 flex flex-wrap gap-x-3 text-xs text-ink-500">
                  <span>
                    {t('passport.shiftsCount', { count: row.relationship.approvedShifts })}
                  </span>
                  <span>·</span>
                  <span>
                    {t('passport.weeksCount', { count: row.relationship.distinctServiceWeeks })}
                  </span>
                  <span>·</span>
                  <span>{row.relationship.totalHours}h</span>
                  <span>·</span>
                  <span>{row.relationship.roleProgression}</span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-lg font-semibold text-brand-700">
                  {row.integrity?.score ?? '-'}
                </div>
                <div className="text-xs text-ink-500">{t('passport.integrityTitle')}</div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
