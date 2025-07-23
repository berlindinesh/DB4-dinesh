#!/bin/bash

echo "🔧 Fixing Socket.IO Connection Issues..."

# Check if running in development or production
if [ "$NODE_ENV" = "production" ]; then
    echo "🚀 Production mode detected"
    ENV_MODE="production"
else
    echo "🛠️  Development mode detected"
    ENV_MODE="development"
fi

# Stop existing containers
echo "🛑 Stopping existing containers..."
docker-compose down

# Check backend .env for required variables
echo "🔍 Checking backend environment configuration..."
if [ ! -f "backend/.env" ]; then
    echo "❌ backend/.env file not found!"
    echo "📝 Creating basic .env template..."
    cat > backend/.env << EOF
# Required for Socket.IO CORS
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5002,http://hrmslb-1427637830.us-east-2.elb.amazonaws.com

# Database
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_here

# Server Configuration
PORT=5002
NODE_ENV=development

# S3 Configuration (optional)
USE_S3=false
AWS_REGION=us-east-2
S3_BUCKET_NAME=db4people

# Email Configuration (optional)
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
EOF
    echo "✅ Created backend/.env template - please update with your values"
else
    echo "✅ backend/.env exists"
fi

# Rebuild containers
echo "🔨 Rebuilding containers with Socket.IO fixes..."
docker-compose build --no-cache

# Start services
echo "🚀 Starting services..."
docker-compose up -d

# Wait for services to start
echo "⏳ Waiting for services to start..."
sleep 15

# Test backend connectivity
echo "🧪 Testing backend connectivity..."
backend_container=$(docker-compose ps -q backend)
if [ ! -z "$backend_container" ]; then
    echo "✅ Backend container running: $backend_container"
    
    # Check backend logs
    echo "📋 Recent backend logs:"
    docker logs --tail 20 $backend_container
    
    # Test Socket.IO endpoint
    echo "🔌 Testing Socket.IO endpoint..."
    curl -f http://localhost:5002/socket.io/ || echo "❌ Socket.IO endpoint not responding"
    
else
    echo "❌ Backend container not found"
fi

# Test frontend connectivity
echo "🌐 Testing frontend connectivity..."
frontend_container=$(docker-compose ps -q frontend)
if [ ! -z "$frontend_container" ]; then
    echo "✅ Frontend container running: $frontend_container"
else
    echo "❌ Frontend container not found"
fi

echo ""
echo "🎯 SOCKET.IO TROUBLESHOOTING CHECKLIST:"
echo "✅ Enhanced Socket.IO CORS configuration"
echo "✅ Added nginx proxy for /socket.io/ endpoint" 
echo "✅ Improved frontend connection handling"
echo "✅ Added comprehensive error logging"
echo "✅ Added heartbeat mechanism"
echo "✅ Added startup diagnostics"
echo ""
echo "📋 Next steps:"
echo "1. Check browser console for Socket.IO connection logs (look for 📡 prefix)"
echo "2. Verify backend logs show Socket.IO connections"
echo "3. Update ALLOWED_ORIGINS in backend/.env if needed"
echo "4. Test real-time notifications"
echo ""
echo "🔍 To debug further:"
echo "  Backend logs: docker logs -f \$(docker-compose ps -q backend)"
echo "  Frontend logs: docker logs -f \$(docker-compose ps -q frontend)"
echo "  Socket.IO test: curl http://localhost:5002/socket.io/"
