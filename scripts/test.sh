#!/bin/bash

# Test script for n8n-kimai node

set -e

echo "🧪 Testing n8n-kimai node..."

# Build the node
echo "📦 Building node..."
npm run build

# Start n8n with the custom node
echo "🐳 Starting n8n test environment..."
docker-compose up -d n8n

echo ""
echo "✅ Test environment is ready!"
echo ""
echo "📍 Access n8n at: http://localhost:5678"
echo ""
echo "🔧 To configure Mailcoach credentials:"
echo "   1. Go to Credentials → Add Credential"
echo "   2. Search for 'Mailcoach API'"
echo "   3. Enter your API Endpoint and API Token"
echo ""

