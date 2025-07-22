// import mongoose from 'mongoose';

// const offboardingSchema = new mongoose.Schema({
//   employeeName: { type: String, required: true },
//   employeeId: { type: String },
//   department: { type: String },
//   position: { type: String },
//   joiningDate: { type: Date },
//   stage: { 
//     type: String, 
//     enum: ['Notice Period', 'Exit Interview', 'Work Handover', 'Clearance Process'],
//     required: true,
//     default: 'Notice Period'
//   },
  
//   // Notice Period fields
//   noticePeriod: String,
//   startDate: { type: Date, required: true },
//   endDate: { type: Date, required: true },
//   reason: String,
//   otherReason: String,
  
//   // Exit Interview fields
//   interviewDate: Date,
//   interviewer: String,
//   feedback: String,
  
//   // Work Handover fields
//   handoverTo: String,
//   handoverEmail: String,
//   projectDocuments: String,
//   pendingTasks: String,
  
//   // Asset Management
//   assets: [{
//     type: { type: String },
//     id: { type: String },
//     status: { 
//       type: String, 
//       enum: ['Pending', 'Returned', 'Lost/Damaged'],
//       default: 'Pending'
//     }
//   }],
  
//   // Clearance Process
//   clearanceStatus: {
//     hr: { type: Boolean, default: false },
//     it: { type: Boolean, default: false },
//     finance: { type: Boolean, default: false },
//     admin: { type: Boolean, default: false }
//   },
//   exitChecklistCompleted: { type: Boolean, default: false },
  
//   // Offboarding completion tracking
//   officiallyOffboarded: { type: Boolean, default: false },
//   officiallyOffboardedDate: { type: Date },
  
//   // Common fields
//   taskStatus: { type: String, default: '0/0' },
//   description: String,
//   manager: { type: String, required: true },
//   documents: [{
//     name: String,
//     type: String,
//     path: String,
//     uploadedAt: { type: Date, default: Date.now }
//   }]
// }, { timestamps: true });

// // Add a pre-save middleware to set the offboarding date
// offboardingSchema.pre('save', function(next) {
//   if (this.isModified('officiallyOffboarded') && this.officiallyOffboarded && !this.officiallyOffboardedDate) {
//     this.officiallyOffboardedDate = new Date();
//   }
//   next();
// });

// // Add a pre-save middleware to check if all clearances are completed
// offboardingSchema.pre('save', function(next) {
//   if (this.isModified('clearanceStatus')) {
//     const { hr, it, finance, admin } = this.clearanceStatus || {};
//     this.exitChecklistCompleted = hr && it && finance && admin;
//   }
//   next();
// });

// export default mongoose.model('Offboarding', offboardingSchema);
import mongoose from 'mongoose';

const offboardingSchema = new mongoose.Schema({
  employeeName: { type: String, required: true },
  employeeId: { type: String },
  department: { type: String },
  position: { type: String },
  joiningDate: { type: Date },
  stage: { 
    type: String, 
    enum: ['Notice Period', 'Exit Interview', 'Work Handover', 'Clearance Process'],
    required: true,
    default: 'Notice Period'
  },
  
  // Notice Period fields
  noticePeriod: String,
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  reason: String,
  otherReason: String,
  
  // Exit Interview fields
  interviewDate: Date,
  interviewer: String,
  feedback: String,
  
  // Work Handover fields
  handoverTo: String,
  handoverEmail: String,
  projectDocuments: String,
  pendingTasks: String,
  
  // Asset Management
  assets: [{
    type: { type: String },
    id: { type: String },
    status: { 
      type: String, 
      enum: ['Pending', 'Returned', 'Lost/Damaged'],
      default: 'Pending'
    }
  }],
  
  // Clearance Process
  clearanceStatus: {
    hr: { type: Boolean, default: false },
    it: { type: Boolean, default: false },
    finance: { type: Boolean, default: false },
    admin: { type: Boolean, default: false }
  },
  exitChecklistCompleted: { type: Boolean, default: false },
  
  // Offboarding completion tracking
  officiallyOffboarded: { type: Boolean, default: false },
  officiallyOffboardedDate: { type: Date },
  
  // Common fields
  taskStatus: { type: String, default: '0/0' },
  description: String,
  manager: { type: String, required: true },
  
  // Documents array - MAKE SURE THIS IS PROPERLY DEFINED
  documents: [{
    name: {
      type: String,
      required: true
    },
    type: {
      type: String,
      required: true
    },
    path: {
      type: String,
      required: true
    },
    size: {
      type: Number
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    },
    uploadedBy: {
      type: String
    }
  }]
}, { timestamps: true });

// Add a pre-save middleware to set the offboarding date
offboardingSchema.pre('save', function(next) {
  if (this.isModified('officiallyOffboarded') && this.officiallyOffboarded && !this.officiallyOffboardedDate) {
    this.officiallyOffboardedDate = new Date();
  }
  next();
});

// Add a pre-save middleware to check if all clearances are completed
offboardingSchema.pre('save', function(next) {
  if (this.isModified('clearanceStatus')) {
    const { hr, it, finance, admin } = this.clearanceStatus || {};
    this.exitChecklistCompleted = hr && it && finance && admin;
  }
  next();
});

// Create model for Offboarding in the main database (for backward compatibility)
const Offboarding = mongoose.model('Offboarding', offboardingSchema);

// Export the schema for company-specific models
export { offboardingSchema };

// Export the main model as default
export default Offboarding;


// import mongoose from 'mongoose';

// const offboardingSchema = new mongoose.Schema({
//   employeeName: { type: String, required: true },
//   employeeId: { type: String },
//   department: { type: String },
//   position: { type: String },
//   joiningDate: { type: Date },
//   stage: { 
//     type: String, 
//     enum: ['Notice Period', 'Exit Interview', 'Work Handover', 'Clearance Process'],
//     required: true,
//     default: 'Notice Period'
//   },
  
//   // Notice Period fields
//   noticePeriod: String,
//   startDate: { type: Date, required: true },
//   endDate: { type: Date, required: true },
//   reason: String,
//   otherReason: String,
  
//   // Exit Interview fields
//   interviewDate: Date,
//   interviewer: String,
//   feedback: String,
  
//   // Work Handover fields
//   handoverTo: String,
//   handoverEmail: String,
//   projectDocuments: String,
//   pendingTasks: String,
  
//   // Asset Management
//   assets: [{
//     type: { type: String },
//     id: { type: String },
//     status: { 
//       type: String, 
//       enum: ['Pending', 'Returned', 'Lost/Damaged'],
//       default: 'Pending'
//     }
//   }],
  
//   // Clearance Process
//   clearanceStatus: {
//     hr: { type: Boolean, default: false },
//     it: { type: Boolean, default: false },
//     finance: { type: Boolean, default: false },
//     admin: { type: Boolean, default: false }
//   },
//   exitChecklistCompleted: { type: Boolean, default: false },
  
//   // Offboarding completion tracking
//   officiallyOffboarded: { type: Boolean, default: false },
//   officiallyOffboardedDate: { type: Date },
  
//   // Common fields
//   taskStatus: { type: String, default: '0/0' },
//   description: String,
//   manager: { type: String, required: true },
//   // documents: [{
//   //   name: String,
//   //   type: String,
//   //   path: String,
//   //   uploadedAt: { type: Date, default: Date.now }
//   // }]
//   documents: [{
//   name: {
//     type: String,
//     required: true
//   },
//   type: {
//     type: String,
//     required: true
//   },
//   path: {
//     type: String,
//     required: true
//   },
//   uploadedAt: {
//     type: Date,
//     default: Date.now
//   }
// }]
// }, { timestamps: true });

// // Add a pre-save middleware to set the offboarding date
// offboardingSchema.pre('save', function(next) {
//   if (this.isModified('officiallyOffboarded') && this.officiallyOffboarded && !this.officiallyOffboardedDate) {
//     this.officiallyOffboardedDate = new Date();
//   }
//   next();
// });

// // Add a pre-save middleware to check if all clearances are completed
// offboardingSchema.pre('save', function(next) {
//   if (this.isModified('clearanceStatus')) {
//     const { hr, it, finance, admin } = this.clearanceStatus || {};
//     this.exitChecklistCompleted = hr && it && finance && admin;
//   }
//   next();
// });

// // Create model for Offboarding in the main database (for backward compatibility)
// const Offboarding = mongoose.model('Offboarding', offboardingSchema);

// // Export the schema for company-specific models
// export { offboardingSchema };

// // Export the main model as default
// export default Offboarding;
