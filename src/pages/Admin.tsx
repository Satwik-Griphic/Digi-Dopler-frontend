export default function Admin() {
  return (
    <div className="min-h-screen p-6">
      <h1 className="text-2xl font-semibold mb-4">Admin Dashboard</h1>
      <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
        <div className="bg-white rounded shadow p-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-medium">Users</h2>
            <button className="px-3 py-1 rounded bg-blue-600 text-white">Add User</button>
          </div>
          <p className="text-sm text-gray-600">Placeholder list...</p>
        </div>
        <div className="bg-white rounded shadow p-4">
          <h2 className="font-medium mb-2">Current Model</h2>
          <div className="inline-flex items-center gap-2">
            <span className="text-gray-700">v1</span>
            <span className="text-gray-400">/</span>
            <span className="text-gray-700">v2</span>
          </div>
        </div>
      </div>
    </div>
  )
}


