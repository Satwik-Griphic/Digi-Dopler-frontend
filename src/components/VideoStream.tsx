import { useState, useRef } from 'react'
import { useStreamAnalytics } from '../context/StreamAnalyticsContext'
import { useConfig } from '../context/ConfigContext'

export default function VideoStream() {
  const { state, sendRtsp } = useStreamAnalytics()
  const { config } = useConfig()
  const [aspect, setAspect] = useState(16 / 9)
  const [hasFrame, setHasFrame] = useState(false)
  const [activeCam, setActiveCam] = useState<'Cam 1' | 'Cam 2' | 'Cam 3' | 'Cam 4' | 'Cam 5'>('Cam 1')
  const [selectedRoom, setSelectedRoom] = useState('Server Room')
  const videoContainerRef = useRef<HTMLDivElement>(null)

  function getRtspFor(cam: string): string | undefined {
    const sources = config?.sources || ({} as any)
    const map: Record<string, string | null | undefined> = {
      'Cam 1': sources.cam1 ?? sources.defaultRtsp,
      'Cam 2': sources.cam2 ?? sources.defaultRtsp,
      'Cam 3': (sources as any).cam3 ?? sources.defaultRtsp,
      'Cam 4': sources.defaultRtsp,
      'Cam 5': sources.defaultRtsp,
    }
    const value = map[cam]
    return typeof value === 'string' ? value : undefined
  }

  function handleImgLoad(e: React.SyntheticEvent<HTMLImageElement>) {
    const { naturalWidth, naturalHeight } = e.currentTarget
    if (naturalWidth && naturalHeight) {
      setAspect(naturalWidth / naturalHeight)
      setHasFrame(true)
    }
  }

  function toggleFullscreen() {
    if (!videoContainerRef.current) return
    
    if (document.fullscreenElement) {
      // Exit fullscreen if already in fullscreen
      if (document.exitFullscreen) {
        document.exitFullscreen()
      }
    } else {
      // Enter fullscreen
      if (videoContainerRef.current.requestFullscreen) {
        videoContainerRef.current.requestFullscreen()
      }
    }
  }

  const styleAspect = { aspectRatio: aspect }
  return (
    <div ref={videoContainerRef} className="w-full">
      {/* Room selector and camera controls above video */}
      <div className="flex items-center justify-between gap-3 mb-2">
        {/* Room Selector */}
        <select
          className=" rounded-lg px-3 py-1.5 text-sm bg-white cursor-pointer"
          value={selectedRoom}
          onChange={(e) => setSelectedRoom(e.target.value)}
        >
          {(config?.rooms || ['Server Room']).map((room) => (
            <option key={room} value={room}>{room}</option>
          ))}
        </select>
        
        {/* Camera Controls */}
        <div className="flex flex-row items-center bg-white rounded-lg shadow px-2 py-1.5 gap-2">
          {(['Cam 1', 'Cam 2', 'Cam 3'] as const).map(cam => (
            <button
              key={cam}
              onClick={() => { setActiveCam(cam); const url = getRtspFor(cam); if (url) sendRtsp(url) }}
              className={
                'px-4 py-1 font-semibold text-sm rounded transition-colors ' +
                (activeCam === cam ? 'bg-gray-600 text-white shadow' : 'bg-transparent text-gray-400 hover:bg-gray-100')
              }
              style={{ outline: 'none' }}
            >
              {cam}
            </button>
          ))}
        </div>
      </div>
      
      {/* Video Container */}
      <div
        className="relative bg-[#f8fafc] rounded-lg shadow-lg overflow-hidden flex flex-col w-full"
        style={styleAspect}
      >
        {/* Live badge - top left */}
        <div className="absolute z-10 left-4 top-4 flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
          <span className="text-xs font-semibold text-white px-2 py-0.5 rounded">Live</span>
        </div>
        
        {/* Fullscreen button - top right */}
        <button
          onClick={toggleFullscreen}
          className="absolute z-10 right-4 top-4 bg-black/30 hover:bg-black/50 text-white p-2 rounded transition-colors"
          style={{ outline: 'none' }}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
          </svg>
        </button>
        
        {/* Video/Image slot */}
        <div className={
          "flex-1 w-full h-full flex items-center justify-center " +
          (state.connection !== 'connected' && !hasFrame ? 'bg-black' : '')
        }>
          {state.connection !== 'connected' && !hasFrame ? (
            <div className="text-gray-400 w-full h-full flex items-center justify-center min-h-[120px]">
              {state.connection === 'connecting' ? 'Connecting…' : 'Stream Disconnected'}
            </div>
          ) : (
            <img
              src={`data:image/jpeg;base64,${state.currentFrame || ''}`}
              className="w-full h-full object-contain"
              alt="Live stream"
              onLoad={handleImgLoad}
            />
          )}
        </div>
      </div>
    </div>
  )
}


