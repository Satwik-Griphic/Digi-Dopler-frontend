import React, { useState, useEffect } from "react"
import currentPoint from "/public/currentPoint.svg";
import { ReferenceDot, ReferenceLine } from "recharts";



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
import { data } from "react-router-dom";

export default function CurrentTempGraph({ className = "" }) {
  const { state } = useAnalytics()
  const { tempHistory, tempFuture } = state
  const {  humidityHistory,   humidityFuture } = state
  console.log("tempHistory, tempFuture",tempHistory, tempFuture)
  console.log("humidityFuture,humidityHistory",humidityFuture,humidityHistory)


  const temperature = state.temperature?.toFixed?.(1) ?? '--'
  const humidity = state.humidity?.toFixed?.(1) ?? '--'


  // console.log("tempFuture,tempHistory", tempFuture, tempHistory)
  const threshold = 45

  const [zoomArea, setZoomArea] = useState<{ x1: number | null; x2: number | null }>({
    x1: null,
    x2: null,
  })
  const [isZooming, setIsZooming] = useState(false)
  const [filteredData, setFilteredData] = useState<any[]>([])
  const [isZoomed, setIsZoomed] = useState(false)

  // ----- Build chart data -----

  const historyData = Array.isArray(humidityHistory) ? humidityHistory : []
  const futureTimestamps = Array.isArray(humidityFuture?.timestamps)
    ? humidityFuture.timestamps
    : []
  const upperBounds = Array.isArray(humidityFuture?.humidiyUpperBound)
    ? humidityFuture.humidiyUpperBound
    : []
  const lowerBounds = Array.isArray(humidityFuture?.humidiyLowerBound)
    ? humidityFuture.humidiyLowerBound
    : []
    console.log("historyData,upperBounds,lowerBounds,futureTimestamps",historyData,upperBounds,lowerBounds,futureTimestamps)

  const lastTemp =
    historyData.length > 0
      ? historyData[historyData.length - 1].temperature
      : null

  const parseUTC = (utcStr: string) => {
    const d = new Date(utcStr);
    return Date.UTC(
      d.getUTCFullYear(),
      d.getUTCMonth(),
      d.getUTCDate(),
      d.getUTCHours(),
      d.getUTCMinutes(),
      d.getUTCSeconds()
    );
  };

  const fullData = [
    // --- History Data ---
    ...historyData.map((d) => ({
      time: parseUTC(d.datetime),
      current: d.humidity,
      upperBound: null,
      lowerBound: null,
      type: "history",
    })),

    // --- Future (Predicted) Data ---
    ...futureTimestamps.map((t, i) => ({
      time: parseUTC(t),
      current: null,
      upperBound: upperBounds[i] ?? null,
      lowerBound: lowerBounds[i] ?? null,
      type: "future",
    })),
  ];
  console.log("full Data:", fullData)

  const dataToRender = isZoomed ? filteredData : fullData
  // console.log("data to render:", dataToRender)

  // ----- Helpers -----
  const formatXAxisLocal = (ts: number) => {
    const d = new Date(ts);
  return d.toISOString().substring(11, 16); 
  };
  //x-axis lables calculation
  const startTime = historyData.length > 0 ? parseUTC(historyData[0].datetime) : fullData[0]?.time ?? Date.now();
  const endTime = futureTimestamps.length > 0
      ? parseUTC(futureTimestamps[futureTimestamps.length - 1])
      : fullData[fullData.length - 1]?.time ?? Date.now();
  const [xDomain, setXDomain] = useState<[number, number]>([startTime, endTime]);


  const THREE_HOURS_MS = 3 * 60 * 60 * 1000;
  const ticks: number[] = [];
  // align first tick to the nearest 3-hour boundary if you like, or start at startTime:
  for (let t = startTime; t <= endTime; t += THREE_HOURS_MS) {
    ticks.push(t);
  }
  if (ticks[ticks.length - 1] < endTime) ticks.push(endTime);
  


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
    ...historyData.map((d) => d.humidity),
    ...upperBounds,
    ...lowerBounds,
  ].filter((v) => v != null);

  const globalMin = Math.min(...allTemps);
  const globalMax = Math.max(...allTemps);
  const defaultYDomain: [number, number] = [30,70];

  // state for current y-axis
  const [yDomain, setYDomain] = useState<[number, number]>(defaultYDomain);

  useEffect(() => {
    if (allTemps.length > 0) {
      const newMin = Math.min(...allTemps);
      const newMax = Math.max(...allTemps);
      setYDomain([newMin - 1, newMax + 1]);
    }
  }, [humidityHistory, humidityFuture]);

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
      setXDomain([min, max]);

    }

    setZoomArea({ x1: null, x2: null })
  }

  const handleZoomOut = () => {
    setIsZoomed(false)
    setFilteredData([])
    setYDomain(defaultYDomain) // reset
    setXDomain([startTime, endTime]); // reset X domain too

  }

  const showZoomBox =
    isZooming && zoomArea.x1 && zoomArea.x2 && Math.abs(zoomArea.x1 - zoomArea.x2) > 0

  const renderLegend = () => (
    <div className="flex justify-center flex-wrap gap-4 text-xs text-gray-500 mt-3">
      <span className="flex items-center gap-1">
        <span className="w-3 h-3 bg-green-300 rounded-sm"></span>Current
      </span>
      <span className="flex items-center gap-1">
        <span className="w-3 h-3 bg-red-300 rounded-sm"></span>Red Alert
      </span>
      <span className="flex items-center gap-1">
        <span className="w-3 h-3 bg-orange-300 rounded-sm"></span>Orange Alert
      </span>
      <span className="flex items-center gap-1">
        <span className="w-3 h-3 bg-pink-300 rounded-sm"></span>Predicted (Backup AC On)
      </span>
      <span className="flex items-center gap-1">
        <span className="w-3 h-3 bg-black rounded-sm"></span>Predicted (Backup AC Off)
      </span>
    </div>
  )
  
  // Filter future points where upperBound > threshold and clip to start from threshold
const thresholdhumidity = 50;
const futureAboveThreshold = dataToRender
  .filter((d) => d.type === "future" && d.upperBound > thresholdhumidity)
  .map((d) => ({
    ...d,
    shadedUpper: d.upperBound,
    shadedBase: thresholdhumidity,
  }));


  // ----- Render -----
  return (
    <div
      className={`bg-white shadow rounded-2xl p-4 h-full flex flex-col justify-between ${className || ""}`}
    >
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-sm font-medium text-gray-800">{`${humidity}%  Humidity`}</h2>
        <div className="flex gap-2">
          {/* <div className="w-6 h-6 bg-red-100 rounded flex items-center justify-center text-red-500 text-xs font-bold">
            !
          </div> */}
          <div className="w-6 h-6 bg-orange-100 rounded flex items-center justify-center text-orange-500 text-xs font-bold">
          <img src={"/orange-warning.svg"} alt={"logo"} className="w-4 h-auto object-contain" />

          </div>
          {isZoomed && (
            <button
              onClick={handleZoomOut}
              className="self-end mb-2 text-xs px-2 py-1 bg-gray-200 hover:bg-gray-300 rounded"
            >
              Zoom Out
            </button>
          )}

        </div>
      </div>

      <ResponsiveContainer width="100%" height={300}>
  <AreaChart
    data={dataToRender}
    onMouseDown={handleMouseDown}
    onMouseMove={handleMouseMove}
    onMouseUp={handleMouseUp}
    margin={{ top: 10, right: 20, left: 20, bottom: 0 }}
  >
    <defs>
      <linearGradient id="greenfill" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#14A63B" stopOpacity={0.4} />
        <stop offset="100%" stopColor="#14A63B" stopOpacity={0.05} />
      </linearGradient>
      <linearGradient id="orangeFill" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#fbbf24" stopOpacity={0.4} />
        <stop offset="100%" stopColor="#fbbf24" stopOpacity={0.05} />
      </linearGradient>
    </defs>

    <CartesianGrid stroke="#e5e7eb" strokeOpacity={0.3} vertical={false} />

    <XAxis
      dataKey="time"
      type="number"
      scale="time"
      domain={[
        startTime - 5 * 60 * 1000, // small left margin (5 min)
        endTime + 5 * 60 * 1000,   // small right margin (5 min)
      ]}
      tickFormatter={(v) => formatXAxisLocal(v)}
      tick={{ fontSize: 9, dy:15 }}
      ticks={ticks}
      axisLine={false}
    />
    <YAxis
      tick={{ fontSize: 10, dx: -30 }}
      domain={[
        Math.floor(yDomain[0]),
        Math.ceil(yDomain[1]),
      ]}
      axisLine={false}
      tickLine={{ strokeOpacity: 0.3 }}
    />

    <Tooltip content={<CustomTooltip />} />

    {/* Threshold Lines */}
    <ReferenceLine y={50} stroke="#9ca3af" strokeDasharray="5 5" />
    <ReferenceLine y={33} stroke="#9ca3af" strokeDasharray="5 5" />

{/* Orange Area for Future above threshold (only above 50) */}
<Area
  type="monotone"
  data={futureAboveThreshold}
  dataKey="shadedUpper"
  stroke="none"
  fill="#FFA05B"
  fillOpacity={0.4}
  baseValue={50} // dynamically start from threshold
  isAnimationActive={false}
/>



    {/* Normal Current Area */}
    <Area
      type="monotone"
      dataKey="current"
      stroke="#14A63B"
      fill="url(#greenfill)"
      isAnimationActive={false}
      connectNulls
    />

    {/* Prediction Lines */}
    <Line
      type="monotone"
      dataKey="upperBound"
      stroke="#000"
      dot={false}
      strokeWidth={1}
      connectNulls
    />
    <Line
      type="monotone"
      dataKey="lowerBound"
      stroke="#ec4899"
      dot={false}
      strokeWidth={1}
      connectNulls
    />

    {/* Zoom Selection Area */}
    {showZoomBox && (
      <ReferenceArea
        x1={Math.min(zoomArea.x1!, zoomArea.x2!)}
        x2={Math.max(zoomArea.x1!, zoomArea.x2!)}
        y1={yDomain[0]}
        y2={yDomain[1]}
        fill="#60a5fa"
        fillOpacity={0.15}
        stroke="#2563eb"
        strokeOpacity={0.3}
      />
    )}

    {/* Red Dot for Current Point */}
    {lastTemp && (
      <ReferenceDot
        x={Date.parse(futureTimestamps[0])}
        y={lastTemp}
        r={4}
        fill="#FF5B5D"
        stroke="white"
      />
    )}
  </AreaChart>
</ResponsiveContainer>


      {renderLegend()}
    </div>
  )
}
