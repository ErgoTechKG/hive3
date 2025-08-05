#!/bin/bash

# Script to run the Course Selection Platform locally

echo "🚀 Starting Course Selection Platform..."
echo ""

# Check if MongoDB is running
if ! brew services list | grep -q "mongodb-community.*started"; then
    echo "📦 Starting MongoDB..."
    brew services start mongodb-community@7.0
fi

# Check if Redis is running
if ! brew services list | grep -q "redis.*started"; then
    echo "📦 Starting Redis..."
    brew services start redis
fi

echo "✅ Database services running"
echo ""

# Kill any existing processes
echo "🧹 Cleaning up existing processes..."
pkill -f "node.*backend" 2>/dev/null
pkill -f "react-scripts" 2>/dev/null
pkill -f "serve.*build" 2>/dev/null
sleep 2

# Start backend
echo "🔧 Starting backend server on port 3001..."
cd backend
npm run dev > backend.log 2>&1 &
BACKEND_PID=$!

# Wait for backend to start
sleep 5

# Check if backend is running
if curl -s http://localhost:3001/health > /dev/null; then
    echo "✅ Backend running on http://localhost:3001"
else
    echo "❌ Backend failed to start. Check backend/backend.log"
    exit 1
fi

# Start frontend (production build for stability)
echo "🎨 Starting frontend server on port 3000..."
cd ../frontend

# Build if needed
if [ ! -d "build" ] || [ "$1" == "--rebuild" ]; then
    echo "📦 Building frontend..."
    npm run build
fi

# Serve production build
npx serve -s build -l 3000 > frontend.log 2>&1 &
FRONTEND_PID=$!

# Wait for frontend to start
sleep 5

# Check if frontend is running
if curl -s http://localhost:3000 > /dev/null; then
    echo "✅ Frontend running on http://localhost:3000"
else
    echo "❌ Frontend failed to start. Check frontend/frontend.log"
    exit 1
fi

echo ""
echo "🎉 Course Selection Platform is running!"
echo ""
echo "📋 Access Points:"
echo "   • Frontend: http://localhost:3000"
echo "   • Login: http://localhost:3000/login"
echo "   • Register: http://localhost:3000/register"
echo "   • Backend API: http://localhost:3001"
echo "   • Health Check: http://localhost:3001/health"
echo ""
echo "📝 Logs:"
echo "   • Backend: backend/backend.log"
echo "   • Frontend: frontend/frontend.log"
echo ""
echo "🛑 To stop: Press Ctrl+C or run 'pkill -f node'"
echo ""

# Keep script running
echo "Press Ctrl+C to stop all services..."
trap "echo ''; echo '🛑 Stopping services...'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit" INT
wait