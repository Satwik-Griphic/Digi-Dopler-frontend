export type AppConfig = {
  apiBaseUrl: string
  sockets: {
    incomingUrl: string
    outgoingUrl?: string
    otherBackendUrl?: string
  }
  health: {
    v1: string
    v2: string
  }
  sources: {
    defaultRtsp: string
    cam1: string | null
    cam2: string | null
    cam3?: string | null
  }
  ui: {
    modelVersion: 'v1' | 'v2'
  }
  rooms?: string[]
  otherBackend?: {
    apiBaseUrl: string
    analyticsPath: string
    statusPath: string
    pollMs?: number
  }
}

export type SocketMessage =
  | { type: 'frame'; payload: { imageBase64: string } }
  | {
      type: 'analytics'
      payload: { totalEvents: number; unknown: number; verified: number; noFace: number }
    }
  | { type: 'verified'; payload: { users: string[] } }
  | { type: 'status'; payload: { connection: 'connected' | 'connecting' | 'disconnected' } }
  // New AI backend protocol messages
  | { type: 'error'; message: string }
  | {
      type: 'response'
      frame: string
      frame_w: number
      frame_h: number
      threshold: number
      predictions: Prediction[]
    }

export type Prediction = {
  source_x: number
  source_y: number
  source_w: number
  source_h: number
  distance: number
  identity: string
}


