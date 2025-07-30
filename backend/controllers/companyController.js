import { fileURLToPath } from 'url';
import { dirname } from 'path';
import path from 'path';
import fs from 'fs';
import multer from 'multer';
import bcrypt from 'bcryptjs';
import nodemailer from 'nodemailer';
import Company from '../models/Company.js';
import  User  from '../models/User.js';
import { sendOtpEmail } from '../utils/mailer.js';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { companyLogoUpload, getFileUrl } from '../config/s3Config.js';



// Get the current file's path and directory (kept for backward compatibility)
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Use centralized S3 upload configuration for company logos
const upload = companyLogoUpload.single('logo');

export {upload};

export const registerCompany = async (req, res) => {
  // Use multer to handle file upload
  upload(req, res, async (err) => {
    if (err) {
      console.error('Multer error:', err);
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({ 
            success: false,
            message: 'File size too large. Maximum size is 2MB.',
            error: 'FILE_SIZE_LIMIT'
          });
        }
        return res.status(400).json({ 
          success: false,
          message: `Upload error: ${err.message}`,
          error: 'MULTER_ERROR'
        });
      } else {
        return res.status(400).json({ 
          success: false,
          message: err.message,
          error: 'UPLOAD_ERROR'
        });
      }
    }
    
    try {
      console.log('=== REGISTRATION REQUEST DEBUG ===');
      console.log('Request method:', req.method);
      console.log('Request headers:', req.headers);
      console.log('Request body keys:', Object.keys(req.body));
      console.log('Request file:', req.file ? 'File present' : 'No file');
      
      // Log each field in detail
      Object.keys(req.body).forEach(key => {
        console.log(`Field "${key}":`, {
          type: typeof req.body[key],
          value: req.body[key],
          length: req.body[key]?.length
        });
      });
      
      // Check if file was uploaded
      if (!req.file) {
        console.error('No file uploaded');
        return res.status(400).json({ 
          success: false,
          message: 'Company logo is required',
          error: 'NO_FILE_UPLOADED'
        });
      }
      
      console.log('File details:', {
        fieldname: req.file.fieldname,
        originalname: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
        filename: req.file.filename
      });
      
      let company, admin;
      
      // Check if data is sent as JSON strings (new format) or flat structure (current format)
      if (req.body.company && req.body.admin) {
        // New format - JSON strings
        try {
          console.log('=== PARSING JSON FORMAT ===');
          
          if (typeof req.body.company === 'string') {
            company = JSON.parse(req.body.company);
          } else {
            company = req.body.company;
          }
          
          if (typeof req.body.admin === 'string') {
            admin = JSON.parse(req.body.admin);
          } else {
            admin = req.body.admin;
          }
          
          console.log('Parsed company data:', company);
          console.log('Parsed admin data:', admin);
          
        } catch (parseError) {
          console.error('JSON parsing error:', parseError);
          return res.status(400).json({
            success: false,
            message: 'Failed to parse JSON data',
            error: 'JSON_PARSE_ERROR',
            details: parseError.message
          });
        }
      } else {
        // Current format - flat structure with bracket notation
        console.log('=== PARSING FLAT STRUCTURE FORMAT ===');
        
        // Build company object from flat structure
        company = {
          name: req.body.name,
          companyCode: req.body.companyCode,
          industry: req.body.industry,
          contactEmail: req.body.contactEmail,
          contactPhone: req.body.contactPhone,
          address: {
            street: req.body['address[street]'],
            city: req.body['address[city]'],
            state: req.body['address[state]'],
            country: req.body['address[country]'],
            zipCode: req.body['address[zipCode]']
          }
        };
        
        // Build admin object from flat structure
        admin = {
          firstName: req.body['admin[firstName]'],
          lastName: req.body['admin[lastName]'],
          middleName: req.body['admin[middleName]'],
          email: req.body['admin[email]'],
          password: req.body['admin[password]']
        };
        
        console.log('Built company data from flat structure:', company);
        console.log('Built admin data from flat structure:', admin);
      }
      
      // Validate company data
      console.log('=== VALIDATING COMPANY DATA ===');
      if (!company || typeof company !== 'object') {
        return res.status(400).json({
          success: false,
          message: 'Company data must be a valid object',
          error: 'INVALID_COMPANY_OBJECT'
        });
      }
      
      const requiredCompanyFields = ['companyCode', 'name', 'contactEmail', 'contactPhone', 'industry'];
      for (const field of requiredCompanyFields) {
        if (!company[field] || typeof company[field] !== 'string' || !company[field].trim()) {
          return res.status(400).json({
            success: false,
            message: `Company ${field} is required and must be a non-empty string`,
            error: 'MISSING_COMPANY_FIELD',
            field: field,
            receivedValue: company[field]
          });
        }
      }
      
      // Validate address if provided
      if (company.address) {
        const addressFields = ['street', 'city', 'state', 'country', 'zipCode'];
        for (const field of addressFields) {
          if (company.address[field] && typeof company.address[field] !== 'string') {
            return res.status(400).json({
              success: false,
              message: `Address ${field} must be a string`,
              error: 'INVALID_ADDRESS_FIELD',
              field: field
            });
          }
        }
        
        // Validate zipCode format if provided
        if (company.address.zipCode && !/^\d{6}$/.test(company.address.zipCode)) {
          return res.status(400).json({
            success: false,
            message: 'Zip code must be exactly 6 digits',
            error: 'INVALID_ZIP_CODE'
          });
        }
      }
      
      // Validate admin data
      console.log('=== VALIDATING ADMIN DATA ===');
      if (!admin || typeof admin !== 'object') {
        return res.status(400).json({
          success: false,
          message: 'Admin data must be a valid object',
          error: 'INVALID_ADMIN_OBJECT'
        });
      }
      
      const requiredAdminFields = ['email', 'password', 'firstName', 'lastName'];
      for (const field of requiredAdminFields) {
        if (!admin[field] || typeof admin[field] !== 'string' || !admin[field].trim()) {
          return res.status(400).json({
            success: false,
            message: `Admin ${field} is required and must be a non-empty string`,
            error: 'MISSING_ADMIN_FIELD',
            field: field,
            receivedValue: admin[field]
          });
        }
      }
      
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(admin.email)) {
        return res.status(400).json({
          success: false,
          message: 'Admin email format is invalid',
          error: 'INVALID_EMAIL_FORMAT',
          email: admin.email
        });
      }
      
      // Validate contact phone format
      if (!/^\d{10}$/.test(company.contactPhone)) {
        return res.status(400).json({
          success: false,
          message: 'Contact phone must be exactly 10 digits',
          error: 'INVALID_PHONE_FORMAT'
        });
      }
      
      console.log('=== VALIDATION PASSED ===');
      
      // Store the logo path/key in database, getFileUrl will be used when retrieving
      // For S3: req.file.key contains the S3 key, req.file.location contains full URL
      // For local: req.file.filename contains the filename
      let logoPath;
      if (req.file.key) {
        // S3 upload - store the S3 key
        logoPath = req.file.key;
      } else if (req.file.location) {
        // S3 upload - store the full URL
        logoPath = req.file.location;
      } else {
        // Local upload - store relative path
        logoPath = `/uploads/company-logos/${req.file.filename}`;
      }
      
      company.logo = logoPath;
      
      console.log('Processing registration with validated data:', {
        companyCode: company.companyCode,
        companyName: company.name,
        adminEmail: admin.email,
        logoPath
      });
      
      // Check if company code already exists
      const existingCompany = await Company.findOne({ companyCode: company.companyCode.toUpperCase() });
      if (existingCompany) {
        return res.status(400).json({ 
          success: false,
          message: 'Company with this code already exists',
          error: 'COMPANY_CODE_EXISTS'
        });
      }
      
      // Check if admin email already exists
      const existingAdmin = await User.findOne({ email: admin.email.toLowerCase() });
      if (existingAdmin) {
        return res.status(400).json({ 
          success: false,
          message: 'Admin email is already registered',
          error: 'EMAIL_EXISTS'
        });
      }
      
      // Generate OTP
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
      
      let finalPasswordHash;
      const isAlreadyHashed = admin.password.startsWith('$2a$') || admin.password.startsWith('$2b$');
      
      console.log('Password processing:', {
        email: admin.email,
        passwordLength: admin.password.length,
        isAlreadyHashed: isAlreadyHashed
      });
      
      if (!isAlreadyHashed) {
        const salt = await bcrypt.genSalt(10);
        finalPasswordHash = await bcrypt.hash(admin.password, salt);
        console.log('Password hashed successfully');
      } else {
        console.log('Password already hashed, using as-is');
        finalPasswordHash = admin.password;
      }
      
      // Create admin user
      const newAdmin = new User({
        firstName: admin.firstName,
        middleName: admin.middleName || '',
        lastName: admin.lastName,
        name: admin.name || `${admin.firstName} ${admin.lastName}`,
        email: admin.email.toLowerCase(),
        password: finalPasswordHash,
        role: 'admin',
        companyCode: company.companyCode.toUpperCase(),
        isActive: true,
        isVerified: false,
        otp,
        otpExpires
      });
      
      await newAdmin.save();
      console.log('Admin user created successfully:', {
        id: newAdmin._id,
        email: newAdmin.email,
        role: newAdmin.role
      });
      
      // Create company
      const newCompany = new Company({
        name: company.name,
        companyCode: company.companyCode.toUpperCase(),
        address: company.address || {},
        contactEmail: company.contactEmail,
        contactPhone: company.contactPhone,
        logo: company.logo,
        industry: company.industry,
        isActive: false,
        adminUserId: newAdmin._id,
        pendingVerification: true
      });
      
      await newCompany.save();
      console.log('Company created successfully:', {
        id: newCompany._id,
        name: newCompany.name,
        companyCode: newCompany.companyCode
      });
      
      // Initialize company database
      try {
        const { getCompanyConnection } = await import('../config/db.js');
        await getCompanyConnection(company.companyCode.toUpperCase());
        console.log(`Company database initialized for ${company.companyCode.toUpperCase()}`);
      } catch (dbError) {
        console.error('Error initializing company database:', dbError);
      }

            // Send OTP email
            try {
              await sendOtpEmail(admin.email, otp, {
                name: newAdmin.name,
                companyName: company.name
              });
              console.log(`OTP sent successfully to ${admin.email}`);
            } catch (emailError) {
              console.error('Error sending OTP email:', emailError);
            }
            
            console.log('=== REGISTRATION COMPLETED SUCCESSFULLY ===');
            
            res.status(201).json({
              success: true,
              message: 'Registration initiated. Please verify your email with the OTP sent to complete registration.',
              email: admin.email,
              companyCode: company.companyCode.toUpperCase()
            });
      
          } catch (error) {
            console.error('=== REGISTRATION ERROR ===');
            console.error('Error details:', error);
            console.error('Error stack:', error.stack);
            
            return res.status(500).json({ 
              success: false,
              message: 'Server error during registration',
              error: 'SERVER_ERROR',
              details: error.message
            });
          }
        });
      };
      


// Add a new controller function to verify OTP
export const verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    
    console.log('Received verification request:', { email, otp });
    
    if (!email || !otp) {
      console.log('Missing email or OTP in request:', req.body);
      return res.status(400).json({ message: 'Email and OTP are required' });
    }
    
    // Find user by email first
    const user = await User.findOne({ email: email.toLowerCase() });
    
    if (!user) {
      console.log('User not found with email:', email);
      return res.status(404).json({ message: 'User not found with this email' });
    }
    
    console.log('Found user:', { 
      id: user._id, 
      email: user.email, 
      storedOtp: user.otp,
      otpExpires: user.otpExpires,
      now: new Date(),
      isExpired: user.otpExpires < new Date(),
      passwordHash: user.password.substring(0, 10) + '...'
    });
    
    // Check if OTP matches
    if (user.otp !== otp) {
      console.log('OTP mismatch:', { provided: otp, stored: user.otp });
      return res.status(400).json({ message: 'Invalid OTP' });
    }
    
    // Check if OTP is expired
    if (user.otpExpires < new Date()) {
      console.log('OTP expired:', { expires: user.otpExpires, now: new Date() });
      return res.status(400).json({ message: 'OTP has expired. Please request a new one' });
    }
    
    // Mark user as verified and clear OTP
    user.isVerified = true;
    user.otp = undefined;
    user.otpExpires = undefined;
    
    await user.save();
    console.log('User verified successfully:', user.email);
    
    // Now activate the company if this is an admin user
    if (user.role === 'admin') {
      const company = await Company.findOne({ 
        companyCode: user.companyCode,
        adminUserId: user._id
      });
      
      if (company) {
        company.isActive = true;
        company.pendingVerification = false;
        await company.save();
        console.log('Company activated:', company.name);

        // Create admin user in company database
        try {
          const { getUserModel } = await import('../models/User.js');
          const CompanyUserModel = await getUserModel(user.companyCode);
          
          // Create a copy of the admin user in the company database
          // IMPORTANT: Do not hash the password again, use the existing hash
          const companyAdmin = new CompanyUserModel({
            userId: user.userId,
            firstName: user.firstName,
            middleName: user.middleName,
            lastName: user.lastName,
            name: user.name,
            email: user.email,
            password: user.password, // Use the already hashed password
            role: user.role,
            companyCode: user.companyCode,
            permissions: user.permissions,
            isVerified: true,
            isActive: true
          });
          
          // Disable the pre-save middleware for this save operation
          companyAdmin.$skipMiddleware = true; // Add this flag
          
          await companyAdmin.save();
          console.log('Admin user created in company database:', companyAdmin.email);
          
          // Import the company schema properly
          const { default: Company, companySchema } = await import('../models/Company.js');
          
          // Create the company model for this company
          const createCompanyModel = (await import('../models/modelFactory.js')).default;
          const CompanyModel = await createCompanyModel(user.companyCode, 'Company', companySchema);
          
          // Create a company record in the company database
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
            adminUserId: companyAdmin._id,
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
      message: 'Email verified successfully. Your company registration is now complete.',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        companyCode: user.companyCode
      }
    });
  } catch (error) {
    console.error('OTP verification error:', error);
    res.status(500).json({ 
      message: 'Server error during OTP verification',
      error: error.message 
    });
  }
};



// Get company details
export const getCompanyDetails = async (req, res) => {
  try {
    const company = await Company.findOne({ companyCode: req.companyCode });
    
    if (!company) {
      return res.status(404).json({ message: 'Company not found' });
    }
    
    res.status(200).json(company);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update company details
export const updateCompanyDetails = async (req, res) => {
  try {
    const { name, address, contactEmail, contactPhone, industry, logo } = req.body;
    
    const company = await Company.findOne({ companyCode: req.companyCode });
    
    if (!company) {
      return res.status(404).json({ message: 'Company not found' });
    }
    
    // Update fields
    if (name) company.name = name;
    if (address) company.address = address;
    if (contactEmail) company.contactEmail = contactEmail;
    if (contactPhone) company.contactPhone = contactPhone;
    if (industry) company.industry = industry;
    if (logo) company.logo = logo;
    
    await company.save();
    
    res.status(200).json({
      message: 'Company details updated successfully',
      company
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update company settings
// Get company settings
export const getCompanySettings = async (req, res) => {
  try {
    const company = await Company.findOne({ companyCode: req.companyCode });
    
    if (!company) {
      return res.status(404).json({ message: 'Company not found' });
    }
    
    res.status(200).json({
      success: true,
      settings: company.settings
    });
  } catch (error) {
    console.error('Error fetching company settings:', error);
    res.status(500).json({ message: error.message });
  }
};

// Update company settings with more detailed validation
// Update company settings
export const updateCompanySettings = async (req, res) => {
  try {
    const { leavePolicy, workingHours, workingDays } = req.body;
    
    // Get company code from authenticated user
    const companyCode = req.companyCode;
    
    if (!companyCode) {
      return res.status(401).json({ message: 'Authentication required. Company code not found.' });
    }
    
    // First, update in the main database
    const company = await Company.findOne({ companyCode });
    
    if (!company) {
      return res.status(404).json({ message: 'Company not found' });
    }
    
    // Validate and update settings in the main database
    if (leavePolicy) {
      company.settings.leavePolicy = {
        ...company.settings.leavePolicy,
        ...leavePolicy
      };
    }
    
    if (workingHours) {
      company.settings.workingHours = {
        ...company.settings.workingHours,
        ...workingHours
      };
    }
    
    if (workingDays) {
      company.settings.workingDays = workingDays;
    }
    
    await company.save();
    
    // Now, update the same settings in the company-specific database
    try {
      // Import the company schema and model factory
      const { companySchema } = await import('../models/Company.js');
      const createCompanyModel = (await import('../models/modelFactory.js')).default;
      
      // Create a model for the company-specific database
      const CompanyModel = await createCompanyModel(companyCode, 'Company', companySchema);
      
      // Find the company record in the company-specific database
      const companyRecord = await CompanyModel.findOne({ companyCode });
      
      if (companyRecord) {
        // Update the settings in the company-specific database
        if (leavePolicy) {
          companyRecord.settings.leavePolicy = {
            ...companyRecord.settings.leavePolicy,
            ...leavePolicy
          };
        }
        
        if (workingHours) {
          companyRecord.settings.workingHours = {
            ...companyRecord.settings.workingHours,
            ...workingHours
          };
        }
        
        if (workingDays) {
          companyRecord.settings.workingDays = workingDays;
        }
        
        await companyRecord.save();
        console.log('Company settings updated in company-specific database');
      } else {
        console.warn(`Company record not found in company-specific database for ${companyCode}`);
      }
    } catch (dbError) {
      console.error('Error updating company settings in company-specific database:', dbError);
      // Continue with the response even if this fails
    }
    
    res.status(200).json({
      success: true,
      message: 'Company settings updated successfully',
      settings: company.settings
    });
  } catch (error) {
    console.error('Error updating company settings:', error);
    res.status(500).json({ message: error.message });
  }
};

// Forgot password - send reset link
export const forgotPassword = async (req, res) => {
  try {
    console.log('Received forgot password request:', req.body);
    const { email, companyCode } = req.body;
    
    console.log('Forgot password request:', { email, companyCode });
    
    if (!email || !companyCode) {
      return res.status(400).json({ message: 'Email and company code are required' });
    }
    
    // Find user by email and company code
    const user = await User.findOne({ email, companyCode });
    
    if (!user) {
      return res.status(404).json({ message: 'User not found with this email and company code' });
    }
    
    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    
    // Hash token and save to user
    const hashedToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');
    
    // Set token expiry (1 hour)
    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
    
    await user.save();
    
    // Create reset URL
    const frontendUrl = process.env.CLIENT_URL || 'http://localhost:3000';
    const resetUrl = `${frontendUrl}/reset-password/${resetToken}?email=${encodeURIComponent(email)}&companyCode=${encodeURIComponent(companyCode)}`;
    
    console.log('Reset URL generated:', resetUrl);
    
    // Create email message with enhanced professional design
const message = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Password Reset</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      line-height: 1.6;
      color: #333333;
      max-width: 600px;
      margin: 0 auto;
    }
    .email-container {
      border: 1px solid #e0e0e0;
      border-radius: 5px;
      padding: 20px;
      background-color: #ffffff;
    }
    .header {
      text-align: center;
      padding-bottom: 15px;
      border-bottom: 1px solid #e0e0e0;
      margin-bottom: 20px;
    }
    .logo {
      max-height: 60px;
      margin-bottom: 10px;
    }
    h1 {
      color: #2c3e50;
      margin-top: 0;
    }
    .content {
      padding: 0 15px;
    }
    .button {
      display: inline-block;
      background-color: #3498db;
      color: white !important;
      text-decoration: none;
      padding: 12px 25px;
      border-radius: 4px;
      margin: 20px 0;
      font-weight: bold;
    }
    .footer {
      margin-top: 30px;
      padding-top: 15px;
      border-top: 1px solid #e0e0e0;
      font-size: 12px;
      color: #7f8c8d;
      text-align: center;
    }
    .security-note {
      background-color: #f8f9fa;
      padding: 10px;
      border-radius: 4px;
      font-size: 13px;
      margin-top: 20px;
    }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="header">
      <!-- <img src="https://yourcompany.com/logo.png" alt="Company Logo" class="logo"> -->
      <h1>Password Reset Request</h1>
    </div>
    <div class="content">
      <p>Hello,</p>
      <p>We received a request to reset your password for your HRMS account. To complete the password reset process, please click on the button below:</p>
      
      <div style="text-align: center;">
        <a href="${resetUrl}" class="button" clicktracking="off">Reset Password</a>
      </div>
      
      <p>If the button doesn't work, you can copy and paste the following link into your browser:</p>
      <p style="word-break: break-all; font-size: 13px;"><a href="${resetUrl}">${resetUrl}</a></p>
      
      <div class="security-note">
        <strong>Important:</strong>
        <ul>
          <li>This link will expire in 1 hour for security reasons.</li>
          <li>If you didn't request a password reset, please ignore this email or contact support if you have concerns.</li>
        </ul>
      </div>
    </div>
    <div class="footer">
      <p>&copy; ${new Date().getFullYear()} HRMS. All rights reserved.</p>
      <p>This is an automated message, please do not reply to this email.</p>
    </div>
  </div>
</body>
</html>
`;

    
    try {
      // Setup email transporter
      const transporter = nodemailer.createTransport({
        service : 'gmail',
        // port: process.env.EMAIL_PORT,
        auth: {
          user: `a.dineshsundar02@gmail.com`,
          pass: `xnbj tvjf odej ynit`
        }
      });
      
      // Send email
      await transporter.sendMail({
        from: `"HRMS Support" <${'a.dineshsundar02@gmail.com'}>`,
        to: user.email,
        subject: 'Password Reset Request',
        html: message
      });
      
      console.log('Password reset email sent to:', user.email);
      
      res.status(200).json({ 
        success: true, 
        message: 'Password reset link sent to your email' 
      });
    } catch (emailError) {
      console.error('Email sending error:', emailError);
      
      // Update user to remove token since email failed
      user.resetPasswordToken = undefined;
      user.resetPasswordExpires = undefined;
      await user.save();
      
      return res.status(500).json({ 
        message: 'Error sending email. Please try again later.',
        error: emailError.message 
      });
    }
  } catch (error) {
    console.error('Detailed forgot password error:', error);
    console.error('Forgot password error:', error);
    res.status(500).json({ 
      message: 'Server error during password reset request',
      error: error.message 
    });
  }
};

// Verify reset token
export const verifyResetToken = async (req, res) => {
  try {
    const { token, email, companyCode } = req.body;
    
    console.log('Token verification request:', { 
      token: token.substring(0, 10) + '...', 
      email, 
      companyCode 
    });
    
    if (!token || !email || !companyCode) {
      console.log('Missing required fields in token verification');
      return res.status(400).json({ message: 'Token, email, and company code are required' });
    }
    
    // Hash the token from the URL
    const hashedToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');
    
    console.log('Looking for user with token:', { 
      email, 
      tokenHash: hashedToken.substring(0, 10) + '...' 
    });
    
    // Find user with the token and check if token is still valid
    const user = await User.findOne({
      email,
      companyCode,
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() }
    });
    
    if (!user) {
      console.log('Invalid or expired token for:', email);
      return res.status(400).json({ message: 'Invalid or expired token' });
    }
    
    console.log('Token verified successfully for user:', user.email);
    
    res.status(200).json({ 
      success: true, 
      message: 'Token is valid' 
    });
    
  } catch (error) {
    console.error('Verify reset token error:', error);
    res.status(500).json({ 
      message: 'Error verifying reset token',
      error: error.message 
    });
  }
};

// reset password
export const resetPassword = async (req, res) => {
  try {
    const { token, email, companyCode, password } = req.body;
    
    console.log('Password reset request received:', { 
      token: token.substring(0, 10) + '...', 
      email, 
      companyCode,
      passwordLength: password.length
    });
    
    if (!token || !email || !companyCode || !password) {
      console.log('Missing required fields in reset password request');
      return res.status(400).json({ 
        message: 'Token, email, company code, and new password are required' 
      });
    }
    
    // Password strength validation
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(password)) {
      return res.status(400).json({ 
        message: 'Password must be at least 8 characters long and include uppercase, lowercase, number and special character (@$!%*?&)' 
      });
    }
    
    // Hash the token from the URL
    const hashedToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');
    
    // Find user in main database with the token
    const mainUser = await User.findOne({
      email: email.toLowerCase(),
      companyCode,
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() }
    });
    
    if (!mainUser) {
      console.log('Invalid or expired token for user:', email);
      return res.status(400).json({ 
        message: 'Invalid or expired reset token. Please request a new password reset.' 
      });
    }
    
    console.log('Found user for password reset in main database:', {
      id: mainUser._id,
      email: mainUser.email,
      companyCode: mainUser.companyCode
    });
    
    // CRITICAL CHECK: Verify that new password is different from current password
    console.log('Checking if new password is different from current password...');
    try {
      const isSamePassword = await bcrypt.compare(password, mainUser.password);
      if (isSamePassword) {
        console.log('New password is same as current password - rejecting request');
        return res.status(400).json({ 
          message: 'New password cannot be the same as your current password. Please choose a different password for security reasons.',
          code: 'SAME_PASSWORD_ERROR'
        });
      }
      console.log('New password is different from current password - proceeding with reset');
    } catch (compareError) {
      console.error('Error comparing passwords:', compareError);
      // If comparison fails, we'll proceed but log the error
      console.log('Password comparison failed, but proceeding with reset');
    }
    
    // Hash the new password
    const salt = await bcrypt.genSalt(12); // Increased salt rounds for better security
    const hashedPassword = await bcrypt.hash(password, salt);
    
    // Update password in main database
    const previousPassword = mainUser.password; // Store for rollback if needed
    mainUser.password = hashedPassword;
    mainUser.resetPasswordToken = undefined;
    mainUser.resetPasswordExpires = undefined;
    mainUser.updatedAt = new Date();
    
    await mainUser.save();
    console.log('Password updated in main database for user:', mainUser.email);
    
    // Update password in company database
    let companyUpdateSuccess = false;
    try {
      const { getUserModel } = await import('../models/User.js');
      const CompanyUserModel = await getUserModel(companyCode);
      
      const companyUser = await CompanyUserModel.findOne({ 
        email: email.toLowerCase() 
      });
      
      if (companyUser) {
        // Double-check in company database as well
        try {
          const isSamePasswordCompany = await bcrypt.compare(password, companyUser.password);
          if (isSamePasswordCompany) {
            console.log('Password was same in company database as well');
            // Rollback main database change
            mainUser.password = previousPassword;
            mainUser.resetPasswordToken = hashedToken;
            mainUser.resetPasswordExpires = new Date(Date.now() + 10 * 60 * 1000); // Reset expiry
            await mainUser.save();
            
            return res.status(400).json({ 
              message: 'New password cannot be the same as your current password. Please choose a different password for security reasons.',
              code: 'SAME_PASSWORD_ERROR'
            });
          }
        } catch (companyCompareError) {
          console.log('Company password comparison failed, proceeding');
        }
        
        companyUser.password = hashedPassword;
        companyUser.resetPasswordToken = undefined;
        companyUser.resetPasswordExpires = undefined;
        companyUser.updatedAt = new Date();
        
        await companyUser.save();
        console.log('Password updated in company database for user:', companyUser.email);
        companyUpdateSuccess = true;
      } else {
        console.log('User not found in company database, creating user');
        
        // Create user in company database with updated password
        const newCompanyUser = new CompanyUserModel({
          userId: mainUser.userId || `USER-${Date.now()}`,
          firstName: mainUser.firstName,
          middleName: mainUser.middleName,
          lastName: mainUser.lastName,
          name: mainUser.name,
          email: mainUser.email,
          password: hashedPassword,
          role: mainUser.role,
          companyCode: mainUser.companyCode,
          permissions: mainUser.permissions,
          isVerified: true,
          isActive: true
        });
        
        await newCompanyUser.save();
        console.log('User created in company database with new password:', newCompanyUser.email);
        companyUpdateSuccess = true;
      }
    } catch (dbError) {
      console.error('Error updating password in company database:', dbError);
      // Log the error but don't fail the entire operation
      companyUpdateSuccess = false;
    }
    
    // Send confirmation email
    try {
      const transporter = nodemailer.createTransporter({
        service: 'gmail',
        auth: {
          user: 'a.dineshsundar02@gmail.com',
          pass: 'xnbj tvjf odej ynit'
        }
      });
      
      const emailContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #4a90e2;">Password Reset Successful</h1>
          <p>Your password has been successfully reset for your HRMS account.</p>
          <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p><strong>Account Details:</strong></p>
            <p>Email: ${mainUser.email}</p>
            <p>Company: ${companyCode}</p>
            <p>Reset Time: ${new Date().toLocaleString()}</p>
          </div>
          <div style="background-color: #fff3cd; padding: 15px; border-radius: 5px; border-left: 4px solid #ffc107;">
            <p><strong>Security Notice:</strong></p>
            <p>If you did not request this password reset, please contact our support team immediately.</p>
          </div>
          <p>You can now log in with your new password.</p>
          <p>Best regards,<br>HRMS Support Team</p>
        </div>
      `;
      
      await transporter.sendMail({
        from: `"HRMS Support" <${'a.dineshsundar02@gmail.com'}>`,
        to: mainUser.email,
        subject: 'Password Reset Successful - HRMS',
        html: emailContent
      });
      
      console.log('Password reset confirmation email sent successfully');
    } catch (emailError) {
      console.error('Error sending confirmation email:', emailError);
      // Continue with the response even if email fails
    }
    
    // Prepare response
    const response = {
      success: true,
      message: 'Password has been reset successfully. You can now log in with your new password.',
      details: {
        email: mainUser.email,
        companyCode: companyCode,
        resetTime: new Date().toISOString(),
        companyDatabaseUpdated: companyUpdateSuccess
      }
    };
    
    console.log('Password reset completed successfully for user:', mainUser.email);
    res.status(200).json(response);
    
  } catch (error) {
    console.error('Reset password error:', error);
    
    // Provide more specific error messages
    let errorMessage = 'Error resetting password';
    if (error.name === 'ValidationError') {
      errorMessage = 'Invalid password format';
    } else if (error.name === 'MongoError' || error.name === 'MongooseError') {
      errorMessage = 'Database error occurred';
    } else if (error.message.includes('bcrypt')) {
      errorMessage = 'Password processing error';
    }
    
    res.status(500).json({ 
      message: errorMessage,
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};




export const changePassword = async (req, res) => {
  try {
    console.log('Change password request received:', {
      body: req.body,
      user: req.user ? {
        _id: req.user._id,
        userId: req.user.userId,
        email: req.user.email,
        companyCode: req.user.companyCode
      } : 'No user in request',
      headers: {
        authorization: req.headers.authorization ? 'Bearer token present' : 'No auth token',
        companyCode: req.headers['x-company-code']
      }
    });
    
    const { currentPassword, newPassword } = req.body;
    
    // Check if we have user information
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    // Get the company code from the request
    const companyCode = req.companyCode || req.user.companyCode;
    
    if (!companyCode) {
      return res.status(400).json({ message: 'Company code is required' });
    }
    
    // Get the user model for this company
    const { getUserModel } = await import('../models/User.js');
    const CompanyUserModel = await getUserModel(companyCode);
    
    // Find the user in the company database
    let user;
    
    // Try to find by _id first
    if (req.user._id) {
      user = await CompanyUserModel.findById(req.user._id);
    }
    
    // If not found and we have userId, try that
    if (!user && req.user.userId) {
      user = await CompanyUserModel.findOne({ userId: req.user.userId });
    }
    
    // If still not found, try by email
    if (!user && req.user.email) {
      user = await CompanyUserModel.findOne({ email: req.user.email.toLowerCase() });
    }
    
    // If we still don't have a user, check the main User model
    if (!user) {
      user = await User.findOne({ 
        email: req.user.email.toLowerCase(),
        companyCode: companyCode
      });
    }
    
    if (!user) {
      console.log('User not found with provided credentials:', {
        _id: req.user._id,
        userId: req.user.userId,
        email: req.user.email,
        companyCode: companyCode
      });
      return res.status(404).json({ message: 'User not found' });
    }
    
    console.log('Found user for password change:', {
      id: user._id,
      email: user.email,
      companyCode: user.companyCode
    });
    
    // Verify current password
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    
    if (!isMatch) {
      console.log('Current password verification failed for user:', user.email);
      return res.status(401).json({ message: 'Current password is incorrect' });
    }
    
    // Check if new password is same as old password
    const isSamePassword = await bcrypt.compare(newPassword, user.password);
    if (isSamePassword) {
      return res.status(400).json({ message: 'New password cannot be the same as your current password' });
    }
    
    // Password strength validation
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(newPassword)) {
      return res.status(400).json({ 
        message: 'Password must be at least 8 characters long and include uppercase, lowercase, number and special character' 
      });
    }
    
    // Hash the new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    
    // Update password in the found user
    user.password = hashedPassword;
    await user.save();
    console.log('Password updated for user:', user.email);
    
    // If we found the user in the main database, also update in company database
    if (user.constructor.modelName === 'User') {
      try {
        const companyUser = await CompanyUserModel.findOne({ email: user.email.toLowerCase() });
        
        if (companyUser) {
          companyUser.password = hashedPassword;
          await companyUser.save();
          console.log('Password also updated in company database for user:', companyUser.email);
        }
      } catch (dbError) {
        console.error('Error updating password in company database:', dbError);
        // Continue with the response even if this fails
      }
    }
    
    res.status(200).json({ 
      success: true, 
      message: 'Password changed successfully' 
    });
    
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ 
      message: 'Error changing password',
      error: error.message 
    });
  }
};




// Add a new controller function to resend OTP
export const resendOtp = async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }
    
    // Find user by email
    const user = await User.findOne({ email });
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    if (user.isVerified) {
      return res.status(400).json({ message: 'Email is already verified' });
    }
    
    // Generate new OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit OTP
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    
    // Update user with new OTP
    user.otp = otp;
    user.otpExpires = otpExpires;
    
    await user.save();
    
    // Find company for this user
    const company = await Company.findOne({ companyCode: user.companyCode });
    
    // Send OTP email
    await sendOtpEmail(email, otp, {
      name: user.name,
      companyName: company ? company.name : 'HRMS'
    });
    
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

