#!/usr/bin/env node
/**
 * Production startup script for TradePulse frontend on Render.
 */

const { spawn } = require('child_process');

// Get port from environment (Render sets this)
const port = process.env.PORT || 4173;

console.log(`🚀 Starting TradePulse frontend on port ${port}`);

// Start Vite preview server
const vite = spawn('npx', ['vite', 'preview', '--host', '0.0.0.0', '--port', port], {
  stdio: 'inherit',
  shell: true
});

vite.on('error', (error) => {
  console.error('❌ Failed to start frontend:', error);
  process.exit(1);
});

vite.on('close', (code) => {
  console.log(`Frontend process exited with code ${code}`);
  process.exit(code);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('⏹️ Received SIGTERM, shutting down gracefully');
  vite.kill('SIGTERM');
});

process.on('SIGINT', () => {
  console.log('⏹️ Received SIGINT, shutting down gracefully');
  vite.kill('SIGINT');
});
