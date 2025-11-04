import React, { createContext, useContext, useEffect, useReducer, useRef } from 'react'
import { useConfig } from './ConfigContext'


type MetricState = {
  temperature: number
  humidity: number
  sensors: { total: number; online: number; offline: number }
  tempHistory: any[]
  tempFuture: { upperBound: [], lowerBound: [], predicted: [], timestamps: [] },
  humidityHistory: any[]
  humidityFuture: { upperBound: [], lowerBound: [], predicted: [], timestamps: [] },
  alerts: {
    id: string
    type: 'temperature' | 'humidity' | 'sensor'
    message: string
    color: 'red' | 'yellow' | 'normal'
    timestamp: string
  }[]
}

type Action =
  | { type: 'updateMetrics'; payload: Pick<MetricState, 'temperature' | 'humidity' | 'sensors'> }
  | { type: 'updateTempGraph'; payload: Pick<MetricState, 'tempHistory' | 'tempFuture'> }
  | { type: 'updateHumidityGraph'; payload: Pick<MetricState, 'humidityHistory' | 'humidityFuture'> }
  | { type: 'updateAlerts'; payload: MetricState['alerts'] }


const AnalyticsContext = createContext<{
  state: MetricState
  fetchMetrics: () => void
} | null>(null)

const initialState: MetricState = {
    temperature: 0,
    humidity: 0,
    sensors: { total: 0, online: 0, offline: 0 },
    tempHistory: [],
    tempFuture: { upperBound: [], lowerBound: [], predicted: [], timestamps: []},
    humidityHistory: [],
    humidityFuture: { upperBound: [], lowerBound: [], predicted: [], timestamps: []},
    alerts: [],
  }
  

  function reducer(state: MetricState, action: Action): MetricState {
    switch (action.type) {
      case 'updateMetrics':
        return { ...state, ...action.payload }
  
      case 'updateTempGraph':
        return {
          ...state,
          tempHistory: action.payload.tempHistory,
          tempFuture: action.payload.tempFuture,
        }
  
      case 'updateHumidityGraph':
        return {
          ...state,
          humidityHistory: action.payload.humidityHistory,
          humidityFuture: action.payload.humidityFuture,
        }
  
      case 'updateAlerts':
        return { ...state, alerts: action.payload }
  
      default:
        return state
    }
  }

  export const AnalyticsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { config, loading } = useConfig()
    const [state, dispatch] = useReducer(reducer, initialState)
    const pollingStarted = useRef(false)


        // --- shared alert builder ---
    const buildAlerts = (
        metrics: { temperature?: number; humidity?: number; sensors?: { total: number; online: number; offline: number } },
        config: any
    ) => {
        const alerts: any[] = []
        const now = new Date().toLocaleTimeString()
    
        const { temperature = 0, humidity = 0, sensors } = metrics
    
        // Temperature
        if (temperature > (config.analytics.temperatureThreshold ?? 0)) {
        alerts.push({
            id: `temperature-${Date.now()}`,
            type: 'temperature',
            message: `Temperature crossed ${config.analytics.temperatureThreshold}°C (Current: ${temperature}°C)`,
            color: 'red',
            timestamp: now,
        })
        }
    
        // Humidity
        if (humidity > (config.analytics.humidityThreshold ?? 0)) {
        alerts.push({
            id: `humidity-${Date.now()}`,
            type: 'humidity',
            message: `Humidity crossed ${config.analytics.humidityThreshold}% (Current: ${humidity}%)`,
            color: 'red',
            timestamp: now,
        })
        }
    
        // Sensors
        if (sensors && sensors.offline > 0) {
        alerts.push({
            id: `sensor-${Date.now()}`,
            type: 'sensor',
            message: `${sensors.offline} sensor${sensors.offline>1?'s':''} offline`,
            color: 'red',
            timestamp: now,
        })
        }
    
        return alerts
    }
  

    const fetchEnvMetrics = async () => {
        if (!config?.analytics?.apiBaseUrl) return
        try {
          const res = await fetch(config.analytics.apiBaseUrl + config.analytics.endpoints?.currentTempHumid)
          if (!res.ok) throw new Error(String(res.status))
          const result = await res.json()
    
          if (!result?.success || !result?.data) {
            throw new Error('Invalid response structure for environment metrics')
          }
      
          const tempObj = result.data.temperature
          const humidObj = result.data.humidity
      
          // Extract values safely
          const temperature = Number(tempObj?.data?.celsius ?? tempObj?.value ?? 0)
          const humidity = Number(humidObj?.data?.relativePercentage ?? humidObj?.value ?? 0)

          console.log("temp and humidity fetched:", temperature, " ---", humidity)
      
    
          dispatch({ type: 'updateMetrics', payload: { temperature, humidity  } })
          const metrics = { temperature, humidity, sensors: state.sensors }
          const alerts = buildAlerts(metrics, config)
          dispatch({ type: 'updateAlerts', payload: alerts })

        } catch (err) {
          console.error('Failed to fetch temperature/humidity:', err)
        }
      }
    
    // --- 🔹 Fetch Sensor Details ---
    const fetchSensorStatus = async () => {
    if (!config?.analytics?.apiBaseUrl || !config.analytics.endpoints?.currentSensors) return
    
    try {
        const res = await fetch(config.analytics.apiBaseUrl + config.analytics.endpoints.currentSensors)
        if (!res.ok) throw new Error(String(res.status))
        const result = await res.json()
    
        if (!result?.success || !Array.isArray(result.data)) {
        throw new Error('Invalid sensor response structure')
        }
    
        const sensorsList = result.data
        const total = sensorsList.length
        const online = sensorsList.filter((s: any) => s.isActive).length
        const offline = total - online
        
        const sensors = { total, online, offline }
        dispatch({ type: 'updateMetrics', payload: { sensors } })

        const metrics = { temperature: state.temperature, humidity: state.humidity, sensors }
        const alerts = buildAlerts(metrics, config)
        dispatch({ type: 'updateAlerts', payload: alerts })
    
    } catch (err) {
        console.error('Failed to fetch sensor data:', err)
    }
    }
      
    // --- 🔹 Fetch Temperature Graph Data (Past 12hr + Predicted Next 12hr) ---
    const fetchTemperatureGraphData = async () => {
        if (!config?.analytics?.apiBaseUrl) return;
      
        try {
          const dbBaseUrl = config.analytics.apiBaseUrl;
          const aiBaseUrl = config.analytics.aiBaseUrl;
          const dbEndpoint =
            config.analytics.endpoints?.previousTemp ||
            "/api/sensor-dashboard/temperature-record";
          const aiEndpoint = "/v1/predict/";
      
          // --- 1️⃣ Build UTC time ranges ---
          const now = new Date();
          const fromUTC = new Date(now.getTime() - 12 * 60 * 60 * 1000); // 12 hours ago
          const toUTC = now;
      
          // Format for DB backend: "2025-11-03T22:30:00.0000Z"
          const formatDBTime = (date: Date) =>
            date.toISOString().slice(0, 23) + "Z"; // Keep Z for UTC
      
          const from = formatDBTime(fromUTC);
          const to = formatDBTime(toUTC);
      
          // --- 2️⃣ DB backend call (historical) ---
          const url = `${dbBaseUrl}${dbEndpoint}?from_date=${encodeURIComponent(
            from
          )}&to_date=${encodeURIComponent(to)}`;
      
          const dbRes = await fetch(url, {
            method: "GET",
            headers: { Accept: "application/json" },
            cache: "no-store",
          });
      
          if (!dbRes.ok) throw new Error(`DB backend error: ${dbRes.status}`);
          const dbData = await dbRes.json();
          console.log("Actual DB data (past 12h UTC):", dbData);

      
          // Convert UTC → IST for display
          const toIST = (utcDateStr: string) => {
            const utc = new Date(utcDateStr);
            return new Date(utc.getTime() + 5.5 * 60 * 60 * 1000); // add 5h30m
          };
      
          const history = Array.isArray(dbData?.data?.actual)
            ? dbData.data.actual.map((d: any) => ({
                datetime: toIST(d.createdAt).toISOString(), // convert to IST for chart
                temperature:
                  d.temperature !== undefined && d.temperature !== null
                    ? Number(d.temperature)
                    : null,
              }))
            : [];
          console.log("📦 DB data (past 12h UTC):", history);

      
          // --- 3️⃣ AI backend call (predicted future, UTC timestamps) ---
          const timestamps: string[] = [];
          const start = new Date(now.getTime() + 2 * 60 * 1000); // current time + 2min
      
          for (let i = 0; i < 12 * 60; i += 2) {
            const utcTime = new Date(start.getTime() + i * 60 * 1000);
            const formatted =
              utcTime.getUTCFullYear() +
              "-" +
              String(utcTime.getUTCMonth() + 1).padStart(2, "0") +
              "-" +
              String(utcTime.getUTCDate()).padStart(2, "0") +
              " " +
              String(utcTime.getUTCHours()).padStart(2, "0") +
              ":" +
              String(utcTime.getUTCMinutes()).padStart(2, "0") +
              ":" +
              String(utcTime.getUTCSeconds()).padStart(2, "0");
            timestamps.push(formatted);
          }
      
          console.log("🕒 Payload timestamps (to AI backend, UTC):", timestamps);
      
          const aiRes = await fetch(`${aiBaseUrl}${aiEndpoint}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ timestamps }),
          });
          
          if (!aiRes.ok) throw new Error(`AI backend error: ${aiRes.status}`);
          const aiData = await aiRes.json();
          console.log("📦 AI predicted data (UTC):", aiData);
          
          // Helper function to safely round numbers
          const roundTo1 = (arr: number[] | undefined) =>
            Array.isArray(arr) ? arr.map((v) => Number(v?.toFixed(1))) : [];
          
          // Convert predicted timestamps (UTC) → IST for graph display
          const future = {
            upperBound: roundTo1(aiData?.predicted_temperature),
            lowerBound: roundTo1(aiData?.predicted_temperature_lower_bound),
            predicted: roundTo1(aiData?.predicted_temperature),
            timestamps: timestamps.map((utc) => {
              const d = new Date(utc.replace(" ", "T") + "Z");
              return new Date(d.getTime() + 5.5 * 60 * 60 * 1000).toISOString();
            }),
          };
          
      
          // --- 4️⃣ Dispatch updates ---
          dispatch({
            type: "updateTempGraph",
            payload: { tempHistory: history, tempFuture: future },
          });
      
          console.log("✅ Temperature graph updated:", {
            historyCount: history,
            futurePoints: future,
          });
        } catch (err) {
          console.error("❌ Failed to fetch temperature graph data:", err);
        }
      };
      
  

    // --- 🔁 Polling every 2 minutes ---
    useEffect(() => {
        if (loading || !config?.analytics || pollingStarted.current) return
        pollingStarted.current = true
      
        // Initial fetch
        fetchEnvMetrics()
        fetchSensorStatus()
        fetchTemperatureGraphData()
      
        // Schedule every 2 min
        const pollMs = config.analytics.pollMs || 120000
        const intervalEnv = setInterval(fetchEnvMetrics, pollMs)
        const intervalSensors = setInterval(fetchSensorStatus, pollMs)
        const intervalTempGraph = setInterval(fetchTemperatureGraphData, pollMs)
      
        return () => {
          clearInterval(intervalEnv)
          clearInterval(intervalSensors)
          clearInterval(intervalTempGraph)
          pollingStarted.current = false
        }
      }, [config?.analytics?.apiBaseUrl])

      useEffect(() => {
        if (!config?.analytics) return;
      
        // build alerts based on the latest state (all metrics available)
        const alerts = buildAlerts(
          {
            temperature: state.temperature,
            humidity: state.humidity,
            sensors: state.sensors,
          },
          config
        );
      
        dispatch({ type: "updateAlerts", payload: alerts });
      }, [
        state.temperature,
        state.humidity,
        state.sensors,
        config?.analytics?.temperatureThreshold,
        config?.analytics?.humidityThreshold,
      ]);
      
    
    return (
    <AnalyticsContext.Provider value={{ state, fetchEnvMetrics }}>
        {children}
    </AnalyticsContext.Provider>
    )
  }
    
    export const useAnalytics = () => {
      const ctx = useContext(AnalyticsContext)
      if (!ctx) throw new Error('useAnalytics must be used within AnalyticsProvider')
      return ctx
    }
  
  const exampleTempResp={
    "success": true,
    "message": "Temperature records retrieved successfully",
    "data": {
        "actual": [
            {
                "datetime": "2025-11-02T18:30:00.000Z",
                "temperature": "23.28"
            },
            {
                "datetime": "2025-11-02T19:30:00.000Z",
                "temperature": "23.28"
            },
            {
                "datetime": "2025-11-02T20:30:00.000Z",
                "temperature": "23.28"
            },
            {
                "datetime": "2025-11-02T21:30:00.000Z",
                "temperature": "23.28"
            },
            {
                "datetime": "2025-11-02T22:30:00.000Z",
                "temperature": "23.28"
            },
            {
                "datetime": "2025-11-02T23:30:00.000Z",
                "temperature": "23.28"
            },
            {
                "datetime": "2025-11-03T00:30:00.000Z",
                "temperature": "23.28"
            },
            {
                "datetime": "2025-11-03T01:30:00.000Z",
                "temperature": "23.28"
            },
            {
                "datetime": "2025-11-03T02:30:00.000Z",
                "temperature": "23.28"
            },
            {
                "datetime": "2025-11-03T03:30:00.000Z",
                "temperature": "23.28"
            },
            {
                "datetime": "2025-11-03T04:30:00.000Z",
                "temperature": null
            },
            {
                "datetime": "2025-11-03T05:30:00.000Z",
                "temperature": "23.56"
            },
            {
                "datetime": "2025-11-03T06:30:00.000Z",
                "temperature": "23.56"
            },
            {
                "datetime": "2025-11-03T07:30:00.000Z",
                "temperature": "23.56"
            },
            {
                "datetime": "2025-11-03T08:30:00.000Z",
                "temperature": "23.56"
            },
            {
                "datetime": "2025-11-03T09:30:00.000Z",
                "temperature": "23.56"
            },
            {
                "datetime": "2025-11-03T10:30:00.000Z",
                "temperature": "23.56"
            },
            {
                "datetime": "2025-11-03T11:30:00.000Z",
                "temperature": "23.56"
            },
            {
                "datetime": "2025-11-03T12:30:00.000Z",
                "temperature": "23.56"
            },
            {
                "datetime": "2025-11-03T13:30:00.000Z",
                "temperature": "23.56"
            },
            {
                "datetime": "2025-11-03T14:30:00.000Z",
                "temperature": "23.56"
            },
            {
                "datetime": "2025-11-03T15:30:00.000Z",
                "temperature": "23.56"
            },
            {
                "datetime": "2025-11-03T16:30:00.000Z",
                "temperature": "23.56"
            },
            {
                "datetime": "2025-11-03T17:30:00.000Z",
                "temperature": "23.56"
            }
        ],
        "predicted": [
            {
                "datetime": "2025-11-02T18:30:00.000Z",
                "temperature": null
            },
            {
                "datetime": "2025-11-02T19:30:00.000Z",
                "temperature": null
            },
            {
                "datetime": "2025-11-02T20:30:00.000Z",
                "temperature": null
            },
            {
                "datetime": "2025-11-02T21:30:00.000Z",
                "temperature": null
            },
            {
                "datetime": "2025-11-02T22:30:00.000Z",
                "temperature": null
            },
            {
                "datetime": "2025-11-02T23:30:00.000Z",
                "temperature": null
            },
            {
                "datetime": "2025-11-03T00:30:00.000Z",
                "temperature": null
            },
            {
                "datetime": "2025-11-03T01:30:00.000Z",
                "temperature": null
            },
            {
                "datetime": "2025-11-03T02:30:00.000Z",
                "temperature": null
            },
            {
                "datetime": "2025-11-03T03:30:00.000Z",
                "temperature": null
            },
            {
                "datetime": "2025-11-03T04:30:00.000Z",
                "temperature": null
            },
            {
                "datetime": "2025-11-03T05:30:00.000Z",
                "temperature": null
            },
            {
                "datetime": "2025-11-03T06:30:00.000Z",
                "temperature": null
            },
            {
                "datetime": "2025-11-03T07:30:00.000Z",
                "temperature": null
            },
            {
                "datetime": "2025-11-03T08:30:00.000Z",
                "temperature": null
            },
            {
                "datetime": "2025-11-03T09:30:00.000Z",
                "temperature": null
            },
            {
                "datetime": "2025-11-03T10:30:00.000Z",
                "temperature": null
            },
            {
                "datetime": "2025-11-03T11:30:00.000Z",
                "temperature": null
            },
            {
                "datetime": "2025-11-03T12:30:00.000Z",
                "temperature": null
            },
            {
                "datetime": "2025-11-03T13:30:00.000Z",
                "temperature": null
            },
            {
                "datetime": "2025-11-03T14:30:00.000Z",
                "temperature": null
            },
            {
                "datetime": "2025-11-03T15:30:00.000Z",
                "temperature": null
            },
            {
                "datetime": "2025-11-03T16:30:00.000Z",
                "temperature": null
            },
            {
                "datetime": "2025-11-03T17:30:00.000Z",
                "temperature": null
            }
        ],
        "prediction_found": false,
        "range": {
            "from": "2025-11-02T18:30:00.000Z",
            "to": "2025-11-03T18:29:59.999Z"
        }
    }
}