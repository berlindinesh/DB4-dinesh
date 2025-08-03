import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema({
  orderId: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  razorpayOrderId: {
    type: String,
    required: true,
    trim: true
  },
  razorpayPaymentId: {
    type: String,
    trim: true,
    default: null
  },
  razorpaySignature: {
    type: String,
    trim: true,
    default: null
  },
  companyCode: {
    type: String,
    required: true,
    trim: true,
    uppercase: true,
    ref: 'Company'
  },
  adminEmail: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  currency: {
    type: String,
    required: true,
    default: 'INR',
    uppercase: true
  },
  status: {
    type: String,
    required: true,
    enum: ['created', 'pending', 'paid', 'failed', 'cancelled', 'refunded'],
    default: 'created'
  },
  paymentMethod: {
    type: String,
    enum: ['card', 'netbanking', 'wallet', 'upi', 'emi', 'paylater', 'unknown'],
    default: 'unknown'
  },
  bankReference: {
    type: String,
    trim: true,
    default: null
  },
  failureReason: {
    type: String,
    trim: true,
    default: null
  },
  refundId: {
    type: String,
    trim: true,
    default: null
  },
  refundAmount: {
    type: Number,
    min: 0,
    default: 0
  },
  notes: {
    companyName: {
      type: String,
      trim: true
    },
    purpose: {
      type: String,
      default: 'HRMS Registration Fee'
    },
    registrationDate: {
      type: Date,
      default: Date.now
    },
    additionalInfo: {
      type: String,
      trim: true
    }
  },
  metadata: {
    userAgent: String,
    ipAddress: String,
    deviceInfo: String
  },
  webhookEvents: [{
    eventType: {
      type: String,
      required: true
    },
    eventData: {
      type: mongoose.Schema.Types.Mixed
    },
    receivedAt: {
      type: Date,
      default: Date.now
    }
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  paidAt: {
    type: Date,
    default: null
  },
  expiresAt: {
    type: Date,
    default: function() {
      // Payment expires in 24 hours
      return new Date(Date.now() + 24 * 60 * 60 * 1000);
    }
  }
}, {
  timestamps: true
});

// Indexes for better query performance
paymentSchema.index({ companyCode: 1 });
paymentSchema.index({ adminEmail: 1 });
paymentSchema.index({ razorpayOrderId: 1 });
paymentSchema.index({ razorpayPaymentId: 1 });
paymentSchema.index({ status: 1 });
paymentSchema.index({ createdAt: -1 });
paymentSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL index

// Virtual for formatted amount in INR
paymentSchema.virtual('amountInINR').get(function() {
  return (this.amount / 100).toFixed(2);
});

// Virtual for payment age
paymentSchema.virtual('paymentAge').get(function() {
  const now = new Date();
  const created = this.createdAt;
  const diffMs = now - created;
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  
  if (diffHours > 0) {
    return `${diffHours}h ${diffMins}m ago`;
  }
  return `${diffMins}m ago`;
});

// Instance methods
paymentSchema.methods.markAsPaid = function(paymentDetails) {
  this.status = 'paid';
  this.razorpayPaymentId = paymentDetails.razorpay_payment_id;
  this.razorpaySignature = paymentDetails.razorpay_signature;
  this.paidAt = new Date();
  this.updatedAt = new Date();
  
  // Extract payment method from Razorpay payment details if available
  if (paymentDetails.method) {
    this.paymentMethod = paymentDetails.method;
  }
  
  if (paymentDetails.bank_reference) {
    this.bankReference = paymentDetails.bank_reference;
  }
  
  return this.save();
};

paymentSchema.methods.markAsFailed = function(reason) {
  this.status = 'failed';
  this.failureReason = reason;
  this.updatedAt = new Date();
  return this.save();
};

paymentSchema.methods.addWebhookEvent = function(eventType, eventData) {
  this.webhookEvents.push({
    eventType,
    eventData,
    receivedAt: new Date()
  });
  this.updatedAt = new Date();
  return this.save();
};

// Static methods
paymentSchema.statics.findByCompanyCode = function(companyCode) {
  return this.find({ companyCode: companyCode.toUpperCase() })
             .sort({ createdAt: -1 });
};

paymentSchema.statics.findPendingPayments = function() {
  return this.find({ 
    status: { $in: ['created', 'pending'] },
    expiresAt: { $gt: new Date() }
  });
};

paymentSchema.statics.getPaymentStats = function() {
  return this.aggregate([
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalAmount: { $sum: '$amount' }
      }
    }
  ]);
};

// Pre-save middleware
paymentSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Pre-find middleware to exclude expired payments by default
paymentSchema.pre(/^find/, function(next) {
  // Only apply this filter if no explicit expiresAt condition is set
  if (!this.getQuery().expiresAt && !this.getQuery()._id) {
    this.where({ expiresAt: { $gt: new Date() } });
  }
  next();
});

const Payment = mongoose.model('Payment', paymentSchema);

export default Payment;
export { paymentSchema };
