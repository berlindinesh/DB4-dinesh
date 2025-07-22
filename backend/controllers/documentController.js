import Document from '../models/Document.js';

export const documentController = {
  // Get all documents
  getAllDocuments: async (req, res) => {
    try {
      const documents = await Document.find();
      res.status(200).json(documents);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  // Create new document
//   createDocument: async (req, res) => {
//     try {
//       const newDocument = new Document({
//         title: req.body.title,
//         employee: req.body.employee,
//         format: req.body.format,
//         maxSize: req.body.maxSize,
//         description: req.body.description,
//         details: [req.body.employee]
//       });
//       const savedDocument = await newDocument.save();
//       res.status(201).json(savedDocument);
//     } catch (error) {
//       res.status(400).json({ message: error.message });
//     }
//   },
     // Create new document
createDocument: async (req, res) => {
    try {
      const documentData = {
        title: req.body.title,
        employee: req.body.employee,
        format: req.body.format,
        maxSize: req.body.maxSize,
        description: req.body.description,
        status: req.body.status,
        current: 0,
        total: 1,
        details: [req.body.employee]
      };
  
      const newDocument = new Document(documentData);
      const savedDocument = await newDocument.save();
      res.status(201).json(savedDocument);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  },
  
  
  // Update document
  updateDocument: async (req, res) => {
    try {
      const updatedDocument = await Document.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true }
      );
      res.status(200).json(updatedDocument);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  },

  // Delete document
  deleteDocument: async (req, res) => {
    try {
      await Document.findByIdAndDelete(req.params.id);
      res.status(200).json({ message: 'Document deleted successfully' });
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  },

  // Bulk approve documents
  bulkApprove: async (req, res) => {
    try {
      const { documentIds } = req.body;
      await Document.updateMany(
        { _id: { $in: documentIds } },
        { status: 'approved' }
      );
      res.status(200).json({ message: 'Documents approved successfully' });
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  },

  // Bulk reject documents
  bulkReject: async (req, res) => {
    try {
      const { documentIds } = req.body;
      await Document.updateMany(
        { _id: { $in: documentIds } },
        { status: 'rejected' }
      );
      res.status(200).json({ message: 'Documents rejected successfully' });
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  }
};
