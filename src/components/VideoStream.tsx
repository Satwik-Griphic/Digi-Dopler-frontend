import { useState, useRef, useEffect } from 'react'
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
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    console.log(state.currentFrame)
    if (!state.currentFrame || !canvasRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const image = new Image()
    image.onload = () => {
      canvas.width = image.width
      canvas.height = image.height
      ctx.drawImage(image, 0, 0, image.width, image.height)

      // draw bounding boxes if any
      if (state.boundingBoxes?.length) {
        state.boundingBoxes.forEach(box => {
          const color = box.distance > box.threshold ? 'red' : 'lime'
          ctx.strokeStyle = color
          ctx.lineWidth = 1
          ctx.strokeRect(box.x, box.y, box.w, box.h)

          // name label
          ctx.font = '16px Arial'
          ctx.fillStyle = color

          ctx.fillText( "",box.x + 4, box.y - 4)
        })
      }

      // update aspect ratio
      setAspect(image.width / image.height)
      setHasFrame(true)
    }
    image.src = `data:image/jpeg;base64,${state.currentFrame}`
    // console.log(image.src)
  }, [state.currentFrame, state.boundingBoxes])

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

  // function handleImgLoad(e: React.SyntheticEvent<HTMLImageElement>) {
  //   const { naturalWidth, naturalHeight } = e.currentTarget
  //   if (naturalWidth && naturalHeight) {
  //     setAspect(naturalWidth / naturalHeight)
  //     setHasFrame(true)
  //   }
  // }

  console.log("videoContainerRef",canvasRef)
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
      <canvas ref={canvasRef} className="w-full h-full object-contain" />

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
        
        {/* Connection state fallback */}
        {state.connection !== 'connected' && !hasFrame && (
          <div className="absolute inset-0 flex items-center justify-center bg-black text-gray-400">
            {state.connection === 'connecting' ? 'Connecting…' : 'Stream Disconnected'}
          </div>
        )}
      </div>
    </div>
  )
}


