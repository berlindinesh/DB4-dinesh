import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import Payment from '../models/Payment.js';
import Company from '../models/Company.js';
import User from '../models/User.js';
import { 
  razorpayInstance, 
  PAYMENT_CONFIG, 
  validateRazorpayCredentials,
  generatePaymentOptions,
  convertToINR 
} from '../config/payment.js';
import { sendPaymentSuccessEmail, sendPaymentNotificationToSuperAdmin } from '../utils/paymentMailer.js';

// Create payment order
export const createPaymentOrder = async (req, res) => {
  try {
    console.log('🔹 Payment Controller: createPaymentOrder called');
    console.log('🔹 Request URL:', req.originalUrl);
    console.log('🔹 Request Method:', req.method);
    console.log('🔹 Request Body:', { 
      companyCode: req.body.companyCode, 
      adminEmail: req.body.adminEmail
    });
    console.log('🔹 Request Headers:', {
      authorization: req.headers.authorization || 'NOT_PROVIDED',
      'x-company-code': req.headers['x-company-code'] || 'NOT_PROVIDED',
      'content-type': req.headers['content-type'] || 'NOT_PROVIDED'
    });
    
    // Validate Razorpay credentials
    validateRazorpayCredentials();
    
    const { companyCode, adminEmail } = req.body;
    
    if (!companyCode) {
      return res.status(400).json({
        success: false,
        message: 'Company code is required'
      });
    }
    
    console.log(`🔍 Searching for company: ${companyCode}`);
    console.log(`🔍 Admin email provided: ${adminEmail || 'Not provided'}`);
    
    const company = await Company.findOne({ 
      companyCode: companyCode.toUpperCase() 
    });
    
    console.log(`🔍 Company found:`, company ? {
      name: company.name,
      isActive: company.isActive,
      pendingVerification: company.pendingVerification,
      contactEmailVerified: company.contactEmailVerified
    } : 'NOT FOUND');
    
    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Company not found'
      });
    }
    
    // For payment creation, we allow companies that are still in verification process
    // Payment is part of the registration flow, so pendingVerification is OK
    if (!company.contactEmailVerified) {
      console.log('⚠️ Company contact email not verified yet, but allowing payment for registration');
    }
    
    console.log(`✅ Company verification status:`, {
      isActive: company.isActive,
      pendingVerification: company.pendingVerification,
      contactEmailVerified: company.contactEmailVerified
    });
    
    // Find admin user - if adminEmail provided, try that first, otherwise find any admin for company
    let admin;
    
    if (adminEmail) {
      admin = await User.findOne({ 
        email: adminEmail.toLowerCase(),
        companyCode: companyCode.toUpperCase(),
        role: 'admin'
      });
      console.log(`🔍 Admin search with email ${adminEmail}:`, admin ? 'FOUND' : 'NOT FOUND');
    }
    
    // If admin not found with provided email (or no email provided), find any admin for this company
    if (!admin) {
      console.log(`🔍 Searching for any admin user for company ${companyCode}`);
      admin = await User.findOne({ 
        companyCode: companyCode.toUpperCase(),
        role: 'admin'
      });
      
      if (admin) {
        console.log(`✅ Found admin for company: ${admin.email}`);
      }
    }
    
    if (!admin) {
      console.log(`No admin found for company ${companyCode}. Available emails:`, 
        await User.find({ companyCode: companyCode.toUpperCase() }).select('email role'));
        
      return res.status(404).json({
        success: false,
        message: `Admin user not found for company ${companyCode}. Please ensure the company registration is complete.`
      });
    }
    
    // Check if payment already exists and is pending/paid
    const existingPayment = await Payment.findOne({
      companyCode: companyCode.toUpperCase(),
      status: { $in: ['paid', 'pending'] }
    });
    
    if (existingPayment && existingPayment.status === 'paid') {
      return res.status(400).json({
        success: false,
        message: 'Payment has already been completed for this company'
      });
    }
    
    // Generate unique order ID
    const orderId = `order_${Date.now()}_${uuidv4().substr(0, 8)}`;
    
    // Prepare company data for payment options
    const companyData = {
      name: company.name,
      companyCode: company.companyCode,
      adminEmail: admin.email
    };
    
    // Generate Razorpay order options
    const orderOptions = generatePaymentOptions(companyData, orderId);
    
    console.log('Creating Razorpay order:', {
      orderId,
      amount: orderOptions.amount,
      currency: orderOptions.currency,
      companyCode: company.companyCode
    });
    
    // Create order with Razorpay
    const razorpayOrder = await razorpayInstance.orders.create(orderOptions);
    
    // Save payment record in database
    const payment = new Payment({
      orderId,
      razorpayOrderId: razorpayOrder.id,
      companyCode: company.companyCode,
      adminEmail: admin.email,
      amount: orderOptions.amount,
      currency: orderOptions.currency,
      status: 'created',
      notes: orderOptions.notes,
      metadata: {
        userAgent: req.headers['user-agent'],
        ipAddress: req.ip || req.connection.remoteAddress,
        deviceInfo: req.headers['x-device-info'] || 'Unknown'
      }
    });
    
    await payment.save();
    
    console.log('Payment record created:', {
      paymentId: payment._id,
      razorpayOrderId: razorpayOrder.id,
      amount: convertToINR(orderOptions.amount)
    });
    
    // Prepare response for frontend
    const response = {
      success: true,
      orderId: razorpayOrder.id,
      amount: orderOptions.amount,
      currency: orderOptions.currency,
      companyName: company.name,
      adminEmail: admin.email,
      paymentConfig: {
        key: process.env.RAZORPAY_KEY_ID,
        theme: PAYMENT_CONFIG.THEME,
        timeout: PAYMENT_CONFIG.TIMEOUT,
        method: PAYMENT_CONFIG.PAYMENT_METHODS
      },
      amountDisplay: `₹${convertToINR(orderOptions.amount)}`,
      description: `HRMS Registration Fee for ${company.name}`,
      prefill: {
        name: `${admin.firstName} ${admin.lastName}`,
        email: admin.email,
        contact: company.contactPhone || ''
      }
    };
    
    res.status(201).json(response);
    
  } catch (error) {
    console.error('Payment order creation failed:', error);
    
    // Handle specific Razorpay errors
    if (error.statusCode) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.error?.description || 'Payment gateway error',
        error: 'RAZORPAY_ERROR'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to create payment order',
      error: error.message
    });
  }
};

// Verify payment
export const verifyPayment = async (req, res) => {
  try {
    const { 
      razorpay_order_id, 
      razorpay_payment_id, 
      razorpay_signature,
      companyCode 
    } = req.body;
    
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: 'Missing payment verification parameters'
      });
    }
    
    // Find payment record
    const payment = await Payment.findOne({ 
      razorpayOrderId: razorpay_order_id 
    });
    
    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment record not found'
      });
    }
    
    // Verify signature
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');
    
    if (expectedSignature !== razorpay_signature) {
      // Mark payment as failed
      await payment.markAsFailed('Invalid payment signature');
      
      return res.status(400).json({
        success: false,
        message: 'Payment verification failed - Invalid signature'
      });
    }
    
    // Fetch payment details from Razorpay
    const razorpayPayment = await razorpayInstance.payments.fetch(razorpay_payment_id);
    
    if (razorpayPayment.status !== 'captured') {
      await payment.markAsFailed(`Payment not captured. Status: ${razorpayPayment.status}`);
      
      return res.status(400).json({
        success: false,
        message: 'Payment was not completed successfully'
      });
    }
    
    // Mark payment as paid
    await payment.markAsPaid({
      razorpay_payment_id,
      razorpay_signature,
      method: razorpayPayment.method,
      bank_reference: razorpayPayment.acquirer_data?.bank_transaction_id
    });
    
    // Update company payment status and activate plan
    const company = await Company.findOne({ 
      companyCode: payment.companyCode 
    });
    
    if (company) {
      // Set plan duration from config if not already set
      if (!company.planDurationDays) {
        company.planDurationDays = PAYMENT_CONFIG.PLAN_DURATION_DAYS;
      }
      
      // Activate the plan
      await company.activatePlan();
      
      // Update payment details
      company.paymentAmount = payment.amount;
      company.razorpayPaymentId = razorpay_payment_id;
      await company.save();
      
      // Send email notifications
      try {
        // Send success email to company contact
        await sendPaymentSuccessEmail(company.contactEmail, {
          companyName: company.name,
          amount: convertToINR(payment.amount),
          planStartDate: company.planStartDate,
          planEndDate: company.planEndDate,
          paymentId: razorpay_payment_id
        });
        
        // Send notification to super admin
        await sendPaymentNotificationToSuperAdmin({
          companyName: company.name,
          companyCode: company.companyCode,
          contactEmail: company.contactEmail,
          amount: convertToINR(payment.amount),
          paymentId: razorpay_payment_id,
          planStartDate: company.planStartDate,
          planEndDate: company.planEndDate
        });
        
        console.log('Payment success emails sent');
      } catch (emailError) {
        console.error('Failed to send payment success emails:', emailError);
      }
    }
    
    console.log('Payment verified successfully:', {
      paymentId: payment._id,
      razorpayPaymentId: razorpay_payment_id,
      companyCode: payment.companyCode,
      amount: convertToINR(payment.amount)
    });
    
    res.status(200).json({
      success: true,
      message: 'Payment verified successfully',
      paymentDetails: {
        paymentId: razorpay_payment_id,
        amount: convertToINR(payment.amount),
        currency: payment.currency,
        status: 'paid',
        paidAt: payment.paidAt,
        method: payment.paymentMethod
      }
    });
    
  } catch (error) {
    console.error('Payment verification failed:', error);
    
    res.status(500).json({
      success: false,
      message: 'Payment verification failed',
      error: error.message
    });
  }
};

// Handle payment failure
export const handlePaymentFailure = async (req, res) => {
  try {
    const { razorpay_order_id, error_description, error_code } = req.body;
    
    if (!razorpay_order_id) {
      return res.status(400).json({
        success: false,
        message: 'Order ID is required'
      });
    }
    
    // Find payment record
    const payment = await Payment.findOne({ 
      razorpayOrderId: razorpay_order_id 
    });
    
    if (payment) {
      const failureReason = error_description || `Error code: ${error_code}` || 'Unknown payment failure';
      await payment.markAsFailed(failureReason);
      
      console.log('Payment marked as failed:', {
        paymentId: payment._id,
        orderId: razorpay_order_id,
        reason: failureReason
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Payment failure recorded'
    });
    
  } catch (error) {
    console.error('Handle payment failure error:', error);
    
    res.status(500).json({
      success: false,
      message: 'Failed to record payment failure',
      error: error.message
    });
  }
};

// Get payment status
export const getPaymentStatus = async (req, res) => {
  try {
    const { companyCode } = req.params;
    
    if (!companyCode) {
      return res.status(400).json({
        success: false,
        message: 'Company code is required'
      });
    }
    
    const payment = await Payment.findOne({ 
      companyCode: companyCode.toUpperCase() 
    }).sort({ createdAt: -1 });
    
    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'No payment record found for this company'
      });
    }
    
    res.status(200).json({
      success: true,
      payment: {
        status: payment.status,
        amount: convertToINR(payment.amount),
        currency: payment.currency,
        createdAt: payment.createdAt,
        paidAt: payment.paidAt,
        paymentMethod: payment.paymentMethod,
        orderId: payment.razorpayOrderId
      }
    });
    
  } catch (error) {
    console.error('Get payment status error:', error);
    
    res.status(500).json({
      success: false,
      message: 'Failed to get payment status',
      error: error.message
    });
  }
};

// Webhook handler for Razorpay events
export const handleWebhook = async (req, res) => {
  try {
    const signature = req.headers['x-razorpay-signature'];
    const body = JSON.stringify(req.body);
    
    // Verify webhook signature
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET)
      .update(body)
      .digest('hex');
    
    if (signature !== expectedSignature) {
      console.log('Invalid webhook signature');
      return res.status(400).json({ success: false });
    }
    
    const event = req.body;
    
    console.log('Received webhook event:', {
      event: event.event,
      paymentId: event.payload?.payment?.entity?.id,
      orderId: event.payload?.payment?.entity?.order_id
    });
    
    // Handle different webhook events
    switch (event.event) {
      case 'payment.captured':
        await handlePaymentCaptured(event.payload.payment.entity);
        break;
      case 'payment.failed':
        await handlePaymentFailedWebhook(event.payload.payment.entity);
        break;
      default:
        console.log('Unhandled webhook event:', event.event);
    }
    
    res.status(200).json({ success: true });
    
  } catch (error) {
    console.error('Webhook handling error:', error);
    res.status(500).json({ success: false });
  }
};

// Helper function to handle payment captured webhook
const handlePaymentCaptured = async (paymentData) => {
  try {
    const payment = await Payment.findOne({ 
      razorpayOrderId: paymentData.order_id 
    });
    
    if (payment && payment.status !== 'paid') {
      await payment.markAsPaid({
        razorpay_payment_id: paymentData.id,
        method: paymentData.method,
        bank_reference: paymentData.acquirer_data?.bank_transaction_id
      });
      
      await payment.addWebhookEvent('payment.captured', paymentData);
      
      console.log('Payment marked as paid via webhook:', paymentData.id);
    }
  } catch (error) {
    console.error('Handle payment captured webhook error:', error);
  }
};

// Helper function to handle payment failed webhook
const handlePaymentFailedWebhook = async (paymentData) => {
  try {
    const payment = await Payment.findOne({ 
      razorpayOrderId: paymentData.order_id 
    });
    
    if (payment && payment.status !== 'failed') {
      await payment.markAsFailed(
        paymentData.error_description || 'Payment failed via webhook'
      );
      
      await payment.addWebhookEvent('payment.failed', paymentData);
      
      console.log('Payment marked as failed via webhook:', paymentData.id);
    }
  } catch (error) {
    console.error('Handle payment failed webhook error:', error);
  }
};

// Get payment configuration
export const getPaymentConfig = async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      config: {
        amount: convertToINR(PAYMENT_CONFIG.REGISTRATION_FEE),
        currency: PAYMENT_CONFIG.CURRENCY,
        theme: PAYMENT_CONFIG.THEME,
        timeout: PAYMENT_CONFIG.TIMEOUT,
        methods: PAYMENT_CONFIG.PAYMENT_METHODS
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get payment configuration',
      error: error.message
    });
  }
};

export default {
  createPaymentOrder,
  verifyPayment,
  handlePaymentFailure,
  getPaymentStatus,
  handleWebhook,
  getPaymentConfig
};
