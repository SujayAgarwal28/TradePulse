import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import SuperMinimalTest from './components/SuperMinimalTest'
import ErrorBoundary from './components/ErrorBoundary'

function App() {
  console.log('App component rendering');
  
  return (
    <ErrorBoundary>
      <Router>
        <Routes>
          <Route path="/" element={<SuperMinimalTest />} />
        </Routes>
      </Router>
    </ErrorBoundary>
  );
}

export default App;
