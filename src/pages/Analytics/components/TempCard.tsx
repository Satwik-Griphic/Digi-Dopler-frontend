import { Thermometer } from 'lucide-react'
import { useAnalytics } from '../../../context/AnalyticsContext'

export default function TempCard({className=""}) {
  const { state } = useAnalytics()
  const temperature = state.temperature?.toFixed?.(1) ?? '--'
  const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

  return (
    <div 
    className={`bg-white shadow rounded-2xl p-4 h-full flex flex-col items-start justify-center align-center ${className || ""}`}
    >
      {/* Icon */}

      {/* Temperature Value */}
      <div className="flex items-baseline">
        <img src={"temp-thermometer.svg"} alt={"thermometer"} className="w-10 h-10 object-contain" />
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
