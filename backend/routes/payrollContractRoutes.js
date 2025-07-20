// import express from 'express';
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
// // Import the authenticate middleware from the correct path
// import { authenticate } from '../middleware/companyAuth.js';

// const router = express.Router();

// // Apply authentication middleware to all routes
// router.use(authenticate);

// // Basic CRUD routes
// router.get('/', getContracts);
// router.get('/dashboard', getDashboardStats);
// router.get('/filter', filterContracts);
// router.get('/:id', getContractById);
// router.post('/', createContract);
// router.put('/:id', updateContract);
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
// Import the authenticate middleware from the correct path
import { authenticate } from '../middleware/companyAuth.js';

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/contracts/') // Make sure this directory exists
  },
  filename: function (req, file, cb) {
    // Generate unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'contract-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  // Accept only specific file types
  const allowedTypes = /pdf|doc|docx|txt/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
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

// Apply authentication middleware to all routes
router.use(authenticate);

// Basic CRUD routes
router.get('/', getContracts);
router.get('/dashboard', getDashboardStats);
router.get('/filter', filterContracts);
router.get('/:id', getContractById);
router.post('/', upload.single('contractDocument'), createContract);
router.put('/:id', upload.single('contractDocument'), updateContract);
router.delete('/:id', deleteContract);

// Advanced functionality routes
router.post('/:id/approval', updateApprovalStatus);
router.post('/:id/compliance', updateComplianceDocuments);
router.post('/:id/terminate', terminateContract);
router.post('/:id/renew', renewContract);
router.post('/bulk-update', bulkUpdateContracts);

export default router;
