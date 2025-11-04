import { createRoot } from 'react-dom/client'
import './index.css'
import './App.css'

import App from './App.tsx'
import { ConfigProvider, useConfig } from './context/ConfigContext'
import { AuthProvider } from './context/AuthContext'
import { StreamAnalyticsProvider } from './context/StreamAnalyticsContext'
import { AnalyticsProvider } from './context/AnalyticsContext.tsx'

function Bootstrap() {
  const { loading, error } = useConfig()
  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading configuration…</div>
  if (error) return <div className="min-h-screen flex items-center justify-center text-red-600">{error}</div>
  return (
    <AuthProvider>
      <StreamAnalyticsProvider>
        <AnalyticsProvider>
        <App />
        </AnalyticsProvider>
      </StreamAnalyticsProvider>
    </AuthProvider>
  )
}

createRoot(document.getElementById('root')!).render(
    <ConfigProvider>
      <Bootstrap />
    </ConfigProvider>
)
