import { Thermometer } from 'lucide-react'
import { useAnalytics } from '../../../context/AnalyticsContext'

export default function TempCard() {
  const { state } = useAnalytics()
  const temperature = state.temperature?.toFixed?.(1) ?? '--'
  const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex flex-col items-start justify-center text-gray-900 w-56 h-48">
      {/* Icon */}

      {/* Temperature Value */}
      <div className="flex items-baseline">
      <Thermometer className="w-6 h-6 text-blue-500 m-2" />
        <span className="text-5xl font-semibold">{temperature}</span>
        <span className="text-xl text-gray-500 ml-1">°C</span>
      </div>

      {/* Label */}
      <div className="text-xl font-medium mt-2">Temperature</div>

      {/* Timestamp */}
      <div className="text-xs text-gray-400 mt-1">{time}</div>
    </div>
  )
}
