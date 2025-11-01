import type { SocketMessage } from '../types'

export type SocketCallbacks = {
  onMessage: (msg: SocketMessage) => void
  onOpen: () => void
  onClose: () => void
  onError: (e: Event) => void
}

export class SocketManager {
  private url: string
  private mirrorUrl?: string
  public ws: WebSocket | null = null
  private mirror: WebSocket | null = null
  private backoff = 500
  private readonly maxBackoff = 5000
  private stopped = false
  private callbacks: SocketCallbacks

  constructor(url: string, callbacks: SocketCallbacks, mirrorUrl?: string) {
    this.url = url
    this.callbacks = callbacks
    this.mirrorUrl = mirrorUrl
  }

  start() {
    this.stopped = false
    this.connect()
  }

  stop() {
    this.stopped = true
    this.ws?.close()
    this.mirror?.close()
  }

  private connect() {
    if (this.stopped) return
    console.log('Connecting to socket:', this.url)
    this.ws = new WebSocket(this.url)
    if (this.mirrorUrl) this.mirror = new WebSocket(this.mirrorUrl)

    this.ws.onopen = () => {
      this.backoff = 500
      this.callbacks.onOpen()
    }
    this.ws.onmessage = (ev) => {
      try {
        const data: SocketMessage = JSON.parse(ev.data)
        this.callbacks.onMessage(data)
        if (this.mirror && this.mirror.readyState === WebSocket.OPEN) {
          this.mirror.send(JSON.stringify(data))
        }
      } catch (e) {
        // ignore malformed
      }
    }
    this.ws.onerror = (e) => this.callbacks.onError(e)
    this.ws.onclose = () => {
      this.callbacks.onClose()
      if (this.stopped) return
      setTimeout(() => {
        this.backoff = Math.min(this.maxBackoff, this.backoff * 2)
        this.connect()
      }, this.backoff)
    }
  }

  public sendMessage(data: string) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(data)
    }
  }
}


