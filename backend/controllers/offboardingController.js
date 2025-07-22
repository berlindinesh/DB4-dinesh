import Offboarding, { offboardingSchema } from "../models/Offboarding.js";
import getModelForCompany from "../models/genericModelFactory.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const getAllOffboardings = async (req, res) => {
  try {
    // Get company code from authenticated user
    const companyCode = req.companyCode;

    if (!companyCode) {
      return res.status(401).json({
        error: "Authentication required",
        message: "Company code not found in request",
      });
    }

    console.log(`Fetching all offboardings for company: ${companyCode}`);

    // Get company-specific Offboarding model
    const CompanyOffboarding = await getModelForCompany(
      companyCode,
      "Offboarding",
      offboardingSchema
    );

    const offboardings = await CompanyOffboarding.find().sort({
      createdAt: -1,
    });
    res.status(200).json(offboardings);
  } catch (error) {
    console.error("Error fetching all offboardings:", error);
    res.status(500).json({ message: error.message });
  }
};

export const getOffboardingById = async (req, res) => {
  try {
    // Get company code from authenticated user
    const companyCode = req.companyCode;

    if (!companyCode) {
      return res.status(401).json({
        error: "Authentication required",
        message: "Company code not found in request",
      });
    }

    const { id } = req.params;

    console.log(`Fetching offboarding ${id} for company: ${companyCode}`);

    // Get company-specific Offboarding model
    const CompanyOffboarding = await getModelForCompany(
      companyCode,
      "Offboarding",
      offboardingSchema
    );

    const offboarding = await CompanyOffboarding.findById(id);
    if (!offboarding) {
      return res.status(404).json({ message: "Offboarding record not found" });
    }
    res.status(200).json(offboarding);
  } catch (error) {
    console.error("Error fetching offboarding by ID:", error);
    res.status(500).json({ message: error.message });
  }
};

export const createOffboarding = async (req, res) => {
  try {
    // Get company code from authenticated user
    const companyCode = req.companyCode;

    if (!companyCode) {
      return res.status(401).json({
        error: "Authentication required",
        message: "Company code not found in request",
      });
    }

    console.log(`Creating offboarding for company: ${companyCode}`);

    // Get company-specific Offboarding model
    const CompanyOffboarding = await getModelForCompany(
      companyCode,
      "Offboarding",
      offboardingSchema
    );

    const newOffboarding = new CompanyOffboarding(req.body);
    const savedOffboarding = await newOffboarding.save();
    res.status(201).json(savedOffboarding);
  } catch (error) {
    console.error("Error creating offboarding:", error);
    res.status(400).json({ message: error.message });
  }
};

export const updateOffboarding = async (req, res) => {
  try {
    // Get company code from authenticated user
    const companyCode = req.companyCode;

    if (!companyCode) {
      return res.status(401).json({
        error: "Authentication required",
        message: "Company code not found in request",
      });
    }

    const { id } = req.params;

    console.log(`Updating offboarding ${id} for company: ${companyCode}`);

    // Get company-specific Offboarding model
    const CompanyOffboarding = await getModelForCompany(
      companyCode,
      "Offboarding",
      offboardingSchema
    );

    const updatedOffboarding = await CompanyOffboarding.findByIdAndUpdate(
      id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!updatedOffboarding) {
      return res.status(404).json({ message: "Offboarding record not found" });
    }

    res.status(200).json(updatedOffboarding);
  } catch (error) {
    console.error("Error updating offboarding:", error);
    res.status(400).json({ message: error.message });
  }
};

export const deleteOffboarding = async (req, res) => {
  try {
    // Get company code from authenticated user
    const companyCode = req.companyCode;

    if (!companyCode) {
      return res.status(401).json({
        error: "Authentication required",
        message: "Company code not found in request",
      });
    }

    const { id } = req.params;

    console.log(`Deleting offboarding ${id} for company: ${companyCode}`);

    // Get company-specific Offboarding model
    const CompanyOffboarding = await getModelForCompany(
      companyCode,
      "Offboarding",
      offboardingSchema
    );

    const offboarding = await CompanyOffboarding.findById(id);

    if (!offboarding) {
      return res.status(404).json({ message: "Offboarding record not found" });
    }

    // Delete associated documents if any
    if (offboarding.documents && offboarding.documents.length > 0) {
      offboarding.documents.forEach((doc) => {
        const filePath = path.join(__dirname, "..", "uploads", doc.path);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      });
    }

    await CompanyOffboarding.findByIdAndDelete(id);
    res.status(200).json({ message: "Offboarding deleted successfully" });
  } catch (error) {
    console.error("Error deleting offboarding:", error);
    res.status(400).json({ message: error.message });
  }
};

export const getOffboardingsByStage = async (req, res) => {
  try {
    // Get company code from authenticated user
    const companyCode = req.companyCode;

    if (!companyCode) {
      return res.status(401).json({
        error: "Authentication required",
        message: "Company code not found in request",
      });
    }

    const { stage } = req.params;

    console.log(
      `Fetching offboardings by stage ${stage} for company: ${companyCode}`
    );

    // Get company-specific Offboarding model
    const CompanyOffboarding = await getModelForCompany(
      companyCode,
      "Offboarding",
      offboardingSchema
    );

    const offboardings = await CompanyOffboarding.find({ stage }).sort({
      createdAt: -1,
    });
    res.status(200).json(offboardings);
  } catch (error) {
    console.error("Error fetching offboardings by stage:", error);
    res.status(400).json({ message: error.message });
  }
};

export const getOffboardingsByDepartment = async (req, res) => {
  try {
    // Get company code from authenticated user
    const companyCode = req.companyCode;

    if (!companyCode) {
      return res.status(401).json({
        error: "Authentication required",
        message: "Company code not found in request",
      });
    }

    const { department } = req.params;

    console.log(
      `Fetching offboardings by department ${department} for company: ${companyCode}`
    );

    // Get company-specific Offboarding model
    const CompanyOffboarding = await getModelForCompany(
      companyCode,
      "Offboarding",
      offboardingSchema
    );

    const offboardings = await CompanyOffboarding.find({ department }).sort({
      createdAt: -1,
    });
    res.status(200).json(offboardings);
  } catch (error) {
    console.error("Error fetching offboardings by department:", error);
    res.status(400).json({ message: error.message });
  }
};

export const getOffboardingsByManager = async (req, res) => {
  try {
    // Get company code from authenticated user
    const companyCode = req.companyCode;

    if (!companyCode) {
      return res.status(401).json({
        error: "Authentication required",
        message: "Company code not found in request",
      });
    }

    const { manager } = req.params;

    console.log(
      `Fetching offboardings by manager ${manager} for company: ${companyCode}`
    );

    // Get company-specific Offboarding model
    const CompanyOffboarding = await getModelForCompany(
      companyCode,
      "Offboarding",
      offboardingSchema
    );

    const offboardings = await CompanyOffboarding.find({ manager }).sort({
      createdAt: -1,
    });
    res.status(200).json(offboardings);
  } catch (error) {
    console.error("Error fetching offboardings by manager:", error);
    res.status(400).json({ message: error.message });
  }
};

export const updateAssetStatus = async (req, res) => {
  try {
    // Get company code from authenticated user
    const companyCode = req.companyCode;

    if (!companyCode) {
      return res.status(401).json({
        error: "Authentication required",
        message: "Company code not found in request",
      });
    }

    const { id, assetIndex, status } = req.body;

    console.log(
      `Updating asset status for offboarding ${id} for company: ${companyCode}`
    );

    // Get company-specific Offboarding model
    const CompanyOffboarding = await getModelForCompany(
      companyCode,
      "Offboarding",
      offboardingSchema
    );

    const offboarding = await CompanyOffboarding.findById(id);

    if (!offboarding) {
      return res.status(404).json({ message: "Offboarding record not found" });
    }

    if (!offboarding.assets || assetIndex >= offboarding.assets.length) {
      return res.status(400).json({ message: "Asset not found" });
    }

    offboarding.assets[assetIndex].status = status;
    const updatedOffboarding = await offboarding.save();

    res.status(200).json(updatedOffboarding);
  } catch (error) {
    console.error("Error updating asset status:", error);
    res.status(400).json({ message: error.message });
  }
};

export const updateClearanceStatus = async (req, res) => {
  try {
    // Get company code from authenticated user
    const companyCode = req.companyCode;

    if (!companyCode) {
      return res.status(401).json({
        error: "Authentication required",
        message: "Company code not found in request",
      });
    }

    const { id, department, status } = req.body;

    console.log(
      `Updating clearance status for offboarding ${id} for company: ${companyCode}`
    );

    // Get company-specific Offboarding model
    const CompanyOffboarding = await getModelForCompany(
      companyCode,
      "Offboarding",
      offboardingSchema
    );

    const offboarding = await CompanyOffboarding.findById(id);

    if (!offboarding) {
      return res.status(404).json({ message: "Offboarding record not found" });
    }

    if (!offboarding.clearanceStatus) {
      offboarding.clearanceStatus = {};
    }

    // Update the specific department's clearance status
    offboarding.clearanceStatus[department] = status;

    // Check if all clearances are completed
    const { hr, it, finance, admin } = offboarding.clearanceStatus;
    offboarding.exitChecklistCompleted = hr && it && finance && admin;

    const updatedOffboarding = await offboarding.save();

    res.status(200).json(updatedOffboarding);
  } catch (error) {
    console.error("Error updating clearance status:", error);
    res.status(400).json({ message: error.message });
  }
};

export const completeOffboarding = async (req, res) => {
  try {
    // Get company code from authenticated user
    const companyCode = req.companyCode;

    if (!companyCode) {
      return res.status(401).json({
        error: "Authentication required",
        message: "Company code not found in request",
      });
    }

    const { id } = req.params;

    console.log(`Completing offboarding ${id} for company: ${companyCode}`);

    // Get company-specific Offboarding model
    const CompanyOffboarding = await getModelForCompany(
      companyCode,
      "Offboarding",
      offboardingSchema
    );

    const offboarding = await CompanyOffboarding.findById(id);

    if (!offboarding) {
      return res.status(404).json({ message: "Offboarding record not found" });
    }

    // Check if all clearances are completed
    if (!offboarding.exitChecklistCompleted) {
      return res
        .status(400)
        .json({
          message:
            "Cannot complete offboarding until all clearances are approved",
        });
    }

    offboarding.officiallyOffboarded = true;
    offboarding.officiallyOffboardedDate = new Date();

    const updatedOffboarding = await offboarding.save();

    res.status(200).json(updatedOffboarding);
  } catch (error) {
    console.error("Error completing offboarding:", error);
    res.status(400).json({ message: error.message });
  }
};

export const getOffboardingStats = async (req, res) => {
  try {
    // Get company code from authenticated user
    const companyCode = req.companyCode;

    if (!companyCode) {
      return res.status(401).json({
        error: "Authentication required",
        message: "Company code not found in request",
      });
    }

    console.log(`Fetching offboarding stats for company: ${companyCode}`);

    // Get company-specific Offboarding model
    const CompanyOffboarding = await getModelForCompany(
      companyCode,
      "Offboarding",
      offboardingSchema
    );

    // Get counts by stage
    const noticePeriodCount = await CompanyOffboarding.countDocuments({
      stage: "Notice Period",
    });
    const exitInterviewCount = await CompanyOffboarding.countDocuments({
      stage: "Exit Interview",
    });
    const workHandoverCount = await CompanyOffboarding.countDocuments({
      stage: "Work Handover",
    });
    const clearanceProcessCount = await CompanyOffboarding.countDocuments({
      stage: "Clearance Process",
    });

    // Get counts for completed offboardings
    const completedCount = await CompanyOffboarding.countDocuments({
      officiallyOffboarded: true,
    });

    // Get counts by department
    const departments = await CompanyOffboarding.distinct("department");
    const departmentCounts = {};

    for (const dept of departments) {
      if (dept) {
        departmentCounts[dept] = await CompanyOffboarding.countDocuments({
          department: dept,
        });
      }
    }

    // Get monthly offboarding counts for the current year
    const currentYear = new Date().getFullYear();
    const startOfYear = new Date(currentYear, 0, 1);
    const endOfYear = new Date(currentYear, 11, 31);

    const monthlyOffboardings = await CompanyOffboarding.aggregate([
      {
        $match: {
          officiallyOffboardedDate: { $gte: startOfYear, $lte: endOfYear },
        },
      },
      {
        $group: {
          _id: { $month: "$officiallyOffboardedDate" },
          count: { $sum: 1 },
        },
      },
      {
        $sort: { _id: 1 },
      },
    ]);

    // Format monthly data
    const monthlyData = Array(12).fill(0);
    monthlyOffboardings.forEach((item) => {
      monthlyData[item._id - 1] = item.count;
    });

    const stats = {
      totalOffboardings: await CompanyOffboarding.countDocuments(),
      byStage: {
        noticePeriod: noticePeriodCount,
        exitInterview: exitInterviewCount,
        workHandover: workHandoverCount,
        clearanceProcess: clearanceProcessCount,
      },
      completed: completedCount,
      byDepartment: departmentCounts,
      monthlyData,
    };

    res.status(200).json(stats);
  } catch (error) {
    console.error("Error fetching offboarding stats:", error);
    res.status(500).json({ message: error.message });
  }
};

// export const uploadDocument = async (req, res) => {
//   try {
//     // Get company code from authenticated user
//     const companyCode = req.companyCode;

//     if (!companyCode) {
//       return res.status(401).json({
//         error: 'Authentication required',
//         message: 'Company code not found in request'
//       });
//     }

//     const { id } = req.params;

//     console.log(`Uploading document for offboarding ${id} for company: ${companyCode}`);

//     // Get company-specific Offboarding model
//     const CompanyOffboarding = await getModelForCompany(companyCode, 'Offboarding', offboardingSchema);

//     if (!req.file) {
//       return res.status(400).json({ message: 'No file uploaded' });
//     }

//     const offboarding = await CompanyOffboarding.findById(id);

//     if (!offboarding) {
//       return res.status(404).json({ message: 'Offboarding record not found' });
//     }

//     // Create a document path string instead of an object
//     const documentPath = req.file.filename;

//     // If documents is a string field, append the new path
//     if (typeof offboarding.documents === 'string') {
//       offboarding.documents = offboarding.documents
//         ? `${offboarding.documents},${documentPath}`
//         : documentPath;
//     }
//     // If documents is an array of strings
//     else if (Array.isArray(offboarding.documents) &&
//              (offboarding.documents.length === 0 || typeof offboarding.documents[0] === 'string')) {
//       if (!offboarding.documents) {
//         offboarding.documents = [];
//       }
//       offboarding.documents.push(documentPath);
//     }
//     // If documents is an array of objects (as intended)
//     else {
//       const newDocument = {
//         name: req.file.originalname,
//         type: req.file.mimetype,
//         path: req.file.filename,
//         uploadedAt: new Date()
//       };

//       if (!offboarding.documents) {
//         offboarding.documents = [];
//       }

//       offboarding.documents.push(newDocument);
//     }

//     const updatedOffboarding = await offboarding.save();

//     res.status(200).json(updatedOffboarding);
//   } catch (error) {
//     console.error('Error uploading document:', error);
//     res.status(400).json({ message: error.message });
//   }
// };

export const uploadDocument = async (req, res) => {
  console.log('=== UPLOAD DOCUMENT FUNCTION CALLED ===');
  console.log('Request method:', req.method);
  console.log('Request URL:', req.url);
  console.log('Request params:', req.params);
  console.log('Request headers:', req.headers);
  console.log('Request body:', req.body);
  console.log('Request file:', req.file);
  console.log('Request files:', req.files);
  console.log('Company code:', req.companyCode);
  
  try {
    // Get company code from authenticated user
    const companyCode = req.companyCode;

    if (!companyCode) {
      console.log('ERROR: No company code found');
      return res.status(401).json({
        error: "Authentication required",
        message: "Company code not found in request",
      });
    }

    const { id } = req.params;
    console.log(`Processing upload for offboarding ID: ${id}, company: ${companyCode}`);

    // Check if file was uploaded
    if (!req.file) {
      console.log('ERROR: No file found in request');
      console.log('Available request properties:', Object.keys(req));
      return res.status(400).json({ message: "No file uploaded" });
    }

    console.log('File details:', {
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      filename: req.file.filename,
      path: req.file.path
    });

    // Get company-specific Offboarding model
    const CompanyOffboarding = await getModelForCompany(
      companyCode,
      "Offboarding",
      offboardingSchema
    );

    const offboarding = await CompanyOffboarding.findById(id);

    if (!offboarding) {
      console.log(`ERROR: Offboarding record not found for ID: ${id}`);
      // Clean up uploaded file if offboarding not found
      if (fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(404).json({ message: "Offboarding record not found" });
    }

    console.log('Found offboarding record:', offboarding._id);

    // Get document type from request body or use default
    const documentType = req.body.title || req.body.documentType || 'Document';

    // Create a new document object with all required fields
    const newDocument = {
      name: req.file.originalname,
      type: documentType,
      path: req.file.filename, // Store just the filename, not the full path
      size: req.file.size,
      uploadedAt: new Date(),
      uploadedBy: req.headers['user-id'] || 'system'
    };

    console.log('New document object:', newDocument);

    // Initialize documents array if it doesn't exist
    if (!offboarding.documents) {
      offboarding.documents = [];
    }

    // Add the new document to the array
    offboarding.documents.push(newDocument);

    // Save the updated offboarding record
    const updatedOffboarding = await offboarding.save();

    console.log('Document uploaded successfully');

    res.status(200).json({
      message: 'Document uploaded successfully',
      document: newDocument,
      offboarding: updatedOffboarding
    });
  } catch (error) {
    console.error("ERROR in uploadDocument:", error);
    
    // Clean up uploaded file if there was an error
    if (req.file && fs.existsSync(req.file.path)) {
      try {
        fs.unlinkSync(req.file.path);
        console.log('Cleaned up uploaded file after error');
      } catch (cleanupError) {
        console.error('Error cleaning up file:', cleanupError);
      }
    }
    
    res.status(500).json({ message: error.message });
  }
};

// Add this function to offboardingController.js
export const downloadDocument = async (req, res) => {
  try {
    const { filename } = req.params;
    const filePath = path.join(__dirname, '..', 'uploads', 'offboarding', companyCode, filename);

    
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: 'File not found' });
    }
    
    // Set appropriate headers for file download
    res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
    res.setHeader('Content-Type', 'application/octet-stream');
    
    // Send the file
    res.sendFile(filePath);
  } catch (error) {
    console.error('Error downloading document:', error);
    res.status(500).json({ message: error.message });
  }
};


export const deleteDocument = async (req, res) => {
  try {
    // Get company code from authenticated user
    const companyCode = req.companyCode;

    if (!companyCode) {
      return res.status(401).json({
        error: "Authentication required",
        message: "Company code not found in request",
      });
    }

    const { id, documentIndex } = req.params;

    console.log(
      `Deleting document for offboarding ${id} for company: ${companyCode}`
    );

    // Get company-specific Offboarding model
    const CompanyOffboarding = await getModelForCompany(
      companyCode,
      "Offboarding",
      offboardingSchema
    );

    const offboarding = await CompanyOffboarding.findById(id);

    if (!offboarding) {
      return res.status(404).json({ message: "Offboarding record not found" });
    }

    if (
      !offboarding.documents ||
      documentIndex >= offboarding.documents.length
    ) {
      return res.status(400).json({ message: "Document not found" });
    }

    // Delete the file from the filesystem
    const documentPath = offboarding.documents[documentIndex].path;
    const filePath = path.join(__dirname, "..", "uploads", documentPath);

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // Remove the document from the array
    offboarding.documents.splice(documentIndex, 1);
    const updatedOffboarding = await offboarding.save();

    res.status(200).json(updatedOffboarding);
  } catch (error) {
    console.error("Error deleting document:", error);
    res.status(400).json({ message: error.message });
  }
};

export const getOffboardingsByDateRange = async (req, res) => {
  try {
    // Get company code from authenticated user
    const companyCode = req.companyCode;

    if (!companyCode) {
      return res.status(401).json({
        error: "Authentication required",
        message: "Company code not found in request",
      });
    }

    const { startDate, endDate } = req.query;

    console.log(
      `Fetching offboardings by date range for company: ${companyCode}`
    );

    // Get company-specific Offboarding model
    const CompanyOffboarding = await getModelForCompany(
      companyCode,
      "Offboarding",
      offboardingSchema
    );

    const query = {};

    if (startDate && endDate) {
      query.startDate = { $gte: new Date(startDate) };
      query.endDate = { $lte: new Date(endDate) };
    } else if (startDate) {
      query.startDate = { $gte: new Date(startDate) };
    } else if (endDate) {
      query.endDate = { $lte: new Date(endDate) };
    }

    const offboardings = await CompanyOffboarding.find(query).sort({
      startDate: 1,
    });
    res.status(200).json(offboardings);
  } catch (error) {
    console.error("Error fetching offboardings by date range:", error);
    res.status(400).json({ message: error.message });
  }
};

export const searchOffboardings = async (req, res) => {
  try {
    // Get company code from authenticated user
    const companyCode = req.companyCode;

    if (!companyCode) {
      return res.status(401).json({
        error: "Authentication required",
        message: "Company code not found in request",
      });
    }

    const { term } = req.query;

    console.log(
      `Searching offboardings with term "${term}" for company: ${companyCode}`
    );

    // Get company-specific Offboarding model
    const CompanyOffboarding = await getModelForCompany(
      companyCode,
      "Offboarding",
      offboardingSchema
    );

    if (!term) {
      return res.status(400).json({ message: "Search term is required" });
    }

    const offboardings = await CompanyOffboarding.find({
      $or: [
        { employeeName: { $regex: term, $options: "i" } },
        { employeeId: { $regex: term, $options: "i" } },
        { department: { $regex: term, $options: "i" } },
        { position: { $regex: term, $options: "i" } },
        { manager: { $regex: term, $options: "i" } },
        { reason: { $regex: term, $options: "i" } },
      ],
    }).sort({ createdAt: -1 });

    res.status(200).json(offboardings);
  } catch (error) {
    console.error("Error searching offboardings:", error);
    res.status(400).json({ message: error.message });
  }
};
