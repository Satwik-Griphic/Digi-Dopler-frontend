import { NavLink, useLocation } from 'react-router-dom'

export default function Navbar() {
  const location = useLocation()
  const isDashboard = location.pathname === '/dashboard'
  const isAnalytics = location.pathname === '/analytics'
  // Camera Feed should only be active for /dashboard/detection, not /dashboard
  const isCamera = location.pathname === '/dashboard/detection'

  return (
    <nav className="w-full bg-gray-100 ">
      <div className="px-4 h-14 flex items-center justify-between w-full">
        <div className="font-semibold text-lg">Intruder Detection System</div>
        <div className="flex items-center gap-4 bg-white rounded-full px-2 py-2">
          <NavLink to="/dashboard" className={`px-3 py-1 rounded-full ${isDashboard ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-gray-100'}`}>Dashboard</NavLink>
          <NavLink to="/analytics" className={`px-3 py-1 rounded-full ${isAnalytics ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-gray-100'}`}>Analytics</NavLink>
          <NavLink to="/dashboard/detection" className={`px-3 py-1 rounded-full ${isCamera ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-gray-100'}`}>Camera Feed</NavLink>
        </div>
        <div />
      </div>
    </nav>
  )
}


