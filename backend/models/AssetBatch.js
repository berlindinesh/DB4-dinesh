import mongoose from 'mongoose';

const assetBatchSchema = new mongoose.Schema({
  batchNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  numberOfAssets: {
    type: Number,
    required: true,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Create model for AssetBatch in the main database (for backward compatibility)
const AssetBatch = mongoose.model('AssetBatch', assetBatchSchema);

// Export the schema for company-specific models
export { assetBatchSchema };

// Export the main model as default
export default AssetBatch;
