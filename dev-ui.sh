#!/bin/bash

# UI Development Quick Start Script for Codespaces/Virtual Machines
# This script sets up the development environment for rapid UI iteration

set -e

echo "🚀 Starting Social Media UI Development Environment..."

# Check if we're in Codespaces
if [ -n "$CODESPACES" ]; then
    echo "📦 Running in GitHub Codespaces"
    export VITE_API_BASE="http://localhost:3000"
else
    echo "💻 Running in local environment"
fi

# Start services with Docker Compose
echo "🐳 Starting backend services..."
docker compose up -d db backend websocket vidbackend

# Wait for database to be ready
echo "⏳ Waiting for database to be ready..."
sleep 5

# Start frontend with hot reload
echo "🎨 Starting frontend development server with hot reload..."
cd frontend

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing frontend dependencies..."
    npm install
fi

# Start Vite dev server
echo "✨ Starting Vite dev server..."
echo "🌐 Frontend will be available at: http://localhost:5173"
echo "🔥 Hot Module Replacement (HMR) is enabled"
echo "💡 Tip: Make changes to files in src/ and see them instantly!"
echo ""
npm run dev -- --host 0.0.0.0

