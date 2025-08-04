import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import SuperMinimalTest from './components/SuperMinimalTest'
import TestPage from './pages/TestPage'
import SimpleTradingPageFixed from './pages/SimpleTradingPageFixed'
import ErrorBoundary from './components/ErrorBoundary'

function App() {
  console.log('App component rendering without React Query');
  
  return (
    <ErrorBoundary>
      <Router>
        <Routes>
          <Route path="/" element={<SuperMinimalTest />} />
          <Route path="/test" element={<TestPage />} />
          <Route path="/trading" element={<SimpleTradingPageFixed />} />
        </Routes>
      </Router>
    </ErrorBoundary>
  );
}

export default App;
