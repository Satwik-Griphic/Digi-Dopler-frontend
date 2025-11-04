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
      <div className="grid grid-cols-5 gap-5 p-5">
        <div className="col-span-1 flex flex-col gap-4">
          <div className="flex-1">
            <TempCard className="h-full" />
          </div>
          <div className="flex-1">
            <HumidityCard className="h-full" />
          </div>
          <div className="flex-1">
            <SensorsCard className="h-full" />
          </div>
        </div>

        <div className="col-span-3 flex flex-col gap-5">
          <div className="flex-1">
            <CurrentTempGraph className="h-full" />
          </div>
          <div className="flex-1">
            <CurrentHumidityGraph className="h-full" />
          </div>
        </div>

        <div className="col-span-1 flex flex-col gap-5">
          <div className="flex-[2]">
            <AlertsCard className="h-full" />
          </div>

          <div className="flex-[1] flex gap-4">
            <BackupAC className="h-full w-1/2" />
            <BackupHumidifier className="h-full w-1/2" />
          </div>
        </div>

      </div>
    </div>
  )
}


