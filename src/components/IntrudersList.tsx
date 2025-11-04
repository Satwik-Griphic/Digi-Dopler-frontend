import { useStreamAnalytics } from '../context/StreamAnalyticsContext'

// type IntruderEntry = {
//   id: string
//   image: string
//   name: string
//   location: string
//   timestamp: string
// }

export default function IntrudersList() {
  const { state } = useStreamAnalytics()
  
  const intruders = state.intruderHistory.map((entry, i) => ({
    id: `intruder-${i}`,
    image: entry.snap || 'https://via.placeholder.com/40?text=No+Snap',
    name: entry.name,
    location: 'Server Room', // can adjust later if backend sends this
    timestamp: entry.timestamp,
  }))
  console.log("after adding intruder image",intruders)

  if (intruders.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-4">
        <h2 className="font-semibold text-gray-900 mb-4">Recent Intruders</h2>
        <p className="text-sm text-gray-500 text-center py-4">No intruders detected</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow p-4 h-auto">
      <h2 className="font-semibold text-gray-900 mb-4">Recent Intruders</h2>
      <div className="space-y-3 h-auto overflow-y-auto">
        {intruders.map((intruder) => (
          <div
            key={intruder.id}
            className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded transition-colors border-b border-gray-100 last:border-b-0"
          >
            <div className="relative flex-shrink-0">
              <img
                src={`data:image/jpeg;base64,${intruder.image}`}
                alt={intruder.name}
                className="w-16 h-10 rounded-sm object-cover"
                onError={(e) => {
                  console.log("error occuring for adding snap shot", e)
                  console.log("intruder image received:", intruder.image)
                  const target = e.target as HTMLImageElement
                  target.src = 'https://via.placeholder.com/40?text=No+Snap'
                }}
              />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-medium text-sm text-gray-900">{intruder.name}</div>
              <div className="text-xs text-gray-600">{intruder.location}</div>
            </div>
            <div className="text-xs text-gray-500 font-medium">{intruder.timestamp}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

