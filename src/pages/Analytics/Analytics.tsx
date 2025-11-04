import Navbar from '../../components/Navbar'
import TempCard from './components/TempCard'
import HumidityCard from './components/HumidityCard'
import SensorsCard from './components/SensorsCard'
import CurrentTempGraph from './components/CurrentTempGraph'
import CurrentHumidityGraph from './components/CurrentHumidityGraph'
import AlertsCard from './components/AlertsCard'
import BackupAC from './components/BackupAC'
import BackupHumidifier from './components/BackupHumidifier'

export default function Analytics() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="grid grid-cols-4 gap-4 p-4">
      {/* Left column */}
      <div className="col-span-1 space-y-4 flex flex-col items-end">
        <TempCard />
        <HumidityCard />
        <SensorsCard />
      </div>

      {/* Middle column */}
      <div className="col-span-2 space-y-4">
        <CurrentTempGraph />
        <CurrentHumidityGraph />
      </div>

      {/* Right column */}
      <div className="col-span-1">
        <AlertsCard />
        <div className="flex gap-6 mt-4">
          <BackupAC />
          <BackupHumidifier />
        </div>
      </div>
    </div>
    </div>
  )
}


