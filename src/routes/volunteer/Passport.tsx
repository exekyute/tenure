import { useTranslation } from 'react-i18next'
import { TIER2_MIN_SHIFTS, TIER2_MIN_WEEKS } from '../../api/PlatformAPI'
import { useAsync, usePlatform } from '../../state/platform'
import { Badge, Card, LoadState, Progress, SectionTitle, TierBadge, useBilingual } from '../../components/ui'

const COMPONENT_KEYS = [
  'continuity',
  'corroboration',
  'attestation',
  'depth',
  'followThrough',
  'reliability',
  'hours',
] as const

export default function Passport() {
  const { t } = useTranslation()
  const { api, ids } = usePlatform()
  const tb = useBilingual()
  const { data, loading, error } = useAsync(() => api.getPassport(ids.volunteerId), [ids.volunteerId])

  if (loading || !data) return <LoadState error={error} />

  return (
    <div className="space-y-6">
      <SectionTitle title={t('passport.title')} subtitle={t('passport.sub')} />

      {/* Tier 1: Attendance Log, free for everyone */}
      <Card className="border-ink-200 bg-ink-50">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">{t('passport.attendanceTitle')}</h2>
          <Badge tone="neutral">{t('common.tier1')}</Badge>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-3xl font-semibold tracking-tight">{data.attendanceHours}</span>
          <span className="text-sm text-ink-500">{t('home.attendance').toLowerCase()}</span>
        </div>
        <p className="mt-2 text-sm leading-relaxed text-ink-500">{t('passport.attendanceStamp')}</p>
      </Card>

      {/* Tier 2: Verified Service Records, earned */}
      <div>
        <SectionTitle title={t('passport.verifiedTitle')} />
        <div className="grid gap-5 md:grid-cols-2">
          {data.relationships.map((r) => (
            <Card key={r.orgId}>
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-semibold text-ink-900">{r.orgName}</h3>
                <TierBadge tier={r.tier} />
              </div>

              {r.meetsThreshold ? (
                <>
                  <dl className="mt-3 grid grid-cols-2 gap-3 text-sm">
                    <Field label={t('passport.shifts')} value={r.approvedShifts} />
                    <Field label={t('passport.weeks')} value={r.distinctServiceWeeks} />
                    <Field label={t('passport.role')} value={r.roleProgression} />
                    <Field label={t('passport.recurrence')} value={r.recurrence} />
                  </dl>
                  <p className="mt-3 text-xs text-ink-400">
                    {t('passport.threshold', {
                      shifts: TIER2_MIN_SHIFTS,
                      weeks: TIER2_MIN_WEEKS,
                    })}
                  </p>
                </>
              ) : (
                <div className="mt-3">
                  <p className="text-sm text-ink-500">
                    {t('passport.progressTo', {
                      have: r.approvedShifts,
                      need: TIER2_MIN_SHIFTS,
                    })}
                  </p>
                  <div className="mt-2">
                    {/* Both bars must fill: shifts and distinct weeks gate the record together. */}
                    <Progress
                      value={
                        Math.min(
                          r.approvedShifts / TIER2_MIN_SHIFTS,
                          r.distinctServiceWeeks / TIER2_MIN_WEEKS,
                        ) * 100
                      }
                      tone="ink"
                    />
                  </div>
                  <div className="mt-2 flex gap-3 text-xs text-ink-500">
                    <span>{t('passport.weeksCount', { count: r.distinctServiceWeeks })}</span>
                    <span>·</span>
                    <span>{r.totalHours}h</span>
                  </div>
                </div>
              )}
            </Card>
          ))}
        </div>
        {data.verifiedRecords.length === 0 && (
          <p className="mt-3 text-sm text-ink-500">{t('passport.verifiedEmpty')}</p>
        )}
      </div>

      {/* Integrity breakdown */}
      <Card>
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">{t('passport.integrityTitle')}</h2>
          <span className="text-2xl font-semibold tracking-tight text-brand-700">
            {data.integrity.score}
          </span>
        </div>
        <div className="mt-4 space-y-3">
          {COMPONENT_KEYS.map((k) => (
            <div key={k}>
              <div className="mb-1 flex justify-between text-xs">
                <span className="text-ink-600">{t(`passport.comp.${k}`)}</span>
                <span className="text-ink-400">{data.integrity.components[k]}</span>
              </div>
              <Progress value={data.integrity.components[k]} />
            </div>
          ))}
        </div>
        <p className="mt-4 text-xs leading-relaxed text-ink-400">
          {tb({
            en: 'Continuity and corroboration carry the most weight, so steady service counts for more than any single shift.',
            fr: 'La continuité et la corroboration pèsent le plus, donc un service régulier compte plus que n\'importe quel quart isolé.',
          })}
        </p>
      </Card>
    </div>
  )
}

function Field({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <dt className="text-ink-400">{label}</dt>
      <dd className="font-medium text-ink-800">{value}</dd>
    </div>
  )
}
