import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAsync, usePlatform } from '../../state/platform'
import { Badge, Card, EmptyState, LinkButton, LoadState, SectionTitle, cx, useBilingual } from '../../components/ui'

const CATEGORIES = ['all', 'shelter', 'food', 'youth', 'environment', 'seniors', 'admin'] as const

export default function Discover() {
  const { t } = useTranslation()
  const { api } = usePlatform()
  const tb = useBilingual()
  const [category, setCategory] = useState<string>('all')
  const { data, loading, error } = useAsync(() => api.listOpportunities({ category }), [category])

  return (
    <div className="space-y-5">
      <SectionTitle title={t('discover.title')} subtitle={t('discover.sub')} />

      <div className="flex flex-wrap gap-1.5">
        {CATEGORIES.map((c) => (
          <button
            key={c}
            onClick={() => setCategory(c)}
            className={cx(
              'rounded-full px-3 py-1 text-xs font-medium transition-colors',
              category === c
                ? 'bg-brand-600 text-white'
                : 'bg-ink-100 text-ink-600 hover:bg-ink-200',
            )}
          >
            {c === 'all' ? t('discover.filterAll') : t(`cause.${c}`)}
          </button>
        ))}
      </div>

      {loading || (!data && !error) ? (
        <LoadState />
      ) : !data || data.length === 0 ? (
        error ? <LoadState error={error} /> : <EmptyState>{t('discover.noShifts')}</EmptyState>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {data.map((card) => (
            <Card key={card.opportunity.id}>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-semibold text-ink-900">{tb(card.opportunity.title)}</h3>
                  <p className="mt-0.5 text-sm text-ink-500">{card.org.name}</p>
                </div>
                <Badge tone="brand">{t(`cause.${card.opportunity.category}`)}</Badge>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-ink-600">
                {tb(card.opportunity.description)}
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink-500">
                <span>{card.opportunity.locationLabel}</span>
                <span>·</span>
                <span>{card.opportunity.distanceKm} km</span>
                <span>·</span>
                <span>{card.opportunity.languages.map((l) => l.toUpperCase()).join(' / ')}</span>
              </div>
              <div className="mt-4 flex items-center justify-between">
                <span className="text-xs font-medium text-ink-500">
                  {t('discover.openShifts', { count: card.shifts.length })}
                </span>
                <LinkButton
                  to={`/volunteer/opportunity/${card.opportunity.id}`}
                  variant="secondary"
                  size="sm"
                >
                  {t('common.viewDetails')}
                </LinkButton>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
