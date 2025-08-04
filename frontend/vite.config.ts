import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { networkInterfaces } from 'os'

// Function to get local network IP
function getNetworkIP(): string {
  const nets = networkInterfaces()
  for (const name of Object.keys(nets)) {
    for (const net of nets[name] || []) {
      // Skip over non-IPv4 and internal (i.e. 127.0.0.1) addresses
      if (net.family === 'IPv4' && !net.internal) {
        return net.address
      }
    }
  }
  return 'localhost'
}

const networkIP = getNetworkIP()

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0', // Allow access from any IP
    port: 5173,
    strictPort: false, // If port is busy, try next available port
    // Automatically open browser to network IP for mobile testing
    open: `http://${networkIP}:5173`,
  },
  preview: {
    host: '0.0.0.0',
    port: 4173,
    strictPort: false,
  }
})
