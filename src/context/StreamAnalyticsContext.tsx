import { createContext, useContext, useEffect, useMemo, useReducer, useRef } from 'react'
import { useConfig } from './ConfigContext'
import type { SocketMessage } from '../types'
import { SocketManager } from '../services/SocketManager'

// --- State ---
type StreamState = {
  source: 'default' | 'cam1' | 'cam2'
  sourceUrl?: string
  connection: 'connected' | 'connecting' | 'disconnected'
  currentFrame?: string
  totalEvents: number
  unknown: number
  verified: number
  noFace: number
  verifiedUsers: string[]
}

type Action =
  | { type: 'setSource'; source: StreamState['source']; url?: string }
  | { type: 'connection'; status: StreamState['connection'] }
  | { type: 'frame'; imageBase64: string }
  | { type: 'analytics'; payload: { totalEvents: number; unknown: number; verified: number; noFace: number } }
  | { type: 'verified'; users: string[] }

const StreamAnalyticsContext = createContext<{
  state: StreamState
  setSource: (source: StreamState['source'], url?: string) => void
  sendRtsp: (rtspUrl: string) => void
} | null>(null)

function reducer(state: StreamState, action: Action): StreamState {
  switch (action.type) {
    case 'setSource':
      return { ...state, source: action.source, sourceUrl: action.url }
    case 'connection':
      return { ...state, connection: action.status }
    case 'frame':
      console.log('frame in reducer', action)
      return { ...state, currentFrame: action.payload }
    case 'analytics':
      return { ...state, ...action.payload }
    case 'verified':
      return { ...state, verifiedUsers: action.users }
    case 'response':
      return { ...state, currentFrame: action.payload }
    default:
      return state
  }
}

export function StreamAnalyticsProvider({ children }: { children: React.ReactNode }) {
  const { config, loading } = useConfig()
  const [state, dispatch] = useReducer(reducer, {
    source: 'default',
    sourceUrl: undefined,
    connection: 'disconnected',
    currentFrame: undefined,
    totalEvents: 0,
    unknown: 0,
    verified: 0,
    noFace: 0,
    verifiedUsers: [],
  })

  // --- SOCKETS SETUP ---
  const aiSocketRef = useRef<SocketManager|null>(null)
  const otherSocketRef = useRef<SocketManager|null>(null)

  useEffect(() => {
    if (loading || !config) return
    dispatch({ type: 'connection', status: 'connecting' })

    // AI backend socket connection
    console.log(config.sockets.incomingUrl)
    const aiSocket = new SocketManager(
      config.sockets.incomingUrl,
      {
        onOpen: () => {
          dispatch({ type: 'connection', status: 'connected' });
          // Use the incomingUrl from config as the stream source fallback
          const streamSource = config?.sources?.defaultRtsp || 'default';
          try {
            aiSocket.sendMessage(
              JSON.stringify({
                type: 'command',
                command: 'start_stream',
                source: streamSource,
              })
            );
          } catch (err) {
            console.error('Failed to send start_stream command:', err);
          }
        },
        onClose: () => dispatch({ type: 'connection', status: 'disconnected' }),
        onError: () => dispatch({ type: 'connection', status: 'disconnected' }),
        onMessage: (msg: SocketMessage) => {
          console.log(msg)
          switch (msg.type) {
            case 'response':
              console.log('response', msg)
              dispatch({ type: 'frame', payload: msg.frame })
              break
            case 'frame':
              dispatch({ type: 'frame', imageBase64: msg.payload.imageBase64 })
              // Forward to other backend socket if open (step 2)
              if (otherSocketRef.current)
                otherSocketRef.current.sendMessage(JSON.stringify(msg))
              break
            case 'analytics':
              dispatch({ type: 'analytics', payload: msg.payload })
              break
            case 'verified':
              dispatch({ type: 'verified', users: msg.payload.users })
              break
            case 'status':
              dispatch({ type: 'connection', status: msg.payload.connection })
              break
          }

        },
      },
    )
    aiSocket.start()
    aiSocketRef.current = aiSocket

    // Other backend socket connection (for forwarding)
    if (config.sockets.otherBackendUrl) {
      const otherSocket = new SocketManager(
        config.sockets.otherBackendUrl,
        {
          onOpen: () => {},
          onClose: () => {},
          onError: () => {},
          onMessage: (_msg: any) => {},
        },
      )
      otherSocket.start()
      otherSocketRef.current = otherSocket
    }

    return () => {
      aiSocket.stop()
      aiSocketRef.current = null
      if (otherSocketRef.current) {
        otherSocketRef.current.stop()
        otherSocketRef.current = null
      }
    }
  }, [loading, config])

  // --- POLLING: Analytics and Current Status from other backend (REST) ---
  useEffect(() => {
    if (loading || !config || !config.otherBackend) return
    const { apiBaseUrl, analyticsPath, statusPath, pollMs = 5000 } = config.otherBackend

    let cancelled = false
    let analyticsTimer: any
    let statusTimer: any

    async function fetchAnalytics() {
      try {
        const res = await fetch(apiBaseUrl + analyticsPath, { cache: 'no-store' })
        if (!res.ok) throw new Error(String(res.status))
        const data = await res.json()
        if (!cancelled) {
          const { totalEvents = 0, unknown = 0, verified = 0, noFace = 0 } = data || {}
          dispatch({ type: 'analytics', payload: { totalEvents, unknown, verified, noFace } })
        }
      } catch (_) {
        // swallow
      }
    }

    async function fetchStatus() {
      try {
        const res = await fetch(apiBaseUrl + statusPath, { cache: 'no-store' })
        if (!res.ok) throw new Error(String(res.status))
        const data = await res.json()
        if (!cancelled) {
          const users: string[] = Array.isArray(data?.users) ? data.users : []
          dispatch({ type: 'verified', users })
        }
      } catch (_) {
        // swallow
      }
    }

    // initial
    fetchAnalytics()
    fetchStatus()
    analyticsTimer = setInterval(fetchAnalytics, pollMs)
    statusTimer = setInterval(fetchStatus, pollMs)

    return () => {
      cancelled = true
      if (analyticsTimer) clearInterval(analyticsTimer)
      if (statusTimer) clearInterval(statusTimer)
    }
  }, [loading, config])

  function sendRtsp(rtspUrl: string) {
    if (!rtspUrl) return
    const message = JSON.stringify({ type: 'stream', rtsp: rtspUrl })
    aiSocketRef.current?.sendMessage(message)
  }

  const value = useMemo(
    () => ({
      state,
      setSource: (source: StreamState['source'], url?: string) => dispatch({ type: 'setSource', source, url }),
      sendRtsp,
    }),
    [state],
  )
  return <StreamAnalyticsContext.Provider value={value}>{children}</StreamAnalyticsContext.Provider>
}

export function useStreamAnalytics() {
  const ctx = useContext(StreamAnalyticsContext)
  if (!ctx) throw new Error('useStreamAnalytics must be used within StreamAnalyticsProvider')
  return ctx
}


