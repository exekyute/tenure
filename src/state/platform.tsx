import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { MockAPI } from '../api/MockAPI'
import { DEMO } from '../api/mockData'

export type DemoRole = 'volunteer' | 'org' | 'mentor'

interface ToastMsg {
  id: number
  text: string
  tone: 'info' | 'success' | 'warn'
}

interface PlatformCtx {
  api: MockAPI
  rev: number
  refresh: () => void
  role: DemoRole
  setRole: (r: DemoRole) => void
  ids: typeof DEMO
  toast: (text: string, tone?: ToastMsg['tone']) => void
}

const Ctx = createContext<PlatformCtx | null>(null)

export function PlatformProvider({ children }: { children: ReactNode }) {
  const apiRef = useRef<MockAPI>()
  if (!apiRef.current) apiRef.current = new MockAPI()

  const [rev, setRev] = useState(0)
  const [role, setRoleState] = useState<DemoRole>(
    (localStorage.getItem('tenure.role') as DemoRole) || 'volunteer',
  )
  const [toasts, setToasts] = useState<ToastMsg[]>([])
  const nextId = useRef(1)

  const refresh = () => setRev((r) => r + 1)

  const setRole = (r: DemoRole) => {
    setRoleState(r)
    localStorage.setItem('tenure.role', r)
  }

  const toast = (text: string, tone: ToastMsg['tone'] = 'info') => {
    const id = nextId.current++
    setToasts((t) => [...t, { id, text, tone }])
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4000)
  }

  const value: PlatformCtx = {
    api: apiRef.current,
    rev,
    refresh,
    role,
    setRole,
    ids: DEMO,
    toast,
  }

  return (
    <Ctx.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed right-4 top-20 z-50 flex flex-col items-end gap-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={
              'pointer-events-auto max-w-sm rounded-xl px-4 py-3 text-sm font-medium shadow-card ' +
              (t.tone === 'success'
                ? 'bg-brand-600 text-white'
                : t.tone === 'warn'
                  ? 'bg-amber-500 text-white'
                  : 'bg-ink-900 text-white')
            }
          >
            {t.text}
          </div>
        ))}
      </div>
    </Ctx.Provider>
  )
}

export function usePlatform(): PlatformCtx {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('usePlatform must be used inside PlatformProvider')
  return ctx
}

/** Run an async loader and re-run whenever the store revision or deps change. */
export function useAsync<T>(loader: () => Promise<T>, deps: unknown[] = []) {
  const { rev } = usePlatform()
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<unknown>(null)

  useEffect(() => {
    let alive = true
    setLoading(true)
    setError(null)
    loader().then(
      (d) => {
        if (alive) {
          setData(d)
          setLoading(false)
        }
      },
      (e) => {
        // Without this, a throwing loader leaves the page on an infinite spinner.
        if (alive) {
          setError(e)
          setLoading(false)
        }
      },
    )
    return () => {
      alive = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rev, ...deps])

  return { data, loading, error }
}
