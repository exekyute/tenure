import { useEffect, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { usePlatform, type DemoRole } from '../state/platform'
import { cx } from './ui'

const ROLE_HOME: Record<DemoRole, string> = {
  volunteer: '/volunteer',
  org: '/org',
  mentor: '/mentor',
}

const NAV: Record<DemoRole, { to: string; key: string; end?: boolean }[]> = {
  volunteer: [
    { to: '/volunteer', key: 'nav.home', end: true },
    { to: '/volunteer/discover', key: 'nav.discover' },
    { to: '/volunteer/passport', key: 'nav.passport' },
    { to: '/volunteer/credits', key: 'nav.credits' },
  ],
  org: [
    { to: '/org', key: 'nav.dashboard', end: true },
    { to: '/org/roster', key: 'nav.roster' },
    { to: '/org/shifts', key: 'nav.shifts' },
    { to: '/org/signoff', key: 'nav.signoff' },
    { to: '/org/reports', key: 'nav.reports' },
  ],
  mentor: [{ to: '/mentor', key: 'nav.profile', end: true }],
}

export function Shell({ children }: { children: ReactNode }) {
  const { t, i18n } = useTranslation()
  const { role, setRole, api, refresh, toast } = usePlatform()
  const navigate = useNavigate()
  const location = useLocation()

  // The URL is the source of truth for the active role, so deep links and
  // browser back/forward keep the switcher and nav in sync.
  useEffect(() => {
    const section = location.pathname.split('/')[1] as DemoRole
    if ((section === 'volunteer' || section === 'org' || section === 'mentor') && section !== role) {
      setRole(section)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname])

  const switchRole = (r: DemoRole) => {
    setRole(r)
    navigate(ROLE_HOME[r])
  }

  const switchLang = (lng: 'en' | 'fr') => {
    i18n.changeLanguage(lng)
    localStorage.setItem('tenure.lang', lng)
  }

  const resetDemo = () => {
    api.reset()
    refresh()
    toast(t('toast.reset'), 'info')
    navigate(ROLE_HOME[role])
  }

  const roles: DemoRole[] = ['volunteer', 'org', 'mentor']

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 border-b border-ink-200 bg-white">
        <div className="mx-auto max-w-5xl px-4">
          <div className="flex h-16 items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-sm font-bold text-white">
                T
              </div>
              <div className="leading-tight">
                <div className="text-base font-semibold tracking-tight">{t('app.name')}</div>
                <div className="hidden text-xs text-ink-400 sm:block">{t('app.tag')}</div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Language toggle */}
              <div className="flex overflow-hidden rounded-lg border border-ink-200">
                {(['en', 'fr'] as const).map((lng) => (
                  <button
                    key={lng}
                    onClick={() => switchLang(lng)}
                    className={cx(
                      'px-2.5 py-1 text-xs font-semibold',
                      i18n.language === lng
                        ? 'bg-ink-900 text-white'
                        : 'bg-white text-ink-500 hover:bg-ink-50',
                    )}
                  >
                    {t(`lang.${lng}`)}
                  </button>
                ))}
              </div>
              <button
                onClick={resetDemo}
                className="rounded-lg px-2.5 py-1 text-xs font-medium text-ink-500 hover:bg-ink-100"
              >
                {t('demo.reset')}
              </button>
            </div>
          </div>

          {/* Role switcher */}
          <div className="flex items-center gap-2.5 pb-3">
            <span className="text-xs font-medium text-ink-400">{t('role.viewAs')}</span>
            <div className="flex flex-wrap gap-2">
              {roles.map((r) => (
                <button
                  key={r}
                  onClick={() => switchRole(r)}
                  className={cx(
                    'rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors',
                    role === r
                      ? 'border-brand-600 bg-brand-600 text-white'
                      : 'border-ink-200 bg-white text-ink-600 hover:bg-ink-50',
                  )}
                >
                  {t(`role.${r}`)}
                </button>
              ))}
            </div>
          </div>

          {/* Section nav */}
          <nav className="flex gap-1 overflow-x-auto">
            {NAV[role].map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  cx(
                    'whitespace-nowrap border-b-2 px-3.5 py-3 text-sm font-medium transition-colors',
                    isActive
                      ? 'border-brand-600 text-brand-700'
                      : 'border-transparent text-ink-500 hover:text-ink-800',
                  )
                }
              >
                {t(item.key)}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700">
          <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
          {t('demo.banner')}
        </div>
        {children}
      </main>
    </div>
  )
}
