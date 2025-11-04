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
  apiBaseUrl: 'http://172.30.205.102:8000',
  sockets: { incomingUrl: 'ws://172.30.205.102:8000/v2/ws/streamsc' },
  health: { v1: '/v1/health', v2: '/v2/health' },
  sources: { defaultRtsp: '', cam1: null, cam2: null },
  ui: { modelVersion: 'v2' },
  rooms: ['Lobby', 'Server Room', 'Office A'],
  otherBackend: {
    apiBaseUrl: 'http://localhost:3000',
    forwardFramePath: '/api/room-live/activity-logs/bulk?camera_id=1&room_id=1',
    analyticsPath: '/api/room-live/status',
    statusPath: '/status',
    pollMs: 5000,
  },
  analytics:{
  pollMs: 120000,        
  temperatureThreshold: 42,
  humidityThreshold: 80,
  apiBaseUrl: "http://localhost:3000",
  endpoints:{
    currentTempHumid: "/api/sensor-dashboard/current-reading",        
    currentSensors: "/api/sensor-dashboard/sensor-list",
    aiBaseUrl: "http://172.26.119.12:8001",
    previousTemp: "/api/sensor-dashboard/temperature-record",
    previousHumidity: "/api/"
  }
  }
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
          otherBackend: { ...DEFAULTS.otherBackend, ...(parsed?.otherBackend || {}) }, 
          analytics: {
            ...DEFAULTS.analytics,
            ...(parsed?.analytics || {}),
            endpoints: {
              ...DEFAULTS.analytics?.endpoints,
              ...(parsed?.analytics?.endpoints || {}),
            },
          },
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


