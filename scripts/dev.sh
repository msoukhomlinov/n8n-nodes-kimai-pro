#!/bin/bash

# Development helper script for n8n-kimai node

set -e

echo "🚀 Starting n8n-kimai development environment..."

# Check if dist folder exists
if [ ! -d "dist" ]; then
    echo "📦 Building node for the first time..."
    npm run build
fi

# Start docker-compose
echo "🐳 Starting Docker containers..."
docker-compose up -d

echo ""
echo "✅ Development environment is ready!"
echo ""
echo "📍 n8n is available at: http://localhost:5678"
echo "🔐 Login credentials:"
echo "   Username: admin"
echo "   Password: admin123"
echo ""
echo "💡 To rebuild the node after changes, run: npm run build"
echo "💡 To watch for changes, run: npm run dev (in another terminal)"
echo "💡 To view logs: docker-compose logs -f n8n"
echo "💡 To stop: docker-compose down"
echo ""

