# Production Deployment Checklist

## ✅ Fixed Issues

### 1. **Docker Volume Mapping** ✅
```yaml
# docker-compose.yml
volumes:
  - uploads-data:/app/uploads
```

### 2. **Backend Dockerfile** ✅
- Creates `/app/uploads` directory
- Sets proper permissions

### 3. **Frontend Nginx Configuration** ✅
- Proxies `/uploads/` to backend
- Proxies `/socket.io/` for real-time features
- Adds CORS headers for images
- Handles React Router

### 4. **Backend Static File Serving** ✅
- Serves `/uploads` before authentication middleware
- Proper CORS headers

### 5. **Socket.IO Real-time Notifications** ✅
- Enhanced CORS configuration
- Proper nginx proxying
- Connection error handling
- Heartbeat mechanism

## 🔧 Environment Variables to Set

### Backend .env
```bash
ALLOWED_ORIGINS=http://hrmslb-1427637830.us-east-2.elb.amazonaws.com
PORT=5002
NODE_ENV=production
```

### Frontend .env.production
```bash
REACT_APP_API_BASE_URL=http://hrmslb-1427637830.us-east-2.elb.amazonaws.com
REACT_APP_API_URL=http://hrmslb-1427637830.us-east-2.elb.amazonaws.com
NODE_ENV=production
```

## 🚀 Deployment Commands

1. **Create uploads directory:**
```bash
mkdir -p uploads
chmod 755 uploads
```

2. **Build and deploy:**
```bash
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

3. **Verify files exist:**
```bash
docker exec -it <backend-container-id> ls -la /app/uploads/
```

4. **Check backend logs:**
```bash
docker logs <backend-container-id>
```

## 🧪 Testing

Test image URL directly:
```bash
curl -I http://hrmslb-1427637830.us-east-2.elb.amazonaws.com/uploads/employeeImage-1753093911965-664516334.png
```

Should return `200 OK` with proper headers.

## 🔍 ALB Configuration (if needed)

Your ALB should route:
- `/` → Frontend container (port 80)
- `/api/*` → Backend container (port 5002) 
- `/uploads/*` → Backend container (port 5002)

If using ALB, no additional configuration needed as nginx handles the proxying.
