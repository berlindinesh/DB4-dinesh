import express from 'express';
import Employee from '../models/employeeRegisterModel.js';
import uploads from '../config/multerConfig.js';
import { authenticate } from '../middleware/companyAuth.js';
import getModelForCompany from '../models/genericModelFactory.js';

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
    
    if (employee) {
      // Update existing employee's personal info
      employee.personalInfo = {
        ...employee.personalInfo,
        ...cleanPersonalInfo,
        employeeImage: req.file ? `/uploads/${req.file.filename}` : employee.personalInfo.employeeImage
      };
    } else {
      // Create a new employee instance
      employee = new CompanyEmployee({
        userId, // Include the userId
        personalInfo: {
          ...cleanPersonalInfo,
          employeeImage: req.file ? `/uploads/${req.file.filename}` : null
        }
      });
    }
    
    // Generate an employee ID if not already set
    if (!employee.Emp_ID) {
      employee.Emp_ID = await CompanyEmployee.generateEmployeeNumber();
    }
    
    // Save the employee
    await employee.save();
    
    console.log('Saved employee with ID:', employee.Emp_ID);
    res.json({ success: true, employeeId: employee.Emp_ID });
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
    
    const employee = await CompanyEmployee.findOne({ Emp_ID: req.params.employeeId });
    res.json({ 
      success: true, 
      data: employee 
    });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
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


router.put('/work-info/:employeeid', async (req, res) => {
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
    const { shiftType, workType } = req.body;
    
    console.log(`Updating work info for employee ${employeeId} with shiftType: ${shiftType}, workType: ${workType}`);
    
    // Use findOneAndUpdate with specific update operators
    const result = await CompanyEmployee.findOneAndUpdate(
      { Emp_ID: employeeId },
      { 
        $set: { 
          'joiningDetails.shiftType': shiftType,
          'joiningDetails.workType': workType,
          'joiningDetails.uanNumber': req.body.uanNumber,
          'joiningDetails.pfNumber': req.body.pfNumber,
        }
      },
      { 
        new: true,
        runValidators: true,
        context: 'query' // This ensures validation only runs on the updated fields
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
    
    // Find employee record by userId
    const employee = await CompanyEmployee.findOne({ userId });
    
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee profile not found for this user ID'
      });
    }
    
    res.json({
      success: true,
      data: employee
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

