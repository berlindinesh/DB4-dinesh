import AssetBatch, { assetBatchSchema } from '../models/AssetBatch.js';
import Asset from '../models/Asset.js';
import getModelForCompany from '../models/genericModelFactory.js';

// Get all asset batches
export const getAllAssetBatches = async (req, res) => {
  try {
    // Get company code from authenticated user
    const companyCode = req.companyCode;
    
    if (!companyCode) {
      return res.status(401).json({ 
        error: 'Authentication required', 
        message: 'Company code not found in request' 
      });
    }
    
    console.log(`Fetching asset batches for company: ${companyCode}`);
    
    // Get company-specific AssetBatch model
    const CompanyAssetBatch = await getModelForCompany(companyCode, 'AssetBatch', assetBatchSchema);
    
    const batches = await CompanyAssetBatch.find().sort({ createdAt: -1 });
    res.status(200).json(batches);
  } catch (error) {
    res.status(500).json({ 
      message: error.message,
      error: 'Error fetching asset batches'
    });
  }
};

// Get a single batch by ID
export const getAssetBatchById = async (req, res) => {
  try {
    // Get company code from authenticated user
    const companyCode = req.companyCode;
    
    if (!companyCode) {
      return res.status(401).json({ 
        error: 'Authentication required', 
        message: 'Company code not found in request' 
      });
    }
    
    console.log(`Fetching asset batch ${req.params.id} for company: ${companyCode}`);
    
    // Get company-specific AssetBatch model
    const CompanyAssetBatch = await getModelForCompany(companyCode, 'AssetBatch', assetBatchSchema);
    
    const batch = await CompanyAssetBatch.findById(req.params.id);
    if (!batch) {
      return res.status(404).json({ message: 'Batch not found' });
    }
    res.status(200).json(batch);
  } catch (error) {
    res.status(500).json({ 
      message: error.message,
      error: 'Error fetching asset batch'
    });
  }
};

// Get a single batch by batch number
export const getAssetBatchByNumber = async (req, res) => {
  try {
    // Get company code from authenticated user
    const companyCode = req.companyCode;
    
    if (!companyCode) {
      return res.status(401).json({ 
        error: 'Authentication required', 
        message: 'Company code not found in request' 
      });
    }
    
    console.log(`Fetching asset batch by number ${req.params.batchNumber} for company: ${companyCode}`);
    
    // Get company-specific AssetBatch model
    const CompanyAssetBatch = await getModelForCompany(companyCode, 'AssetBatch', assetBatchSchema);
    
    const batch = await CompanyAssetBatch.findOne({ batchNumber: req.params.batchNumber });
    if (!batch) {
      return res.status(404).json({ message: 'Batch not found' });
    }
    res.status(200).json(batch);
  } catch (error) {
    res.status(500).json({ 
      message: error.message,
      error: 'Error fetching asset batch by number'
    });
  }
};

// Create a new asset batch
export const createAssetBatch = async (req, res) => {
  try {
    // Get company code from authenticated user
    const companyCode = req.companyCode;
    
    if (!companyCode) {
      return res.status(401).json({ 
        error: 'Authentication required', 
        message: 'Company code not found in request' 
      });
    }
    
    console.log(`Creating asset batch for company: ${companyCode}`);
    
    // Get company-specific AssetBatch model
    const CompanyAssetBatch = await getModelForCompany(companyCode, 'AssetBatch', assetBatchSchema);
    
    // Check if batch number already exists
    const existingBatch = await CompanyAssetBatch.findOne({ batchNumber: req.body.batchNumber });
    if (existingBatch) {
      return res.status(400).json({ message: 'Batch number already exists' });
    }
    
    const newBatch = new CompanyAssetBatch(req.body);
    const savedBatch = await newBatch.save();
    res.status(201).json(savedBatch);
  } catch (error) {
    res.status(400).json({ 
      message: error.message,
      error: 'Error creating asset batch'
    });
  }
};

// Update an asset batch
export const updateAssetBatch = async (req, res) => {
  try {
    // Get company code from authenticated user
    const companyCode = req.companyCode;
    
    if (!companyCode) {
      return res.status(401).json({ 
        error: 'Authentication required', 
        message: 'Company code not found in request' 
      });
    }
    
    console.log(`Updating asset batch ${req.params.id} for company: ${companyCode}`);
    
    // Get company-specific AssetBatch model
    const CompanyAssetBatch = await getModelForCompany(companyCode, 'AssetBatch', assetBatchSchema);
    
    // If batch number is being updated, check if the new number already exists
    if (req.body.batchNumber) {
      const existingBatch = await CompanyAssetBatch.findOne({ 
        batchNumber: req.body.batchNumber,
        _id: { $ne: req.params.id }
      });
      
      if (existingBatch) {
        return res.status(400).json({ message: 'Batch number already exists' });
      }
    }
    
    const updatedBatch = await CompanyAssetBatch.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!updatedBatch) {
      return res.status(404).json({ message: 'Batch not found' });
    }
    
    res.status(200).json(updatedBatch);
  } catch (error) {
    res.status(400).json({ 
      message: error.message,
      error: 'Error updating asset batch'
    });
  }
};

// Delete an asset batch
export const deleteAssetBatch = async (req, res) => {
  try {
    // Get company code from authenticated user
    const companyCode = req.companyCode;
    
    if (!companyCode) {
      return res.status(401).json({ 
        error: 'Authentication required', 
        message: 'Company code not found in request' 
      });
    }
    
    console.log(`Deleting asset batch ${req.params.id} for company: ${companyCode}`);
    
    // Get company-specific models
    const CompanyAssetBatch = await getModelForCompany(companyCode, 'AssetBatch', assetBatchSchema);
    
    // First check if the batch exists
    const batch = await CompanyAssetBatch.findById(req.params.id);
    if (!batch) {
      return res.status(404).json({ message: 'Batch not found' });
    }
    
    // Check if any assets are using this batch
    // Note: You'll need to update the Asset model similarly to work with company-specific databases
    // For now, we'll assume the Asset model has been updated
    const CompanyAsset = await getModelForCompany(companyCode, 'Asset', assetBatchSchema); 
    const assetsUsingBatch = await CompanyAsset.findOne({ batch: batch.batchNumber });
    
    if (assetsUsingBatch) {
      return res.status(400).json({ 
        message: 'Cannot delete batch because it is associated with one or more assets' 
      });
    }
    
    const deletedBatch = await CompanyAssetBatch.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: 'Batch deleted successfully' });
  } catch (error) {
    res.status(500).json({ 
      message: error.message,
      error: 'Error deleting asset batch'
    });
  }
};

// Get assets by batch
export const getAssetsByBatch = async (req, res) => {
  try {
    // Get company code from authenticated user
    const companyCode = req.companyCode;
    
    if (!companyCode) {
      return res.status(401).json({ 
        error: 'Authentication required', 
        message: 'Company code not found in request' 
      });
    }
    
    console.log(`Fetching assets for batch ${req.params.batchNumber} for company: ${companyCode}`);
    
    // Get company-specific Asset model
    const CompanyAsset = await getModelForCompany(companyCode, 'Asset', null); // Replace null with assetSchema when available
    
    const assets = await CompanyAsset.find({ batch: req.params.batchNumber });
    res.status(200).json(assets);
  } catch (error) {
    res.status(500).json({ 
      message: error.message,
      error: 'Error fetching assets by batch'
    });
  }
};
