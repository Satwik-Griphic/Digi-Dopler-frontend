import React, { useState, useEffect } from "react"
import currentPoint from "/public/currentPoint.svg";
import { ReferenceDot } from "recharts";



import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Line,
  ReferenceArea,
} from "recharts"
import { useAnalytics } from "../../../context/AnalyticsContext"

export default function CurrentTempGraph({className=""}) {
  const { state } = useAnalytics()
  const { tempHistory, tempFuture } = state
  const threshold = 32

  const [zoomArea, setZoomArea] = useState<{ x1: number | null; x2: number | null }>({
    x1: null,
    x2: null,
  })
  const [isZooming, setIsZooming] = useState(false)
  const [filteredData, setFilteredData] = useState<any[]>([])
  const [isZoomed, setIsZoomed] = useState(false)

  // ----- Build chart data -----
  const historyData = Array.isArray(tempHistory) ? tempHistory : []
  const futureTimestamps = Array.isArray(tempFuture?.timestamps)
    ? tempFuture.timestamps
    : []
  const upperBounds = Array.isArray(tempFuture?.upperBound)
    ? tempFuture.upperBound
    : []
  const lowerBounds = Array.isArray(tempFuture?.lowerBound)
    ? tempFuture.lowerBound
    : []

  const lastTemp =
    historyData.length > 0
      ? historyData[historyData.length - 1].temperature
      : null

  const fullData = [
    ...historyData.map((d) => ({
      time: new Date(d.datetime).getTime(),
      current: d.temperature,
      upperBound: null,
      lowerBound: null,
      type: "history",
    })),
    ...(futureTimestamps.length > 0
      ? [
          {
            time: new Date(futureTimestamps[0]).getTime(),
            current: lastTemp,
            upperBound: null,
            lowerBound: null,
            type: "connector",
          },
        ]
      : []),
    ...futureTimestamps.map((t, i) => ({
      time: new Date(t).getTime(),
      current: null,
      upperBound: upperBounds[i] ?? null,
      lowerBound: lowerBounds[i] ?? null,
      type: "future",
    })),
  ]

  const dataToRender = isZoomed ? filteredData : fullData

  // ----- Helpers -----
  const formatXAxis = (ts: number) => {
    const d = new Date(ts)
    const h = d.getHours().toString().padStart(2, "0")
    const m = d.getMinutes().toString().padStart(2, "0")
    return `${h}:${m}`
  }

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const p = payload[0].payload
      const time = new Date(p.time).toLocaleString("en-IN", {
        hour12: false,
        hour: "2-digit",
        minute: "2-digit",
      })
      if (p.type === "history") {
        return (
          <div className="bg-white p-2 border border-gray-300 rounded text-xs shadow">
            <p>{`Time: ${time}`}</p>
            <p>{`Actual Temp: ${p.current?.toFixed(1)}°C`}</p>
          </div>
        )
      }
      if (p.type === "future") {
        return (
          <div className="bg-white p-2 border border-gray-300 rounded text-xs shadow">
            <p>{`Time: ${time}`}</p>
            <p>{`Upper: ${p.upperBound?.toFixed(1)}°C`}</p>
            <p>{`Lower: ${p.lowerBound?.toFixed(1)}°C`}</p>
          </div>
        )
      }
    }
    return null
  }

  // --- Compute dynamic Y range ---
  const allTemps = [
    ...historyData.map((d) => d.temperature),
    ...upperBounds,
    ...lowerBounds,
  ].filter((v) => v != null);

  const globalMin = Math.min(...allTemps);
  const globalMax = Math.max(...allTemps);
  const defaultYDomain: [number, number] = [globalMin - 1, globalMax + 1];

  // state for current y-axis
  const [yDomain, setYDomain] = useState<[number, number]>(defaultYDomain);

  useEffect(() => {
    if (allTemps.length > 0) {
      const newMin = Math.min(...allTemps);
      const newMax = Math.max(...allTemps);
      setYDomain([newMin - 1, newMax + 1]);
    }
  }, [tempHistory, tempFuture]);

  // ----- Zoom logic -----

const handleMouseDown = (e: any) => {
  if (e && e.activeLabel) {
    setIsZooming(true)
    setZoomArea({ x1: e.activeLabel, x2: e.activeLabel })
  }
}

const handleMouseMove = (e: any) => {
  if (isZooming && e && e.activeLabel) {
    setZoomArea((prev) => ({ ...prev, x2: e.activeLabel }))
  }
}

const handleMouseUp = () => {
  if (!isZooming) return
  setIsZooming(false)

  const { x1, x2 } = zoomArea
  if (x1 == null || x2 == null) return

  const [min, max] = x1 < x2 ? [x1, x2] : [x2, x1]
  const zoomed = fullData.filter((d) => d.time >= min && d.time <= max)

  if (zoomed.length > 2) {
    setFilteredData(zoomed)
    setIsZoomed(true)

    // dynamically compute new Y range based on zoomed data
    const temps = zoomed
      .map((d) => d.current ?? d.upperBound ?? d.lowerBound)
      .filter((v) => v != null)
    const yMin = Math.min(...temps)
    const yMax = Math.max(...temps)
    setYDomain([yMin - 1, yMax + 1])
  }

  setZoomArea({ x1: null, x2: null })
}

const handleZoomOut = () => {
  setIsZoomed(false)
  setFilteredData([])
  setYDomain(defaultYDomain) // reset
}

const showZoomBox =
  isZooming && zoomArea.x1 && zoomArea.x2 && Math.abs(zoomArea.x1 - zoomArea.x2) > 0


  // ----- Render -----
  return (
    <div 
    className={`bg-white shadow rounded-2xl p-4 h-full flex flex-col justify-between ${className || ""}`}
    >
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-sm font-medium text-gray-800">23°C Current Temperature</h2>
        <div className="flex gap-2">
          <div className="w-6 h-6 bg-red-100 rounded flex items-center justify-center text-red-500 text-xs font-bold">
            !
          </div>
          <div className="w-6 h-6 bg-orange-100 rounded flex items-center justify-center text-orange-500 text-xs font-bold">
            !
          </div>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <AreaChart
          data={dataToRender}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
        >
          <defs>
            <linearGradient id="blueFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#60a5fa" stopOpacity={0.4} />
              <stop offset="100%" stopColor="#60a5fa" stopOpacity={0.05} />
            </linearGradient>
          </defs>

          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
          <XAxis
            dataKey="time"
            type="number"
            scale="time"
            domain={["auto", "auto"]}
            tickFormatter={(v) => formatXAxis(v)}
            tick={{ fontSize: 9 }}
            ticks={dataToRender.filter((_, i) => i % 90 === 0).map((d) => d.time)}
          />
          <YAxis tick={{ fontSize: 10 }} domain={yDomain} />

          <Tooltip content={<CustomTooltip />} />

          <Area
            type="monotone"
            dataKey="current"
            stroke="#3b82f6"
            fill="url(#blueFill)"
            isAnimationActive={false}
            connectNulls
          />
          <Line
            type="monotone"
            dataKey="upperBound"
            stroke="#000"
            dot={false}
            strokeWidth={1.2}
            connectNulls
          />
          <Line
            type="monotone"
            dataKey="lowerBound"
            stroke="#ec4899"
            dot={false}
            strokeWidth={1.2}
            connectNulls
          />

          {showZoomBox && (
            <ReferenceArea
              x1={Math.min(zoomArea.x1!, zoomArea.x2!)}
              x2={Math.max(zoomArea.x1!, zoomArea.x2!)}
              y1={yDomain[0]}
              y2={yDomain[1]}
              fill="#60a5fa"
              fillOpacity={0.2}
              stroke="#2563eb"
              strokeOpacity={0.3}
            />
          )}
          {lastTemp && (
          <ReferenceDot
            x={new Date(futureTimestamps[0]).getTime()}
            y={lastTemp}
            r={4}
            fill="#FF5B5D"
            stroke="white"
          />
        )}
          
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
