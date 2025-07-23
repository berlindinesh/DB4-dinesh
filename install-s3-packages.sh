#!/bin/bash

echo "🔧 Installing S3 packages for HRMS application..."

# Navigate to backend directory
cd backend

# Install required S3 packages
echo "📦 Installing AWS SDK and related packages..."
npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner multer-s3 sharp uuid

if [ $? -eq 0 ]; then
    echo "✅ All S3 packages installed successfully!"
    echo ""
    echo "📋 Next steps:"
    echo "1. Set up your AWS credentials in backend/.env:"
    echo "   USE_S3=true"
    echo "   AWS_REGION=us-east-2"
    echo "   AWS_ACCESS_KEY_ID=your_access_key"
    echo "   AWS_SECRET_ACCESS_KEY=your_secret_key"
    echo "   S3_BUCKET_NAME=db4people"
    echo ""
    echo "2. Configure S3 bucket CORS policy (see S3_SETUP_GUIDE.md)"
    echo ""
    echo "3. Restart your backend server"
    echo ""
    echo "4. Test S3 connection: curl http://localhost:5002/api/s3/test"
else
    echo "❌ Failed to install S3 packages"
    exit 1
fi
