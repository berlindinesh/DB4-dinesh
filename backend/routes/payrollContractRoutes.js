// import express from 'express';
// import multer from 'multer';
// import path from 'path';
// import fs from 'fs';
// import { 
//   getContracts,
//   getContractById,
//   createContract, 
//   updateContract,
//   deleteContract,
//   filterContracts,
//   updateApprovalStatus,
//   updateComplianceDocuments,
//   terminateContract,
//   getDashboardStats,
//   renewContract,
//   bulkUpdateContracts
// } from '../controllers/payrollContractController.js';
// import { authenticate } from '../middleware/companyAuth.js';

// const router = express.Router();

// // Configure multer for file uploads
// const storage = multer.diskStorage({
//   destination: function (req, file, cb) {
//     const uploadPath = path.join(process.cwd(), 'uploads', 'contracts');
    
//     // Create directory if it doesn't exist
//     if (!fs.existsSync(uploadPath)) {
//       fs.mkdirSync(uploadPath, { recursive: true });
//       console.log('Created directory:', uploadPath);
//     }
    
//     console.log('Multer: Saving file to:', uploadPath);
//     cb(null, uploadPath);
//   },
//   filename: function (req, file, cb) {
//     // Generate unique filename
//     const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
//     const filename = 'contract-' + uniqueSuffix + path.extname(file.originalname);
//     console.log('Multer: Generated filename:', filename);
//     cb(null, filename);
//   }
// });

// const fileFilter = (req, file, cb) => {
//   console.log('Multer: File filter - received file:', file.originalname, file.mimetype);
  
//   // Accept only specific file types
//   const allowedTypes = /pdf|doc|docx|txt/;
//   const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
//   const mimetype = allowedTypes.test(file.mimetype) || 
//                    file.mimetype === 'application/pdf' ||
//                    file.mimetype === 'application/msword' ||
//                    file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
//                    file.mimetype === 'text/plain';

//   if (mimetype && extname) {
//     console.log('Multer: File accepted');
//     return cb(null, true);
//   } else {
//     console.log('Multer: File rejected - invalid type');
//     cb(new Error('Only PDF, DOC, DOCX, and TXT files are allowed!'));
//   }
// };

// const upload = multer({
//   storage: storage,
//   limits: {
//     fileSize: 10 * 1024 * 1024 // 10MB limit
//   },
//   fileFilter: fileFilter
// });

// // Add download route BEFORE authentication middleware (no auth needed for downloads)
// router.get('/download/:filename', (req, res) => {
//   try {
//     const filename = req.params.filename;
    
//     // Validate filename to prevent directory traversal attacks
//     if (!filename || filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
//       console.log('Invalid filename:', filename);
//       return res.status(400).json({ error: 'Invalid filename' });
//     }
    
//     const filePath = path.join(process.cwd(), 'uploads', 'contracts', filename);
    
//     console.log('Download request for:', filename);
//     console.log('Full file path:', filePath);
    
//     // Check if file exists
//     if (!fs.existsSync(filePath)) {
//       console.log('File not found at path:', filePath);
      
//       // List files in directory for debugging
//       const dirPath = path.join(process.cwd(), 'uploads', 'contracts');
//       if (fs.existsSync(dirPath)) {
//         const files = fs.readdirSync(dirPath);
//         console.log('Files in directory:', files);
//       }
      
//       return res.status(404).json({ error: 'File not found' });
//     }
    
//     // Get file stats
//     const stats = fs.statSync(filePath);
//     console.log('File found, size:', stats.size);
    
//     // Set appropriate headers
//     res.setHeader('Content-Type', 'application/octet-stream');
//     res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
//     res.setHeader('Content-Length', stats.size);
    
//     // Create read stream and pipe to response
//     const fileStream = fs.createReadStream(filePath);
    
//     fileStream.on('error', (error) => {
//       console.error('Error reading file:', error);
//       if (!res.headersSent) {
//         res.status(500).json({ error: 'Error reading file' });
//       }
//     });
    
//     fileStream.pipe(res);
    
//   } catch (error) {
//     console.error('Download error:', error);
//     if (!res.headersSent) {
//       res.status(500).json({ error: 'Failed to download file' });
//     }
//   }
// });

// // Apply authentication middleware to all other routes
// router.use(authenticate);

// // Debug route to check uploads
// router.get('/debug/files', (req, res) => {
//   try {
//     const uploadsDir = path.join(process.cwd(), 'uploads', 'contracts');
    
//     if (!fs.existsSync(uploadsDir)) {
//       return res.json({
//         message: 'Uploads directory does not exist',
//         path: uploadsDir
//       });
//     }
    
//     const files = fs.readdirSync(uploadsDir);
    
//     res.json({
//       uploadsDir,
//       files,
//       fileCount: files.length
//     });
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// });

// // Basic CRUD routes
// router.get('/', getContracts);
// router.get('/dashboard', getDashboardStats);
// router.get('/filter', filterContracts);
// router.get('/:id', getContractById);

// // File upload routes - these need to be BEFORE the /:id routes to avoid conflicts
// router.post('/', upload.single('contractDocument'), (req, res, next) => {
//   console.log('POST / route hit');
//   console.log('File received:', req.file);
//   console.log('Body received:', req.body);
//   next();
// }, createContract);

// router.put('/:id', upload.single('contractDocument'), (req, res, next) => {
//   console.log('PUT /:id route hit');
//   console.log('File received:', req.file);
//   console.log('Body received:', req.body);
//   next();
// }, updateContract);

// router.delete('/:id', deleteContract);

// // Advanced functionality routes
// router.post('/:id/approval', updateApprovalStatus);
// router.post('/:id/compliance', updateComplianceDocuments);
// router.post('/:id/terminate', terminateContract);
// router.post('/:id/renew', renewContract);
// router.post('/bulk-update', bulkUpdateContracts);

// export default router;

import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { 
  getContracts,
  getContractById,
  createContract, 
  updateContract,
  deleteContract,
  filterContracts,
  updateApprovalStatus,
  updateComplianceDocuments,
  terminateContract,
  getDashboardStats,
  renewContract,
  bulkUpdateContracts
} from '../controllers/payrollContractController.js';
import { authenticate } from '../middleware/companyAuth.js';

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = path.join(process.cwd(), 'uploads', 'contracts');
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
      console.log('Created directory:', uploadPath);
    }
    
    console.log('Multer: Saving file to:', uploadPath);
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    // Generate unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const filename = 'contract-' + uniqueSuffix + path.extname(file.originalname);
    console.log('Multer: Generated filename:', filename);
    cb(null, filename);
  }
});

const fileFilter = (req, file, cb) => {
  console.log('Multer: File filter - received file:', file.originalname, file.mimetype);
  
  // Accept only specific file types
  const allowedTypes = /pdf|doc|docx|txt/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype) || 
                   file.mimetype === 'application/pdf' ||
                   file.mimetype === 'application/msword' ||
                   file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
                   file.mimetype === 'text/plain';

  if (mimetype && extname) {
    console.log('Multer: File accepted');
    return cb(null, true);
  } else {
    console.log('Multer: File rejected - invalid type');
    cb(new Error('Only PDF, DOC, DOCX, and TXT files are allowed!'));
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: fileFilter
});

// IMPORTANT: Download route MUST be before authentication and before other routes
router.get('/download/:filename', (req, res) => {
  try {
    const filename = req.params.filename;
    
    console.log('=== DOWNLOAD REQUEST START ===');
    console.log('Requested filename:', filename);
    
    // Validate filename to prevent directory traversal attacks
    if (!filename || filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      console.log('❌ Invalid filename:', filename);
      return res.status(400).json({ error: 'Invalid filename' });
    }
    
    const filePath = path.join(process.cwd(), 'uploads', 'contracts', filename);
    console.log('Full file path:', filePath);
    
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      console.log('❌ File not found at path:', filePath);
      
      // List files in directory for debugging
      const dirPath = path.join(process.cwd(), 'uploads', 'contracts');
      if (fs.existsSync(dirPath)) {
        const files = fs.readdirSync(dirPath);
        console.log('📁 Files in directory:', files);
        console.log('📁 Total files:', files.length);
      } else {
        console.log('❌ Directory does not exist:', dirPath);
      }
      
      return res.status(404).json({ 
        success: false,
        error: 'File not found',
        requestedFile: filename,
        searchPath: filePath
      });
    }
    
    // Get file stats
    const stats = fs.statSync(filePath);
    console.log('✅ File found, size:', stats.size, 'bytes');
    
    // Set appropriate headers
    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', stats.size);
    res.setHeader('Cache-Control', 'no-cache');
    
    // Create read stream and pipe to response
    const fileStream = fs.createReadStream(filePath);
    
    fileStream.on('error', (error) => {
      console.error('❌ Error reading file:', error);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Error reading file' });
      }
    });
    
    fileStream.on('open', () => {
      console.log('✅ File stream opened successfully');
    });
    
    fileStream.on('end', () => {
      console.log('✅ File download completed');
      console.log('=== DOWNLOAD REQUEST END ===');
    });
    
    fileStream.pipe(res);
    
  } catch (error) {
    console.error('❌ Download error:', error);
    if (!res.headersSent) {
      res.status(500).json({ 
        success: false,
        error: 'Failed to download file',
        details: error.message
      });
    }
  }
});

// Debug route to check uploads - ALSO before auth
router.get('/debug/files', (req, res) => {
  try {
    const uploadsDir = path.join(process.cwd(), 'uploads', 'contracts');
    
    console.log('=== DEBUG FILES REQUEST ===');
    console.log('Checking directory:', uploadsDir);
    
    if (!fs.existsSync(uploadsDir)) {
      console.log('❌ Directory does not exist');
      return res.json({
        success: false,
        message: 'Uploads directory does not exist',
        path: uploadsDir
      });
    }
    
    const files = fs.readdirSync(uploadsDir);
    console.log('📁 Files found:', files);
    
    // Get detailed file info
    const fileDetails = files.map(file => {
      const filePath = path.join(uploadsDir, file);
      const stats = fs.statSync(filePath);
      return {
        filename: file,
        size: stats.size,
        created: stats.birthtime,
        modified: stats.mtime
      };
    });
    
    res.json({
      success: true,
      uploadsDir,
      files,
      fileCount: files.length,
      fileDetails
    });
  } catch (error) {
    console.error('❌ Debug error:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

// Apply authentication middleware to all other routes
router.use(authenticate);

// Basic CRUD routes
router.get('/', getContracts);
router.get('/dashboard', getDashboardStats);
router.get('/filter', filterContracts);
router.get('/:id', getContractById);

// File upload routes
router.post('/', upload.single('contractDocument'), (req, res, next) => {
  console.log('=== CREATE CONTRACT REQUEST ===');
  console.log('File received:', req.file);
  console.log('Body received:', req.body);
  next();
}, createContract);

router.put('/:id', upload.single('contractDocument'), (req, res, next) => {
  console.log('=== UPDATE CONTRACT REQUEST ===');
  console.log('File received:', req.file);
  console.log('Body received:', req.body);
  next();
}, updateContract);

router.delete('/:id', deleteContract);

// Advanced functionality routes
router.post('/:id/approval', updateApprovalStatus);
router.post('/:id/compliance', updateComplianceDocuments);
router.post('/:id/terminate', terminateContract);
router.post('/:id/renew', renewContract);
router.post('/bulk-update', bulkUpdateContracts);

export default router;
