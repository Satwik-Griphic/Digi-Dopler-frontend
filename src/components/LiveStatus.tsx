import { useStreamAnalytics } from '../context/StreamAnalyticsContext'

export default function LiveStatus() {
  const { state } = useStreamAnalytics()
  
  // Calculate intruders (unknown) from state
  const intruders = state.unknown
  const known = state.verified
  const total = state.totalEvents
  
  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div className="flex flex-row sm:flex-row sm:items-center sm:justify-between mb-1">
        <h2 className="font-semibold text-gray-900">Live status</h2>
        <p className="text-sm text-gray-500 mt-1 sm:mt-0">Detected in the last 5 mins</p>
      </div>
      
      {/* Summary Statistics */}
      <div className="grid grid-cols-3 gap-3 mb-4 bg-gray-100 rounded-lg p-4 mt-2">
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" />
            </svg>
          <div className="text-md font-semibold text-gray-500">Total</div>
          </div>
          <div className="text-2xl font-bold text-gray-900">{total}</div>
        </div>
        
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <svg className="w-4 h-4 text-red-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          <div className="text-md font-semibold text-gray-500">Intruders</div>
          </div>
          <div className="text-2xl font-bold text-red-600">{intruders}</div>
        </div>
        
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          <div className="text-md font-semibold text-gray-500">Known</div>
          </div>
          <div className="text-2xl font-bold text-green-600">{known}</div>
        </div>
      </div>
      
      {/* Alert Banner */}
      {intruders > 0 && (
        <div className="bg-red-600 text-white rounded-lg p-3 flex items-center gap-2">
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <span className="font-semibold">{intruders} Intruder{intruders > 1 ? 's' : ''} Detected</span>
        </div>
      )}
    </div>
  )
}

