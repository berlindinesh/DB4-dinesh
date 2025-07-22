import mongoose from 'mongoose';

const documentSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  employee: {
    type: String,
    required: true
  },
  format: {
    type: String,
    required: true
  },
  maxSize: {
    type: String,
    required: true
  },
  description: String,
  current: {
    type: Number,
    default: 0
  },
  total: {
    type: Number,
    default: 1
  },
  details: [String],
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model('Document', documentSchema);
