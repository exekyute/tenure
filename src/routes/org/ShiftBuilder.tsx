import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAsync, usePlatform } from '../../state/platform'
import { Badge, Button, Card, SectionTitle, useBilingual } from '../../components/ui'

function localISO(offsetDays: number): string {
  const d = new Date()
  d.setDate(d.getDate() + offsetDays)
  const p = (x: number) => String(x).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}

export default function ShiftBuilder() {
  const { t } = useTranslation()
  const { api, ids, refresh, toast } = usePlatform()
  const tb = useBilingual()
  const { data: opps } = useAsync(() => api.listOrgOpportunities(ids.orgId), [ids.orgId])
  const { data: shifts } = useAsync(() => api.listOrgShifts(ids.orgId), [ids.orgId])

  const today = localISO(0)
  const [opportunityId, setOpportunityId] = useState('')
  const [date, setDate] = useState(localISO(7))
  const [startTime, setStart] = useState('09:00')
  const [endTime, setEnd] = useState('12:00')
  const [capacity, setCapacity] = useState(6)
  const [supervisorName, setSupervisor] = useState('Dana R.')

  const selected = opportunityId || opps?.[0]?.id || ''
  const upcoming = (shifts ?? []).filter((s) => s.date >= today).sort((a, b) => a.date.localeCompare(b.date))

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selected || !date || !startTime || !endTime || !supervisorName.trim() || capacity < 1) {
      toast(t('org.errMissing'), 'warn')
      return
    }
    if (date < today) {
      toast(t('org.errPastDate'), 'warn')
      return
    }
    if (endTime <= startTime) {
      toast(t('org.errEndBeforeStart'), 'warn')
      return
    }
    await api.createShift({
      opportunityId: selected,
      date,
      startTime,
      endTime,
      capacity,
      supervisorName: supervisorName.trim(),
    })
    refresh()
    toast(t('org.created'), 'success')
  }

  const field =
    'w-full rounded-lg border border-ink-200 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/25'
  const label = 'mb-1 block text-xs font-medium text-ink-500'

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <SectionTitle title={t('org.shiftsTitle')} subtitle={t('org.shiftsSub')} />
      <Card>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className={label}>{t('org.opp')}</label>
            <select
              className={field}
              value={selected}
              onChange={(e) => setOpportunityId(e.target.value)}
            >
              {opps?.map((o) => (
                <option key={o.id} value={o.id}>
                  {tb(o.title)}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={label}>{t('org.date')}</label>
              <input
                type="date"
                className={field}
                value={date}
                min={today}
                required
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
            <div>
              <label className={label}>{t('org.capacity')}</label>
              <input
                type="number"
                min={1}
                className={field}
                value={capacity}
                required
                onChange={(e) => setCapacity(Number(e.target.value))}
              />
            </div>
            <div>
              <label className={label}>{t('org.start')}</label>
              <input
                type="time"
                className={field}
                value={startTime}
                required
                onChange={(e) => setStart(e.target.value)}
              />
            </div>
            <div>
              <label className={label}>{t('org.end')}</label>
              <input
                type="time"
                className={field}
                value={endTime}
                required
                onChange={(e) => setEnd(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className={label}>{t('org.supervisor')}</label>
            <input
              className={field}
              value={supervisorName}
              required
              onChange={(e) => setSupervisor(e.target.value)}
            />
          </div>

          <Button type="submit">{t('org.create')}</Button>
        </form>
      </Card>

      {upcoming.length > 0 && (
        <div>
          <SectionTitle title={t('org.upcoming')} />
          <Card flush className="divide-y divide-ink-100">
            {upcoming.map((s) => (
              <div key={s.id} className="flex items-center justify-between gap-3 px-6 py-3.5">
                <div>
                  <div className="text-sm font-medium text-ink-800">{tb(s.opportunityTitle)}</div>
                  <div className="mt-0.5 text-xs text-ink-500">
                    {s.date} · {s.startTime}-{s.endTime} · {s.supervisorName}
                  </div>
                </div>
                <Badge tone={s.filled >= s.capacity ? 'neutral' : 'brand'}>
                  {s.filled}/{s.capacity}
                </Badge>
              </div>
            ))}
          </Card>
        </div>
      )}
    </div>
  )
}
