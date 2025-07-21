// import mongoose from 'mongoose';

// const AssetHistorySchema = new mongoose.Schema({
//   name: { type: String, required: true }, // Changed from assetName to name
//   category: { type: String, required: true },
//   allottedDate: { type: Date, required: true },
//   returnDate: { type: Date },
//   status: { 
//     type: String, 
//     enum: ['In Use', 'Returned', 'Under Service', 'Available', 'Under Maintenance'], 
//     required: true 
//   },
//   batch: { type: String },
//   currentEmployee: { type: String },
//   previousEmployees: [{ type: String }]
// });

// export default mongoose.model('AssetHistory', AssetHistorySchema);

// import mongoose from 'mongoose';

// const AssetHistorySchema = new mongoose.Schema({
//   name: { type: String, required: true }, // Changed from assetName to name
//   category: { type: String, required: true },
//   allottedDate: { type: Date, required: true },
//   returnDate: { type: Date },
//   status: { 
//     type: String, 
//     enum: ['In Use', 'Returned', 'Under Service', 'Available', 'Under Maintenance'], 
//     required: true 
//   },
//   batch: { type: String },
//   currentEmployee: { type: String },
//   previousEmployees: [{ type: String }]
// });

// // Add console.log to see the schema when the server starts
// console.log("AssetHistory Schema initialized");

// // Create model for AssetHistory in the main database (for backward compatibility)
// const AssetHistory = mongoose.model('AssetHistory', AssetHistorySchema);

// // Export the schema for company-specific models
// export { AssetHistorySchema };

// // Export the main model as default
// export default AssetHistory;
import mongoose from 'mongoose';

const AssetHistorySchema = new mongoose.Schema({
  name: { type: String, required: true },
  category: { type: String, required: true },
  allottedDate: { type: Date }, // Remove required: true
  returnDate: { type: Date },
  status: { 
    type: String, 
    enum: ['In Use', 'Returned', 'Under Service', 'Available', 'Under Maintenance'], 
    required: true 
  },
  batch: { type: String, default: "" },
  currentEmployee: { type: String, default: "" }, // Add default
  previousEmployees: [{ type: String }] // This is correct
});

console.log("AssetHistory Schema initialized");

const AssetHistory = mongoose.model('AssetHistory', AssetHistorySchema);

export { AssetHistorySchema };
export default AssetHistory;
