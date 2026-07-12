import { useTranslation } from 'react-i18next'
import { useAsync, usePlatform } from '../../state/platform'
import { Button, Card, LoadState, SectionTitle, TierBadge } from '../../components/ui'

export default function Reports() {
  const { t } = useTranslation()
  const { api, ids, toast } = usePlatform()
  const { data, loading, error } = useAsync(() => api.getReports(ids.orgId), [ids.orgId])

  if (loading || !data) return <LoadState error={error} />

  const exportCsv = () => {
    const rows = [
      [t('org.colVol'), t('org.colShifts'), t('org.colHours'), t('org.colTier')],
      ...data.map((r) => [
        r.account.name,
        r.approvedShifts,
        r.totalHours,
        r.tier === 2 ? t('common.tier2') : t('common.tier1'),
      ]),
    ]
    const csv = rows.map((r) => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'tenure-hours.csv'
    a.click()
    URL.revokeObjectURL(url)
    toast(t('toast.exported'), 'success')
  }

  return (
    <div className="space-y-6">
      <SectionTitle
        title={t('org.reportsTitle')}
        subtitle={t('org.reportsSub')}
        action={
          <Button size="sm" variant="secondary" onClick={exportCsv}>
            {t('org.export')}
          </Button>
        }
      />
      <Card flush className="overflow-x-auto">
        <table className="w-full min-w-[26rem] text-sm">
          <thead>
            <tr className="border-b border-ink-100 text-left text-xs uppercase tracking-wide text-ink-400">
              <th className="px-6 py-3.5 font-medium">{t('org.colVol')}</th>
              <th className="px-6 py-3.5 text-right font-medium">{t('org.colShifts')}</th>
              <th className="px-6 py-3.5 text-right font-medium">{t('org.colHours')}</th>
              <th className="px-6 py-3.5 text-right font-medium">{t('org.colTier')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-100">
            {data.map((r) => (
              <tr key={r.account.id}>
                <td className="px-6 py-3.5 font-medium text-ink-800">{r.account.name}</td>
                <td className="px-6 py-3.5 text-right text-ink-600">{r.approvedShifts}</td>
                <td className="px-6 py-3.5 text-right text-ink-600">{r.totalHours}</td>
                <td className="px-6 py-3.5 text-right">
                  <TierBadge tier={r.tier} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  )
}
