import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import Layout from './components/Layout'
import DashboardNew from './pages/DashboardNew'
import Trading from './pages/Trading'
import Portfolio from './pages/Portfolio'
import Profile from './pages/Profile'
import SimpleLandingPageAuth from './pages/SimpleLandingPageAuth'
import AuthPage from './pages/AuthPage'
import SocialHubNew from './pages/SocialHubNew'
import CreateCompetition from './pages/CreateCompetition'
import CompetitionDetailsNew from './pages/CompetitionDetailsNew'
import CompetitionTradingNew from './pages/CompetitionTradingNew'
import PublicProfile from './pages/PublicProfile'
import UserSearchTest from './pages/UserSearchTest'
import NetworkDiagnostic from './pages/NetworkDiagnostic'
import ErrorBoundary from './components/ErrorBoundary'

// Create a client
const queryClient = new QueryClient()

// Protected Route Component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useAuth()
  return isAuthenticated ? <>{children}</> : <Navigate to="/auth" replace />
}

// Public Route Component (redirect to dashboard if authenticated)
const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useAuth()
  return !isAuthenticated ? <>{children}</> : <Navigate to="/dashboard" replace />
}

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <Router>
            <div className="min-h-screen bg-slate-900">
              <Routes>
              {/* Landing page - redirects to dashboard if authenticated */}
              <Route path="/" element={
                <PublicRoute>
                  <SimpleLandingPageAuth />
                </PublicRoute>
              } />
              
              {/* Authentication page */}
              <Route path="/auth" element={
                <PublicRoute>
                  <AuthPage />
                </PublicRoute>
              } />
              
              {/* Dashboard route with full functionality */}
              <Route path="/dashboard" element={
                <ProtectedRoute>
                  <Layout>
                    <DashboardNew />
                  </Layout>
                </ProtectedRoute>
              } />
              
              {/* Trading page */}
              <Route path="/trading" element={
                <ProtectedRoute>
                  <Layout>
                    <Trading />
                  </Layout>
                </ProtectedRoute>
              } />
              
              {/* Portfolio page */}
              <Route path="/portfolio" element={
                <ProtectedRoute>
                  <Layout>
                    <Portfolio />
                  </Layout>
                </ProtectedRoute>
              } />
              
              {/* Profile page */}
              <Route path="/profile" element={
                <ProtectedRoute>
                  <Layout>
                    <Profile />
                  </Layout>
                </ProtectedRoute>
              } />
              
              {/* Social Hub */}
              <Route path="/social" element={
                <ProtectedRoute>
                  <Layout>
                    <SocialHubNew />
                  </Layout>
                </ProtectedRoute>
              } />
              
              {/* Create Competition */}
              <Route path="/competitions/create" element={
                <ProtectedRoute>
                  <Layout>
                    <CreateCompetition />
                  </Layout>
                </ProtectedRoute>
              } />
              
              {/* Competition Details */}
              <Route path="/competitions/:id" element={
                <ProtectedRoute>
                  <Layout>
                    <CompetitionDetailsNew />
                  </Layout>
                </ProtectedRoute>
              } />
              
              {/* Competition Trading */}
              <Route path="/competitions/:competitionId/trade" element={
                <ProtectedRoute>
                  <Layout>
                    <CompetitionTradingNew />
                  </Layout>
                </ProtectedRoute>
              } />
              
              {/* Public Profile */}
              <Route path="/profile/:userId" element={
                <ProtectedRoute>
                  <Layout>
                    <PublicProfile />
                  </Layout>
                </ProtectedRoute>
              } />
              
              {/* User Search Test */}
              <Route path="/test/user-search" element={
                <ProtectedRoute>
                  <Layout>
                    <UserSearchTest />
                  </Layout>
                </ProtectedRoute>
              } />
              
              {/* Network Diagnostic */}
              <Route path="/test/network" element={
                <Layout>
                  <NetworkDiagnostic />
                </Layout>
              } />
              
              {/* Catch all - redirect to home */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
        </Router>
      </AuthProvider>
    </QueryClientProvider>
    </ErrorBoundary>
  )
}

export default App
