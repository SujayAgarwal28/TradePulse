import React, { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle, Clock, RefreshCw, Wifi } from 'lucide-react';

const NetworkDiagnostic: React.FC = () => {
  const [tests, setTests] = useState<any[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [currentTest, setCurrentTest] = useState('');

  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

  const addTest = (name: string, status: 'running' | 'success' | 'error', message: string, details?: any) => {
    setTests(prev => [
      ...prev.filter(t => t.name !== name),
      { name, status, message, details, timestamp: new Date().toLocaleTimeString() }
    ]);
  };

  const runDiagnostics = async () => {
    setIsRunning(true);
    setTests([]);
    
    // Test 1: Environment Variables
    setCurrentTest('Checking environment variables...');
    addTest('Environment', 'running', 'Checking configuration...');
    
    const envVars = {
      VITE_API_URL: import.meta.env.VITE_API_URL,
      NODE_ENV: import.meta.env.NODE_ENV,
      MODE: import.meta.env.MODE
    };
    
    addTest('Environment', 'success', 'Environment variables loaded', envVars);

    // Test 2: Network connectivity
    setCurrentTest('Testing network connectivity...');
    addTest('Network', 'running', 'Testing basic connectivity...');
    
    try {
      const response = await fetch('https://httpbin.org/json', { signal: AbortSignal.timeout(5000) });
      if (response.ok) {
        addTest('Network', 'success', 'Internet connectivity working');
      } else {
        addTest('Network', 'error', 'Internet connectivity issues');
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      addTest('Network', 'error', `Network error: ${errorMessage}`);
    }

    // Test 3: Backend health check
    setCurrentTest('Testing backend health...');
    addTest('Backend Health', 'running', `Testing ${API_BASE_URL}/health...`);
    
    try {
      const response = await fetch(`${API_BASE_URL}/health`, {
        signal: AbortSignal.timeout(5000)
      });
      
      if (response.ok) {
        const data = await response.json();
        addTest('Backend Health', 'success', 'Backend is healthy', data);
      } else {
        addTest('Backend Health', 'error', `Backend returned ${response.status}: ${response.statusText}`);
      }
    } catch (error: any) {
      let errorMsg = error.message;
      if (error.message.includes('ERR_BLOCKED_BY_CLIENT')) {
        errorMsg = 'Request blocked by browser/ad blocker';
      } else if (error.message.includes('NetworkError')) {
        errorMsg = 'Network error - check if backend is running';
      }
      addTest('Backend Health', 'error', errorMsg, { originalError: error.message });
    }

    // Test 4: CORS preflight
    setCurrentTest('Testing CORS configuration...');
    addTest('CORS', 'running', 'Testing CORS preflight...');
    
    try {
      const response = await fetch(`${API_BASE_URL}/health`, {
        method: 'OPTIONS',
        signal: AbortSignal.timeout(5000)
      });
      
      addTest('CORS', 'success', 'CORS preflight working', {
        status: response.status,
        headers: Object.fromEntries(response.headers.entries())
      });
    } catch (error: any) {
      addTest('CORS', 'error', `CORS test failed: ${error.message}`);
    }

    // Test 5: Auth endpoint
    setCurrentTest('Testing authentication endpoint...');
    addTest('Authentication', 'running', 'Testing auth endpoint...');
    
    try {
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: `test_${Date.now()}@diagnostic.com`,
          password: 'testpass123'
        }),
        signal: AbortSignal.timeout(5000)
      });
      
      if (response.ok || response.status === 400) {
        addTest('Authentication', 'success', `Auth endpoint accessible (${response.status})`);
      } else {
        addTest('Authentication', 'error', `Auth endpoint failed: ${response.status}`);
      }
    } catch (error: any) {
      addTest('Authentication', 'error', `Auth test failed: ${error.message}`);
    }

    // Test 6: User search endpoint
    setCurrentTest('Testing user search endpoint...');
    addTest('User Search', 'running', 'Testing search endpoint...');
    
    try {
      const response = await fetch(`${API_BASE_URL}/social/search?q=test`, {
        signal: AbortSignal.timeout(5000)
      });
      
      if (response.status === 403) {
        addTest('User Search', 'success', 'Search endpoint accessible (auth required)');
      } else if (response.ok) {
        addTest('User Search', 'success', 'Search endpoint working');
      } else {
        addTest('User Search', 'error', `Search failed: ${response.status}`);
      }
    } catch (error: any) {
      addTest('User Search', 'error', `Search test failed: ${error.message}`);
    }

    setCurrentTest('');
    setIsRunning(false);
  };

  useEffect(() => {
    runDiagnostics();
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'running': return <Clock className="h-5 w-5 text-yellow-500 animate-spin" />;
      case 'success': return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'error': return <AlertCircle className="h-5 w-5 text-red-500" />;
      default: return <Wifi className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running': return 'border-yellow-500 bg-yellow-50';
      case 'success': return 'border-green-500 bg-green-50';
      case 'error': return 'border-red-500 bg-red-50';
      default: return 'border-gray-500 bg-gray-50';
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">🔧 Network Diagnostic Tool</h1>
          <p className="text-gray-400">Diagnosing connectivity issues with TradePulse backend</p>
        </div>

        {/* Current Test Status */}
        {isRunning && currentTest && (
          <div className="bg-blue-900 border border-blue-700 rounded-lg p-4 mb-6 flex items-center">
            <Clock className="h-5 w-5 text-blue-400 animate-spin mr-3" />
            <span className="text-blue-200">{currentTest}</span>
          </div>
        )}

        {/* Control Panel */}
        <div className="bg-gray-800 rounded-lg p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Diagnostic Tests</h2>
            <button
              onClick={runDiagnostics}
              disabled={isRunning}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 px-4 py-2 rounded-lg font-semibold transition-colors flex items-center"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isRunning ? 'animate-spin' : ''}`} />
              {isRunning ? 'Running...' : 'Run Tests'}
            </button>
          </div>
          
          <div className="text-sm text-gray-400">
            <strong>Backend URL:</strong> {API_BASE_URL}
          </div>
        </div>

        {/* Test Results */}
        <div className="space-y-4">
          {tests.map((test, index) => (
            <div
              key={index}
              className={`border-l-4 rounded-lg p-4 bg-gray-800 ${getStatusColor(test.status)}`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center">
                  {getStatusIcon(test.status)}
                  <h3 className="font-semibold ml-3 text-white">{test.name}</h3>
                </div>
                <span className="text-xs text-gray-400">{test.timestamp}</span>
              </div>
              
              <p className="text-gray-300 mb-2">{test.message}</p>
              
              {test.details && (
                <details className="mt-2">
                  <summary className="cursor-pointer text-sm text-gray-400 hover:text-white">
                    Show details
                  </summary>
                  <pre className="mt-2 p-2 bg-gray-900 rounded text-xs overflow-auto">
                    {JSON.stringify(test.details, null, 2)}
                  </pre>
                </details>
              )}
            </div>
          ))}
        </div>

        {/* Troubleshooting Guide */}
        <div className="bg-gray-800 rounded-lg p-6 mt-8">
          <h2 className="text-xl font-semibold mb-4">🔍 Troubleshooting Guide</h2>
          
          <div className="space-y-4 text-sm">
            <div>
              <h3 className="font-semibold text-yellow-400">ERR_BLOCKED_BY_CLIENT</h3>
              <p className="text-gray-300">
                Requests are being blocked by browser extensions (ad blockers, privacy tools).
                Try disabling extensions or whitelist localhost.
              </p>
            </div>
            
            <div>
              <h3 className="font-semibold text-yellow-400">NetworkError / Connection Refused</h3>
              <p className="text-gray-300">
                Backend server is not running or not accessible.
                Check if the backend is running on the correct port.
              </p>
            </div>
            
            <div>
              <h3 className="font-semibold text-yellow-400">CORS Errors</h3>
              <p className="text-gray-300">
                Cross-origin requests are being blocked.
                Check backend CORS configuration and headers.
              </p>
            </div>
            
            <div>
              <h3 className="font-semibold text-yellow-400">Environment Issues</h3>
              <p className="text-gray-300">
                Check that VITE_API_URL is set correctly in .env file.
                Restart the frontend after changing environment variables.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NetworkDiagnostic;
