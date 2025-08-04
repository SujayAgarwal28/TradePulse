import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from './contexts/AuthContext'
import ErrorBoundary from './components/ErrorBoundary'

// Pages
import LandingPage from './pages/LandingPage'
import AuthPage from './pages/AuthPage'
import Dashboard from './pages/Dashboard'
import TradingFixed from './pages/TradingFixed'
import Portfolio from './pages/Portfolio'
import Navbar from './components/Navbar'

// Create a properly configured QueryClient
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error: any) => {
        // Don't retry on 4xx errors
        if (error?.response?.status >= 400 && error?.response?.status < 500) {
          return false;
        }
        return failureCount < 2;
      },
      staleTime: 5 * 60 * 1000, // 5 minutes
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
      networkMode: 'online',
    },
    mutations: {
      retry: 1,
      networkMode: 'online',
    },
  },
})

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <QueryClientProvider client={queryClient}>
          <Router>
            <Routes>
              {/* Public routes */}
              <Route path="/" element={<LandingPage />} />
              <Route path="/auth" element={<AuthPage />} />
              
              {/* Protected routes with navbar */}
              <Route path="/dashboard" element={
                <div className="min-h-screen bg-finance-dark overflow-x-hidden">
                  <Navbar />
                  <main className="w-full max-w-full px-4 sm:px-6 py-8 overflow-x-hidden">
                    <Dashboard />
                  </main>
                </div>
              } />
              
              <Route path="/trading" element={
                <div className="min-h-screen bg-finance-dark overflow-x-hidden">
                  <Navbar />
                  <main className="w-full max-w-full px-4 sm:px-6 py-8 overflow-x-hidden">
                    <TradingFixed />
                  </main>
                </div>
              } />
              
              <Route path="/portfolio" element={
                <div className="min-h-screen bg-finance-dark overflow-x-hidden">
                  <Navbar />
                  <main className="w-full max-w-full px-4 sm:px-6 py-8 overflow-x-hidden">
                    <Portfolio />
                  </main>
                </div>
              } />
            </Routes>
          </Router>
        </QueryClientProvider>
      </AuthProvider>
    </ErrorBoundary>
  )
}

export default App
