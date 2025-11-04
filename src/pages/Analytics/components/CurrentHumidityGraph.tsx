import React from 'react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Line,
} from 'recharts'
import { useAnalytics } from '../../../context/AnalyticsContext'

export default function CurrentTempGraph() {
  const { state } = useAnalytics()
  const { tempHistory, tempFuture } = state
  const threshold = 38

  const historyData = Array.isArray(tempHistory) ? tempHistory : []
  const futureTimestamps = Array.isArray(tempFuture?.timestamps) ? tempFuture.timestamps : []
  const upperBounds = Array.isArray(tempFuture?.upperBound) ? tempFuture.upperBound : []
  const lowerBounds = Array.isArray(tempFuture?.lowerBound) ? tempFuture.lowerBound : []

  // Find the last known historical temperature
  const lastTemp = historyData.length > 0 ? historyData[historyData.length - 1].temperature : null

  // Build chart data
  const chartData = [
    ...historyData.map((d) => ({
      time: new Date(d.datetime).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false, // 24-hour format
      }),
      current: d.temperature,
      upperBound: null,
      lowerBound: null,
    })),
    ...(futureTimestamps.length > 0
      ? [
          {
            // connect predicted series to last current point
            time: new Date(futureTimestamps[0]).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
              hour12: false,
            }),
            current: lastTemp,
            upperBound: null,
            lowerBound: null,
          },
        ]
      : []),
    ...futureTimestamps.map((t, i) => ({
      time: new Date(t).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      }),
      current: null,
      upperBound: upperBounds[i] ?? null,
      lowerBound: lowerBounds[i] ?? null,
    })),
  ]

  const renderLegend = () => (
    <div className="flex justify-center flex-wrap gap-4 text-xs text-gray-500 mt-3">
      <span className="flex items-center gap-1">
        <span className="w-3 h-3 bg-blue-300 rounded-sm"></span>Current
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

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
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

      <ResponsiveContainer width="100%" height={260}>
        <AreaChart data={chartData}>
          <defs>
            <linearGradient id="blueFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#60a5fa" stopOpacity={0.4} />
              <stop offset="100%" stopColor="#60a5fa" stopOpacity={0.05} />
            </linearGradient>
            <linearGradient id="redFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f87171" stopOpacity={0.4} />
              <stop offset="100%" stopColor="#f87171" stopOpacity={0.05} />
            </linearGradient>
            <linearGradient id="orangeFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#fb923c" stopOpacity={0.4} />
              <stop offset="100%" stopColor="#fb923c" stopOpacity={0.05} />
            </linearGradient>
          </defs>

          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
          <XAxis
            dataKey="time"
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 10 }}
            interval="preserveStartEnd"
          />
          <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 10 }} />
          <Tooltip />

          {/* Historical Temperature */}
          <Area
            type="monotone"
            dataKey="current"
            stroke="#3b82f6"
            fillOpacity={1}
            fill="url(#blueFill)"
            isAnimationActive={false}
            connectNulls
          />

          {/* Red Alert Zone */}
          <Area
            type="monotone"
            dataKey="current"
            stroke="#ef4444"
            fill="url(#redFill)"
            isAnimationActive={false}
            dot={false}
            connectNulls
            strokeOpacity={chartData.some((d) => d.current > threshold) ? 1 : 0}
          />

          {/* Prediction Bounds */}
          <Line
            type="monotone"
            dataKey="upperBound"
            stroke="#000000"
            dot={false}
            strokeWidth={1.5}
            connectNulls
          />
          <Line
            type="monotone"
            dataKey="lowerBound"
            stroke="#ec4899"
            dot={false}
            strokeWidth={1.5}
            connectNulls
          />
        </AreaChart>
      </ResponsiveContainer>

      {renderLegend()}
    </div>
  )
}
