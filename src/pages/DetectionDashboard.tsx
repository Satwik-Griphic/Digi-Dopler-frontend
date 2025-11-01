import Navbar from '../components/Navbar'
import VideoStream from '../components/VideoStream'
import LiveStatus from '../components/LiveStatus'
import IntrudersList from '../components/IntrudersList'

export default function DetectionDashboard() {

  return (
    <div className="min-h-screen bg-gray-50 w-full">
      <Navbar />
      <div className="p-0 w-full">
        <div className="flex flex-col w-full">
          {/* Responsive flex: 2/3 stream, 1/3 sidebar */}
          <div className="flex flex-col lg:flex-row gap-6 w-full p-6">
            {/* Stream card with tabs and stream image */}
            <div className="w-full lg:w-2/3 min-w-0">
              <VideoStream />
            </div>
            
            {/* Sidebar cards - Live Status and Intruders List */}
            <div className="w-full lg:w-1/3 space-y-4">
              <LiveStatus />
              <IntrudersList />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}


