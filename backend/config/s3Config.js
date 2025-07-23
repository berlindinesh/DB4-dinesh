import { S3Client } from '@aws-sdk/client-s3';
import multer from 'multer';
import path from 'path';

// Check if S3 packages are available
let multerS3 = null;
let uuid = null;

try {
  multerS3 = (await import('multer-s3')).default;
  uuid = (await import('uuid')).v4;
  console.log('📦 S3 packages loaded successfully');
} catch (error) {
  console.log('📦 S3 packages not installed, using local storage');
}

// AWS S3 Configuration
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-2',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const BUCKET_NAME = process.env.S3_BUCKET_NAME || 'db4people';

// S3 Storage Configuration
const s3Storage = multerS3 ? multerS3({
  s3: s3Client,
  bucket: BUCKET_NAME,
  key: function (req, file, cb) {
    // Extract company code and user info
    const companyCode = req.companyCode || 'unknown';
    let userId = 'unknown';
    
    try {
      if (req.body.formData) {
        const formData = JSON.parse(req.body.formData);
        userId = formData.userId || req.user?.userId || 'unknown';
      }
    } catch (e) {
      userId = req.user?.userId || 'unknown';
    }
    
    const fileExtension = path.extname(file.originalname);
    const uniqueId = uuid ? uuid() : Date.now();
    const fileName = `employees/${companyCode}/${userId}/${file.fieldname}-${Date.now()}-${uniqueId}${fileExtension}`;
    
    console.log('📁 S3 file path:', fileName);
    cb(null, fileName);
  },
  contentType: multerS3.AUTO_CONTENT_TYPE,
  metadata: function (req, file, cb) {
    cb(null, {
      fieldName: file.fieldname,
      originalName: file.originalname,
      uploadedBy: req.user?.userId || 'system',
      uploadedAt: new Date().toISOString(),
      companyCode: req.companyCode || 'unknown'
    });
  },
}) : null;

// Local Storage Configuration (fallback)
const localStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// File Filter
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only image files (JPEG, PNG, GIF, WebP) are allowed!'), false);
  }
};

// Choose storage based on environment
const useS3 = process.env.USE_S3 === 'true' && 
              process.env.AWS_ACCESS_KEY_ID && 
              process.env.AWS_SECRET_ACCESS_KEY && 
              multerS3;
const storage = useS3 ? s3Storage : localStorage;

console.log(`📦 Using ${useS3 ? 'S3' : 'local'} storage for file uploads`);

// Multer Configuration
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: fileFilter,
});

// Helper function to get the full URL
export const getFileUrl = (filePath) => {
  if (!filePath) return null;
  
  // If it's already a full URL, return it
  if (filePath.startsWith('http')) return filePath;
  
  // If using S3, construct S3 URL
  if (useS3 && filePath) {
    // If the path doesn't include the bucket URL, construct it
    if (!filePath.includes('.amazonaws.com')) {
      const region = process.env.AWS_REGION || 'us-east-2';
      return `https://${BUCKET_NAME}.s3.${region}.amazonaws.com/${filePath}`;
    }
    return filePath;
  }
  
  // For local storage, use the API base URL
  const baseUrl = process.env.API_BASE_URL || 'http://localhost:5002';
  const cleanPath = filePath.startsWith('/uploads/') ? filePath.replace('/uploads/', '') : filePath;
  return `${baseUrl}/uploads/${cleanPath}`;
};

export { s3Client, BUCKET_NAME, upload, useS3 };
export default upload;
