import jwt from 'jsonwebtoken';
import MainUser, { getUserModel } from '../models/User.js';
import Company from '../models/Company.js';
import crypto from 'crypto';
import { sendOtpEmail } from '../utils/mailer.js';
import bcrypt from 'bcrypt';
import { markInvitationAccepted } from './invitationController.js';

// Helper function to validate company status
const validateCompanyStatus = async (companyCode) => {
  const company = await Company.findOne({ 
    companyCode: companyCode.toUpperCase()
  });
  
  if (!company) {
    return {
      isValid: false,
      response: { 
        status: 401,
        data: { success: false, message: 'Invalid company code' }
      }
    };
  }
  
  if (!company.paymentCompleted) {
    return {
      isValid: false,
      response: {
        status: 402,
        data: {
          success: false,
          message: 'Company registration payment is pending. Please complete the payment to access the system.',
          requiresPayment: true,
          companyCode: company.companyCode,
          paymentLink: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/payment/${company.companyCode}`
        }
      }
    };
  }
  
  if (company.isPaymentExpired || (company.planEndDate && new Date() > company.planEndDate)) {
    if (!company.isPaymentExpired) {
      await company.checkPaymentExpiry();
    }
    
    return {
      isValid: false,
      response: {
        status: 402,
        data: {
          success: false,
          message: 'Your company plan has expired. Please renew to continue using the system.',
          planExpired: true,
          companyCode: company.companyCode,
          planEndDate: company.planEndDate
        }
      }
    };
  }
  
  if (!company.isActive) {
    return {
      isValid: false,
      response: {
        status: 401,
        data: { success: false, message: 'Company account is inactive' }
      }
    };
  }
  
  return { isValid: true, company };
};

// Helper function to authenticate user in company database
const authenticateCompanyUser = async (email, password, companyCode) => {
  const CompanyUserModel = await getUserModel(companyCode);
  const user = await CompanyUserModel.findOne({ 
    email: email.toLowerCase()
  });
  
  if (!user) {
    return { found: false };
  }
  
  if (!user.password) {
    return {
      found: true,
      isValid: false,
      response: {
        status: 401,
        data: { success: false, message: 'Account setup incomplete. Please contact administrator.' }
      }
    };
  }
  
  const isPasswordValid = await bcrypt.compare(password, user.password);
  
  if (!isPasswordValid) {
    return {
      found: true,
      isValid: false,
      response: {
        status: 401,
        data: { success: false, message: 'Invalid email or password' }
      }
    };
  }
  
  if (!user.isActive && !user.isFirstLogin) {
    return {
      found: true,
      isValid: false,
      response: {
        status: 401,
        data: { success: false, message: 'Your account is inactive. Please contact your administrator.' }
      }
    };
  }
  
  return { found: true, isValid: true, user };
};

// Helper function to handle first login
const handleFirstLogin = async (user, companyCode) => {
  if (!user.isFirstLogin) {
    user.lastLogin = new Date();
    user.lastModified = new Date();
    user.$skipMiddleware = true;
    await user.save();
    return;
  }
  
  try {
    if (user.invitationId) {
      await markInvitationAccepted(user._id, companyCode);
    }
    
    user.isFirstLogin = false;
    user.isActive = true;
    user.lastLogin = new Date();
    user.lastModified = new Date();
    user.$skipMiddleware = true;
    await user.save();
    
    console.log('User activated and first login completed');
  } catch (invitationError) {
    console.error('Error handling first login:', invitationError);
  }
};

// Helper function to authenticate main database user
const authenticateMainUser = async (email, password, companyCode, company) => {
  const user = await MainUser.findOne({ 
    email: email.toLowerCase(), 
    companyCode: companyCode.toUpperCase() 
  });
  
  if (!user) {
    return {
      found: false,
      response: {
        status: 401,
        data: { success: false, message: 'Invalid email or password' }
      }
    };
  }
  
  if (!user.isVerified) {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000);
    
    user.otp = otp;
    user.otpExpires = otpExpires;
    await user.save();
    
    try {
      await sendOtpEmail(email, otp, {
        name: user.name,
        companyName: company.name
      });
    } catch (emailError) {
      console.error('Error sending OTP email:', emailError);
    }
    
    return {
      found: true,
      isValid: false,
      response: {
        status: 403,
        data: {
          success: false,
          message: 'Email not verified. A verification code has been sent to your email.',
          requiresVerification: true,
          email: user.email
        }
      }
    };
  }
  
  if (!user.isActive) {
    return {
      found: true,
      isValid: false,
      response: {
        status: 401,
        data: { success: false, message: 'Your account is inactive. Please contact your administrator.' }
      }
    };
  }
  
  const isPasswordValid = await bcrypt.compare(password, user.password);
  
  if (!isPasswordValid) {
    return {
      found: true,
      isValid: false,
      response: {
        status: 401,
        data: { success: false, message: 'Invalid email or password' }
      }
    };
  }
  
  return { found: true, isValid: true, user };
};

// Helper function to create user in company database
const createCompanyUser = async (mainUser, companyCode) => {
  try {
    const CompanyUserModel = await getUserModel(companyCode);
    
    const companyUser = new CompanyUserModel({
      userId: mainUser.userId || `USER-${Date.now()}`,
      firstName: mainUser.firstName,
      middleName: mainUser.middleName,
      lastName: mainUser.lastName,
      name: mainUser.name,
      email: mainUser.email,
      password: mainUser.password,
      role: mainUser.role,
      companyCode: mainUser.companyCode,
      permissions: mainUser.permissions,
      isVerified: true,
      isActive: true,
      lastLogin: new Date(),
      lastModified: new Date()
    });
    
    companyUser.$skipMiddleware = true;
    await companyUser.save();
    console.log('User created in company database:', companyUser.email);
    
    return companyUser;
  } catch (dbError) {
    console.error('Error creating user in company database:', dbError);
    return null;
  }
};

// Login user
export const login = async (req, res) => {
  try {
    const { email, password, companyCode } = req.body;
    
    console.log('Login attempt received:', { 
      email, 
      companyCode,
      passwordProvided: !!password,
      passwordLength: password ? password.length : 0
    });
    
    // Validate company status
    const companyValidation = await validateCompanyStatus(companyCode);
    if (!companyValidation.isValid) {
      const { status, data } = companyValidation.response;
      return res.status(status).json(data);
    }
    
    const { company } = companyValidation;
    
    // Try to authenticate user in company database first
    try {
      const companyUserAuth = await authenticateCompanyUser(email, password, companyCode);
      
      if (companyUserAuth.found) {
        if (!companyUserAuth.isValid) {
          const { status, data } = companyUserAuth.response;
          return res.status(status).json(data);
        }
        
        const user = companyUserAuth.user;
        await handleFirstLogin(user, companyCode);
        
        // Generate JWT token and return success
        const token = jwt.sign(
          { 
            userId: user._id, 
            companyCode: user.companyCode, 
            role: user.role,
            isCompanyUser: true
          },
          process.env.JWT_SECRET || 'your_jwt_secret',
          { expiresIn: '24h' }
        );
        
        console.log('Login successful for company user:', user.email);
        
        return res.status(200).json({
          success: true,
          token,
          user: {
            id: user._id,
            userId: user.userId,
            name: user.name,
            email: user.email,
            role: user.role,
            permissions: user.permissions,
            companyCode: user.companyCode,
            isFirstLogin: false
          }
        });
      }
    } catch (dbError) {
      console.error('Error accessing company database:', dbError);
      return res.status(500).json({
        success: false,
        message: 'Database connection error. Please try again.'
      });
    }
    
    // If user not found in company database, check main database
    const mainUserAuth = await authenticateMainUser(email, password, companyCode, company);
    
    if (!mainUserAuth.found || !mainUserAuth.isValid) {
      const { status, data } = mainUserAuth.response;
      return res.status(status).json(data);
    }
    
    let user = mainUserAuth.user;
    
    // Create user in company database if not exists
    const companyUser = await createCompanyUser(user, companyCode);
    if (companyUser) {
      user = companyUser;
    }
    
    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: user._id, 
        companyCode: user.companyCode, 
        role: user.role
      },
      process.env.JWT_SECRET || 'your_jwt_secret',
      { expiresIn: '24h' }
    );
    
    console.log('Login successful for user:', user.email);
    
    res.status(200).json({
      success: true,
      token,
      user: {
        id: user._id,
        userId: user.userId,
        name: user.name,
        email: user.email,
        role: user.role,
        permissions: user.permissions,
        companyCode: user.companyCode
      }
    });
  } catch (error) {
    console.error('Login error details:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error during login',
      error: error.message 
    });
  }
};

// Verify email with OTP
export const verifyEmail = async (req, res) => {
  try {
    const { email, otp } = req.body;
    
    console.log('Received verification request:', { email, otp });
    
    // Find user in main database
    const user = await MainUser.findOne({ email });
    
    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: 'User not found' 
      });
    }
    
    const now = new Date();
    console.log('Found user:', {
      id: user._id,
      email: user.email,
      storedOtp: user.otp,
      otpExpires: user.otpExpires,
      now,
      isExpired: now > user.otpExpires
    });
    
    if (now > user.otpExpires) {
      return res.status(400).json({ 
        success: false,
        message: 'OTP has expired' 
      });
    }
    
    if (user.otp !== otp) {
      return res.status(400).json({ 
        success: false,
        message: 'Invalid OTP' 
      });
    }
    
    // Mark user as verified
    user.isVerified = true;
    user.otp = undefined;
    user.otpExpires = undefined;
    await user.save();
    
    console.log('User verified successfully:', user.email);
    
    // Activate company if this is an admin user
    if (user.role === 'admin') {
      const company = await Company.findOne({ companyCode: user.companyCode });
      if (company) {
        company.isActive = true;
        company.pendingVerification = false;
        await company.save();
        console.log('Company activated:', company.name);
        
        // Create admin user in company database
        try {
          // Get company-specific User model
          const CompanyUserModel = await getUserModel(user.companyCode);
          
          // Create user in company database
          const companyUser = new CompanyUserModel({
            userId: user.userId,
            firstName: user.firstName,
            middleName: user.middleName,
            lastName: user.lastName,
            name: user.name,
            email: user.email,
            password: user.password, // Already hashed
            role: user.role,
            companyCode: user.companyCode,
            permissions: user.permissions,
            isVerified: true,
            isActive: true,
            lastModified: new Date()
          });
          
          await companyUser.save();
          console.log('Admin user created in company database:', companyUser.email);
          
          // Also create a Company document in the company database
          const { companySchema } = await import('../models/Company.js');
          const createCompanyModel = (await import('../models/modelFactory.js')).default;
          const CompanyModel = await createCompanyModel(user.companyCode, 'Company', companySchema);
          
          const companyRecord = new CompanyModel({
            name: company.name,
            companyCode: company.companyCode,
            address: company.address,
            contactEmail: company.contactEmail,
            contactPhone: company.contactPhone,
            logo: company.logo,
            industry: company.industry,
            isActive: true,
            settings: company.settings,
            adminUserId: companyUser._id,
            registrationNumber: company.registrationNumber,
            pendingVerification: false
          });
          
          await companyRecord.save();
          console.log('Company record created in company database');
        } catch (dbError) {
          console.error('Error creating records in company database:', dbError);
          // Continue with the response even if this fails
        }
      }
    }
    
    res.status(200).json({ 
      success: true,
      message: 'Email verified successfully' 
    });
  } catch (error) {
    console.error('Verification error:', error);
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

// Create a new user (by admin or HR)
export const createUser = async (req, res) => {
  try {
    const { firstName, lastName, email, role, companyCode } = req.body;
    
    // Get company-specific User model
    const CompanyUserModel = await getUserModel(companyCode);
    
    // Check if user with email already exists in company database
    const existingUser = await CompanyUserModel.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }
    
    // Also check main database to avoid conflicts
    const existingMainUser = await MainUser.findOne({ email, companyCode });
    if (existingMainUser) {
      return res.status(400).json({ message: 'User with this email already exists in main database' });
    }
    
    // Generate temporary password
    const tempPassword = crypto.randomBytes(8).toString('hex');
    
    // Create new user in company database
    const user = new CompanyUserModel({
      firstName,
      lastName,
      name: `${firstName} ${lastName}`,
      email,
      password: tempPassword,
      role,
      companyCode,
      isVerified: true,
      isActive: true,
      lastModified: new Date()
    });
    
    // Assign permissions based on role
    user.assignPermissions();
    
    await user.save();
    
    // Send invitation email with temporary password
    try {
      // Get company details
      const company = await Company.findOne({ companyCode });
      
      // Create email message
      const message = `
        <h1>Welcome to ${company ? company.name : 'our HRMS system'}</h1>
        <p>Hello ${firstName} ${lastName},</p>
        <p>An account has been created for you with the following details:</p>
        <ul>
          <li>Email: ${email}</li>
          <li>Temporary Password: ${tempPassword}</li>
          <li>Company Code: ${companyCode}</li>
        </ul>
        <p>Please login using these credentials and change your password immediately.</p>
        <p>Login URL: ${process.env.CLIENT_URL || 'http://localhost:3000'}/login</p>
      `;
      
      // Setup email transporter
      const transporter = nodemailer.createTransporter({
        service: 'gmail',
        auth: {
          user: process.env.USER,
          pass: 'xnbj tvjf odej ynit'
        }
      });
      
      // Send email
      await transporter.sendMail({
        from: `"HRMS Support" <${process.env.USER}>`,
        to: email,
        subject: 'Your HRMS Account',
        html: message
      });
      
      console.log(`Invitation email sent to ${email} with password: ${tempPassword}`);
    } catch (emailError) {
      console.error('Error sending invitation email:', emailError);
      // Continue with the response even if email fails
    }
    
    res.status(201).json({ 
      message: 'User created successfully',
      userId: user.userId
    });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ message: error.message });
  }
};

// Resend OTP
export const resendOtp = async (req, res) => {
  try {
    const { email, companyCode } = req.body;
    
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }
    
    // Find user in main database
    const user = await MainUser.findOne({ 
      email,
      companyCode: companyCode ? companyCode.toUpperCase() : undefined
    });
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    if (user.isVerified) {
      return res.status(400).json({ message: 'Email is already verified' });
    }
    
    // Generate new OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    
    // Update user with new OTP
    user.otp = otp;
    user.otpExpires = otpExpires;
    await user.save();
    
    // Find company for this user
    const company = await Company.findOne({ companyCode: user.companyCode });
    
    // Send OTP email
    try {
      await sendOtpEmail(email, otp, {
        name: user.name,
        companyName: company ? company.name : 'HRMS'
      });
      
      console.log(`OTP resent to ${email}: ${otp}`);
    } catch (emailError) {
      console.error('Error sending OTP email:', emailError);
      return res.status(500).json({ 
        message: 'Error sending OTP email. Please try again later.',
        error: emailError.message 
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'OTP resent successfully'
    });
  } catch (error) {
    console.error('Resend OTP error:', error);
    res.status(500).json({ 
      message: 'Server error during OTP resend',
      error: error.message 
    });
  }
};

// Forgot password
export const forgotPassword = async (req, res) => {
  try {
    const { email, companyCode } = req.body;
    
    if (!email || !companyCode) {
      return res.status(400).json({ message: 'Email and company code are required' });
    }
    
    // Try to find user in company database first
    let user = null;
    let isCompanyUser = false;
    
    try {
      // Get company-specific User model
      const CompanyUserModel = await getUserModel(companyCode);
      
      // Find user in company database
      user = await CompanyUserModel.findOne({ email: email.toLowerCase() });
      
      if (user) {
        isCompanyUser = true;
        console.log('User found in company database for password reset:', user.email);
      }
    } catch (dbError) {
      console.error('Error accessing company database:', dbError);
      // Continue to check main database
    }
    
    // If not found in company database, check main database
    if (!user) {
      user = await MainUser.findOne({ 
        email: email.toLowerCase(), 
        companyCode: companyCode.toUpperCase() 
      });
      
      if (!user) {
        return res.status(404).json({ message: 'User not found with this email and company code' });
      }
    }
    
    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    
    // Hash token
    const hashedToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');
    
    // Set token expiry (1 hour)
    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
    user.lastModified = new Date();
    
    await user.save();
    
    // If user is in company database, also update main database record
    if (isCompanyUser) {
      const mainUser = await MainUser.findOne({ 
        email: email.toLowerCase(), 
        companyCode: companyCode.toUpperCase() 
      });
      
      if (mainUser) {
        mainUser.resetPasswordToken = hashedToken;
        mainUser.resetPasswordExpires = user.resetPasswordExpires;
        await mainUser.save();
      }
    }
    
    // Create reset URL
    const frontendUrl = process.env.CLIENT_URL || 'http://localhost:3000';
    const resetUrl = `${frontendUrl}/reset-password/${resetToken}?email=${encodeURIComponent(email)}&companyCode=${encodeURIComponent(companyCode)}`;
    
    // Send password reset email
    try {
      // Setup email transporter
      const transporter = nodemailer.createTransporter({
        service: 'gmail',
        auth: {
          user: process.env.USER,
          pass: process.env.PASS
        }
      });
      
      // Create email message
      const message = `
        <h1>Password Reset Request</h1>
        <p>Hello ${user.name},</p>
        <p>You requested a password reset for your HRMS account. Click the link below to reset your password:</p>
        <p><a href="${resetUrl}">Reset Password</a></p>
        <p>This link will expire in 1 hour.</p>
        <p>If you didn't request this, please ignore this email.</p>
      `;
      
      // Send email
      await transporter.sendMail({
        from: `"HRMS Support" <${process.env.USER}>`,
        to: user.email,
        subject: 'Password Reset Request',
        html: message
      });
      
      console.log('Password reset email sent to:', user.email);
    } catch (emailError) {
      console.error('Error sending password reset email:', emailError);
      
      // Update user to remove token since email failed
      user.resetPasswordToken = undefined;
      user.resetPasswordExpires = undefined;
      await user.save();
      
      return res.status(500).json({ 
        message: 'Error sending email. Please try again later.',
        error: emailError.message 
      });
    }
    
    res.status(200).json({ 
      success: true, 
      message: 'Password reset link sent to your email' 
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ 
      message: 'Server error during password reset request',
      error: error.message 
    });
  }
};

// Helper function to find user for password reset
const findUserForPasswordReset = async (token, email, companyCode) => {
  const hashedToken = crypto
    .createHash('sha256')
    .update(token)
    .digest('hex');
  
  // Try company database first
  try {
    const CompanyUserModel = await getUserModel(companyCode);
    const user = await CompanyUserModel.findOne({
      email: email.toLowerCase(),
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() }
    });
    
    if (user) {
      return { user, isCompanyUser: true };
    }
  } catch (dbError) {
    console.error('Error accessing company database:', dbError);
  }
  
  // Try main database
  const user = await MainUser.findOne({
    email: email.toLowerCase(),
    companyCode: companyCode.toUpperCase(),
    resetPasswordToken: hashedToken,
    resetPasswordExpires: { $gt: Date.now() }
  });
  
  return user ? { user, isCompanyUser: false } : null;
};

// Helper function to update password in both databases
const updatePasswordInBothDatabases = async (user, newPassword, companyCode, isCompanyUser) => {
  // Update password in current user
  user.password = newPassword;
  user.resetPasswordToken = null;
  user.resetPasswordExpires = null;
  user.lastModified = new Date();
  await user.save();
  
  // Update in the other database as well
  if (isCompanyUser) {
    try {
      const mainUser = await MainUser.findOne({ 
        email: user.email.toLowerCase(), 
        companyCode: companyCode.toUpperCase() 
      });
      
      if (mainUser) {
        mainUser.password = user.password;
        mainUser.resetPasswordToken = null;
        mainUser.resetPasswordExpires = null;
        await mainUser.save();
      }
    } catch (error) {
      console.error('Error updating main user password:', error);
    }
  } else {
    try {
      const CompanyUserModel = await getUserModel(companyCode);
      const companyUser = await CompanyUserModel.findOne({
        email: user.email.toLowerCase()
      });
      
      if (companyUser) {
        companyUser.password = user.password;
        companyUser.resetPasswordToken = null;
        companyUser.resetPasswordExpires = null;
        companyUser.lastModified = new Date();
        await companyUser.save();
      }
    } catch (error) {
      console.error('Error updating company user password:', error);
    }
  }
};

// Reset password
export const resetPassword = async (req, res) => {
  try {
    const { token, email, companyCode, password } = req.body;
    
    if (!token || !email || !companyCode || !password) {
      return res.status(400).json({ 
        message: 'Token, email, company code, and new password are required' 
      });
    }
    
    // Find user for password reset
    const userResult = await findUserForPasswordReset(token, email, companyCode);
    
    if (!userResult) {
      return res.status(400).json({ message: 'Invalid or expired token' });
    }
    
    const { user, isCompanyUser } = userResult;
    
    // Update password
    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    user.lastModified = new Date();
    
    await user.save();
    
    // If user is in company database, also update main database record
    if (isCompanyUser) {
      const mainUser = await MainUser.findOne({ 
        email: email.toLowerCase(), 
        companyCode: companyCode.toUpperCase() 
      });
      
      if (mainUser) {
        mainUser.password = user.password; // Use the already hashed password
        mainUser.resetPasswordToken = undefined;
        mainUser.resetPasswordExpires = undefined;
        await mainUser.save();
      }
    }
    // If user is in main database, also update company database record
    else {
      try {
        // Get company-specific User model
        const CompanyUserModel = await getUserModel(companyCode);
        
        // Find user in company database
        const companyUser = await CompanyUserModel.findOne({
          email: email.toLowerCase()
        });
        
        if (companyUser) {
          companyUser.password = user.password; // Use the already hashed password
          companyUser.resetPasswordToken = undefined;
          companyUser.resetPasswordExpires = undefined;
          companyUser.lastModified = new Date();
          await companyUser.save();
        }
      } catch (dbError) {
        console.error('Error updating company user password:', dbError);
        // Continue with the response even if this fails
      }
    }
    
    // Send confirmation email
    try {
      const transporter = nodemailer.createTransporter({
        service: 'gmail',
        auth: {
          user: process.env.USER,
          pass: process.env.PASS
        }
      });
      
      await transporter.sendMail({
        from: `"HRMS Support" <${process.env.USER}>`,
        to: user.email,
        subject: 'Password Reset Successful',
        html: `
          <h1>Password Reset Successful</h1>
          <p>Your password has been successfully reset.</p>
          <p>If you did not request this change, please contact support immediately.</p>
        `
      });
    } catch (emailError) {
      console.error('Error sending confirmation email:', emailError);
      // Continue with the response even if email fails
    }
    
    res.status(200).json({ 
      success: true, 
      message: 'Password has been reset successfully' 
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ 
      message: 'Error resetting password',
      error: error.message 
    });
  }
};
    