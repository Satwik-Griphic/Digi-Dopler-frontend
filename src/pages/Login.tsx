import { useNavigate } from 'react-router-dom'
import { useState } from 'react'

export default function Login() {
  const navigate = useNavigate()
  const [userId, setUserId] = useState('')
  const [password, setPassword] = useState('')

  function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    // Temporary: accept any credentials for now
    navigate('/dashboard/detection')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <form onSubmit={onSubmit} className="w-full max-w-sm bg-white shadow rounded p-6 space-y-4">
        <h1 className="text-2xl font-semibold text-gray-900 text-center">DigiDoppel Login</h1>
        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-700">User ID</label>
          <input className="w-full border rounded px-3 py-2 focus:outline-none focus:ring focus:border-blue-500" value={userId} onChange={(e) => setUserId(e.target.value)} required />
        </div>
        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-700">Password</label>
          <input type="password" className="w-full border rounded px-3 py-2 focus:outline-none focus:ring focus:border-blue-500" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </div>
        <button type="submit" className="w-full bg-blue-600 text-white rounded py-2 hover:bg-blue-700">Login</button>
      </form>
    </div>
  )
}


