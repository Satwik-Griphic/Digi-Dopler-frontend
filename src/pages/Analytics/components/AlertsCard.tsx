import { useAnalytics } from '../../../context/AnalyticsContext'
import { AlertTriangle, AlertCircle, WifiOff } from 'lucide-react'

export default function AlertsCard({className=""}) {
  const { state } = useAnalytics()
  const alerts = state.alerts || []

  const getAlertStyle = (color: string) => {
    switch (color) {
      case 'red':
        return 'bg-red-50 border-red-100 text-red-700'
      case 'yellow':
        return 'bg-yellow-50 border-yellow-100 text-yellow-700'
      default:
        return 'bg-blue-50 border-blue-100 text-blue-700'
    }
  }

  const getAlertIcon = (color: string) => {
    switch (color) {
      case 'red':
        return <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
      case 'yellow':
        return <AlertTriangle className="w-4 h-4 text-yellow-500 flex-shrink-0" />
      default:
        return <WifiOff className="w-4 h-4 text-blue-500 flex-shrink-0" />
    }
  }

  return (
    <div 
    className={`bg-white shadow rounded-2xl p-4 h-full flex flex-col justify-between ${className || ""}`}
    >
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-gray-800 font-semibold text-lg">Alerts</h2>
        <button className="text-sm text-gray-500 hover:text-gray-700">View all</button>
      </div>

      {alerts.length === 0 ? (
        <p className="text-sm text-gray-500 text-center py-8">No active alerts</p>
      ) : (
        <div className="space-y-2">
          {alerts.map(alert => (
            <div
              key={alert.id}
              className={`flex items-center justify-between px-3 py-2 rounded-md border ${getAlertStyle(alert.color)}`}
            >
              <div className="flex items-center gap-2">
                {getAlertIcon(alert.color)}
                <span className="text-sm font-medium">{alert.message}</span>
              </div>
              <span className="text-xs text-gray-400 font-medium whitespace-nowrap">
                {alert.timestamp}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
