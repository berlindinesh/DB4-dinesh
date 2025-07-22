import express from 'express';
import { documentController } from '../controllers/documentController.js';

const router = express.Router();

router.get('/documents', documentController.getAllDocuments);
router.post('/documents', documentController.createDocument);
router.put('/documents/:id', documentController.updateDocument);
router.delete('/documents/:id', documentController.deleteDocument);
router.post('/documents/bulk-approve', documentController.bulkApprove);
router.post('/documents/bulk-reject', documentController.bulkReject);

export default router;
