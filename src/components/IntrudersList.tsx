import { useStreamAnalytics } from '../context/StreamAnalyticsContext'

type IntruderEntry = {
  id: string
  image: string
  name: string
  location: string
  timestamp: string
}

export default function IntrudersList() {
  const { state } = useStreamAnalytics()
  
  // For now, we'll create mock data based on the state
  // In production, this would come from the backend with actual intruder detection data
  const mockIntruders: IntruderEntry[] = state.unknown > 0
    ? Array.from({ length: Math.min(state.unknown, 3) }, (_, i) => ({
        id: `intruder-${i}`,
        // Using a placeholder image or the current frame if available
        image: state.currentFrame 
          ? `data:image/jpeg;base64,${state.currentFrame}` 
          : 'https://via.placeholder.com/40?text=Unknown',
        name: 'Unknown Intruder',
        location: 'Server Room',
        timestamp: new Date(Date.now() - (2 - i) * 60000).toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: true
        })
      }))
    : []
  
  if (mockIntruders.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-4">
        <h2 className="font-semibold text-gray-900 mb-4">Recent Intruders</h2>
        <p className="text-sm text-gray-500 text-center py-4">No intruders detected</p>
      </div>
    )
  }
  
  return (
    <div className="bg-white rounded-lg shadow p-4">
      <h2 className="font-semibold text-gray-900 mb-4">Recent Intruders</h2>
      <div className="space-y-3">
        {mockIntruders.map((intruder) => (
          <div
            key={intruder.id}
            className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded transition-colors border-b border-gray-100 last:border-b-0"
          >
            {/* Profile Image */}
            <div className="relative flex-shrink-0">
              <img
                src={intruder.image}
                alt={intruder.name}
                className="w-10 h-10 rounded-full object-cover"
                onError={(e) => {
                  // Fallback to placeholder if image fails to load
                  const target = e.target as HTMLImageElement
                  target.src = 'https://via.placeholder.com/40?text=Unknown'
                }}
              />
            </div>
            
            {/* Details */}
            <div className="flex-1 min-w-0">
              <div className="font-medium text-sm text-gray-900">{intruder.name}</div>
              <div className="text-xs text-gray-600">{intruder.location}</div>
            </div>
            
            {/* Timestamp */}
            <div className="text-xs text-gray-500 font-medium">{intruder.timestamp}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

