import express from 'express';
import { 
  getAllActions, 
  createAction, 
  getAction, 
  updateAction, 
  deleteAction,
  downloadAttachment,
  upload
} from '../controllers/disciplinaryActionController.js';
import { authenticate } from '../middleware/companyAuth.js';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticate);

// Get all disciplinary actions
router.get('/', getAllActions);

// Create a new disciplinary action
router.post('/', upload.single('attachment'), createAction);

// Get, update, delete a specific disciplinary action
router.get('/:id', getAction);
router.put('/:id', upload.single('attachment'), updateAction);
router.delete('/:id', deleteAction);

// Download attachment
router.get('/attachment/:filename', downloadAttachment);

export default router;
