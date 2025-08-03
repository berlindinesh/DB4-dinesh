import express from 'express';
import {
  createPaymentOrder,
  verifyPayment,
  handlePaymentFailure,
  getPaymentStatus,
  handleWebhook,
  getPaymentConfig
} from '../controllers/paymentController.js';

const router = express.Router();

// Add middleware to log all payment requests for debugging
router.use((req, res, next) => {
  console.log(`Payment route accessed: ${req.method} ${req.url}`);
  console.log('Payment route headers:', req.headers);
  next();
});

// PUBLIC ROUTES - NO AUTHENTICATION REQUIRED
// ==========================================

// Get payment configuration
router.get('/config', getPaymentConfig);

// Create payment order
router.post('/create-order', createPaymentOrder);

// Verify payment
router.post('/verify', verifyPayment);

// Handle payment failure
router.post('/failure', handlePaymentFailure);

// Get payment status by company code
router.get('/status/:companyCode', getPaymentStatus);

// Webhook endpoint for Razorpay
router.post('/webhook', express.raw({ type: 'application/json' }), handleWebhook);

// UTILITY ROUTES
// ==============

// Health check endpoint
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Payment service is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Test Razorpay connectivity (development only)
if (process.env.NODE_ENV === 'development') {
  router.get('/test-connection', async (req, res) => {
    try {
      const { razorpayInstance } = await import('../config/payment.js');
      
      // Test API by fetching a non-existent order (will return 400, but confirms connection)
      try {
        await razorpayInstance.orders.fetch('test_connection');
      } catch (testError) {
        // Expected error - means API is accessible
        if (testError.statusCode === 400) {
          return res.status(200).json({
            success: true,
            message: 'Razorpay connection successful',
            environment: 'development'
          });
        }
        throw testError;
      }
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Razorpay connection failed',
        error: error.message,
        environment: 'development'
      });
    }
  });
}

export default router;
