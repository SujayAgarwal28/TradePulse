import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

// Create a client
const queryClient = new QueryClient()

// Simple test component
const TestComponent = () => {
  return (
    <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">TradePulse Test</h1>
        <p className="text-xl">Frontend is working!</p>
        <div className="mt-4">
          <button className="bg-blue-500 hover:bg-blue-600 px-4 py-2 rounded">
            Test Button
          </button>
        </div>
      </div>
    </div>
  )
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <Routes>
          {/* Test route */}
          <Route path="/" element={<TestComponent />} />
        </Routes>
      </Router>
    </QueryClientProvider>
  )
}

export default App
