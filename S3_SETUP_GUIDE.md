# S3 Integration Setup Guide

## 🚀 Complete S3 Setup for HRMS Application

Your S3 bucket `arn:aws:s3:::db4people` is now fully integrated with your HRMS application!

### 📦 Required Dependencies
First, install the required packages:
```bash
npm install @aws-sdk/client-s3 multer-s3 sharp uuid
```

### 🔧 Environment Configuration

#### Backend Environment Variables
Add to your `backend/.env`:
```bash
# S3 Configuration
USE_S3=true
AWS_REGION=us-east-2
AWS_ACCESS_KEY_ID=your_access_key_here
AWS_SECRET_ACCESS_KEY=your_secret_key_here
S3_BUCKET_NAME=db4people

# API Configuration
API_BASE_URL=http://hrmslb-1427637830.us-east-2.elb.amazonaws.com
ALLOWED_ORIGINS=http://hrmslb-1427637830.us-east-2.elb.amazonaws.com
```

#### Frontend Environment Variables
Add to your `frontend/.env.production`:
```bash
REACT_APP_API_BASE_URL=http://hrmslb-1427637830.us-east-2.elb.amazonaws.com
REACT_APP_USE_S3=true
```

### 🛡️ AWS IAM Permissions
Create an IAM policy for your S3 bucket:
```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "HRMSS3Access",
            "Effect": "Allow",
            "Action": [
                "s3:GetObject",
                "s3:PutObject",
                "s3:DeleteObject",
                "s3:ListBucket"
            ],
            "Resource": [
                "arn:aws:s3:::db4people",
                "arn:aws:s3:::db4people/*"
            ]
        }
    ]
}
```

### 🌐 S3 Bucket CORS Configuration
Configure CORS for your S3 bucket:
```json
[
    {
        "AllowedHeaders": ["*"],
        "AllowedMethods": ["GET", "HEAD", "PUT", "POST", "DELETE"],
        "AllowedOrigins": [
            "http://hrmslb-1427637830.us-east-2.elb.amazonaws.com",
            "http://localhost:3000"
        ],
        "ExposeHeaders": ["ETag"]
    }
]
```

### 📁 File Organization Structure
Files will be organized in S3 as:
```
db4people/
├── employees/
│   ├── COMPANY_CODE/
│   │   ├── EMPLOYEE_ID/
│   │   │   ├── profile.jpg
│   │   │   ├── documents/
│   │   │   └── contracts/
│   └── ...
├── company-assets/
└── temp-uploads/
```

### 🔄 Migration Process

#### 1. Test S3 Connection
```bash
curl -X GET "http://your-domain/api/s3/test" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "X-Company-Code: YOUR_COMPANY_CODE"
```

#### 2. Migrate Existing Images
```bash
# From backend directory
node scripts/migrateToS3.js run
```

#### 3. Verify Migration
Check your S3 bucket console to see migrated files.

### 🧪 Testing S3 Integration

#### Upload Test
```bash
curl -X POST "http://your-domain/api/s3/upload" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "X-Company-Code: YOUR_COMPANY_CODE" \
  -F "file=@test-image.jpg"
```

#### Delete Test
```bash
curl -X DELETE "http://your-domain/api/s3/delete/employees/COMPANY/USER_ID/profile.jpg" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "X-Company-Code: YOUR_COMPANY_CODE"
```

### 📋 Deployment Checklist

- [ ] Install required npm packages
- [ ] Set up AWS IAM user with S3 permissions
- [ ] Configure S3 bucket CORS policy
- [ ] Update backend environment variables
- [ ] Update frontend environment variables
- [ ] Test S3 connection
- [ ] Run migration script for existing images
- [ ] Verify image uploads work in application
- [ ] Test image loading in production

### 🔀 Gradual Migration Strategy

1. **Phase 1**: Set `USE_S3=false` initially
2. **Phase 2**: Test with `USE_S3=true` in development
3. **Phase 3**: Run migration script to move existing images
4. **Phase 4**: Deploy to production with S3 enabled
5. **Phase 5**: Remove local upload directory after verification

### 🚨 Fallback Strategy
The system automatically falls back to local storage if:
- S3 credentials are missing
- S3 connection fails
- `USE_S3=false` in environment

### 📊 Cost Optimization
- Images are stored in S3 Standard class
- Consider lifecycle policies for old images
- Monitor S3 usage in AWS console
- Set up CloudWatch alerts for costs

### 🔧 Troubleshooting

**Images not loading?**
1. Check S3 CORS configuration
2. Verify AWS credentials
3. Check bucket permissions
4. Review application logs

**Migration failed?**
1. Ensure local files exist in uploads directory
2. Check S3 permissions
3. Verify network connectivity
4. Review migration logs

## 🎉 Benefits of S3 Integration

✅ **Scalable Storage**: No server disk space limits
✅ **High Availability**: 99.999999999% durability  
✅ **Cost Effective**: Pay only for what you use
✅ **CDN Ready**: Easy CloudFront integration
✅ **Backup Built-in**: Versioning and cross-region replication
✅ **Security**: Encryption at rest and in transit

Your HRMS application is now ready for production-scale image storage! 🚀
