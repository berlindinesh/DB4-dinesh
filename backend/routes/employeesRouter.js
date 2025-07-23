import express from 'express';
import Employee from '../models/employeeRegisterModel.js';
import uploads from '../config/multerConfig.js';
import { authenticate } from '../middleware/companyAuth.js';
import getModelForCompany from '../models/genericModelFactory.js';
import { getFileUrl, useS3 } from '../config/s3Config.js';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticate);

// Update the personal-info route handler to include userId validation
router.post('/personal-info', uploads.single('employeeImage'), async (req, res) => {
  try {
    // Get company code from authenticated user
    const companyCode = req.companyCode;
    
    if (!companyCode) {
      return res.status(401).json({ 
        error: 'Authentication required', 
        message: 'Company code not found in request' 
      });
    }
    
    // Get company-specific Employee model
    const CompanyEmployee = await getModelForCompany(companyCode, 'Employee', Employee.schema);
    
    // Make sure we're properly parsing the formData
    const formData = JSON.parse(req.body.formData);
    const { personalInfo, userId } = formData;
    
    console.log('Received userId:', userId); // Add this for debugging
    
    // Validate required fields
    if (!personalInfo.firstName || !personalInfo.lastName) {
      return res.status(400).json({ 
        success: false, 
        error: 'First name and last name are required' 
      });
    }
    
    // Validate userId is provided
    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'User ID is required'
      });
    }
    
    // Clean up empty fields to avoid unique constraint issues
    const cleanPersonalInfo = { ...personalInfo };
    if (!cleanPersonalInfo.aadharNumber) delete cleanPersonalInfo.aadharNumber;
    if (!cleanPersonalInfo.panNumber) delete cleanPersonalInfo.panNumber;
    if (!cleanPersonalInfo.email) delete cleanPersonalInfo.email;
    
    // Check if employee with this userId already exists
    let employee = await CompanyEmployee.findOne({ userId });
    
    // Handle image URL based on storage type
    let imageUrl = null;
    if (req.file) {
      if (useS3) {
        // For S3, use the location provided by multer-s3
        imageUrl = req.file.location || getFileUrl(req.file.key);
        console.log('📁 S3 image uploaded:', imageUrl);
      } else {
        // For local storage, construct path
        imageUrl = `/uploads/${req.file.filename}`;
        console.log('📁 Local image uploaded:', imageUrl);
      }
    }

    if (employee) {
      // Update existing employee's personal info
      employee.personalInfo = {
        ...employee.personalInfo,
        ...cleanPersonalInfo,
        employeeImage: imageUrl || employee.personalInfo.employeeImage
      };
    } else {
      // Create a new employee instance
      employee = new CompanyEmployee({
        userId, // Include the userId
        personalInfo: {
          ...cleanPersonalInfo,
          employeeImage: imageUrl
        }
      });
    }
    
    // Generate an employee ID if not already set
    if (!employee.Emp_ID) {
      employee.Emp_ID = await CompanyEmployee.generateEmployeeNumber();
    }
    
    // Save the employee
    const savedEmployee = await employee.save();
    
    // Construct full image URL for response
    const responseEmployee = savedEmployee.toObject();
    if (responseEmployee.personalInfo?.employeeImage) {
      responseEmployee.personalInfo.employeeImageUrl = getFileUrl(responseEmployee.personalInfo.employeeImage);
    }

    console.log('Saved employee with ID:', savedEmployee.Emp_ID);
    res.json({ 
      success: true, 
      employeeId: savedEmployee.Emp_ID,
      employee: responseEmployee,
      storage: useS3 ? 'S3' : 'Local',
      imageUrl: responseEmployee.personalInfo?.employeeImageUrl
    });
  } catch (error) {
    console.error('Error saving employee:', error);
    res.status(400).json({ success: false, error: error.message });
  }
});

router.post('/address-info', async (req, res) => {
  try {
    // Get company code from authenticated user
    const companyCode = req.companyCode;
    
    if (!companyCode) {
      return res.status(401).json({ 
        error: 'Authentication required', 
        message: 'Company code not found in request' 
      });
    }
    
    // Get company-specific Employee model
    const CompanyEmployee = await getModelForCompany(companyCode, 'Employee', Employee.schema);
    
    const { currentAddress, permanentAddress, employeeId } = req.body;
    
    // Log the received data to verify what's coming from the frontend
    console.log('Received address data:', { 
      employeeId, 
      currentAddress, 
      permanentAddress 
    });
    
    if (!employeeId) {
      return res.status(400).json({ 
        success: false, 
        error: 'Employee ID is required' 
      });
    }
    
    // Create the update object with the exact field structure from the schema
    const updateData = {
      addressDetails: {
        presentAddress: {
          address: currentAddress.street,
          city: currentAddress.city,
          district: currentAddress.district,
          state: currentAddress.state,
          pinCode: currentAddress.pincode,
          country: currentAddress.country
        },
        permanentAddress: {
          address: permanentAddress.street,
          city: permanentAddress.city,
          district: permanentAddress.district,
          state: permanentAddress.state,
          pinCode: permanentAddress.pincode,
          country: permanentAddress.country
        }
      }
    };
    
    // Log the update data being sent to MongoDB
    console.log('Update data for MongoDB:', updateData);
    
    const updatedEmployee = await CompanyEmployee.findOneAndUpdate(
      { Emp_ID: employeeId },
      { $set: updateData },
      { new: true }
    );

    if (!updatedEmployee) {
      return res.status(404).json({ 
        success: false, 
        error: 'Employee not found' 
      });
    }

    // Log the updated employee to verify the changes
    console.log('Updated employee:', {
      id: updatedEmployee.Emp_ID,
      addressDetails: updatedEmployee.addressDetails
    });
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error details:', error);
    res.status(400).json({ success: false, error: error.message });
  }
});

router.post('/education-details', async (req, res) => {
  try {
    // Get company code from authenticated user
    const companyCode = req.companyCode;
    
    if (!companyCode) {
      return res.status(401).json({ 
        error: 'Authentication required', 
        message: 'Company code not found in request' 
      });
    }
    
    // Get company-specific Employee model
    const CompanyEmployee = await getModelForCompany(companyCode, 'Employee', Employee.schema);
    
    const { employeeId, educationDetails, trainingStatus, trainingDetails } = req.body;
    
    const updatedEmployee = await CompanyEmployee.findOneAndUpdate(
      { Emp_ID: employeeId },
      { 
        $set: { 
          educationDetails,
          trainingStatus,
          trainingDetails
        }
      },
      { new: true }
    );

    res.json({ 
      success: true, 
      message: 'Education and training details saved successfully',
      data: updatedEmployee 
    });
  } catch (error) {
    res.status(400).json({ 
      success: false, 
      error: error.message 
    });
  }
});

router.post('/joining-details', async (req, res) => {
  try {
    // Get company code from authenticated user
    const companyCode = req.companyCode;
    
    if (!companyCode) {
      return res.status(401).json({ 
        error: 'Authentication required', 
        message: 'Company code not found in request' 
      });
    }
    
    // Get company-specific Employee model
    const CompanyEmployee = await getModelForCompany(companyCode, 'Employee', Employee.schema);
    
    const { employeeId, formData } = req.body;
    
    if (!employeeId) {
      return res.status(400).json({ 
        success: false, 
        error: 'Employee ID is required' 
      });
    }
    
    const updatedEmployee = await CompanyEmployee.findOneAndUpdate(
      { Emp_ID: employeeId },
      { $set: { joiningDetails: formData } },
      { new: true }
    );
    
    if (!updatedEmployee) {
      return res.status(404).json({ 
        success: false, 
        error: 'Employee not found' 
      });
    }
    
    console.log('Updated employee with joining details:', updatedEmployee.Emp_ID);
    res.json({ success: true });
  } catch (error) {
    console.error('Error saving joining details:', error);
    res.status(400).json({ success: false, error: error.message });
  }
});

router.post('/family-details', async (req, res) => {
  try {
    // Get company code from authenticated user
    const companyCode = req.companyCode;
    
    if (!companyCode) {
      return res.status(401).json({ 
        error: 'Authentication required', 
        message: 'Company code not found in request' 
      });
    }
    
    // Get company-specific Employee model
    const CompanyEmployee = await getModelForCompany(companyCode, 'Employee', Employee.schema);
    
    const { employeeId, familyDetails } = req.body;
    
    const updatedEmployee = await CompanyEmployee.findOneAndUpdate(
      { Emp_ID: employeeId },
      { 
        $set: { familyDetails }
      },
      { new: true }
    );

    res.json({ 
      success: true, 
      message: 'Family details saved successfully',
      data: updatedEmployee 
    });
  } catch (error) {
    res.status(400).json({ 
      success: false, 
      error: error.message 
    });
  }
});

router.post('/service-history', async (req, res) => {
  try {
    // Get company code from authenticated user
    const companyCode = req.companyCode;
    
    if (!companyCode) {
      return res.status(401).json({ 
        error: 'Authentication required', 
        message: 'Company code not found in request' 
      });
    }
    
    // Get company-specific Employee model
    const CompanyEmployee = await getModelForCompany(companyCode, 'Employee', Employee.schema);
    
    const { employeeId, hasServiceHistory, serviceHistory } = req.body;
    
    const updateData = hasServiceHistory ? 
      { serviceHistory } : 
      { serviceHistory: [] };
    
    const updatedEmployee = await CompanyEmployee.findOneAndUpdate(
      { Emp_ID: employeeId },
      { $set: updateData },
      { new: true }
    );

    res.json({ 
      success: true, 
      message: 'Service history saved successfully',
      data: updatedEmployee 
    });
  } catch (error) {
    res.status(400).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Add this route to fetch complete profile data
router.get('/profile/:employeeId', async (req, res) => {
  try {
    // Get company code from authenticated user
    const companyCode = req.companyCode;
    
    if (!companyCode) {
      return res.status(401).json({ 
        error: 'Authentication required', 
        message: 'Company code not found in request' 
      });
    }
    
    // Get company-specific Employee model
    const CompanyEmployee = await getModelForCompany(companyCode, 'Employee', Employee.schema);
    
    const employee = await CompanyEmployee.findOne({ Emp_ID: req.params.employeeId });
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }
    res.json({
      success: true,
      data: {
        Emp_ID: employee.Emp_ID,
        personalInfo: employee.personalInfo,
        addressDetails: employee.addressDetails,
        joiningDetails: employee.joiningDetails,
        educationDetails: employee.educationDetails,
        familyDetails: employee.familyDetails,
        serviceHistory: employee.serviceHistory,
        nominationDetails: employee.nominationDetails,
        trainingDetails: employee.trainingDetails
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching profile data' });
  }
});

router.get('/get-employee/:employeeId', async (req, res) => {
  try {
    // Get company code from authenticated user
    const companyCode = req.companyCode;
    
    if (!companyCode) {
      return res.status(401).json({ 
        error: 'Authentication required', 
        message: 'Company code not found in request' 
      });
    }
    
    // Get company-specific Employee model
    const CompanyEmployee = await getModelForCompany(companyCode, 'Employee', Employee.schema);
    
    const employee = await CompanyEmployee.findOne({ Emp_ID: req.params.employeeId })
      .select(`
        userId
        Emp_ID
        registrationComplete
        personalInfo
        addressDetails
        joiningDetails
        educationDetails
        trainingStatus
        trainingDetails
        familyDetails
        serviceHistory
        nominationDetails
        bankInfo
        createdAt
        updatedAt
      `);
    
    if (!employee) {
      return res.status(404).json({ 
        success: false, 
        message: 'Employee not found' 
      });
    }

    // Return complete employee data
    res.json({ 
      success: true, 
      data: {
        userId: employee.userId,
        Emp_ID: employee.Emp_ID,
        registrationComplete: employee.registrationComplete,
        
        // Personal Info with all fields
        personalInfo: {
          prefix: employee.personalInfo?.prefix || "",
          firstName: employee.personalInfo?.firstName || "",
          lastName: employee.personalInfo?.lastName || "",
          dob: employee.personalInfo?.dob || null,
          gender: employee.personalInfo?.gender || "",
          maritalStatus: employee.personalInfo?.maritalStatus || "",
          bloodGroup: employee.personalInfo?.bloodGroup || "",
          nationality: employee.personalInfo?.nationality || "",
          aadharNumber: employee.personalInfo?.aadharNumber || "",
          panNumber: employee.personalInfo?.panNumber || "",
          mobileNumber: employee.personalInfo?.mobileNumber || "",
          email: employee.personalInfo?.email || "",
          workemail: employee.personalInfo?.workemail || "",
          employeeImage: employee.personalInfo?.employeeImage || ""
        },
        
        // Address Details with complete structure
        addressDetails: {
          presentAddress: {
            address: employee.addressDetails?.presentAddress?.address || "",
            city: employee.addressDetails?.presentAddress?.city || "",
            district: employee.addressDetails?.presentAddress?.district || "",
            state: employee.addressDetails?.presentAddress?.state || "",
            pinCode: employee.addressDetails?.presentAddress?.pinCode || "",
            country: employee.addressDetails?.presentAddress?.country || ""
          },
          permanentAddress: {
            address: employee.addressDetails?.permanentAddress?.address || "",
            city: employee.addressDetails?.permanentAddress?.city || "",
            district: employee.addressDetails?.permanentAddress?.district || "",
            state: employee.addressDetails?.permanentAddress?.state || "",
            pinCode: employee.addressDetails?.permanentAddress?.pinCode || "",
            country: employee.addressDetails?.permanentAddress?.country || ""
          }
        },
        
        // Joining Details with all fields
        joiningDetails: {
          dateOfAppointment: employee.joiningDetails?.dateOfAppointment || null,
          dateOfJoining: employee.joiningDetails?.dateOfJoining || null,
          department: employee.joiningDetails?.department || "",
          initialDesignation: employee.joiningDetails?.initialDesignation || "",
          modeOfRecruitment: employee.joiningDetails?.modeOfRecruitment || "",
          employeeType: employee.joiningDetails?.employeeType || "",
          shiftType: employee.joiningDetails?.shiftType || "",
          workType: employee.joiningDetails?.workType || "",
          uanNumber: employee.joiningDetails?.uanNumber || "",
          pfNumber: employee.joiningDetails?.pfNumber || ""
        },
        
        // Education Details with complete structure
        educationDetails: {
          basic: employee.educationDetails?.basic || [],
          professional: employee.educationDetails?.professional || []
        },
        
        // Training Details with complete structure
        trainingStatus: employee.trainingStatus || "no",
        trainingDetails: {
          trainingInIndia: employee.trainingDetails?.trainingInIndia || []
        },
        
        // Family Details (array)
        familyDetails: employee.familyDetails || [],
        
        // Service History (array)
        serviceHistory: employee.serviceHistory || [],
        
        // Nomination Details (array)
        nominationDetails: employee.nominationDetails || [],
        
        // Bank Info with all fields
        bankInfo: {
          accountNumber: employee.bankInfo?.accountNumber || "",
          ifscCode: employee.bankInfo?.ifscCode || "",
          bankName: employee.bankInfo?.bankName || "",
          branchName: employee.bankInfo?.branchName || "",
          accountType: employee.bankInfo?.accountType || ""
        },
        
        // Timestamps
        createdAt: employee.createdAt,
        updatedAt: employee.updatedAt
      }
    });
  } catch (error) {
    console.error('Error fetching employee:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error',
      message: error.message 
    });
  }
});

// Add this route for updating personal info
router.put('/personal-info/:employeeId', async (req, res) => {
  try {
    const companyCode = req.companyCode;
    
    if (!companyCode) {
      return res.status(401).json({ 
        error: 'Authentication required', 
        message: 'Company code not found in request' 
      });
    }
    
    const CompanyEmployee = await getModelForCompany(companyCode, 'Employee', Employee.schema);
    
    const { employeeId } = req.params;
    const { personalInfo, addressDetails, joiningDetails, educationDetails, trainingStatus, trainingDetails, familyDetails, serviceHistory, nominationDetails } = req.body;
    
    console.log(`Updating personal info for employee ${employeeId}`);
    console.log('Received data:', req.body);
    
    // Build the update object with proper validation
    const updateFields = {};
    
    // Clean and validate personalInfo
    if (personalInfo) {
      const cleanPersonalInfo = { ...personalInfo };
      
      // Remove computed and system fields
      delete cleanPersonalInfo.name;
      delete cleanPersonalInfo.phone;
      delete cleanPersonalInfo.department;
      delete cleanPersonalInfo.designation;
      delete cleanPersonalInfo.employeeId;
      delete cleanPersonalInfo.userId;
      delete cleanPersonalInfo.addressDetails;
      delete cleanPersonalInfo.joiningDetails;
      delete cleanPersonalInfo.educationDetails;
      delete cleanPersonalInfo.trainingDetails;
      delete cleanPersonalInfo.familyDetails;
      delete cleanPersonalInfo.serviceHistory;
      delete cleanPersonalInfo.nominationDetails;
      delete cleanPersonalInfo.registrationComplete;
      delete cleanPersonalInfo.trainingStatus;
      
      // Remove empty values to avoid unique constraint issues
      Object.keys(cleanPersonalInfo).forEach(key => {
        if (cleanPersonalInfo[key] === "" || cleanPersonalInfo[key] === null || cleanPersonalInfo[key] === undefined) {
          delete cleanPersonalInfo[key];
        }
      });
      
      if (Object.keys(cleanPersonalInfo).length > 0) {
        updateFields.personalInfo = cleanPersonalInfo;
      }
    }
    
    // Validate and clean addressDetails
    if (addressDetails && typeof addressDetails === 'object') {
      updateFields.addressDetails = addressDetails;
    }
    
    // Validate and clean joiningDetails
    if (joiningDetails && typeof joiningDetails === 'object') {
      updateFields.joiningDetails = joiningDetails;
    }
    
    // Validate and clean educationDetails
    if (educationDetails && typeof educationDetails === 'object') {
      const cleanEducationDetails = {
        basic: [],
        professional: []
      };
      
      // Validate basic education
      if (Array.isArray(educationDetails.basic)) {
        cleanEducationDetails.basic = educationDetails.basic.filter(item => {
          return item && 
                 typeof item === 'object' && 
                 ['10th', '12th'].includes(item.education);
        });
      }
      
      // Validate professional education
      if (Array.isArray(educationDetails.professional)) {
        cleanEducationDetails.professional = educationDetails.professional.filter(item => {
          return item && 
                 typeof item === 'object' && 
                 ['UG', 'PG', 'Doctorate'].includes(item.education);
        });
      }
      
      updateFields.educationDetails = cleanEducationDetails;
    }
    
    // Validate trainingStatus
    if (trainingStatus && ['yes', 'no'].includes(trainingStatus)) {
      updateFields.trainingStatus = trainingStatus;
    }
    
    // Validate and clean trainingDetails
    if (trainingDetails && typeof trainingDetails === 'object') {
      const cleanTrainingDetails = {
        trainingInIndia: []
      };
      
      if (Array.isArray(trainingDetails.trainingInIndia)) {
        cleanTrainingDetails.trainingInIndia = trainingDetails.trainingInIndia.filter(item => {
          return item && 
                 typeof item === 'object' && 
                 item.type && 
                 item.topic && 
                 item.institute;
        });
      }
      
      updateFields.trainingDetails = cleanTrainingDetails;
    }
    
    // Validate arrays
    if (Array.isArray(familyDetails)) {
      updateFields.familyDetails = familyDetails.filter(item => 
        item && typeof item === 'object' && item.name && item.relation
      );
    }
    
    if (Array.isArray(serviceHistory)) {
      updateFields.serviceHistory = serviceHistory.filter(item => 
        item && typeof item === 'object'
      );
    }
    
    if (Array.isArray(nominationDetails)) {
      updateFields.nominationDetails = nominationDetails.filter(item => 
        item && typeof item === 'object'
      );
    }
    
    console.log('Cleaned update fields:', updateFields);
    
    // Only proceed if there are fields to update
    if (Object.keys(updateFields).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid fields to update'
      });
    }
    
    // Update the employee document
    const result = await CompanyEmployee.findOneAndUpdate(
      { Emp_ID: employeeId },
      { $set: updateFields },
      { 
        new: true,
        runValidators: true,
        context: 'query'
      }
    );
    
    if (!result) {
      console.log(`Employee with ID ${employeeId} not found`);
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }
    
    console.log(`Successfully updated personal info for employee ${employeeId}`);
    
    res.json({
      success: true,
      message: 'Personal information updated successfully',
      data: {
        personalInfo: result.personalInfo,
        addressDetails: result.addressDetails,
        joiningDetails: result.joiningDetails,
        educationDetails: result.educationDetails,
        trainingStatus: result.trainingStatus,
        trainingDetails: result.trainingDetails,
        familyDetails: result.familyDetails,
        serviceHistory: result.serviceHistory,
        nominationDetails: result.nominationDetails
      }
    });
  } catch (error) {
    console.error('Error updating personal information:', error);
    
    // More detailed error logging
    if (error.name === 'ValidationError') {
      console.error('Validation errors:', error.errors);
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: Object.keys(error.errors).map(key => ({
          field: key,
          message: error.errors[key].message
        }))
      });
    }
    
    res.status(500).json({
      success: false,
      message: `Server error: ${error.message}`
    });
  }
});



router.post('/nomination-details', async (req, res) => {
  try {
    // Get company code from authenticated user
    const companyCode = req.companyCode;
    
    if (!companyCode) {
      return res.status(401).json({ 
        error: 'Authentication required', 
        message: 'Company code not found in request' 
      });
    }
    
    // Get company-specific Employee model
    const CompanyEmployee = await getModelForCompany(companyCode, 'Employee', Employee.schema);
    
    const { employeeId, nominationDetails } = req.body;
    
    const updatedEmployee = await CompanyEmployee.findOneAndUpdate(
      { Emp_ID: employeeId },
      { $set: { nominationDetails } },
      { new: true }
    );

    res.json({ 
      success: true, 
      message: 'Nomination details saved successfully',
      data: updatedEmployee 
    });
  } catch (error) {
    res.status(400).json({ 
      success: false, 
      error: error.message 
    });
  }
});

router.post('/complete-registration', async (req, res) => {
  try {
    // Get company code from authenticated user
    const companyCode = req.companyCode;
    
    if (!companyCode) {
      return res.status(401).json({ 
        error: 'Authentication required', 
        message: 'Company code not found in request' 
      });
    }
    
    // Get company-specific Employee model
    const CompanyEmployee = await getModelForCompany(companyCode, 'Employee', Employee.schema);
    
    const { employeeId, registrationComplete, allFormData } = req.body;
    console.log('Received data:', { employeeId, allFormData });
    
    const updatedEmployee = await CompanyEmployee.findOneAndUpdate(
      { Emp_ID: employeeId },
      { 
        $set: {
          ...allFormData,
          registrationComplete: true
        }
      },
            { new: true, upsert: true } // Added upsert option to create if not exists
    );

    console.log('Saved employee:', updatedEmployee);
    res.json({ success: true, data: updatedEmployee });
  } catch (error) {
    console.log('Error saving:', error);
    res.status(400).json({ error: error.message });
  }
});

// Add this route to fetch employees for dropdown selection
router.get('/list', async (req, res) => {
  try {
    // Get company code from authenticated user
    const companyCode = req.companyCode;
    
    if (!companyCode) {
      return res.status(401).json({ 
        error: 'Authentication required', 
        message: 'Company code not found in request' 
      });
    }
    
    // Get company-specific Employee model
    const CompanyEmployee = await getModelForCompany(companyCode, 'Employee', Employee.schema);
    
    const employees = await CompanyEmployee.find({})
      .select('Emp_ID personalInfo.firstName personalInfo.lastName joiningDetails.department')
      .sort('personalInfo.firstName');
    
    const formattedEmployees = employees.map(emp => ({
      id: emp.Emp_ID,
      name: `${emp.personalInfo?.firstName || ''} ${emp.personalInfo?.lastName || ''}`,
      department: emp.joiningDetails?.department || 'Not Assigned',
      value: `${emp.Emp_ID} - ${emp.personalInfo?.firstName || ''} ${emp.personalInfo?.lastName || ''}`
    }));
    
    res.json({ success: true, data: formattedEmployees });
  } catch (error) {
    console.error('Error fetching employees list:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/registered', async (req, res) => {
  try {
    // Get company code from authenticated user
    const companyCode = req.companyCode;
    
    if (!companyCode) {
      return res.status(401).json({ 
        error: 'Authentication required', 
        message: 'Company code not found in request' 
      });
    }
    
    // Get company-specific Employee model
    const CompanyEmployee = await getModelForCompany(companyCode, 'Employee', Employee.schema);
    
    const employees = await CompanyEmployee.find({})
      .select('personalInfo addressDetails joiningDetails Emp_ID bankInfo')
      .sort('-createdAt');
    
    res.json(employees);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching employees', error });
  }
});

router.get('/bank-info/:employeeId', async (req, res) => {
  try {
    // Get company code from authenticated user
    const companyCode = req.companyCode;
    
    if (!companyCode) {
      return res.status(401).json({ 
        error: 'Authentication required', 
        message: 'Company code not found in request' 
      });
    }
    
    // Get company-specific Employee model
    const CompanyEmployee = await getModelForCompany(companyCode, 'Employee', Employee.schema);
    
    const employee = await CompanyEmployee.findOne({ Emp_ID: req.params.employeeId });
    res.json(employee.bankInfo);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching bank info' });
  }
});

// router.put('/bank-info/:employeeId', async (req, res) => {
//   try {
//     // Get company code from authenticated user
//     const companyCode = req.companyCode;
    
//     if (!companyCode) {
//       return res.status(401).json({ 
//         error: 'Authentication required', 
//         message: 'Company code not found in request' 
//       });
//     }
    
//     // Get company-specific Employee model
//     const CompanyEmployee = await getModelForCompany(companyCode, 'Employee', Employee.schema);
    
//     const employee = await CompanyEmployee.findOneAndUpdate(
//       { Emp_ID: req.params.employeeId },
//       { bankInfo: req.body },
//       { new: true }
//     );
//     res.json(employee.bankInfo);
//   } catch (error) {
//     res.status(500).json({ message: 'Error updating bank info' });
//   }
// });

router.put('/bank-info/:employeeId', async (req, res) => {
  try {
    const companyCode = req.companyCode;
    
    if (!companyCode) {
      return res.status(401).json({ 
        error: 'Authentication required', 
        message: 'Company code not found in request' 
      });
    }
    
    const CompanyEmployee = await getModelForCompany(companyCode, 'Employee', Employee.schema);
    
    const employee = await CompanyEmployee.findOneAndUpdate(
      { Emp_ID: req.params.employeeId }, // Use employeeId here
      { $set: { bankInfo: req.body.bankInfo } }, // Make sure to access bankInfo from body
      { new: true }
    );
    
    if (!employee) {
      return res.status(404).json({ 
        success: false, 
        message: 'Employee not found' 
      });
    }
    
    res.json({ 
      success: true,
      data: { bankInfo: employee.bankInfo }
    });
  } catch (error) {
    console.error('Error updating bank info:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error updating bank info',
      error: error.message 
    });
  }
});


router.put('/work-info/:employeeId', async (req, res) => {
  try {
    // Get company code from authenticated user
    const companyCode = req.companyCode;
    
    if (!companyCode) {
      return res.status(401).json({ 
        error: 'Authentication required', 
        message: 'Company code not found in request' 
      });
    }
    
    // Get company-specific Employee model
    const CompanyEmployee = await getModelForCompany(companyCode, 'Employee', Employee.schema);
    
    const { employeeId } = req.params;
    const { 
      shiftType, 
      workType, 
      uanNumber, 
      pfNumber,
      department,
      designation,
      employeeType,
      dateOfJoining,
      dateOfAppointment,
      modeOfRecruitment
    } = req.body;
    
    console.log(`Updating work info for employee ${employeeId}`);
    console.log('Update data:', req.body);
    
    // Build update object dynamically to only update provided fields
    const updateFields = {};
    
    if (shiftType !== undefined) updateFields['joiningDetails.shiftType'] = shiftType;
    if (workType !== undefined) updateFields['joiningDetails.workType'] = workType;
    if (uanNumber !== undefined) updateFields['joiningDetails.uanNumber'] = uanNumber;
    if (pfNumber !== undefined) updateFields['joiningDetails.pfNumber'] = pfNumber;
    if (department !== undefined) updateFields['joiningDetails.department'] = department;
    if (designation !== undefined) updateFields['joiningDetails.initialDesignation'] = designation;
    if (employeeType !== undefined) updateFields['joiningDetails.employeeType'] = employeeType;
    if (dateOfJoining !== undefined) updateFields['joiningDetails.dateOfJoining'] = dateOfJoining;
    if (dateOfAppointment !== undefined) updateFields['joiningDetails.dateOfAppointment'] = dateOfAppointment;
    if (modeOfRecruitment !== undefined) updateFields['joiningDetails.modeOfRecruitment'] = modeOfRecruitment;
    
    // Use findOneAndUpdate with specific update operators
    const result = await CompanyEmployee.findOneAndUpdate(
      { Emp_ID: employeeId },
      { $set: updateFields },
      { 
        new: true,
        runValidators: true,
        context: 'query'
      }
    );
    
    if (!result) {
      console.log(`Employee with ID ${employeeId} not found`);
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }
    
    console.log(`Successfully updated work info for employee ${employeeId}`);
    
    res.json({
      success: true,
      message: 'Work information updated successfully',
      data: result.joiningDetails
    });
  } catch (error) {
    console.error('Error updating work information:', error);
    res.status(500).json({
      success: false,
      message: `Server error: ${error.message}`
    });
  }
});


// Get employee profile by userId
router.get('/by-user/:userId', async (req, res) => {
  try {
    // Get company code from authenticated user
    const companyCode = req.companyCode;
    
    if (!companyCode) {
      return res.status(401).json({ 
        error: 'Authentication required', 
        message: 'Company code not found in request' 
      });
    }
    
    // Get company-specific Employee model
    const CompanyEmployee = await getModelForCompany(companyCode, 'Employee', Employee.schema);
    
    const { userId } = req.params;
    
    // Find employee record by userId with all fields
    const employee = await CompanyEmployee.findOne({ userId })
      .select(`
        userId
        Emp_ID
        registrationComplete
        personalInfo
        addressDetails
        joiningDetails
        educationDetails
        trainingStatus
        trainingDetails
        familyDetails
        serviceHistory
        nominationDetails
        bankInfo
        createdAt
        updatedAt
      `);
    
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee profile not found for this user ID'
      });
    }
    
    // Return complete employee data
    res.json({
      success: true,
      data: {
        userId: employee.userId,
        Emp_ID: employee.Emp_ID,
        registrationComplete: employee.registrationComplete,
        
        // Personal Info with all fields
        personalInfo: {
          prefix: employee.personalInfo?.prefix || "",
          firstName: employee.personalInfo?.firstName || "",
          lastName: employee.personalInfo?.lastName || "",
          dob: employee.personalInfo?.dob || null,
          gender: employee.personalInfo?.gender || "",
          maritalStatus: employee.personalInfo?.maritalStatus || "",
          bloodGroup: employee.personalInfo?.bloodGroup || "",
          nationality: employee.personalInfo?.nationality || "",
          aadharNumber: employee.personalInfo?.aadharNumber || "",
          panNumber: employee.personalInfo?.panNumber || "",
          mobileNumber: employee.personalInfo?.mobileNumber || "",
          email: employee.personalInfo?.email || "",
          workemail: employee.personalInfo?.workemail || "",
          employeeImage: employee.personalInfo?.employeeImage || ""
        },
        
        // Address Details with complete structure
        addressDetails: {
          presentAddress: {
            address: employee.addressDetails?.presentAddress?.address || "",
            city: employee.addressDetails?.presentAddress?.city || "",
            district: employee.addressDetails?.presentAddress?.district || "",
            state: employee.addressDetails?.presentAddress?.state || "",
            pinCode: employee.addressDetails?.presentAddress?.pinCode || "",
            country: employee.addressDetails?.presentAddress?.country || ""
          },
          permanentAddress: {
            address: employee.addressDetails?.permanentAddress?.address || "",
            city: employee.addressDetails?.permanentAddress?.city || "",
            district: employee.addressDetails?.permanentAddress?.district || "",
            state: employee.addressDetails?.permanentAddress?.state || "",
            pinCode: employee.addressDetails?.permanentAddress?.pinCode || "",
            country: employee.addressDetails?.permanentAddress?.country || ""
          }
        },
        
        // Joining Details with all fields
        joiningDetails: {
          dateOfAppointment: employee.joiningDetails?.dateOfAppointment || null,
          dateOfJoining: employee.joiningDetails?.dateOfJoining || null,
          department: employee.joiningDetails?.department || "",
          initialDesignation: employee.joiningDetails?.initialDesignation || "",
          modeOfRecruitment: employee.joiningDetails?.modeOfRecruitment || "",
          employeeType: employee.joiningDetails?.employeeType || "",
          shiftType: employee.joiningDetails?.shiftType || "",
          workType: employee.joiningDetails?.workType || "",
          uanNumber: employee.joiningDetails?.uanNumber || "",
          pfNumber: employee.joiningDetails?.pfNumber || ""
        },
        
        // Education Details with complete structure
        educationDetails: {
          basic: employee.educationDetails?.basic || [],
          professional: employee.educationDetails?.professional || []
        },
        
        // Training Details with complete structure
        trainingStatus: employee.trainingStatus || "no",
        trainingDetails: {
          trainingInIndia: employee.trainingDetails?.trainingInIndia || []
        },
        
        // Family Details (array)
        familyDetails: employee.familyDetails || [],
        
        // Service History (array)
        serviceHistory: employee.serviceHistory || [],
        
        // Nomination Details (array)
        nominationDetails: employee.nominationDetails || [],
        
        // Bank Info with all fields
        bankInfo: {
          accountNumber: employee.bankInfo?.accountNumber || "",
          ifscCode: employee.bankInfo?.ifscCode || "",
          bankName: employee.bankInfo?.bankName || "",
          branchName: employee.bankInfo?.branchName || "",
          accountType: employee.bankInfo?.accountType || ""
        },
        
        // Timestamps
        createdAt: employee.createdAt,
        updatedAt: employee.updatedAt
      }
    });
  } catch (error) {
    console.error('Error fetching employee by userId:', error);
    res.status(500).json({
      success: false,
      message: `Server error: ${error.message}`
    });
  }
});

router.get('/report', async (req, res) => {
  try {
    // Get company code from authenticated user
    const companyCode = req.companyCode;
    
    if (!companyCode) {
      return res.status(401).json({ 
        error: 'Authentication required', 
        message: 'Company code not found in request' 
      });
    }
    
    // Get company-specific Employee model
    const CompanyEmployee = await getModelForCompany(companyCode, 'Employee', Employee.schema);
    
    // Get query parameters
    const period = req.query.period || '6m';
    const startDateParam = req.query.startDate ? new Date(req.query.startDate) : null;
    
    // Calculate date range based on period if startDate not provided
    const today = new Date();
    let startDate = startDateParam || new Date();
    
    if (!startDateParam) {
      switch(period) {
        case '1m':
          startDate.setMonth(today.getMonth() - 1);
          break;
        case '3m':
          startDate.setMonth(today.getMonth() - 3);
          break;
        case '6m':
          startDate.setMonth(today.getMonth() - 6);
          break;
        case '1y':
          startDate.setFullYear(today.getFullYear() - 1);
          break;
        default:
          startDate.setMonth(today.getMonth() - 6);
      }
    }
    
    // Get all employees
    const employees = await CompanyEmployee.find({})
      .select('Emp_ID personalInfo joiningDetails addressDetails registrationComplete createdAt');
    
    // Calculate statistics
    const totalEmployees = employees.length;
    const activeEmployees = employees.filter(emp => emp.registrationComplete).length;
    
    // Get department distribution
    const departments = {};
    employees.forEach(emp => {
      // Check if joiningDetails exists and has department
      const dept = emp.joiningDetails && emp.joiningDetails.department 
        ? emp.joiningDetails.department 
        : 'Unassigned';
        
      // Make sure we don't count empty strings or null values as departments
      if (dept && dept.trim() !== '') {
        departments[dept] = (departments[dept] || 0) + 1;
      } else {
        departments['Unassigned'] = (departments['Unassigned'] || 0) + 1;
      }
    });
    
    // Format department data for pie chart - filter out empty departments
    const departmentData = Object.keys(departments)
      .filter(name => name && name !== 'undefined' && name !== 'null')
      .map(name => ({
        name,
        value: departments[name]
      }));
    
    // Calculate monthly trends based on joining date
    const monthlyData = {};
    for (let i = 0; i < (period === '1y' ? 12 : 6); i++) {
      const month = new Date();
      month.setMonth(today.getMonth() - i);
      const monthName = month.toLocaleString('default', { month: 'short' });
      monthlyData[monthName] = { onboarded: 0, offboarded: 0 };
    }
    
    // Count onboarded employees by month using joiningDetails.dateOfJoining
    employees.forEach(emp => {
      if (emp.joiningDetails && emp.joiningDetails.dateOfJoining) {
        const joiningDate = new Date(emp.joiningDetails.dateOfJoining);
        
        // Only count if joining date is within the selected time period
        if (joiningDate >= startDate) {
          const monthName = joiningDate.toLocaleString('default', { month: 'short' });
          if (monthlyData[monthName]) {
            monthlyData[monthName].onboarded += 1;
          }
        }
      }
    });
    
    // Format trend data for chart
    const trendData = Object.keys(monthlyData).map(month => ({
      month,
      onboarded: monthlyData[month].onboarded,
      offboarded: monthlyData[month].offboarded
    })).reverse();
    
    // Format employee data for table
    const employeeData = employees.map((emp, index) => {
      // Get department with fallback to "Unassigned"
      const department = emp.joiningDetails && emp.joiningDetails.department && 
                         emp.joiningDetails.department.trim() !== '' 
                         ? emp.joiningDetails.department 
                         : 'Unassigned';
                         
      // Get designation with fallback to "Not Assigned"
      const designation = emp.joiningDetails && emp.joiningDetails.initialDesignation && 
                          emp.joiningDetails.initialDesignation.trim() !== '' 
                          ? emp.joiningDetails.initialDesignation 
                          : 'Not Assigned';
      return {
        key: index.toString(),
        empId: emp.Emp_ID,
        name: `${emp.personalInfo?.firstName || ''} ${emp.personalInfo?.lastName || ''}`,
        department: department,
        designation: designation,
        status: emp.registrationComplete ? 'Active' : 'Incomplete',
        progress: emp.registrationComplete ? 100 : 50,
        avatar: emp.personalInfo?.employeeImage || 'https://xsgames.co/randomusers/avatar.php?g=pixel',
        email: emp.personalInfo?.email || 'N/A',
        joiningDate: emp.joiningDetails?.dateOfJoining 
                    ? new Date(emp.joiningDetails.dateOfJoining).toLocaleDateString() 
                    : 'N/A'
      };
    });
    
    // Add "Unassigned" to department data if it exists
    if (departments['Unassigned'] && !departmentData.find(d => d.name === 'Unassigned')) {
      departmentData.push({
        name: 'Unassigned',
        value: departments['Unassigned']
      });
    }
    
    res.json({
      success: true,
      data: {
        stats: {
          totalOnboarded: activeEmployees,
          totalOffboarded: 0, // You might want to implement this logic
          averageOnboardingTime: 14, // Placeholder - implement actual calculation
          completionRate: totalEmployees > 0 ? Math.round((activeEmployees / totalEmployees) * 100) : 0
        },
        trendData,
        departmentData,
        employeeData
      }
    });
  } catch (error) {
    console.error('Error generating report:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;

