#!/bin/bash
# Frontend build script for Render

echo "🎨 Starting TradePulse frontend build..."

# Install dependencies
npm ci

# Build the React app
npm run build

echo "✅ Frontend build completed!"
