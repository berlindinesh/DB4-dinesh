import Contract, { contractSchema } from '../models/payrollContractModel.js';
import getModelForCompany from '../models/genericModelFactory.js';
import path from 'path';
import fs from 'fs';

// Add this new function to handle document downloads
export const downloadContractDocument = async (req, res) => {
  try {
    const { filename } = req.params;
    
    if (!filename) {
      return res.status(400).json({ 
        success: false, 
        error: 'Filename is required' 
      });
    }
    
    // Construct the file path
    const filePath = path.join(process.cwd(), 'uploads', 'contracts', filename);
    
    console.log('Attempting to download file:', filePath);
    
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      console.log('File not found:', filePath);
      return res.status(404).json({ 
        success: false, 
        error: 'File not found' 
      });
    }
    
    // Get file stats
    const stats = fs.statSync(filePath);
    
    // Set appropriate headers
    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', stats.size);
    
    // Create read stream and pipe to response
    const fileStream = fs.createReadStream(filePath);
    
    fileStream.on('error', (error) => {
      console.error('Error reading file:', error);
      if (!res.headersSent) {
        res.status(500).json({ 
          success: false, 
          error: 'Error reading file' 
        });
      }
    });
    
    fileStream.pipe(res);
    
  } catch (error) {
    console.error('Download error:', error);
    if (!res.headersSent) {
      res.status(500).json({ 
        success: false, 
        error: 'Internal server error' 
      });
    }
  }
};

export const getContracts = async (req, res) => {
  try {
    // Get company code from authenticated user
    const companyCode = req.companyCode;
    
    if (!companyCode) {
      return res.status(401).json({ 
        error: 'Authentication required', 
        message: 'Company code not found in request' 
      });
    }
    
    console.log(`Fetching contracts for company: ${companyCode}`);
    
    // Get company-specific Contract model
    const CompanyContract = await getModelForCompany(companyCode, 'Contract', contractSchema);
    
    // Get contracts from company database
    const contracts = await CompanyContract.find();
    
    console.log(`Retrieved ${contracts.length} contracts for company ${companyCode}`);
    res.status(200).json({ success: true, data: contracts });
  } catch (error) {
    console.error(`Error fetching contracts:`, error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getContractById = async (req, res) => {
  try {
    // Get company code from authenticated user
    const companyCode = req.companyCode;
    
    if (!companyCode) {
      return res.status(401).json({ 
        error: 'Authentication required', 
        message: 'Company code not found in request' 
      });
    }
    
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ 
        success: false, 
        error: 'Contract ID is required' 
      });
    }
    
    console.log(`Fetching contract ${id} for company: ${companyCode}`);
    
    // Get company-specific Contract model
    const CompanyContract = await getModelForCompany(companyCode, 'Contract', contractSchema);
    
    // Get contract from company database
    const contract = await CompanyContract.findById(id);
    
    if (!contract) {
      return res.status(404).json({ success: false, error: 'Contract not found' });
    }
    
    res.status(200).json({ success: true, data: contract });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};


export const createContract = async (req, res) => {
  try {
    console.log('=== CREATE CONTRACT START ===');
    console.log('Creating contract - received data:', req.body);
    console.log('Uploaded file:', req.file);
    
    // Get company code from authenticated user
    const companyCode = req.companyCode;
    
    if (!companyCode) {
      return res.status(401).json({ 
        error: 'Authentication required', 
        message: 'Company code not found in request' 
      });
    }
    
    console.log(`Creating contract for company: ${companyCode}`);
    
    // Get company-specific Contract model
    const CompanyContract = await getModelForCompany(companyCode, 'Contract', contractSchema);
    
    // Prepare contract data
    const contractData = { ...req.body };
    
    // Handle file upload if present
    if (req.file) {
      console.log('✅ Processing uploaded file:', req.file);
      console.log('File details:', {
        filename: req.file.filename,
        originalname: req.file.originalname,
        path: req.file.path,
        size: req.file.size,
        mimetype: req.file.mimetype
      });
      
      contractData.contractDocument = {
        filename: req.file.filename,
        originalName: req.file.originalname,
        path: req.file.path,
        size: req.file.size,
        mimetype: req.file.mimetype,
        uploadDate: new Date()
      };
      
      console.log('✅ Contract document data saved:', contractData.contractDocument);
    } else {
      console.log('⚠️ No file uploaded');
    }
    
    // Convert string numbers to actual numbers
    if (contractData.basicSalary) {
      contractData.basicSalary = Number(contractData.basicSalary);
    }
    if (contractData.noticePeriod) {
      contractData.noticePeriod = Number(contractData.noticePeriod);
    }
    
    console.log('Final contract data:', contractData);
    
    const newContract = new CompanyContract(contractData);
    const savedContract = await newContract.save();
    
    console.log(`✅ Contract created successfully with ID: ${savedContract._id}`);
    
    // Log the saved contract document info
    if (savedContract.contractDocument) {
      console.log('✅ Saved contract document info:', savedContract.contractDocument);
    }
    
        console.log('=== CREATE CONTRACT END ===');
    
    res.status(201).json({ success: true, data: savedContract });
  }
  catch (error) {
    console.error('❌ Error creating contract:', error);
    res.status(400).json({ success: false, error: error.message });
  }
};

export const updateContract = async (req, res) => {
  try {
    console.log('=== UPDATE CONTRACT START ===');
    console.log('Updating contract - received data:', req.body);
    console.log('Uploaded file:', req.file);
    
    // Get company code from authenticated user
    const companyCode = req.companyCode;
    
    if (!companyCode) {
      return res.status(401).json({ 
        error: 'Authentication required', 
        message: 'Company code not found in request' 
      });
    }
    
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ 
        success: false, 
        error: 'Contract ID is required' 
      });
    }
    
    console.log(`Updating contract ${id} for company: ${companyCode}`);
    
    // Get company-specific Contract model
    const CompanyContract = await getModelForCompany(companyCode, 'Contract', contractSchema);
    
    const contract = await CompanyContract.findById(id);
    if (!contract) {
      return res.status(404).json({ success: false, error: 'Contract not found' });
    }
    
    console.log('Existing contract found:', contract._id);
    if (contract.contractDocument) {
      console.log('Existing document:', contract.contractDocument);
    }
    
    // Prepare update data
    const updateData = { ...req.body };
    
    // Handle file upload if present
    if (req.file) {
      console.log('✅ Processing uploaded file for update:', req.file);
      console.log('File details:', {
        filename: req.file.filename,
        originalname: req.file.originalname,
        path: req.file.path,
        size: req.file.size,
        mimetype: req.file.mimetype
      });
      
      updateData.contractDocument = {
        filename: req.file.filename,
        originalName: req.file.originalname,
        path: req.file.path,
        size: req.file.size,
        mimetype: req.file.mimetype,
        uploadDate: new Date()
      };
      
      console.log('✅ Updated contract document data:', updateData.contractDocument);
    } else {
      console.log('⚠️ No new file uploaded, keeping existing document');
    }
    
    // Convert string numbers to actual numbers
    if (updateData.basicSalary) {
      updateData.basicSalary = Number(updateData.basicSalary);
    }
    if (updateData.noticePeriod) {
      updateData.noticePeriod = Number(updateData.noticePeriod);
    }
    
    console.log('Final update data:', updateData);
    
    const updatedContract = await CompanyContract.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );
    
    console.log(`✅ Contract ${id} updated successfully`);
    
    // Log the updated contract document info
    if (updatedContract.contractDocument) {
      console.log('✅ Updated contract document info:', updatedContract.contractDocument);
    }
    
    console.log('=== UPDATE CONTRACT END ===');
    
    res.status(200).json({ success: true, data: updatedContract });
  } catch (error) {
    console.error(`❌ Error updating contract ${req.params.id}:`, error);
    res.status(400).json({ success: false, error: error.message });
  }
};



export const deleteContract = async (req, res) => {
  try {
    // Get company code from authenticated user
    const companyCode = req.companyCode;
    
    if (!companyCode) {
      return res.status(401).json({ 
        error: 'Authentication required', 
        message: 'Company code not found in request' 
      });
    }
    
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ 
        success: false, 
        error: 'Contract ID is required' 
      });
    }
    
    console.log(`Deleting contract ${id} for company: ${companyCode}`);
    
    // Get company-specific Contract model
    const CompanyContract = await getModelForCompany(companyCode, 'Contract', contractSchema);
    
    const contract = await CompanyContract.findById(req.params.id);
    if (!contract) {
      return res.status(404).json({ success: false, error: 'Contract not found' });
    }
    
    await CompanyContract.findByIdAndDelete(req.params.id);
    
    console.log(`Contract ${id} deleted successfully`);
    res.status(200).json({ success: true, message: 'Contract deleted successfully' });
  } catch (error) {
    console.error(`Error deleting contract ${req.params.id}:`, error);
    res.status(400).json({ success: false, error: error.message });
  }
};

export const filterContracts = async (req, res) => {
  try {
    // Get company code from authenticated user
    const companyCode = req.companyCode;
    
    if (!companyCode) {
      return res.status(401).json({ 
        error: 'Authentication required', 
        message: 'Company code not found in request' 
      });
    }
    
    const { 
      contractStatus, 
      employeeName, 
      wageType,
      department,
      minSalary,
      maxSalary,
      startDate,
      endDate,
      filingStatus
    } = req.query;
    
    console.log("Received filter query:", req.query);
    
    // Get company-specific Contract model
    const CompanyContract = await getModelForCompany(companyCode, 'Contract', contractSchema);
    
    const filter = {};

    // Handle employee name filter - frontend sends employeeName but schema has employee field
    if (employeeName) {
      filter.employee = { $regex: employeeName, $options: 'i' };
    }
    
    // Handle contract status filter - exact match
    if (contractStatus) {
      filter.contractStatus = contractStatus;
    }
    
    // Handle wage type filter - exact match
    if (wageType) {
      filter.wageType = wageType;
    }

    // Handle filing status filter - exact match
     if (filingStatus) {
      filter.filingStatus = filingStatus;
    }
    
    // Handle additional filters (these are optional but included for completeness)
    if (department) {
      filter.department = department;
    }
    
    if (startDate) {
      filter.startDate = { $gte: startDate };
    }
    
    if (endDate) {
      filter.endDate = { $lte: endDate };
    }
    
    if (minSalary || maxSalary) {
      filter.basicSalary = {};
      if (minSalary) {
        filter.basicSalary.$gte = Number(minSalary);
      }
      if (maxSalary) {
        filter.basicSalary.$lte = Number(maxSalary);
      }
    }
    
    console.log('Final filter query:', filter);
    
    const contracts = await CompanyContract.find(filter);
    console.log(`Found ${contracts.length} matching contracts`);
    
    res.status(200).json({ success: true, data: contracts });
  } catch (error) {
    console.error('Filter error:', error);
    res.status(400).json({ success: false, error: error.message });
  }
};

export const updateApprovalStatus = async (req, res) => {
  try {
    // Get company code from authenticated user
    const companyCode = req.companyCode;
    
    if (!companyCode) {
      return res.status(401).json({ 
        error: 'Authentication required', 
        message: 'Company code not found in request' 
      });
    }
    
    const { id } = req.params;
    const { approverName, approverRole, status, comments } = req.body;
    
    if (!approverName || !approverRole || !status) {
      return res.status(400).json({ 
        success: false, 
        error: 'Approver name, role and status are required' 
      });
    }
    
    // Get company-specific Contract model
    const CompanyContract = await getModelForCompany(companyCode, 'Contract', contractSchema);
    
    const contract = await CompanyContract.findById(id);
    if (!contract) {
      return res.status(404).json({ success: false, error: 'Contract not found' });
    }
    
    // Initialize approval status if it doesn't exist
    if (!contract.approvalStatus) {
      contract.approvalStatus = {
        status: 'Pending',
        approvers: []
      };
    }
    
    // Check if this approver already exists
    const approverIndex = contract.approvalStatus.approvers.findIndex(
      a => a.name === approverName && a.role === approverRole
    );
    
    if (approverIndex >= 0) {
      // Update existing approver
      contract.approvalStatus.approvers[approverIndex] = {
        name: approverName,
        role: approverRole,
        status,
        date: new Date(),
        comments: comments || contract.approvalStatus.approvers[approverIndex].comments
      };
    } else {
      // Add new approver
      contract.approvalStatus.approvers.push({
        name: approverName,
        role: approverRole,
        status,
        date: new Date(),
        comments
      });
    }
    
    // Update overall status based on approvers
    const allApproved = contract.approvalStatus.approvers.every(a => a.status === 'Approved');
    const anyRejected = contract.approvalStatus.approvers.some(a => a.status === 'Rejected');
    
    if (anyRejected) {
      contract.approvalStatus.status = 'Rejected';
    } else if (allApproved) {
      contract.approvalStatus.status = 'Approved';
    } else {
      contract.approvalStatus.status = 'Pending';
    }
    
    await contract.save();
    
    res.status(200).json({ success: true, data: contract });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

export const updateComplianceDocuments = async (req, res) => {
  try {
    // Get company code from authenticated user
    const companyCode = req.companyCode;
    
    if (!companyCode) {
      return res.status(401).json({ 
        error: 'Authentication required', 
        message: 'Company code not found in request' 
      });
    }
    
    const { id } = req.params;
    const { documents } = req.body;
    
    if (!Array.isArray(documents)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Documents must be an array' 
      });
    }
    
    // Get company-specific Contract model
    const CompanyContract = await getModelForCompany(companyCode, 'Contract', contractSchema);
    
    const contract = await CompanyContract.findById(id);
    if (!contract) {
      return res.status(404).json({ success: false, error: 'Contract not found' });
    }
    
    // Update compliance documents
    contract.complianceDocuments = documents;
    await contract.save();
    
    res.status(200).json({ success: true, data: contract });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

export const terminateContract = async (req, res) => {
  try {
    // Get company code from authenticated user
    const companyCode = req.companyCode;
    
    if (!companyCode) {
      return res.status(401).json({ 
        error: 'Authentication required', 
        message: 'Company code not found in request' 
      });
    }
    
    const { id } = req.params;
    const { terminationReason } = req.body;
    
    // Get company-specific Contract model
    const CompanyContract = await getModelForCompany(companyCode, 'Contract', contractSchema);
    
    const contract = await CompanyContract.findById(id);
    if (!contract) {
      return res.status(404).json({ success: false, error: 'Contract not found' });
    }
    
    // Update contract status
    contract.contractStatus = 'Terminated';
    
    // Add termination reason to notes if provided
    if (terminationReason) {
      contract.note = contract.note 
        ? `${contract.note}\n\nTermination reason: ${terminationReason}`
        : `Termination reason: ${terminationReason}`;
    }
    
    await contract.save();
    
    res.status(200).json({ success: true, data: contract });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

export const getDashboardStats = async (req, res) => {
  try {
    // Get company code from authenticated user
    const companyCode = req.companyCode;
    
    if (!companyCode) {
      return res.status(401).json({ 
        error: 'Authentication required', 
        message: 'Company code not found in request' 
      });
    }
    
    // Get company-specific Contract model
    const CompanyContract = await getModelForCompany(companyCode, 'Contract', contractSchema);
    
    // Get total count of contracts
    const totalContracts = await CompanyContract.countDocuments();
    
    // Get count by status
    const activeContracts = await CompanyContract.countDocuments({ contractStatus: 'Active' });
    const draftContracts = await CompanyContract.countDocuments({ contractStatus: 'Draft' });
    const expiredContracts = await CompanyContract.countDocuments({ contractStatus: 'Expired' });
    const terminatedContracts = await CompanyContract.countDocuments({ contractStatus: 'Terminated' });
    
    // Get count by approval status
    const pendingApproval = await CompanyContract.countDocuments({ 'approvalStatus.status': 'Pending' });
    const approved = await CompanyContract.countDocuments({ 'approvalStatus.status': 'Approved' });
    const rejected = await CompanyContract.countDocuments({ 'approvalStatus.status': 'Rejected' });
    
    // Get contracts expiring in the next 30 days
    const today = new Date();
    const thirtyDaysLater = new Date();
    thirtyDaysLater.setDate(today.getDate() + 30);
    
    const todayStr = today.toISOString().split('T')[0];
    const thirtyDaysLaterStr = thirtyDaysLater.toISOString().split('T')[0];
    
    const expiringContracts = await CompanyContract.countDocuments({
      contractStatus: 'Active',
      endDate: { 
        $gte: todayStr, 
        $lte: thirtyDaysLaterStr 
      }
    });
    
    // Get average contract duration in days
    const contracts = await CompanyContract.find({
      startDate: { $exists: true },
      endDate: { $exists: true }
    });
    
    let totalDuration = 0;
    let contractsWithDuration = 0;
    
    contracts.forEach(contract => {
      if (contract.startDate && contract.endDate) {
        const start = new Date(contract.startDate);
        const end = new Date(contract.endDate);
        const duration = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
        
        if (duration > 0) {
          totalDuration += duration;
          contractsWithDuration++;
        }
      }
    });
    
    const averageDuration = contractsWithDuration > 0 
      ? Math.round(totalDuration / contractsWithDuration) 
      : 0;
    
    res.status(200).json({
      success: true,
      data: {
        totalContracts,
        byStatus: {
          active: activeContracts,
          draft: draftContracts,
          expired: expiredContracts,
          terminated: terminatedContracts
        },
        byApproval: {
          pending: pendingApproval,
          approved: approved,
          rejected: rejected
        },
        expiringContracts,
        averageDuration
      }
    });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

export const renewContract = async (req, res) => {
  try {
    // Get company code from authenticated user
    const companyCode = req.companyCode;
    
    if (!companyCode) {
      return res.status(401).json({ 
        error: 'Authentication required', 
        message: 'Company code not found in request' 
      });
    }
    
    const { id } = req.params;
    const { 
      startDate, 
      endDate, 
      basicSalary, 
      renewalReason,
      contractStatus = 'Active'
    } = req.body;
    
    if (!startDate) {
      return res.status(400).json({ 
        success: false, 
        error: 'Start date is required for renewal' 
      });
    }
    
    // Get company-specific Contract model
    const CompanyContract = await getModelForCompany(companyCode, 'Contract', contractSchema);
    
    // Get the original contract
    const originalContract = await CompanyContract.findById(id);
    if (!originalContract) {
      return res.status(404).json({ success: false, error: 'Contract not found' });
    }
    
    // Create a new contract based on the original
    const newContractData = {
      ...originalContract.toObject(),
      _id: undefined, // Remove the _id so a new one will be generated
      startDate,
      endDate,
      basicSalary: basicSalary || originalContract.basicSalary,
      contractStatus,
      renewalHistory: [
        ...(originalContract.renewalHistory || []),
        {
          previousContractId: originalContract._id,
          renewalDate: new Date(),
          reason: renewalReason || 'Contract renewal'
        }
      ]
    };
    
    // Update salary history if salary changed
    if (basicSalary && basicSalary !== originalContract.basicSalary) {
      newContractData.salaryHistory = [
        ...(originalContract.salaryHistory || []),
        {
          amount: basicSalary,
          effectiveDate: new Date(startDate),
          reason: 'Contract renewal with salary adjustment'
        }
      ];
    }
    
    // Create the new contract
    const newContract = new CompanyContract(newContractData);
    await newContract.save();
    
    // Update the original contract if it's still active
    if (originalContract.contractStatus === 'Active') {
      originalContract.contractStatus = 'Expired';
      originalContract.note = originalContract.note 
        ? `${originalContract.note}\n\nRenewed on ${new Date().toISOString().split('T')[0]}`
        : `Renewed on ${new Date().toISOString().split('T')[0]}`;
      
      await originalContract.save();
    }
    
    res.status(201).json({ 
      success: true, 
      data: newContract,
      message: 'Contract renewed successfully'
    });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};



export const bulkUpdateContracts = async (req, res) => {
  try {
    console.log('=== BULK UPDATE START ===');
    console.log('Request body:', req.body);
    
    // Get company code from authenticated user
    const companyCode = req.companyCode;
    
    if (!companyCode) {
      return res.status(401).json({ 
        success: false,
        error: 'Authentication required', 
        message: 'Company code not found in request' 
      });
    }
    
    const { contractIds, updates } = req.body;
    
    if (!Array.isArray(contractIds) || contractIds.length === 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'Contract IDs array is required and must not be empty' 
      });
    }
    
    if (!updates || Object.keys(updates).length === 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'Updates object is required and must not be empty' 
      });
    }
    
    console.log(`Bulk updating ${contractIds.length} contracts for company: ${companyCode}`);
    console.log('Updates to apply:', updates);
    
    // Get company-specific Contract model
    const CompanyContract = await getModelForCompany(companyCode, 'Contract', contractSchema);
    
    // Update multiple contracts
    const result = await CompanyContract.updateMany(
      { _id: { $in: contractIds } },
      { $set: updates }
    );
    
    console.log('Update result:', result);
    console.log('=== BULK UPDATE END ===');
    
    res.status(200).json({ 
      success: true, 
      data: {
        matchedCount: result.matchedCount,
        modifiedCount: result.modifiedCount,
        contractIds: contractIds
      },
      message: `Updated ${result.modifiedCount} of ${result.matchedCount} contracts`
    });
  } catch (error) {
    console.error('❌ Bulk update error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message,
      details: 'Bulk update operation failed'
    });
  }
};

export const bulkDeleteContracts = async (req, res) => {
  try {
    console.log('=== BULK DELETE START ===');
    console.log('Request body:', req.body);
    
    // Get company code from authenticated user
    const companyCode = req.companyCode;
    
    if (!companyCode) {
      return res.status(401).json({ 
        success: false,
        error: 'Authentication required', 
        message: 'Company code not found in request' 
      });
    }
    
    const { contractIds } = req.body;
    
    if (!Array.isArray(contractIds) || contractIds.length === 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'Contract IDs array is required and must not be empty' 
      });
    }
    
    console.log(`Bulk deleting ${contractIds.length} contracts for company: ${companyCode}`);
    console.log('Contract IDs to delete:', contractIds);
    
    // Get company-specific Contract model
    const CompanyContract = await getModelForCompany(companyCode, 'Contract', contractSchema);
    
    // Delete multiple contracts
    const result = await CompanyContract.deleteMany(
      { _id: { $in: contractIds } }
    );
    
    console.log('Delete result:', result);
    console.log('=== BULK DELETE END ===');
    
    res.status(200).json({ 
      success: true, 
      data: {
        deletedCount: result.deletedCount,
        contractIds: contractIds
      },
      message: `Successfully deleted ${result.deletedCount} contracts`
    });
  } catch (error) {
    console.error('❌ Bulk delete error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message,
      details: 'Bulk delete operation failed'
    });
  }
};
