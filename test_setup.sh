#!/bin/bash

echo "🧪 Testing FP16 Demotion Web Interface..."

# Check if backend is running
echo "📡 Checking backend server..."
if curl -s http://localhost:3001 > /dev/null; then
    echo "✅ Backend server is running on port 3001"
else
    echo "❌ Backend server is not responding on port 3001"
    echo "Please start the backend with: cd backend && npm start"
    exit 1
fi

# Check if frontend is accessible
echo "🌐 Checking frontend server..."
if curl -s http://localhost:3000 > /dev/null; then
    echo "✅ Frontend is accessible on port 3000"
else
    echo "⏳ Frontend might still be starting up..."
    echo "Please check: cd frontend && npm start"
fi

echo ""
echo "🎯 Quick Start Guide:"
echo "1. Backend is running at: http://localhost:3001"
echo "2. Frontend is available at: http://localhost:3000"
echo "3. Upload a C/C++ file and click 'Analyze Code'"
echo ""
echo "🔧 To test with a sample file:"
echo "   Try uploading: test/test.c or test/comprehensive_test.c"
