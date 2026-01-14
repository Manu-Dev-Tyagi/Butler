#!/bin/bash

# Butler PMS - Start Servers Script
# This script helps start both API and Worker servers

echo "🚀 Starting Butler PMS Servers..."
echo ""

# Check if port 3000 is in use
if lsof -ti:3000 > /dev/null 2>&1; then
    echo "⚠️  Port 3000 is already in use!"
    echo "Killing process on port 3000..."
    lsof -ti:3000 | xargs kill -9
    sleep 1
fi

# Check Node version
NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)

if [ "$NODE_VERSION" -ge 24 ]; then
    echo "⚠️  Node.js v24 detected. Using direct scripts (no hot-reload)..."
    echo "💡 Recommendation: Use Node.js v20 LTS for best compatibility"
    echo ""
    echo "Starting servers in background..."
    echo ""
    echo "📡 API Server: npm run dev:api:direct"
    echo "⚙️  Worker Server: npm run dev:worker:direct"
    echo ""
    echo "Open new terminals and run:"
    echo "  Terminal 1: cd pms-backend && npm run dev:api:direct"
    echo "  Terminal 2: cd pms-backend && npm run dev:worker:direct"
else
    echo "✅ Using nodemon with hot-reload..."
    echo ""
    echo "Starting servers..."
    echo ""
    npm run dev:all
fi
