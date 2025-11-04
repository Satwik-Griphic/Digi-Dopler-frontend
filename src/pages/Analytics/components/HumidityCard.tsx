import { Droplets } from 'lucide-react'
import { useAnalytics } from '../../../context/AnalyticsContext'

export default function HumidityCard({className=""}) {
  const { state } = useAnalytics()
  const humidity = state.humidity?.toFixed?.(1) ?? '--'
  const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

  return (
    <div 
    className={`bg-white shadow rounded-2xl p-4 h-full flex flex-col justify-between ${className || ""}`}
    >
    {/* Icon + Value Row */}
    <div className="flex items-center mb-1">
      <Droplets className="w-8 h-8 text-green-500 m-2" />
      <span className="text-5xl font-semibold">{humidity}</span>
      <span className="text-xl text-gray-500 ml-1">%</span>
    </div>

    {/* Label */}
    <div className="text-xl font-medium mt-2">Humidity</div>

    {/* Timestamp */}
    <div className="text-xs text-gray-400 mt-1">{time}</div>
  </div>
  )
}
