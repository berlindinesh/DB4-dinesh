import express from 'express';
import s3Service from '../services/s3Service.js';
import { authenticate, companyFilter } from '../middleware/companyAuth.js';
import { upload, useS3 } from '../config/s3Config.js';

const router = express.Router();

// Test S3 connection
router.get('/test', authenticate, companyFilter, async (req, res) => {
  try {
    const result = await s3Service.testConnection();
    res.json({
      message: 'S3 Configuration Test',
      useS3: useS3,
      ...result
    });
  } catch (error) {
    res.status(500).json({
      message: 'S3 test failed',
      error: error.message,
      useS3: useS3
    });
  }
});

// Upload single file to S3 (alternative endpoint)
router.post('/upload', authenticate, companyFilter, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    // For S3, the file URL is already available in req.file.location
    // For local storage, construct the URL
    const fileUrl = useS3 ? req.file.location : `/uploads/${req.file.filename}`;

    res.json({
      message: 'File uploaded successfully',
      file: {
        url: fileUrl,
        key: req.file.key || req.file.filename,
        originalName: req.file.originalname,
        size: req.file.size,
        mimetype: req.file.mimetype
      },
      storage: useS3 ? 'S3' : 'local'
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({
      message: 'File upload failed',
      error: error.message
    });
  }
});

// Delete file from S3
router.delete('/delete/:fileKey', authenticate, companyFilter, async (req, res) => {
  try {
    const { fileKey } = req.params;
    const result = await s3Service.deleteFile(decodeURIComponent(fileKey));
    
    res.json({
      message: 'File deleted successfully',
      ...result
    });
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({
      message: 'File deletion failed',
      error: error.message
    });
  }
});

// Get signed URL for private files
router.get('/signed-url/:fileKey', authenticate, companyFilter, async (req, res) => {
  try {
    const { fileKey } = req.params;
    const { expiresIn = 3600 } = req.query;
    
    const signedUrl = await s3Service.getSignedUrl(decodeURIComponent(fileKey), parseInt(expiresIn));
    
    res.json({
      message: 'Signed URL generated',
      url: signedUrl,
      expiresIn: parseInt(expiresIn)
    });
  } catch (error) {
    console.error('Signed URL error:', error);
    res.status(500).json({
      message: 'Failed to generate signed URL',
      error: error.message
    });
  }
});

// Migrate existing local files to S3
router.post('/migrate', authenticate, companyFilter, async (req, res) => {
  try {
    const { localPath, s3Key } = req.body;
    
    if (!localPath || !s3Key) {
      return res.status(400).json({
        message: 'Both localPath and s3Key are required'
      });
    }

    const result = await s3Service.migrateLocalFileToS3(localPath, s3Key);
    
    res.json({
      message: 'File migrated successfully',
      ...result
    });
  } catch (error) {
    console.error('Migration error:', error);
    res.status(500).json({
      message: 'File migration failed',
      error: error.message
    });
  }
});

export default router;
