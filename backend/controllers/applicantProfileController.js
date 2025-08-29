import ApplicantProfile, { applicantProfileSchema } from '../models/ApplicantProfile.js';
import getModelForCompany from '../models/genericModelFactory.js';

// Get all applicant profiles
export const getAllApplicantProfiles = async (req, res) => {
  try {
    // Get company code from authenticated user
    const companyCode = req.companyCode;
    
    if (!companyCode) {
      return res.status(401).json({ 
        error: 'Authentication required', 
        message: 'Company code not found in request' 
      });
    }
    
    console.log(`Fetching applicant profiles for company: ${companyCode}`);
    
    // Get company-specific ApplicantProfile model
    const CompanyApplicantProfile = await getModelForCompany(companyCode, 'ApplicantProfile', applicantProfileSchema);
    
    // Get profiles from company database
    const profiles = await CompanyApplicantProfile.find();
    
    console.log(`Retrieved ${profiles.length} applicant profiles for company ${companyCode}`);
    res.json(profiles);
  } catch (error) {
    console.error(`Error fetching applicant profiles:`, error);
    res.status(500).json({ 
      error: 'Error fetching applicant profiles', 
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// Create new applicant profile
export const createApplicantProfile = async (req, res) => {
  try {
    // Get company code from authenticated user
    const companyCode = req.companyCode;
    
    if (!companyCode) {
      return res.status(401).json({ 
        error: 'Authentication required', 
        message: 'Company code not found in request' 
      });
    }
    
    console.log(`Creating applicant profile for company: ${companyCode}`);
    
    // Get company-specific ApplicantProfile model
    const CompanyApplicantProfile = await getModelForCompany(companyCode, 'ApplicantProfile', applicantProfileSchema);
    
    // Create new profile in company database
    const newProfile = new CompanyApplicantProfile(req.body);
    await newProfile.save();
    
    console.log(`Applicant profile created successfully for ${req.body.name}`);
    res.status(201).json(newProfile);
  } catch (error) {
    console.error('Error creating applicant profile:', error);
    
    // Handle specific MongoDB errors
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        error: 'Validation error',
        message: error.message,
        details: error.errors ? Object.values(error.errors).map(err => err.message) : []
      });
    }
    
    if (error.name === 'MongoServerError' && error.code === 11000) {
      return res.status(409).json({
        error: 'Duplicate entry',
        message: 'An applicant profile with these details already exists'
      });
    }
    
    res.status(400).json({ 
      error: 'Error creating applicant profile', 
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// Delete an applicant profile by ID
export const deleteApplicantProfile = async (req, res) => {
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
        error: 'Invalid request', 
        message: 'Applicant profile ID is required' 
      });
    }
    
    console.log(`Deleting applicant profile ${id} for company: ${companyCode}`);
    
    // Get company-specific ApplicantProfile model
    const CompanyApplicantProfile = await getModelForCompany(companyCode, 'ApplicantProfile', applicantProfileSchema);
    
    // Delete profile from company database
    const profile = await CompanyApplicantProfile.findByIdAndDelete(id);
    
    if (!profile) {
      return res.status(404).json({ 
        error: 'Applicant profile not found',
        message: `No applicant profile found with ID: ${id}`
      });
    }
    
    console.log(`Applicant profile ${id} deleted successfully`);
    res.status(200).json({ message: 'Profile deleted successfully' });
  } catch (error) {
    console.error(`Error deleting applicant profile ${req.params.id}:`, error);
    
    if (error.name === 'CastError' && error.kind === 'ObjectId') {
      return res.status(400).json({
        error: 'Invalid ID',
        message: 'The provided applicant profile ID is not valid'
      });
    }
    
    res.status(400).json({ 
      error: 'Error deleting applicant profile', 
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// Batch delete applicant profiles by IDs
export const batchDeleteApplicantProfiles = async (req, res) => {
  try {
    // Get company code from authenticated user
    const companyCode = req.companyCode;
    
    if (!companyCode) {
      return res.status(401).json({ 
        error: 'Authentication required', 
        message: 'Company code not found in request' 
      });
    }
    
    const { ids } = req.body;
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ 
        error: 'Invalid request', 
        message: 'Valid array of profile IDs is required' 
      });
    }
    
    console.log(`Batch deleting applicant profiles for company: ${companyCode}`);
    
    // Get company-specific ApplicantProfile model
    const CompanyApplicantProfile = await getModelForCompany(companyCode, 'ApplicantProfile', applicantProfileSchema);
    
    // Delete profiles from company database
    const result = await CompanyApplicantProfile.deleteMany({ _id: { $in: ids } });
    
    console.log(`${result.deletedCount} applicant profiles deleted successfully`);
    res.status(200).json({ 
      message: 'Profiles deleted successfully',
      deletedCount: result.deletedCount
    });
  } catch (error) {
    console.error('Error batch deleting applicant profiles:', error);
    
    res.status(400).json({ 
      error: 'Error deleting applicant profiles', 
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

export default {
  getAllApplicantProfiles,
  createApplicantProfile,
  deleteApplicantProfile,
  batchDeleteApplicantProfiles,
};


