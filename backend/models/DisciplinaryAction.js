import mongoose from 'mongoose';

const disciplinaryActionSchema = new mongoose.Schema({
  employee: {
    type: String,
    required: true
  },
  action: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  startDate: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    required: true
  },
  attachments: {
    filename: String,
    originalName: String,
    path: String
  },
  // Employee reference fields
  employeeId: {
    type: String,
    required: true,
    index: true
  },
  email: {
    type: String
  },
  department: {
    type: String
  },
  designation: {
    type: String
  }
}, { timestamps: true });

// Create model for DisciplinaryAction in the main database (for backward compatibility)
const DisciplinaryAction = mongoose.model('DisciplinaryAction', disciplinaryActionSchema);

// Export the schema for company-specific models
export { disciplinaryActionSchema };

// Export the main model as default
export default DisciplinaryAction;

