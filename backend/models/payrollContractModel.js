import mongoose from 'mongoose';

const contractSchema = new mongoose.Schema({
  contract: { type: String, required: true },
  employee: { type: String, required: true },
  startDate: { type: String, required: true },
  endDate: { type: String },
  wageType: { type: String, required: true },
  basicSalary: { type: Number, required: true },
  filingStatus: { 
    type: String, 
    enum: [
      'Individual', 
      'Head of Household (HOH)', 
      'Married Filing Jointly (MFJ)', 
      'Married Filing Separately (MFS)', 
      'Single Filer'
    ] 
  },
  contractStatus: { type: String, enum: ['Draft', 'Active', 'Expired', 'Terminated'], default: 'Active' },
  department: { type: String },
  position: { type: String },
  role: { type: String },
  shift: { type: String },
  workType: { type: String },
  noticePeriod: { type: Number },
  deductFromBasicPay: { type: Boolean, default: false },
  calculateDailyLeave: { type: Boolean, default: false },
  note: { type: String },
  payFrequency: { type: String, enum: ['Weekly', 'Monthly', 'Semi-Monthly'] },
  documentUrl: { type: String },

    // Add contract document fields
  contractDocument: {
    filename: { type: String },
    originalName: { type: String },
    path: { type: String },
    size: { type: Number },
    mimetype: { type: String },
    uploadDate: { type: Date, default: Date.now }
  },
  
  renewalHistory: [{
    previousContractId: { type: mongoose.Schema.Types.ObjectId, ref: 'payrollContractModel' },
    renewalDate: { type: Date, default: Date.now },
    reason: { type: String }
  }],
  approvalStatus: {
    status: { type: String, enum: ['Pending', 'Approved', 'Rejected'], default: 'Pending' },
    approvers: [{
      name: { type: String },
      role: { type: String },
      status: { type: String, enum: ['Pending', 'Approved', 'Rejected'] },
      date: { type: Date },
      comments: { type: String }
    }]
  },
  salaryHistory: [{
    amount: { type: Number },
    effectiveDate: { type: Date },
    reason: { type: String }
  }],
  complianceDocuments: [{
    documentName: { type: String },
    status: { type: String, enum: ['Pending', 'Completed', 'Overdue'] },
    dueDate: { type: Date },
    submittedDate: { type: Date }
  }]
}, {
  timestamps: true
});

// Add a pre-save hook to automatically update contract status based on dates
contractSchema.pre('save', function(next) {
  const today = new Date();
  const endDate = this.endDate ? new Date(this.endDate) : null;
  
  // If contract has an end date and it's in the past, mark as expired
  if (endDate && endDate < today && this.contractStatus !== 'Terminated') {
    this.contractStatus = 'Expired';
  }
  
  next();
});

// Add virtual for remaining days
contractSchema.virtual('remainingDays').get(function() {
  if (!this.endDate) return null;
  
  const today = new Date();
  const endDate = new Date(this.endDate);
  const diffTime = endDate - today;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Add method to check if contract is expiring soon (within 30 days)
contractSchema.methods.isExpiringSoon = function() {
  if (!this.endDate) return false;
  
  const remainingDays = this.remainingDays;
  return remainingDays !== null && remainingDays > 0 && remainingDays <= 30;
};

// Ensure virtuals are included in JSON output
contractSchema.set('toJSON', { virtuals: true });
contractSchema.set('toObject', { virtuals: true });

// Create model for Contract in the main database (for backward compatibility)
const Contract = mongoose.model('payrollContractModel', contractSchema);

// Export the schema for company-specific models
export { contractSchema };

// Export the main model as default
export default Contract;
