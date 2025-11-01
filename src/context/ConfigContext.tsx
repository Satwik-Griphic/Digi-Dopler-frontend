import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import yaml from 'js-yaml'
import type { AppConfig } from '../types'

type ConfigState = {
  config: AppConfig | null
  loading: boolean
  error: string | null
}

const ConfigContext = createContext<ConfigState | undefined>(undefined)

const DEFAULTS: AppConfig = {
  apiBaseUrl: 'http://localhost:8000',
  sockets: { incomingUrl: 'ws://localhost:8000/v2/ws/streamsc' },
  health: { v1: '/v1/health', v2: '/v2/health' },
  sources: { defaultRtsp: '', cam1: null, cam2: null },
  ui: { modelVersion: 'v2' },
  rooms: ['Lobby', 'Server Room', 'Office A'],
}

export function ConfigProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<ConfigState>({ config: null, loading: true, error: null })

  useEffect(() => {
    let isMounted = true
    async function load() {
      try {
        const res = await fetch('/config.yaml', { cache: 'no-store' })
        if (!res.ok) throw new Error(`Failed to load config: ${res.status}`)
        const text = await res.text()
        const parsed = yaml.load(text) as Partial<AppConfig>
        const merged: AppConfig = {
          ...DEFAULTS,
          ...parsed,
          sockets: { ...DEFAULTS.sockets, ...(parsed?.sockets || {}) },
          health: { ...DEFAULTS.health, ...(parsed?.health || {}) },
          sources: { ...DEFAULTS.sources, ...(parsed?.sources || {}) },
          ui: { ...DEFAULTS.ui, ...(parsed?.ui || {}) },
        }
        console.log(merged)
        if (isMounted) setState({ config: merged, loading: false, error: null })
      } catch (err: any) {
        if (isMounted) setState({ config: DEFAULTS, loading: false, error: err?.message || 'Unknown error' })
      }
    }
    load()
    return () => {
      isMounted = false
    }
  }, [])

  const value = useMemo(() => state, [state])
  return <ConfigContext.Provider value={value}>{children}</ConfigContext.Provider>
}

export function useConfig() {
  const ctx = useContext(ConfigContext)
  if (!ctx) throw new Error('useConfig must be used within ConfigProvider')
  return ctx
}


