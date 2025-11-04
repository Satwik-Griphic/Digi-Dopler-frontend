import React from 'react'
import { Wifi, WifiOff, Rss } from 'lucide-react'
import { useAnalytics } from '../../../context/AnalyticsContext'

export default function SensorsCard({className=""}) {
  const { state } = useAnalytics()
  const { sensors } = state
  const total = sensors?.total ?? 0
  const online = sensors?.online ?? 0
  const offline = sensors?.offline ?? 0

  return (
    <div 
    className={`bg-white shadow rounded-2xl p-4 h-full flex flex-col align-start justify-center ${className || ""}`}
    >
      {/* Top: Icon + Title */}
      <div className="flex items-center mb-3">
        <Rss className="w-5 h-5 text-blue-500 mr-2" />
        <span className="text-sm text-gray-700 text-xl font-medium mt-2">
          {total} Sensors
        </span>
      </div>

      {/* Middle: Online / Offline counts */}
      <div className="flex justify-around mb-3">
        <span className="text-4xl font-semibold">{String(online).padStart(2, '0')}</span>
        <span className="text-4xl font-semibold">{String(offline).padStart(2, '0')}</span>
      </div>

      {/* Bottom: Status badges */}
      <div className="flex justify-between">
        <div className="flex items-center gap-1 bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-medium">
          <Wifi className="w-4 h-4" />
          Online
        </div>
        <div className="flex items-center gap-1 bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs font-medium">
          <WifiOff className="w-4 h-4" />
          Offline
        </div>
      </div>
    </div>
  )
}
