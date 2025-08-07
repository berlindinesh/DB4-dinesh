# S3 + Axios Integration Verification Guide

## 🔍 Current Integration Status

Your HRMS application now has **complete S3 integration** with proper axios call handling. Here's how it works:

### 📡 **Axios Upload Flow (PersonalInformationForm.js)**

```javascript
// 1. Frontend creates FormData
const formData = new FormData();
formData.append('formData', JSON.stringify({ 
  userId: userIdentifier,
  personalInfo: personalInfoData 
}));
formData.append('employeeImage', values.employeeImage); // File object

// 2. Axios POST to backend
const response = await api.post('/employees/personal-info', formData, {
  headers: { 'Content-Type': 'multipart/form-data' }
});

// 3. Response includes S3 URL
console.log(response.data.imageUrl); // Full S3 URL
```

### 🔧 **Backend Processing (employeesRouter.js)**

```javascript
// 1. Multer handles upload (S3 or local)
router.post('/personal-info', uploads.single('employeeImage'), async (req, res) => {
  
  // 2. Get file URL based on storage
  let imageUrl = null;
  if (req.file) {
    if (useS3) {
      imageUrl = req.file.location; // S3 full URL
    } else {
      imageUrl = `/uploads/${req.file.filename}`; // Local path
    }
  }
  
  // 3. Store in MongoDB
  employee.personalInfo.employeeImage = imageUrl;
  
  // 4. Return full URL in response
  res.json({
    imageUrl: getFileUrl(imageUrl),
    storage: useS3 ? 'S3' : 'Local'
  });
});
```

### 💾 **MongoDB Storage Patterns**

**S3 Storage:**
```json
{
  "personalInfo": {
    "employeeImage": "https://db4people.s3.us-east-2.amazonaws.com/employees/DIN/user123/employeeImage-1640995200000-abc123.jpg"
  }
}
```

**Local Storage:**
```json
{
  "personalInfo": {
    "employeeImage": "/uploads/employeeImage-1640995200000-xyz789.jpg"
  }
}
```

### 🖼️ **Frontend Image Display (getAssetUrl)**

```javascript
// 1. Get image path from API response
const imagePath = employee.personalInfo.employeeImage;

// 2. getAssetUrl handles both S3 and local URLs
const displayUrl = getAssetUrl(imagePath);

// 3. Use in React components
<img src={getAssetUrl(employee.personalInfo.employeeImage)} />
```

## ✅ **S3 Configuration Checklist**

### 1. **Install Required Packages**
```bash
cd backend
npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner multer-s3 uuid
```

### 2. **Environment Variables**
```bash
# backend/.env
USE_S3=true
AWS_REGION=us-east-2
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
S3_BUCKET_NAME=db4people
```

### 3. **S3 Bucket CORS Policy**
```json
[{
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "HEAD", "PUT", "POST", "DELETE"],
    "AllowedOrigins": ["*"],
    "ExposeHeaders": ["ETag"]
}]
```

### 4. **S3 Bucket Policy (Public Read)**
```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "PublicReadGetObject",
            "Effect": "Allow",
            "Principal": "*",
            "Action": "s3:GetObject",
            "Resource": "arn:aws:s3:::db4people/*"
        }
    ]
}
```

## 🧪 **Testing the Integration**

### 1. **Test S3 Connection**
```bash
curl -X GET "http://localhost:5002/api/s3/test" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "X-Company-Code: YOUR_COMPANY_CODE"
```

### 2. **Test Image Upload**
```bash
curl -X POST "http://localhost:5002/api/employees/personal-info" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "X-Company-Code: YOUR_COMPANY_CODE" \
  -F "formData={\"userId\":\"test123\",\"personalInfo\":{\"firstName\":\"Test\",\"lastName\":\"User\"}}" \
  -F "employeeImage=@test-image.jpg"
```

### 3. **Run Comprehensive Test**
```bash
chmod +x test-s3-integration.js
node test-s3-integration.js run
```

## 📊 **File Organization in S3**

```
db4people/
├── employees/
│   ├── DIN/                    # Company Code
│   │   ├── user123/            # User ID
│   │   │   ├── employeeImage-timestamp-uuid.jpg
│   │   │   └── documents/
│   │   └── user456/
│   └── COMPANY2/
├── company-assets/
└── temp-uploads/
```

## 🔄 **Migration from Local to S3**

If you have existing local images:

```bash
# Run migration script
cd backend
node scripts/migrateToS3.js run
```

## 🚨 **Troubleshooting**

### Images not loading?
1. ✅ Check S3 bucket policy (public read access)
2. ✅ Verify CORS configuration
3. ✅ Check AWS credentials
4. ✅ Verify `USE_S3=true` in .env

### Upload failing?
1. ✅ Check AWS IAM permissions
2. ✅ Verify multer-s3 package installed
3. ✅ Check file size limits
4. ✅ Verify multipart/form-data header

### URLs incorrect?
1. ✅ Check `getFileUrl()` function
2. ✅ Verify frontend `getAssetUrl()` handling
3. ✅ Check MongoDB stored values

## 🎯 **Performance Benefits**

- **✅ CDN Ready**: S3 URLs work with CloudFront
- **✅ Scalable**: No server storage limits
- **✅ Fast Loading**: Direct S3 access
- **✅ Backup Built-in**: S3 durability and versioning
- **✅ Cost Effective**: Pay per use

Your S3 integration is now **production-ready** with complete axios call handling! 🚀
