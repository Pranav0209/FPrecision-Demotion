#!/bin/bash

echo "🚀 Setting up FP16 Demotion Plugin Web Interface..."

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check if Node.js is installed
if ! command_exists node; then
    echo "❌ Node.js is not installed. Please install Node.js from https://nodejs.org/"
    exit 1
fi

# Check if npm is installed
if ! command_exists npm; then
    echo "❌ npm is not installed. Please install npm."
    exit 1
fi

echo "✅ Node.js and npm are installed"

# Install backend dependencies
echo "📦 Installing backend dependencies..."
cd backend
if npm install; then
    echo "✅ Backend dependencies installed successfully"
else
    echo "❌ Failed to install backend dependencies"
    exit 1
fi

# Install frontend dependencies
echo "📦 Installing frontend dependencies..."
cd ../frontend
if npm install; then
    echo "✅ Frontend dependencies installed successfully"
else
    echo "❌ Failed to install frontend dependencies"
    exit 1
fi

echo "🎉 Setup complete!"
echo ""
echo "To start the application:"
echo "1. Open a terminal and run: cd backend && npm start"
echo "2. Open another terminal and run: cd frontend && npm start"
echo ""
echo "The application will be available at http://localhost:3000"
echo "Make sure your FP16 plugin is built and available in the build/ directory"
