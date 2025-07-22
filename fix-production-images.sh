#!/bin/bash

echo "🔧 Fixing Production Image Loading Issues..."

# 1. Stop existing containers
echo "🛑 Stopping existing containers..."
docker-compose down

# 2. Remove old images to ensure clean build
echo "🧹 Cleaning old images..."
docker-compose build --no-cache

# 3. Start services
echo "🚀 Starting services..."
docker-compose up -d

# 4. Wait for services to start
echo "⏳ Waiting for services to start..."
sleep 30

# 5. Check if backend is healthy
echo "🩺 Checking backend health..."
backend_container=$(docker-compose ps -q backend)
if [ ! -z "$backend_container" ]; then
    echo "✅ Backend container ID: $backend_container"
    echo "📋 Backend logs:"
    docker logs --tail 10 $backend_container
else
    echo "❌ Backend container not found"
fi

# 6. Check uploads directory in container
echo "📂 Checking uploads directory in container..."
if [ ! -z "$backend_container" ]; then
    echo "📁 Uploads directory contents:"
    docker exec $backend_container ls -la /app/uploads/ || echo "❌ Uploads directory not found in container"
else
    echo "❌ Cannot check uploads directory - backend container not running"
fi

# 7. Test endpoints
echo "🧪 Testing endpoints..."
echo "Testing frontend..."
curl -I http://localhost/ || echo "❌ Cannot reach frontend"

echo "Testing backend API..."
curl -I http://localhost:5002/api/ || echo "❌ Cannot reach backend API"

echo "Testing uploads endpoint..."
curl -I http://localhost/uploads/ || echo "❌ Cannot reach uploads endpoint"

echo ""
echo "✅ Deployment fixes applied!"
echo ""
echo "📋 Next steps:"
echo "  1. Update backend/.env with: ALLOWED_ORIGINS=http://hrmslb-1427637830.us-east-2.elb.amazonaws.com"
echo "  2. Upload some test images and verify they appear in docker volume"
echo "  3. Test image URLs in browser: http://your-alb-domain/uploads/image-name.jpg"
echo "  4. Check ALB configuration routes /uploads/* to your frontend container (which proxies to backend)"
