import mongoose from 'mongoose';

const allowanceSchema = new mongoose.Schema({
  name: { type: String, required: true },
  percentage: { type: Number, required: true },
  amount: { type: Number, required: true },
  category: { type: String, default: 'Regular' },
  status: { type: String, default: 'Active' },
  isRecurring: { type: Boolean, default: true },
  isBasicPay: { type: Boolean, default: false } // Added to identify Basic Pay component
}, { _id: false });

const deductionSchema = new mongoose.Schema({
  name: { type: String, required: true },
  percentage: { type: Number, required: true },
  amount: { type: Number, required: true },
  category: { type: String, default: 'Tax' },
  status: { type: String, default: 'Active' },
  isRecurring: { type: Boolean, default: true },
  isFixedAmount: { type: Boolean, default: false } // Added to identify fixed amount deductions
}, { _id: false });

const payslipSchema = new mongoose.Schema({
  month: { type: Number, required: true },
  year: { type: Number, required: true },
  generatedDate: { type: Date, default: Date.now },
  grossSalary: { type: Number, required: true },
  totalDeductions: { type: Number, required: true },
  netSalary: { type: Number, required: true },
  status: { type: String, default: 'Generated' },
  pdfPath: { type: String },
  baseAfterDeductions: { type: Number }, // Added to store base after deductions
  attendanceAdjustedBase: { type: Number }, // Added to store attendance adjusted base
  lopImpact: { // Added to store LOP impact details
    totalPayBeforeLOP: { type: Number },
    lopDeduction: { type: Number },
    lopPercentage: { type: Number }
  }
}, { timestamps: true });

const unifiedPayrollSchema = new mongoose.Schema({
  // Employee basic info
  empId: { type: String, required: true, unique: true },
  empName: { type: String, required: true },
  department: { type: String, required: true },
  designation: { type: String, required: true },
  basicPay: { type: Number, required: true },
  bankName: { type: String, required: true },
  bankAccountNo: { type: String, required: true },
  pfNo: { type: String, required: true },
  uanNo: { type: String, required: true },
  panNo: { type: String, required: true },
  lop: { 
    type: Number,
    default: 0,
    validate: {
      validator: function(v) {
        return Number.isInteger(v * 2);
      },
      message: 'LOP must be in increments of 0.5 days'
    }
  },
  payableDays: { type: Number, default: 30 },
  // email: { type: String }, // This already exists
  workEmail: { type: String }, // Changed from email to workEmail
  status: { type: String, default: 'Active' },
  joiningDate: { type: Date, required: true }, // Added joining date field
  
  // User relationship fields
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', // Reference to User model
    sparse: true, // Allows multiple documents without userId
    index: true // Add index for better query performance
  },
  userEmail: { 
    type: String, 
    sparse: true, // Allows multiple documents without userEmail
    index: true // Add index for better query performance
  },
  isLinkedToUser: { 
    type: Boolean, 
    default: false // Flag to indicate if employee is linked to a user account
  },
  
  // Embedded collections
  allowances: [allowanceSchema],
  deductions: [deductionSchema],
  payslips: [payslipSchema],
  
}, { timestamps: true });

// ADD INDEXES FOR BETTER PERFORMANCE
unifiedPayrollSchema.index({ userId: 1 });
unifiedPayrollSchema.index({ userEmail: 1 });
unifiedPayrollSchema.index({ empId: 1, userId: 1 });

// ADD A METHOD TO LINK USER TO EMPLOYEE
unifiedPayrollSchema.methods.linkToUser = function(userId, userEmail) {
  this.userId = userId;
  this.userEmail = userEmail;
  this.isLinkedToUser = true;
  return this.save();
};

// ENHANCED STATIC METHOD TO FIND EMPLOYEE BY USER
unifiedPayrollSchema.statics.findByUser = async function(userId, userEmail) {
  console.log(`Searching for employee with userId: ${userId}, userEmail: ${userEmail}`);
  
  // First try to find by userId
  let employee = await this.findOne({ userId: userId });
  
  if (!employee && userEmail) {
    // If not found by userId, try by userEmail or email
    employee = await this.findOne({ 
      $or: [
        { userEmail: userEmail },
        { workEmail: userEmail }
        // { email: userEmail }
      ]
    });
  }
  
  console.log(`Employee found by findByUser: ${employee ? employee.empId : 'None'}`);
  return employee;
};

// NEW STATIC METHOD TO FIND EMPLOYEE BY EMPID AND VERIFY USER OWNERSHIP
unifiedPayrollSchema.statics.findByEmpIdAndUser = async function(empId, userId, userEmail) {
  console.log(`Finding employee ${empId} for user ${userId} with email ${userEmail}`);
  
  // First find the employee by empId
  const employee = await this.findOne({ empId: empId });
  
  if (!employee) {
    console.log(`Employee ${empId} not found`);
    return null;
  }
  
  // Check if this employee belongs to the current user
  // Convert ObjectId to string for comparison if needed
  const employeeUserIdStr = employee.userId ? employee.userId.toString() : null;
  const requestUserIdStr = userId ? userId.toString() : null;
  
  const isOwner = (employeeUserIdStr && employeeUserIdStr === requestUserIdStr) || 
                  (employee.userEmail && employee.userEmail === userEmail) || 
                  (employee.workEmail && employee.workEmail === userEmail);
                  // (employee.email && employee.email === userEmail);
  
  console.log(`Employee ownership check:`, {
    empId,
    employeeUserId: employeeUserIdStr,
    requestUserId: requestUserIdStr,
    employeeUserEmail: employee.userEmail,
    employeeWorkEmail: employee.workEmail,
    // employeeEmail: employee.email,
    requestUserEmail: userEmail,
    isOwner,
    isLinkedToUser: employee.isLinkedToUser
  });
  
  // Return employee only if user owns it
  return isOwner ? employee : null;
};

// STATIC METHOD TO GET ALL EMPLOYEES FOR A SPECIFIC USER (if user has multiple employee records)
unifiedPayrollSchema.statics.findAllByUser = async function(userId, userEmail) {
  console.log(`Finding all employees for user ${userId} with email ${userEmail}`);
  
  const employees = await this.find({
    $or: [
      { userId: userId },
      { userEmail: userEmail },
      { workEmail: userEmail }
      // { email: userEmail }
    ]
  });
  
  console.log(`Found ${employees.length} employees for user`);
  return employees;
};

// STATIC METHOD TO CHECK IF USER CAN ACCESS SPECIFIC PAYSLIP
unifiedPayrollSchema.statics.canUserAccessPayslip = async function(payslipId, userId, userEmail) {
  console.log(`Checking if user ${userId} can access payslip ${payslipId}`);
  
  // Parse payslip ID to get empId
  const [empId, month, year] = payslipId.split('_');
  
  if (!empId || !month || !year) {
    console.log('Invalid payslip ID format');
    return false;
  }
  
  // Find employee and verify ownership
  const employee = await this.findByEmpIdAndUser(empId, userId, userEmail);
  
  if (!employee) {
    console.log('Employee not found or user does not own this employee record');
    return false;
  }
  
  // Check if payslip exists
  const payslip = employee.payslips.find(
    p => p.month === parseInt(month) && p.year === parseInt(year)
  );
  
  const canAccess = !!payslip;
  console.log(`User can access payslip: ${canAccess}`);
  
  return canAccess;
};

// STATIC METHOD TO LINK USER TO EMPLOYEE BY EMPID (for admin/HR use)
unifiedPayrollSchema.statics.linkUserToEmployeeByEmpId = async function(empId, userId, userEmail) {
  console.log(`Linking user ${userId} to employee ${empId}`);
  
  const employee = await this.findOne({ empId: empId });
  
  if (!employee) {
    throw new Error('Employee not found');
  }
  
  // Check if employee is already linked to another user
  if (employee.isLinkedToUser && employee.userId && employee.userId.toString() !== userId.toString()) {
    throw new Error('Employee is already linked to another user');
  }
  
  // Link the user to employee
  employee.userId = userId;
  employee.userEmail = userEmail;
  employee.isLinkedToUser = true;
  
  await employee.save();
  
  console.log(`Successfully linked user ${userId} to employee ${empId}`);
  return employee;
};

// STATIC METHOD TO UNLINK USER FROM EMPLOYEE (for admin/HR use)
unifiedPayrollSchema.statics.unlinkUserFromEmployee = async function(empId) {
  console.log(`Unlinking user from employee ${empId}`);
  
  const employee = await this.findOne({ empId: empId });
  
  if (!employee) {
    throw new Error('Employee not found');
  }
  
  // Unlink the user
  employee.userId = undefined;
  employee.userEmail = undefined;
  employee.isLinkedToUser = false;
  
  await employee.save();
  
  console.log(`Successfully unlinked user from employee ${empId}`);
  return employee;
};

// Create model for UnifiedPayroll in the main database (for backward compatibility)
const UnifiedPayroll = mongoose.model('UnifiedPayroll', unifiedPayrollSchema);

// Export the schema for company-specific models
export { unifiedPayrollSchema };

// Export the main model as default
export default UnifiedPayroll;
