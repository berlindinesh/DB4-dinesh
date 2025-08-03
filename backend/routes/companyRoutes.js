import express from 'express';
import { 
  getCompanyDetails, 
  updateCompanyDetails, 
  updateCompanySettings,
  registerCompany,
  forgotPassword,
  resetPassword,
  verifyResetToken,
  changePassword,
  verifyOtp,
  verifyDualOtp,
  resendOtp,
  upload,
  getCompanySettings,
  checkCompanyCode,
} from '../controllers/companyController.js';
import {
  login,
  createUser
} from '../controllers/authControllerCompany.js';
import { authenticate, authorize } from '../middleware/companyAuth.js';
import User from '../models/User.js';
import Company from '../models/Company.js';
import bcrypt from 'bcrypt';
import { getUserModel } from '../models/User.js';
import { getFileUrl } from '../config/s3Config.js';

const router = express.Router();

// PUBLIC ROUTES - NO AUTHENTICATION REQUIRED
// ==========================================

// Company registration and authentication
router.post('/register', registerCompany);
router.post('/login', login);

// OTP verification routes
router.post('/verify-otp', verifyOtp);
router.post('/verify-dual-otp', verifyDualOtp);
router.post('/resend-otp', resendOtp);

// Password reset routes - public
router.post('/forgot-password', forgotPassword);
router.post('/verify-reset-token', verifyResetToken);
router.post('/reset-password', resetPassword);

// Verification status route - public
router.get('/verification-status/:companyCode', async (req, res) => {
  try {
    const { companyCode } = req.params;
    
    const company = await Company.findOne({ companyCode });
    
    if (!company) {
      return res.status(404).json({ message: 'Company not found' });
    }
    
    // Find the admin user
    const adminUser = await User.findById(company.adminUserId);
    
    res.json({
      companyName: company.name,
      isActive: company.isActive,
      pendingVerification: company.pendingVerification,
      adminVerified: adminUser ? adminUser.isVerified : false
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Check company code availability - public
router.get('/check-code/:companyCode', checkCompanyCode);

// Get payment link for company - public
router.get('/payment-link/:companyCode', async (req, res) => {
  try {
    const { companyCode } = req.params;
    
    const company = await Company.findOne({ companyCode: companyCode.toUpperCase() });
    
    if (!company) {
      return res.status(404).json({ 
        success: false,
        message: 'Company not found' 
      });
    }
    
    // Check if payment is already completed
    if (company.paymentCompleted) {
      return res.status(400).json({
        success: false,
        message: 'Payment has already been completed for this company'
      });
    }
    
    // Check if company registration is complete (email verified)
    if (company.pendingVerification) {
      return res.status(400).json({
        success: false,
        message: 'Company registration is not complete. Please verify email addresses first.'
      });
    }
    
    // Mark payment link as shared
    if (!company.paymentLinkShared) {
      company.paymentLinkShared = true;
      company.paymentLinkSharedDate = new Date();
      await company.save();
    }
    
    res.json({
      success: true,
      company: {
        name: company.name,
        companyCode: company.companyCode,
        contactEmail: company.contactEmail,
        paymentRequired: true,
        paymentLinkShared: true
      },
      paymentLink: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/payment/${company.companyCode}`,
      message: 'Payment link is ready. Please complete the payment to activate your account.'
    });
    
  } catch (error) {
    console.error('Error getting payment link:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error',
      error: error.message 
    });
  }
});

// Send payment link via email - public
router.post('/send-payment-link/:companyCode', async (req, res) => {
  try {
    const { companyCode } = req.params;
    
    const company = await Company.findOne({ companyCode: companyCode.toUpperCase() });
    
    if (!company) {
      return res.status(404).json({ 
        success: false,
        message: 'Company not found' 
      });
    }
    
    // Check if payment is already completed
    if (company.paymentCompleted) {
      return res.status(400).json({
        success: false,
        message: 'Payment has already been completed for this company'
      });
    }
    
    // Check if company registration is complete (email verified)
    if (company.pendingVerification) {
      return res.status(400).json({
        success: false,
        message: 'Company registration is not complete. Please verify email addresses first.'
      });
    }
    
    // Generate payment link
    const paymentLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/payment/${company.companyCode}`;
    
    // Send payment link email
    try {
      const { sendPaymentLinkEmail } = await import('../utils/paymentMailer.js');
      await sendPaymentLinkEmail(company, paymentLink);
      
      // Mark payment link as shared
      company.paymentLinkShared = true;
      company.paymentLinkSharedDate = new Date();
      await company.save();
      
      res.json({
        success: true,
        message: `Payment link has been sent to ${company.contactEmail}`,
        company: {
          name: company.name,
          companyCode: company.companyCode,
          contactEmail: company.contactEmail
        },
        paymentLink
      });
      
    } catch (emailError) {
      console.error('Error sending payment link email:', emailError);
      res.status(500).json({
        success: false,
        message: 'Failed to send payment link email',
        error: emailError.message
      });
    }
    
  } catch (error) {
    console.error('Error sending payment link:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error',
      error: error.message 
    });
  }
});

// Get all pending payment companies (for admin use)
router.get('/pending-payments', async (req, res) => {
  try {
    const pendingCompanies = await Company.find({
      paymentCompleted: false,
      pendingVerification: false,
      isActive: false
    }).select('name companyCode contactEmail createdAt paymentLinkShared paymentLinkSharedDate');
    
    const companiesWithLinks = pendingCompanies.map(company => ({
      ...company.toObject(),
      paymentLink: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/payment/${company.companyCode}`,
      daysSinceRegistration: Math.floor((new Date() - company.createdAt) / (1000 * 60 * 60 * 24))
    }));
    
    res.json({
      success: true,
      count: companiesWithLinks.length,
      companies: companiesWithLinks
    });
    
  } catch (error) {
    console.error('Error getting pending payments:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error',
      error: error.message 
    });
  }
});

// Send payment reminders to all pending companies
router.post('/send-payment-reminders', async (req, res) => {
  try {
    const pendingCompanies = await Company.find({
      paymentCompleted: false,
      pendingVerification: false,
      isActive: false
    });
    
    let sent = 0;
    let failed = 0;
    const results = [];
    
    for (const company of pendingCompanies) {
      try {
        const daysSinceRegistration = Math.floor((new Date() - company.createdAt) / (1000 * 60 * 60 * 24));
        const { sendPaymentReminderEmail } = await import('../utils/paymentMailer.js');
        
        await sendPaymentReminderEmail(company, Math.max(0, 365 - daysSinceRegistration));
        
        company.paymentLinkShared = true;
        company.paymentLinkSharedDate = new Date();
        await company.save();
        
        sent++;
        results.push({
          companyCode: company.companyCode,
          contactEmail: company.contactEmail,
          status: 'sent',
          daysSinceRegistration
        });
        
      } catch (emailError) {
        failed++;
        results.push({
          companyCode: company.companyCode,
          contactEmail: company.contactEmail,
          status: 'failed',
          error: emailError.message
        });
      }
    }
    
    res.json({
      success: true,
      message: `Payment reminders sent. ${sent} successful, ${failed} failed.`,
      summary: { sent, failed, total: pendingCompanies.length },
      results
    });
    
  } catch (error) {
    console.error('Error sending payment reminders:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error',
      error: error.message 
    });
  }
});

// Test payment link system - for verification
router.post('/test-payment-link/:companyCode', async (req, res) => {
  try {
    const { companyCode } = req.params;
    
    const company = await Company.findOne({ companyCode: companyCode.toUpperCase() });
    
    if (!company) {
      return res.status(404).json({ 
        success: false,
        message: 'Company not found' 
      });
    }
    
    const paymentLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/payment/${company.companyCode}`;
    
    // Test all payment link functions
    const tests = {
      companyExists: !!company,
      emailVerified: !company.pendingVerification,
      paymentNotCompleted: !company.paymentCompleted,
      paymentLinkGenerated: !!paymentLink,
      emailConfigured: !!(process.env.USER && process.env.PASS),
      razorpayConfigured: !!(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET)
    };
    
    const allTestsPassed = Object.values(tests).every(test => test === true);
    
    res.json({
      success: true,
      message: 'Payment link system test completed',
      companyCode: company.companyCode,
      companyName: company.name,
      contactEmail: company.contactEmail,
      paymentLink,
      tests,
      allTestsPassed,
      readyForPayment: allTestsPassed
    });
    
  } catch (error) {
    console.error('Error testing payment link:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error during test',
      error: error.message 
    });
  }
});

// Debug routes - should be removed in production
router.get('/debug-otp/:email', async (req, res) => {
  try {
    const { email } = req.params;
    const user = await User.findOne({ email });
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json({
      email: user.email,
      otp: user.otp,
      otpExpires: user.otpExpires,
      isVerified: user.isVerified,
      now: new Date()
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/debug-reset-password', async (req, res) => {
  try {
    const { email, companyCode, newPassword } = req.body;
    
    if (!email || !companyCode || !newPassword) {
      return res.status(400).json({ message: 'Email, company code, and new password are required' });
    }
    
    const user = await User.findOne({ 
      email: email.toLowerCase(), 
      companyCode: companyCode.toUpperCase() 
    });
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Hash the new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    
    // Update the user's password
    user.password = hashedPassword;
    user.lastModified = new Date();
    await user.save();
    
    res.json({ 
      message: 'Password reset successful',
      email: user.email,
      companyCode: user.companyCode
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// PROTECTED ROUTES - AUTHENTICATION REQUIRED
// =========================================
// Apply authentication middleware to all routes below this point
router.use(authenticate);

// Company management routes
router.get('/', getCompanyDetails);
router.put('/', authorize(['manage_company_settings']), updateCompanyDetails);
router.put('/settings', authenticate, authorize(['manage_company_settings']), updateCompanySettings);
router.get('/settings', authenticate, getCompanySettings);

// User management routes
router.post('/users', authorize(['create_employees']), createUser);

// Add new route to get users with incremental updates support
router.get('/users', authenticate, async (req, res) => {
  try {
    const companyCode = req.companyCode;
    const { lastCheck } = req.query;
    
    if (!companyCode) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    let query = { companyCode };
    
    // If lastCheck is provided, only return users modified after that time
    if (lastCheck) {
      query.lastModified = { $gt: new Date(lastCheck) };
    }
    
    const CompanyUser = await getUserModel(companyCode);
    const users = await CompanyUser.find(query)
      .select('-password')
      .sort({ lastModified: -1 });
    
    res.json({
      users,
      hasUpdates: users.length > 0,
      lastCheck: new Date(),
      total: users.length
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: error.message });
  }
});

// Change password (for authenticated users)
router.post('/change-password', changePassword);

// Add this route after the existing routes
router.get('/logo', authenticate, async (req, res) => {
  try {
    const companyCode = req.companyCode;
    
    if (!companyCode) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    const company = await Company.findOne({ companyCode });
    
    if (!company) {
      return res.status(404).json({ message: 'Company not found' });
    }
    
    // Use centralized getFileUrl function to handle both S3 and local URLs
    const logoUrl = getFileUrl(company.logo);
    
    res.status(200).json({ 
      success: true,
      logoUrl: logoUrl
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/details', authenticate, async (req, res) => {
  try {
    const companyCode = req.companyCode;
    
    if (!companyCode) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    const company = await Company.findOne({ companyCode });
    
    if (!company) {
      return res.status(404).json({ message: 'Company not found' });
    }
    
    // Format address as a single string
    let formattedAddress = '';
    if (company.address) {
      const addr = company.address;
      const addressParts = [];
      if (addr.street) addressParts.push(addr.street);
      if (addr.city) addressParts.push(addr.city);
      if (addr.state) addressParts.push(addr.state);
      if (addr.country) addressParts.push(addr.country);
      if (addr.zipCode) addressParts.push(addr.zipCode);
      formattedAddress = addressParts.join(', ');
    }
    
    // Use centralized getFileUrl function to handle both S3 and local URLs
    const logoUrl = getFileUrl(company.logo);
    
    res.status(200).json({ 
      success: true,
      data: {
        name: company.name,
        address: formattedAddress,
        email: company.contactEmail,
        phone: company.contactPhone,
        logoUrl: logoUrl
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;

