/**
 * BULLETPROOF Environment Configuration
 * Automatically detects and configures API URLs for any environment
 * Handles localhost, network IPs, mobile access, and cross-platform scenarios
 */

// List of possible backend ports to try
const BACKEND_PORTS = [8000, 8080, 3001]

// Get the current host (automatically detects network IP or localhost)
const getCurrentHost = (): string => {
  if (typeof window === 'undefined') {
    return 'localhost'
  }
  
  return window.location.hostname
}

// Get the current protocol (http or https)
const getCurrentProtocol = (): string => {
  if (typeof window === 'undefined') {
    return 'http:'
  }
  
  return window.location.protocol
}

// BULLETPROOF: Multiple backend host detection strategies
const getBackendHost = (): string => {
  // Production: Use environment variable if available
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL.replace(/^https?:\/\//, '').replace(/:\d+$/, '')
  }
  
  // Production: Check if we're on a Render domain
  if (typeof window !== 'undefined' && window.location.hostname.includes('onrender.com')) {
    return 'tradepulse-backend.onrender.com'
  }
  
  if (typeof window === 'undefined') {
    return 'localhost'
  }
  
  const currentHost = window.location.hostname
  
  // Strategy 1: If accessing from localhost, backend is also localhost
  if (currentHost === 'localhost' || currentHost === '127.0.0.1') {
    return 'localhost'
  }
  
  // Strategy 2: If accessing from network IP, use same network for backend
  if (currentHost.startsWith('192.168.') || currentHost.startsWith('10.') || currentHost.startsWith('172.')) {
    return currentHost  // Same network IP for consistency
  }
  
  // Strategy 3: If accessing from external domain, fallback to localhost
  return 'localhost'
}

// BULLETPROOF: Always prioritize localhost for authentication stability
const getPossibleBackendURLs = (): string[] => {
  const protocol = getCurrentProtocol()
  
  // Production: If we have VITE_API_BASE_URL, use it first
  if (import.meta.env.VITE_API_BASE_URL) {
    return [import.meta.env.VITE_API_BASE_URL]
  }
  
  // Production: If on Render, use Render backend URL
  if (typeof window !== 'undefined' && window.location.hostname.includes('onrender.com')) {
    return ['https://tradepulse-backend.onrender.com']
  }
  
  // CRITICAL: Always try localhost FIRST - this fixes the auth issues
  const urls: string[] = [
    `${protocol}//localhost:8000`  // HIGHEST PRIORITY - fixes 401/422 errors
  ]
  
  // Only add network IPs if we're actually on a network (for mobile access)
  const currentHost = getCurrentHost()
  if (currentHost !== 'localhost' && currentHost !== '127.0.0.1') {
    urls.push(`${protocol}//${currentHost}:8000`)
  }
  
  // Alternative localhost ports as last resort
  BACKEND_PORTS.forEach(port => {
    if (port !== 8000) {
      urls.push(`${protocol}//localhost:${port}`)
    }
  })
  
  return urls
}

// ROBUST: Test backend connectivity
const testBackendConnectivity = async (url: string): Promise<boolean> => {
  try {
    const response = await fetch(`${url}/health`, {
      method: 'GET',
      mode: 'cors',
      credentials: 'omit',
      signal: AbortSignal.timeout(3000) // 3 second timeout
    })
    return response.ok
  } catch (error) {
    console.warn(`❌ Backend test failed for ${url}:`, error)
    return false
  }
}

// SMART: Auto-detect working backend URL
const detectWorkingBackendURL = async (): Promise<string> => {
  const possibleURLs = getPossibleBackendURLs()
  
  console.log('🔍 Testing backend URLs:', possibleURLs)
  
  // Test URLs in parallel for speed
  const testPromises = possibleURLs.map(async (url) => {
    const works = await testBackendConnectivity(url)
    return { url, works }
  })
  
  try {
    const results = await Promise.all(testPromises)
    const workingURL = results.find(result => result.works)?.url
    
    if (workingURL) {
      console.log('✅ Found working backend URL:', workingURL)
      return workingURL
    }
  } catch (error) {
    console.warn('⚠️  Backend connectivity test failed:', error)
  }
  
  // Fallback to primary URL if testing fails
  const fallbackURL = possibleURLs[0]
  console.log('🔄 Using fallback backend URL:', fallbackURL)
  return fallbackURL
}

// Configuration object with dynamic backend detection
export const config = {
  // API Configuration - will be set dynamically
  api: {
    baseURL: import.meta.env.VITE_API_BASE_URL || `${getCurrentProtocol()}//${getBackendHost()}:8000`, // Use env var in production
    timeout: 30000,
    possibleURLs: getPossibleBackendURLs(),
  },
  
  // Frontend Configuration
  frontend: {
    baseURL: `${getCurrentProtocol()}//${getCurrentHost()}:5173`,
  },
  
  // Development flags
  isDevelopment: import.meta.env.DEV,
  isProduction: import.meta.env.PROD,
}

// Export individual values for convenience
export let API_BASE_URL = config.api.baseURL
export const FRONTEND_BASE_URL = config.frontend.baseURL

// BULLETPROOF: Initialize backend URL detection
export const initializeBackendURL = async (): Promise<string> => {
  try {
    const workingURL = await detectWorkingBackendURL()
    config.api.baseURL = workingURL
    API_BASE_URL = workingURL
    return workingURL
  } catch (error) {
    console.error('🚨 Failed to detect backend URL:', error)
    return config.api.baseURL // Return fallback
  }
}

// SMART: Export function to retry backend connection
export const retryBackendConnection = async (): Promise<boolean> => {
  console.log('🔄 Retrying backend connection...')
  try {
    const newURL = await detectWorkingBackendURL()
    config.api.baseURL = newURL
    return true
  } catch (error) {
    console.error('🚨 Backend retry failed:', error)
    return false
  }
}

// Log configuration in development
if (config.isDevelopment) {
  console.log('🔧 Environment Configuration:', {
    currentHost: getCurrentHost(),
    backendHost: getBackendHost(),
    protocol: getCurrentProtocol(),
    apiURL: config.api.baseURL,
    frontendURL: config.frontend.baseURL,
    possibleBackendURLs: config.api.possibleURLs,
  })
  
  // Auto-initialize backend URL detection in development
  initializeBackendURL().then(url => {
    console.log('🎯 Final backend URL:', url)
  })
}
