import AssetHistory, { AssetHistorySchema } from '../models/AssetHistory.js';
import getModelForCompany from '../models/genericModelFactory.js';

// Get all assets
export const getAllAssets = async (req, res) => {
  try {
    // Get company code from authenticated user
    const companyCode = req.companyCode;
    
    if (!companyCode) {
      return res.status(401).json({ 
        error: 'Authentication required', 
        message: 'Company code not found in request' 
      });
    }
    
    console.log(`Fetching assets for company: ${companyCode}`);
    
    // Get company-specific AssetHistory model
    const CompanyAssetHistory = await getModelForCompany(companyCode, 'AssetHistory', AssetHistorySchema);
    
    const assets = await CompanyAssetHistory.find();
    res.json(assets);
  } catch (error) {
    console.error('Error fetching assets:', error);
    res.status(500).json({ 
      message: error.message,
      error: 'Error fetching assets'
    });
  }
};

// Create a new asset


// Add this validation function at the top of the file
const isAlphabeticOnly = (str) => {
  if (!str) return true; // Empty is valid
  return /^[A-Za-z\s]+$/.test(str);
};

// Update the createAsset function
// export const createAsset = async (req, res) => {
//   try {
//     // Get company code from authenticated user
//     const companyCode = req.companyCode;
    
//     if (!companyCode) {
//       return res.status(401).json({ 
//         error: 'Authentication required', 
//         message: 'Company code not found in request' 
//       });
//     }
    
//     // Extract asset data from request body
//     const { 
//       name, 
//       category, 
//       allottedDate, 
//       returnDate, 
//       status, 
//       batch, 
//       currentEmployee,
//       previousEmployees 
//     } = req.body;
    
//     // Validate employee names
//     if (currentEmployee && !isAlphabeticOnly(currentEmployee)) {
//       return res.status(400).json({
//         error: 'Validation error',
//         message: 'Current employee name should contain only alphabetic characters'
//       });
//     }
    
//     if (previousEmployees && Array.isArray(previousEmployees)) {
//       for (const emp of previousEmployees) {
//         if (!isAlphabeticOnly(emp)) {
//           return res.status(400).json({
//             error: 'Validation error',
//             message: 'Previous employee names should contain only alphabetic characters'
//           });
//         }
//       }
//     }
//      // Save the asset
//     const newAsset = await asset.save();
//     res.status(201).json(newAsset);
//   } catch (error) {
//     console.error('Error creating asset:', error);
//     res.status(400).json({ 
//       message: error.message,
//       error: 'Error creating asset'
//     });
//   }
// };

// export const createAsset = async (req, res) => {
//   try {
//     // Get company code from authenticated user
//     const companyCode = req.companyCode;
    
//     if (!companyCode) {
//       return res.status(401).json({ 
//         error: 'Authentication required', 
//         message: 'Company code not found in request' 
//       });
//     }
    
//     console.log(`Creating asset for company: ${companyCode}`);
//     console.log("Request body:", req.body);
    
//     // Get company-specific AssetHistory model
//     const CompanyAssetHistory = await getModelForCompany(companyCode, 'AssetHistory', AssetHistorySchema);
    
//     // Extract asset data from request body
//     const { 
//       name, 
//       category, 
//       allottedDate, 
//       returnDate, 
//       status, 
//       batch, 
//       currentEmployee,
//       previousEmployees 
//     } = req.body;
    
//     // Validate required fields
//     if (!name) {
//       return res.status(400).json({ 
//         error: 'Validation error', 
//         message: 'Asset name is required' 
//       });
//     }
    
//     if (!category) {
//       return res.status(400).json({ 
//         error: 'Validation error', 
//         message: 'Category is required' 
//       });
//     }
    
//     if (!status) {
//       return res.status(400).json({ 
//         error: 'Validation error', 
//         message: 'Status is required' 
//       });
//     }
    
//     // Create asset object with only the fields that have values
//     const assetData = {
//       name,
//       category,
//       status
//     };
    
//     // Only add optional fields if they have values
//     if (batch) assetData.batch = batch;
//     if (currentEmployee) assetData.currentEmployee = currentEmployee;
    
//     // Handle previousEmployees properly
//     if (previousEmployees) {
//       if (Array.isArray(previousEmployees)) {
//         assetData.previousEmployees = previousEmployees;
//       } else if (typeof previousEmployees === 'string') {
//         assetData.previousEmployees = previousEmployees
//           .split(',')
//           .map(emp => emp.trim())
//           .filter(emp => emp !== '');
//       } else {
//         assetData.previousEmployees = [];
//       }
//     } else {
//       assetData.previousEmployees = [];
//     }
    
//     // Handle dates
//     if (allottedDate) {
//       try {
//         assetData.allottedDate = new Date(allottedDate);
//       } catch (e) {
//         return res.status(400).json({
//           error: 'Validation error',
//           message: 'Invalid allotted date format'
//         });
//       }
//     }
    
//     if (returnDate) {
//       try {
//         assetData.returnDate = new Date(returnDate);
//       } catch (e) {
//         return res.status(400).json({
//           error: 'Validation error',
//           message: 'Invalid return date format'
//         });
//       }
//     }
    
//     console.log("Creating asset with data:", assetData);
    
//     // Create and save the asset
//     const asset = new CompanyAssetHistory(assetData);
//     const newAsset = await asset.save();
    
//     console.log("Asset created successfully:", newAsset._id);
//     res.status(201).json(newAsset);
//   } catch (error) {
//     console.error('Error creating asset:', error);
    
//     // Provide detailed error messages based on the type of error
//     if (error.name === 'ValidationError') {
//       // Mongoose validation error
//       const validationErrors = Object.values(error.errors).map(err => err.message);
//       return res.status(400).json({ 
//         error: 'Validation error',
//         message: validationErrors.join(', '),
//         details: validationErrors
//       });
//     } else if (error.name === 'MongoError' && error.code === 11000) {
//       // Duplicate key error
//       return res.status(400).json({
//         error: 'Duplicate error',
//         message: 'An asset with this information already exists'
//       });
//     }
    
//     // Generic error
//     res.status(400).json({ 
//       error: 'Error creating asset',
//       message: error.message
//     });
//   }
// };


// export const createAsset = async (req, res) => {
//   try {
//     // Get company code from authenticated user
//     const companyCode = req.companyCode;
    
//     if (!companyCode) {
//       return res.status(401).json({ 
//         error: 'Authentication required', 
//         message: 'Company code not found in request' 
//       });
//     }
    
//     console.log(`Creating asset for company: ${companyCode}`);
//     console.log("Request body:", req.body);
    
//     // Get company-specific AssetHistory model
//     const CompanyAssetHistory = await getModelForCompany(companyCode, 'AssetHistory', AssetHistorySchema);
    
//     // Extract asset data from request body
//     const { 
//       name, 
//       category, 
//       allottedDate, 
//       returnDate, 
//       status, 
//       batch, 
//       currentEmployee,
//       previousEmployees 
//     } = req.body;
    
//     // Validate required fields
//     if (!name) {
//       return res.status(400).json({ 
//         error: 'Validation error', 
//         message: 'Asset name is required' 
//       });
//     }
    
//     if (!category) {
//       return res.status(400).json({ 
//         error: 'Validation error', 
//         message: 'Category is required' 
//       });
//     }
    
//     if (!status) {
//       return res.status(400).json({ 
//         error: 'Validation error', 
//         message: 'Status is required' 
//       });
//     }
    
//     // Create asset object with only the fields that have values
//     const assetData = {
//       name,
//       category,
//       status
//     };
    
//     // Only add optional fields if they have values
//     if (batch) assetData.batch = batch;
    
//     // Always include employee data, even if empty
//     assetData.currentEmployee = currentEmployee || "";
    
//     // Handle previousEmployees properly
//     if (previousEmployees) {
//       if (Array.isArray(previousEmployees)) {
//         assetData.previousEmployees = previousEmployees.filter(emp => emp && emp.trim() !== "");
//       } else if (typeof previousEmployees === 'string') {
//         assetData.previousEmployees = previousEmployees
//           .split(',')
//           .map(emp => emp.trim())
//           .filter(emp => emp !== '');
//       } else {
//         assetData.previousEmployees = [];
//       }
//     } else {
//       assetData.previousEmployees = [];
//     }
    
//     // Handle dates
//     if (allottedDate) {
//       try {
//         assetData.allottedDate = new Date(allottedDate);
//       } catch (e) {
//         return res.status(400).json({
//           error: 'Validation error',
//           message: 'Invalid allotted date format'
//         });
//       }
//     }



    
//     if (returnDate) {
//       try {
//         assetData.returnDate = new Date(returnDate);
//       } catch (e) {
//         return res.status(400).json({
//           error: 'Validation error',
//           message: 'Invalid return date format'
//         });
//       }
//     }
    
//     console.log("Creating asset with data:", assetData);
    
//     // Create and save the asset
//     const asset = new CompanyAssetHistory(assetData);
//     const newAsset = await asset.save();
    
//     console.log("Asset created successfully:", newAsset._id);
//     res.status(201).json(newAsset);
//   } catch (error) {
//     console.error('Error creating asset:', error);
    
//     // Provide detailed error messages based on the type of error
//     if (error.name === 'ValidationError') {
//       // Mongoose validation error
//       const validationErrors = Object.values(error.errors).map(err => err.message);
//       return res.status(400).json({ 
//         error: 'Validation error',
//         message: validationErrors.join(', '),
//         details: validationErrors
//       });
//     } else if (error.name === 'MongoError' && error.code === 11000) {
//       // Duplicate key error
//       return res.status(400).json({
//         error: 'Duplicate error',
//         message: 'An asset with this information already exists'
//       });
//     }
    
//     // Generic error
//     res.status(400).json({ 
//       error: 'Error creating asset',
//       message: error.message
//     });
//   }
// };




export const createAsset = async (req, res) => {
  try {
    const companyCode = req.companyCode;
    
    if (!companyCode) {
      return res.status(401).json({ 
        error: 'Authentication required', 
        message: 'Company code not found in request' 
      });
    }
    
    console.log(`Creating asset for company: ${companyCode}`);
    console.log("Request body:", req.body);
    
    const CompanyAssetHistory = await getModelForCompany(companyCode, 'AssetHistory', AssetHistorySchema);
    
    const { 
      name, 
      category, 
      allottedDate, 
      returnDate, 
      status, 
      batch, 
      currentEmployee,
      previousEmployees 
    } = req.body;
    
    // Validate required fields
    if (!name || !category || !status) {
      return res.status(400).json({ 
        error: 'Validation error', 
        message: 'Asset name, category, and status are required' 
      });
    }
    
    // Create asset data
    const assetData = {
      name: name.trim(),
      category: category.trim(),
      status: status.trim(),
      batch: batch || "",
      currentEmployee: currentEmployee || "",
      previousEmployees: []
    };
    
    // Handle previousEmployees
    if (previousEmployees) {
      if (Array.isArray(previousEmployees)) {
        assetData.previousEmployees = previousEmployees.filter(emp => emp && emp.trim() !== "");
      } else if (typeof previousEmployees === 'string') {
        assetData.previousEmployees = previousEmployees
          .split(',')
          .map(emp => emp.trim())
          .filter(emp => emp !== '');
      }
    }
    
    // Handle dates only if provided
    if (allottedDate) {
      assetData.allottedDate = new Date(allottedDate);
    }
    
    if (returnDate) {
      assetData.returnDate = new Date(returnDate);
    }
    
    console.log("Creating asset with data:", assetData);
    
    const asset = new CompanyAssetHistory(assetData);
    const newAsset = await asset.save();
    
    console.log("Asset created successfully:", newAsset);
    res.status(201).json(newAsset);
  } catch (error) {
    console.error('Error creating asset:', error);
    res.status(400).json({ 
      error: 'Error creating asset',
      message: error.message
    });
  }
};

// Update the updateAsset function
// export const updateAsset = async (req, res) => {
//   try {
//     // Get company code from authenticated user
//     const companyCode = req.companyCode;
    
//     if (!companyCode) {
//       return res.status(401).json({ 
//         error: 'Authentication required', 
//         message: 'Company code not found in request' 
//       });
//     }
    
//     // Extract asset data from request body
//     const { 
//       name,
//       category,
//       status, 
//       returnDate, 
//       allottedDate, 
//       currentEmployee, 
//       previousEmployees,
//       batch 
//     } = req.body;
    
//     // Validate employee names
//     if (currentEmployee && !isAlphabeticOnly(currentEmployee)) {
//       return res.status(400).json({
//         error: 'Validation error',
//         message: 'Current employee name should contain only alphabetic characters'
//       });
//     }
    
//     if (previousEmployees && Array.isArray(previousEmployees)) {
//       for (const emp of previousEmployees) {
//         if (!isAlphabeticOnly(emp)) {
//           return res.status(400).json({
//             error: 'Validation error',
//             message: 'Previous employee names should contain only alphabetic characters'
//           });
//         }
//       }
//     }

//     if (!asset) {
//       return res.status(404).json({ message: 'Asset not found' });
//     }
    
//     res.json(asset);
//   } catch (error) {
//     console.error('Error updating asset:', error);
//     res.status(400).json({ 
//       message: error.message,
//       error: 'Error updating asset'
//     });
//   }
// };

// export const updateAsset = async (req, res) => {
//   try {
//     // Get company code from authenticated user
//     const companyCode = req.companyCode;
    
//     if (!companyCode) {
//       return res.status(401).json({ 
//         error: 'Authentication required', 
//         message: 'Company code not found in request' 
//       });
//     }
    
//     const assetId = req.params.id;
//     if (!assetId) {
//       return res.status(400).json({
//         error: 'Validation error',
//         message: 'Asset ID is required'
//       });
//     }
    
//     console.log(`Updating asset ${assetId} for company: ${companyCode}`);
//     console.log("Update request body:", req.body);
    
//     // Get company-specific AssetHistory model
//     const CompanyAssetHistory = await getModelForCompany(companyCode, 'AssetHistory', AssetHistorySchema);
    
//     // Check if the asset exists
//     const existingAsset = await CompanyAssetHistory.findById(assetId);
//     if (!existingAsset) {
//       return res.status(404).json({ 
//         error: 'Not found',
//         message: 'Asset not found' 
//       });
//     }
    
//     // Extract asset data from request body
//     const { 
//       name,
//       category,
//       status, 
//       returnDate, 
//       allottedDate, 
//       currentEmployee, 
//       previousEmployees,
//       batch 
//     } = req.body;
    
//     // Validate required fields
//     if (!name) {
//       return res.status(400).json({ 
//         error: 'Validation error', 
//         message: 'Asset name is required' 
//       });
//     }
    
//     if (!category) {
//       return res.status(400).json({ 
//         error: 'Validation error', 
//         message: 'Category is required' 
//       });
//     }
    
//     if (!status) {
//       return res.status(400).json({ 
//         error: 'Validation error', 
//         message: 'Status is required' 
//       });
//     }
    
//     // Create update object with only the fields that have values
//     const updateData = {
//       name,
//       category,
//       status
//     };
    
//     // Only add optional fields if they have values
//     if (batch !== undefined) updateData.batch = batch;
//     if (currentEmployee !== undefined) updateData.currentEmployee = currentEmployee;
    
//     // Handle previousEmployees properly
//     if (previousEmployees !== undefined) {
//       if (Array.isArray(previousEmployees)) {
//         updateData.previousEmployees = previousEmployees;
//       } else if (typeof previousEmployees === 'string') {
//         updateData.previousEmployees = previousEmployees
//           .split(',')
//           .map(emp => emp.trim())
//           .filter(emp => emp !== '');
//       } else {
//         updateData.previousEmployees = [];
//       }
//     }
    
//     // Handle dates
//     if (allottedDate) {
//       try {
//         updateData.allottedDate = new Date(allottedDate);
//       } catch (e) {
//         return res.status(400).json({
//           error: 'Validation error',
//           message: 'Invalid allotted date format'
//         });
//       }
//     }
    
//     if (returnDate) {
//       try {
//         updateData.returnDate = new Date(returnDate);
//       } catch (e) {
//         return res.status(400).json({
//           error: 'Validation error',
//           message: 'Invalid return date format'
//         });
//       }
//     }
    
//     console.log("Updating asset with data:", updateData);
    
//     // Update the asset
//     const updatedAsset = await CompanyAssetHistory.findByIdAndUpdate(
//       assetId,
//       updateData,
//       { new: true, runValidators: true }
//     );

//     if (!updatedAsset) {
//       return res.status(404).json({ 
//         error: 'Not found',
//         message: 'Asset not found after update' 
//       });
//     }
    
//     console.log("Asset updated successfully:", updatedAsset._id);
//     res.json(updatedAsset);
//   } catch (error) {
//     console.error('Error updating asset:', error);
    
//     // Provide detailed error messages based on the type of error
//     if (error.name === 'ValidationError') {
//       // Mongoose validation error
//       const validationErrors = Object.values(error.errors).map(err => err.message);
//       return res.status(400).json({ 
//         error: 'Validation error',
//         message: validationErrors.join(', '),
//         details: validationErrors
//       });
//     } else if (error.name === 'CastError' && error.kind === 'ObjectId') {
//       return res.status(400).json({
//         error: 'Invalid ID',
//         message: 'The provided asset ID is invalid'
//       });
//     }
    
//     // Generic error
//     res.status(400).json({ 
//       error: 'Error updating asset',
//       message: error.message
//     });
//   }
// };

// export const updateAsset = async (req, res) => {
//   try {
//     // Get company code from authenticated user
//     const companyCode = req.companyCode;
    
//     if (!companyCode) {
//       return res.status(401).json({ 
//         error: 'Authentication required', 
//         message: 'Company code not found in request' 
//       });
//     }
    
//     const assetId = req.params.id;
//     if (!assetId) {
//       return res.status(400).json({
//         error: 'Validation error',
//         message: 'Asset ID is required'
//       });
//     }
    
//     console.log(`Updating asset ${assetId} for company: ${companyCode}`);
//     console.log("Update request body:", req.body);
    
//     // Get company-specific AssetHistory model
//     const CompanyAssetHistory = await getModelForCompany(companyCode, 'AssetHistory', AssetHistorySchema);
    
//     // Check if the asset exists
//     const existingAsset = await CompanyAssetHistory.findById(assetId);
//     if (!existingAsset) {
//       return res.status(404).json({ 
//         error: 'Not found',
//         message: 'Asset not found' 
//       });
//     }
    
//     // Extract asset data from request body
//     const { 
//       name,
//       category,
//       status, 
//       returnDate, 
//       allottedDate, 
//       currentEmployee, 
//       previousEmployees,
//       batch 
//     } = req.body;
    
//     // Validate required fields
//     if (!name) {
//       return res.status(400).json({ 
//         error: 'Validation error', 
//         message: 'Asset name is required' 
//       });
//     }
    
//     if (!category) {
//       return res.status(400).json({ 
//         error: 'Validation error', 
//         message: 'Category is required' 
//       });
//     }
    
//     if (!status) {
//       return res.status(400).json({ 
//         error: 'Validation error', 
//         message: 'Status is required' 
//       });
//     }
    
//     // Create update object with required fields
//     const updateData = {
//       name,
//       category,
//       status
//     };
    
//     // Add batch if provided
//     if (batch !== undefined) updateData.batch = batch;
    
//     // Always include currentEmployee, even if empty
//     updateData.currentEmployee = currentEmployee !== undefined ? currentEmployee : "";
    
//     // Handle previousEmployees properly
//     if (previousEmployees !== undefined) {
//       if (Array.isArray(previousEmployees)) {
//         updateData.previousEmployees = previousEmployees.filter(emp => emp && emp.trim() !== "");
//       } else if (typeof previousEmployees === 'string') {
//         updateData.previousEmployees = previousEmployees
//           .split(',')
//           .map(emp => emp.trim())
//           .filter(emp => emp !== '');
//       } else {
//         updateData.previousEmployees = [];
//       }
//     } else {
//       // If previousEmployees is not provided, keep the existing value
//       updateData.previousEmployees = existingAsset.previousEmployees || [];
//     }
    
//     // Handle dates
//     if (allottedDate) {
//       try {
//         updateData.allottedDate = new Date(allottedDate);
//       } catch (e) {
//         return res.status(400).json({
//           error: 'Validation error',
//           message: 'Invalid allotted date format'
//         });
//       }
//     }
    
//     if (returnDate) {
//       try {
//         updateData.returnDate = new Date(returnDate);
//       } catch (e) {
//         return res.status(400).json({
//           error: 'Validation error',
//           message: 'Invalid return date format'
//         });
//       }
//     }
    
//     console.log("Updating asset with data:", updateData);
    
//     // Update the asset
//     const updatedAsset = await CompanyAssetHistory.findByIdAndUpdate(
//       assetId,
//       updateData,
//       { new: true, runValidators: true }
//     );

//     if (!updatedAsset) {
//       return res.status(404).json({ 
//         error: 'Not found',
//         message: 'Asset not found after update' 
//       });
//     }
    
//     console.log("Asset updated successfully:", updatedAsset._id);
//     res.json(updatedAsset);
//   } catch (error) {
//     console.error('Error updating asset:', error);
//     // Provide detailed error messages based on the type of error
//     if (error.name === 'ValidationError') {
//       // Mongoose validation error
//       const validationErrors = Object.values(error.errors).map(err => err.message);
//       return res.status(400).json({ 
//         error: 'Validation error',
//         message: validationErrors.join(', '),
//         details: validationErrors
//       });
//     } else if (error.name === 'CastError' && error.kind === 'ObjectId') {
//       return res.status(400).json({
//         error: 'Invalid ID',
//         message: 'The provided asset ID is invalid'
//       });
//     }
    
//     // Generic error
//     res.status(400).json({ 
//       error: 'Error updating asset',
//       message: error.message
//     });
//   }
// };




export const updateAsset = async (req, res) => {
  try {
    const companyCode = req.companyCode;
    
    if (!companyCode) {
      return res.status(401).json({ 
        error: 'Authentication required', 
        message: 'Company code not found in request' 
      });
    }
    
    const assetId = req.params.id;
    console.log(`Updating asset ${assetId} for company: ${companyCode}`);
    console.log("Update request body:", req.body);
    
    const CompanyAssetHistory = await getModelForCompany(companyCode, 'AssetHistory', AssetHistorySchema);
    
    const existingAsset = await CompanyAssetHistory.findById(assetId);
    if (!existingAsset) {
      return res.status(404).json({ 
        error: 'Not found',
        message: 'Asset not found' 
      });
    }
    
    const { 
      name,
      category,
      status, 
      returnDate, 
      allottedDate, 
      currentEmployee, 
      previousEmployees,
      batch 
    } = req.body;
    
    // Validate required fields
    if (!name || !category || !status) {
      return res.status(400).json({ 
        error: 'Validation error', 
        message: 'Asset name, category, and status are required' 
      });
    }
    
    // Create update data
    const updateData = {
      name: name.trim(),
      category: category.trim(),
      status: status.trim(),
      batch: batch || "",
      currentEmployee: currentEmployee || ""
    };
    
    // Handle previousEmployees
    if (previousEmployees !== undefined) {
      if (Array.isArray(previousEmployees)) {
        updateData.previousEmployees = previousEmployees.filter(emp => emp && emp.trim() !== "");
      } else if (typeof previousEmployees === 'string') {
        updateData.previousEmployees = previousEmployees
          .split(',')
          .map(emp => emp.trim())
          .filter(emp => emp !== '');
      } else {
        updateData.previousEmployees = [];
      }
    }
    
    // Handle dates
    if (allottedDate) {
      updateData.allottedDate = new Date(allottedDate);
    }
    
    if (returnDate) {
      updateData.returnDate = new Date(returnDate);
    }
    
    console.log("Updating asset with data:", updateData);
    
    const updatedAsset = await CompanyAssetHistory.findByIdAndUpdate(
      assetId,
      updateData,
      { new: true, runValidators: true }
    );

    if (!updatedAsset) {
      return res.status(404).json({ 
        error: 'Not found',
        message: 'Asset not found after update' 
      });
    }
    
    console.log("Asset updated successfully:", updatedAsset);
    res.json(updatedAsset);
  } catch (error) {
    console.error('Error updating asset:', error);
    res.status(400).json({ 
      error: 'Error updating asset',
      message: error.message
    });
  }
};

// Delete an asset
export const deleteAsset = async (req, res) => {
  try {
    // Get company code from authenticated user
    const companyCode = req.companyCode;
    
    if (!companyCode) {
      return res.status(401).json({ 
        error: 'Authentication required', 
        message: 'Company code not found in request' 
      });
    }
    
    console.log(`Deleting asset ${req.params.id} for company: ${companyCode}`);
    
    // Get company-specific AssetHistory model
    const CompanyAssetHistory = await getModelForCompany(companyCode, 'AssetHistory', AssetHistorySchema);
    
    // Delete the asset
    const asset = await CompanyAssetHistory.findByIdAndDelete(req.params.id);
    
    if (!asset) {
      return res.status(404).json({ message: 'Asset not found' });
    }
    
    res.json({ message: 'Asset deleted' });
  } catch (error) {
    console.error('Error deleting asset:', error);
    res.status(500).json({ 
      message: error.message,
      error: 'Error deleting asset'
    });
  }
};

// Get summary data for the dashboard
export const getSummaryData = async (req, res) => {
  try {
    // Get company code from authenticated user
    const companyCode = req.companyCode;
    
    if (!companyCode) {
      return res.status(401).json({ 
        error: 'Authentication required', 
        message: 'Company code not found in request' 
      });
    }
    
    console.log(`Fetching asset summary data for company: ${companyCode}`);
    
    // Get company-specific AssetHistory model
    const CompanyAssetHistory = await getModelForCompany(companyCode, 'AssetHistory', AssetHistorySchema);
    
    // Get total count of assets
    const totalAssets = await CompanyAssetHistory.countDocuments();

    // Get count of assets currently in use
    const assetsInUse = await CompanyAssetHistory.countDocuments({ status: 'In Use' });

    // Group by category and get the count of assets in each category
    const categoryData = await CompanyAssetHistory.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
        },
      },
    ]);

    // Group by status and get the count of assets in each status
    const statusData = await CompanyAssetHistory.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]);

    // Send the data as a response
    res.json({
      totalAssets,
      assetsInUse,
      categoryData,
      statusData,
    });
  } catch (error) {
    console.error('Error fetching summary data:', error);
    res.status(500).json({ 
      message: error.message,
      error: 'Error fetching summary data'
    });
  }
};
