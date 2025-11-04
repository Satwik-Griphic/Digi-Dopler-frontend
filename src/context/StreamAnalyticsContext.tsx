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
  intruderHistory:
    {
      snap: string,
      name: string,
      timestamp: string
    }[]
  boundingBoxes?: {
      x: number
      y: number
      w: number
      h: number
      distance: number
      name: string
      confidence: number
      threshold: number
    }[]
}

type Action =
  | { type: 'setSource'; source: StreamState['source']; url?: string }
  | { type: 'connection'; status: StreamState['connection'] }
  | { type: 'frame'; imageBase64: string }
  | { type: 'analytics'; payload: { totalEvents: number; unknown: number; verified: number; noFace: number } }
  | { type: 'verified'; users: string[] }
  | { type: 'intruderHistory'; history: { snap: string, name: string, timestamp: string }[] }
  | { type: 'boundingBoxes'; boxes: StreamState['boundingBoxes'] }



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
      return { ...state, currentFrame: action.imageBase64 }
    case 'analytics':
      return { ...state, ...action.payload }
    case 'verified':
      return { ...state, verifiedUsers: action.users }
    case 'intruderHistory':
      return { ...state, intruderHistory: action.history }
    case 'boundingBoxes':
      return { ...state, boundingBoxes: action.boxes }
      
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
    intruderHistory: [],

  })

  // --- SOCKETS SETUP ---
  const aiSocketRef = useRef<SocketManager|null>(null)
  const otherSocketRef = useRef<SocketManager|null>(null)
  const pollingStarted = useRef(false)


  async function sendToDbBackend(payload) {
    // console.log('payload going to send to db backend:', payload)
    
  const wrappedPayload = { data: [payload] }
  // console.log("data sending to db each frame when intruder detected",wrappedPayload)
    try {
      await fetch(`${config?.otherBackend?.apiBaseUrl}${config?.otherBackend?.forwardFramePath}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(wrappedPayload),
      });
    } catch (err) {
      console.error('Failed to send to DB backend:', err);
    }
  }

  useEffect(() => {
    if (loading || !config) return
    dispatch({ type: 'connection', status: 'connecting' })

    // AI backend socket connection
    // console.log(config.sockets.incomingUrl)
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
          // console.log(msg)
          switch (msg.type) {
            case 'response':
              // console.log('response received from ai backend', msg)
              dispatch({ type: 'frame', imageBase64: msg.frame })
              if (msg.predictions && Array.isArray(msg.predictions)) {
                // handle overlapping boxes
                const mergedBoxes = Object.values(
                  msg.predictions.reduce((acc, p) => {
                    const key = `${p.source_x}-${p.source_y}-${p.source_w}-${p.source_h}`
                    if (!acc[key] || p.distance < acc[key].distance) {
                      acc[key] = {
                        x: p.source_x,
                        y: p.source_y,
                        w: p.source_w,
                        h: p.source_h,
                        distance: p.distance,
                        name: p.distance > msg.threshold ? 'Unknown' : p.identity.split('_')[0],
                        threshold: msg.threshold,

                      }
                    }
                    return acc
                  }, {})
                )
                dispatch({ type: 'boundingBoxes', boxes: mergedBoxes })
              }
            
              if (msg.frame) {
                const transformed = transformAiResponse(msg)
                sendToDbBackend(transformed)
              }
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

   

    return () => {
      aiSocket.stop()
      aiSocketRef.current = null
    }
  }, [loading, config])

  // --- POLLING: Analytics and Current Status from other backend (REST) ---
  useEffect(() => {
    if (loading || !config || !config.otherBackend) return;
  
    pollingStarted.current = true;
    const { apiBaseUrl, analyticsPath, pollMs = 120000 } = config.otherBackend;
  
    let cancelled = false;
    let pollingTimer: any;
  
    async function fetchAnalyticsAndIntruders() {
      try {
        const res = await fetch(apiBaseUrl + analyticsPath, { cache: "no-store" });
        if (!res.ok) throw new Error(String(res.status));
  
        const result = await res.json();
        if (cancelled || !result?.success || !result?.data) return;
  
        // ---- Extract key metrics ----
        let total = Number(result.data["Total User"] ?? 0);
        const intrudersArray = Array.isArray(result.data.Intruders)
          ? result.data.Intruders
          : [];
  
        const unknown = intrudersArray.length;
        if(unknown>total)
          total=unknown
        const verified = Math.max(total - unknown, 0);
        const noFace = total - (verified + unknown);
  
        // ---- Update analytics numbers ----
        dispatch({
          type: "analytics",
          payload: {
            totalEvents: total,
            verified,
            unknown,
            noFace,
          },
        });
  
        // ---- Update intruder history ----
        if (intrudersArray.length > 0) {
          console.log("intrudersArray:",intrudersArray)
          const newHistory = intrudersArray.map((intruder: any) => ({
            snap: intruder.image || "/placeholder-image.jpg",
            name: "Unknown Person",
            timestamp: new Date(intruder.datetime).toLocaleString(),
          }));
  
          dispatch({
            type: "intruderHistory",
            history: newHistory,
          });
        } else {
          dispatch({ type: "intruderHistory", history: [] });
        }
  
        console.log("✅ Combined analytics + intruder data received:", result.data);
      } catch (err) {
        console.error("Failed to fetch analytics & intruder data:", err);
      }
    }
  
    // --- Initial + repeated polling ---
    fetchAnalyticsAndIntruders();
    pollingTimer = setInterval(fetchAnalyticsAndIntruders, 120000);
  
    return () => {
      cancelled = true;
      if (pollingTimer) clearInterval(pollingTimer);
    };
  }, [config?.otherBackend?.apiBaseUrl]);
  

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


function transformAiResponse(msg) {
  const { frame, threshold, predictions = [] } = msg;

  const coords = predictions.map(p => ({
    x: p.source_x,
    y: p.source_y,
    w: p.source_w,
    h: p.source_h,
    distance: p.distance,
    name: p.identity.split('_')[0],
  }));

  let status: 'no_face' | 'unknown' | 'verified';
  if (predictions.length === 0) {
    status = 'no_face';
  } else if (predictions.some(p => p.distance > threshold)) {
    status = 'unknown';
  } else {
    status = 'verified';
  }

  return {
    type: 'response',
    image: frame,
    threshold,
    datetime: new Date().toISOString(),
    distance: 0,
    confidence: 0,
    frameHeight: '0',
    frameWidth: '0',
    status,
    coordinates: coords,
  };
}


