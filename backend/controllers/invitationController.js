
// import Invitation from '../models/Invitation.js';
// import { getUserModel } from '../models/User.js';
// import crypto from 'crypto';
// import nodemailer from 'nodemailer';
// import jwt from 'jsonwebtoken';

// // Create email transporter
// const transporter = nodemailer.createTransport({
//   service: 'gmail',
//   auth: {
//     user: 'a.dineshsundar02@gmail.com',
//     pass: 'xnbj tvjf odej ynit'
//   }
// });
import Invitation from '../models/Invitation.js';
import { getUserModel } from '../models/User.js';
import crypto from 'crypto';
import nodemailer from 'nodemailer';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

// Create email transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'a.dineshsundar02@gmail.com',
    pass: 'xnbj tvjf odej ynit'
  }
});

// Validate invitation token
export const validateInvitationToken = async (req, res) => {
  try {
    const { token } = req.query;

    if (!token) {
      return res.status(400).json({ message: 'Token is required' });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        console.error('Token verification failed:', error.message);
        return res.status(401).json({ message: 'Invitation token has expired. Please request a new invitation.' });
      } else if (error.name === 'JsonWebTokenError') {
        console.error('Token verification failed:', error.message);
        return res.status(400).json({ message: 'Invalid invitation token.' });
      } else {
        console.error('Unexpected token verification error:', error.message);
        return res.status(500).json({ message: 'Error verifying token.' });
      }
    }

    const invitation = await Invitation.findOne({
      token,
      email: decoded.email.toLowerCase(),
      companyCode: decoded.companyCode,
      status: 'pending'
    });

    if (!invitation) {
      return res.status(404).json({ message: 'Invitation not found or already used.' });
    }

    if (new Date() > new Date(invitation.expiresAt)) {
      return res.status(410).json({ message: 'Invitation has expired.' });
    }

    res.status(200).json({
      message: 'Invitation token is valid.',
      invitation: {
        email: invitation.email,
        firstName: invitation.firstName,
        lastName: invitation.lastName,
        role: invitation.role,
        companyCode: invitation.companyCode
      }
    });
  } catch (error) {
    console.error('Error validating invitation token:', error);
    res.status(500).json({ message: 'Server error while validating invitation.' });
  }
};

// Send invitation email function
export const sendInvitationEmail = async (userData, password) => {
  const fullName = `${userData.firstName} ${userData.middleName ? userData.middleName + ' ' : ''}${userData.lastName}`;
  
  const mailOptions = {
    from: '"HRMS Support" <a.dineshsundar02@gmail.com>',
    to: userData.email,
    subject: 'Welcome to HRMS - Your Account Invitation',
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 5px;">
        <div style="text-align: center; margin-bottom: 20px;">
          <h1 style="color: #1976d2;">Welcome to HRMS</h1>
        </div>
        
        <p>Dear ${fullName},</p>
        
        <p>You have been invited to join the HRMS platform for your company. Your account has been created with the following details:</p>
        
        <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p><strong>Email:</strong> ${userData.email}</p>
          <p><strong>Role:</strong> ${userData.role.charAt(0).toUpperCase() + userData.role.slice(1)}</p>
          <p><strong>Company Code:</strong> ${userData.companyCode}</p>
          <p><strong>Temporary Password:</strong> ${password}</p>
        </div>
        
        <p>Please use these credentials to log in to the HRMS platform. You will be prompted to change your password after your first login.</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.CLIENT_URL || 'http://localhost:3000'}/login" 
             style="background-color: #1976d2; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; font-weight: bold;">
            Login to HRMS
          </a>
        </div>
        
        <p>If you have any questions or need assistance, please contact your administrator.</p>
        
        <p>Thank you,<br>HRMS Team</p>
        
        <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #e0e0e0; font-size: 12px; color: #757575; text-align: center;">
          <p>This is an automated email. Please do not reply to this message.</p>
        </div>
      </div>
    `
  };

  return await transporter.sendMail(mailOptions);
};

// Create and send invitation
export const createInvitation = async (req, res) => {
  try {
    console.log('Received invitation request:', {
      body: req.body,
      user: req.user ? { id: req.user.id } : 'No user',
      companyCode: req.companyCode || 'No company code'
    });
    
    const { firstName, middleName, lastName, email, role } = req.body;
    const companyCode = req.companyCode;
    const adminId = req.user.id;
    
    // Validate required fields
    if (!firstName || !lastName || !email || !role) {
      return res.status(400).json({ 
        message: 'First name, last name, email, and role are required' 
      });
    }
    
    // Check if email already exists in the company
    const CompanyUser = await getUserModel(companyCode);
    const existingUser = await CompanyUser.findOne({ email: email.toLowerCase() });
    
    if (existingUser) {
      return res.status(400).json({ 
        message: 'A user with this email already exists in your company' 
      });
    }
    
    // Check if there's a pending invitation
    const existingInvitation = await Invitation.findOne({ 
      email: email.toLowerCase(),
      companyCode,
      status: 'pending'
    });
    
    if (existingInvitation) {
      return res.status(400).json({ 
        message: 'An invitation has already been sent to this email' 
      });
    }
    
    // Generate a random password
    const password = Math.random().toString(36).slice(-8) + Math.random().toString(36).toUpperCase().slice(-2) + '!1';
    
    // Generate a token for the invitation
    const token = crypto.randomBytes(32).toString('hex');
    
    // Create an invitation record
    const invitation = new Invitation({
      firstName,
      middleName,
      lastName,
      email: email.toLowerCase(),
      role,
      companyCode,
      invitedBy: adminId,
      token,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
    });
    
    await invitation.save();
    console.log('Invitation saved:', invitation._id);
    
    // Create the user in the company database
    try {
      const fullName = `${firstName}${middleName ? ' ' + middleName : ''} ${lastName}`;

      console.log('Creating user with data:', {
        firstName,
        lastName,
        fullName,
        email: email.toLowerCase(),
        passwordLength: password.length,
        role,
        companyCode
      });
      
      // Hash password manually to avoid double hashing
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(password, saltRounds);
      
      const newUser = new CompanyUser({
        firstName,
        middleName: middleName || '',
        lastName,
        name: fullName,
        email: email.toLowerCase(),
        password: hashedPassword,
        role,
        companyCode,
        isVerified: true,
        isActive: false, // Set to false initially
        isFirstLogin: true, // Mark as first login
        invitationId: invitation._id, // Link to invitation
        lastModified: new Date()
      });

      // Assign permissions based on role
      newUser.assignPermissions();

      // Skip middleware to prevent double hashing
      newUser.$skipMiddleware = true;
      await newUser.save();
      
      console.log('User created in company database:', newUser._id);
      
      // Send invitation email
      await sendInvitationEmail({
        email: newUser.email,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        middleName: newUser.middleName,
        companyCode: newUser.companyCode,
        role: newUser.role
      }, password);
      
      console.log('Invitation email sent to:', newUser.email);
      
      res.status(201).json({
        message: 'User invited successfully',
        user: {
          name: newUser.name,
          email: newUser.email,
          role: newUser.role
        }
      });
    } catch (userError) {
      console.error('Error creating user or sending email:', userError);
      
      // If user creation fails, delete the invitation
      await Invitation.findByIdAndDelete(invitation._id);
      
      throw userError;
    }
  } catch (error) {
    console.error('Error inviting user:', error);
    res.status(500).json({ message: error.message });
  }
};

// Get all invitations for a company
export const getInvitations = async (req, res) => {
  try {
    const { lastCheck } = req.query;
    let query = { companyCode: req.companyCode };
    
    if (lastCheck) {
      query.lastModified = { $gt: new Date(lastCheck) };
    }
    
    const invitations = await Invitation.find(query).sort({ createdAt: -1 });
    
    res.status(200).json({
      invitations,
      hasUpdates: invitations.length > 0,
      lastCheck: new Date()
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Resend invitation
export const resendInvitation = async (req, res) => {
  try {
    const { invitationId } = req.params;
    
    const invitation = await Invitation.findOne({
      _id: invitationId,
      companyCode: req.companyCode
    });
    
    if (!invitation) {
      return res.status(404).json({ message: 'Invitation not found' });
    }
    
    // Find the user to update their password
    const CompanyUser = await getUserModel(req.companyCode);
    const user = await CompanyUser.findOne({ email: invitation.email });
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Generate a new password
    const newPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).toUpperCase().slice(-2) + '!1';
    
    console.log('Resending invitation with new password for user:', user.email);
    
    // Update user password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);
    
    user.password = hashedPassword;
    user.isFirstLogin = true; // Reset first login flag
    user.lastModified = new Date();
    
    // Skip the password hashing middleware
    user.$skipMiddleware = true;
    await user.save();
    
    // Update invitation expiry and status
    invitation.expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
    invitation.status = 'pending';
    invitation.lastModified = new Date();
    await invitation.save();
    
    // Resend the email
    await sendInvitationEmail({
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      middleName: user.middleName,
      companyCode: user.companyCode,
      role: user.role
    }, newPassword);
    
    console.log('Invitation resent to:', user.email);
    
    res.status(200).json({
      message: 'Invitation resent successfully'
    });
  } catch (error) {
    console.error('Error resending invitation:', error);
    res.status(500).json({ message: error.message });
  }
};

// Cancel invitation
export const cancelInvitation = async (req, res) => {
  try {
    const { invitationId } = req.params;
    
    const invitation = await Invitation.findOne({
      _id: invitationId,
      companyCode: req.companyCode
    });
    
    if (!invitation) {
      return res.status(404).json({ message: 'Invitation not found' });
    }
    
        // Find and handle the user
        const CompanyUser = await getUserModel(req.companyCode);
        const user = await CompanyUser.findOne({ email: invitation.email });
        
        if (user) {
          if (user.isFirstLogin) {
            // Delete user if they haven't logged in yet
            await CompanyUser.findByIdAndDelete(user._id);
            console.log('User deleted as they had not logged in yet:', user.email);
          } else {
            // Just deactivate if they have already logged in
            user.isActive = false;
            user.lastModified = new Date();
            user.$skipMiddleware = true;
            await user.save();
            console.log('User deactivated:', user.email);
          }
        }
        
        // Update invitation status to cancelled
        invitation.status = 'cancelled';
        invitation.lastModified = new Date();
        await invitation.save();
        
        res.status(200).json({
          message: 'Invitation cancelled successfully'
        });
      } catch (error) {
        console.error('Error cancelling invitation:', error);
        res.status(500).json({ message: error.message });
      }
    };
    
    // Mark invitation as accepted (called when user first logs in)
    export const markInvitationAccepted = async (userId, companyCode) => {
      try {
        // Get the user to find their invitation
        const CompanyUser = await getUserModel(companyCode);
        const user = await CompanyUser.findById(userId);
        
        if (!user || !user.invitationId) {
          console.log('No invitation found for user:', userId);
          return;
        }
        
        // Find and update the invitation
        const invitation = await Invitation.findById(user.invitationId);
        
        if (invitation && invitation.status === 'pending') {
          invitation.status = 'accepted';
          invitation.lastModified = new Date();
          await invitation.save();
          console.log('Invitation marked as accepted:', invitation._id);
        }
        
        return invitation;
      } catch (error) {
        console.error('Error marking invitation as accepted:', error);
        throw error;
      }
    };
    

// // Validate invitation token
// export const validateInvitationToken = async (req, res) => {
//   try {
//     const { token } = req.query;

//     if (!token) {
//       return res.status(400).json({ message: 'Token is required' });
//     }

//     let decoded;
//     try {
//       decoded = jwt.verify(token, process.env.JWT_SECRET);
//     } catch (error) {
//       if (error.name === 'TokenExpiredError') {
//         console.error('Token verification failed:', error.message);
//         return res.status(401).json({ message: 'Invitation token has expired. Please request a new invitation.' });
//       } else if (error.name === 'JsonWebTokenError') {
//         console.error('Token verification failed:', error.message);
//         return res.status(400).json({ message: 'Invalid invitation token.' });
//       } else {
//         console.error('Unexpected token verification error:', error.message);
//         return res.status(500).json({ message: 'Error verifying token.' });
//       }
//     }

//     const invitation = await Invitation.findOne({
//       token,
//       email: decoded.email.toLowerCase(),
//       companyCode: decoded.companyCode,
//       status: 'pending'
//     });

//     if (!invitation) {
//       return res.status(404).json({ message: 'Invitation not found or already used.' });
//     }

//     // Check if invitation has expired (optional safety check)
//     if (new Date() > new Date(invitation.expiresAt)) {
//       return res.status(410).json({ message: 'Invitation has expired.' });
//     }

//     res.status(200).json({
//       message: 'Invitation token is valid.',
//       invitation: {
//         email: invitation.email,
//         firstName: invitation.firstName,
//         lastName: invitation.lastName,
//         role: invitation.role,
//         companyCode: invitation.companyCode
//       }
//     });
//   } catch (error) {
//     console.error('Error validating invitation token:', error);
//     res.status(500).json({ message: 'Server error while validating invitation.' });
//   }
// };

// // Send invitation email function
// export const sendInvitationEmail = async (userData, password) => {
//   const fullName = `${userData.firstName} ${userData.middleName ? userData.middleName + ' ' : ''}${userData.lastName}`;
  
//   const mailOptions = {
//     from: '"HRMS Support" <a.dineshsundar02@gmail.com>',
//     to: userData.email,
//     subject: 'Welcome to HRMS - Your Account Invitation',
//     html: `
//       <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 5px;">
//         <div style="text-align: center; margin-bottom: 20px;">
//           <h1 style="color: #1976d2;">Welcome to HRMS</h1>
//         </div>
        
//         <p>Dear ${fullName},</p>
        
//         <p>You have been invited to join the HRMS platform for your company. Your account has been created with the following details:</p>
        
//         <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
//           <p><strong>Email:</strong> ${userData.email}</p>
//           <p><strong>Role:</strong> ${userData.role.charAt(0).toUpperCase() + userData.role.slice(1)}</p>
//           <p><strong>Company Code:</strong> ${userData.companyCode}</p>
//           <p><strong>Temporary Password:</strong> ${password}</p>
//         </div>
        
//         <p>Please use these credentials to log in to the HRMS platform. You will be prompted to change your password after your first login.</p>
        
//         <div style="text-align: center; margin: 30px 0;">
//           <a href="${process.env.CLIENT_URL || 'http://localhost:3000'}/login" 
//              style="background-color: #1976d2; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; font-weight: bold;">
//             Login to HRMS
//           </a>
//         </div>
        
//         <p>If you have any questions or need assistance, please contact your administrator.</p>
        
//         <p>Thank you,<br>HRMS Team</p>
        
//         <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #e0e0e0; font-size: 12px; color: #757575; text-align: center;">
//           <p>This is an automated email. Please do not reply to this message.</p>
//         </div>
//       </div>
//     `
//   };

//   return await transporter.sendMail(mailOptions);
// };

// // Create and send invitation
// export const createInvitation = async (req, res) => {
//   try {
//     console.log('Received invitation request:', {
//       body: req.body,
//       user: req.user ? { id: req.user.id } : 'No user',
//       companyCode: req.companyCode || 'No company code'
//     });
    
//     const { firstName, middleName, lastName, email, role } = req.body;
//     const companyCode = req.companyCode;
//     const adminId = req.user.id;
    
//     // Validate required fields
//     if (!firstName || !lastName || !email || !role) {
//       return res.status(400).json({ 
//         message: 'First name, last name, email, and role are required' 
//       });
//     }
    
//     // Check if email already exists in the company
//     const CompanyUser = await getUserModel(companyCode);
//     const existingUser = await CompanyUser.findOne({ email: email.toLowerCase() });
    
//     if (existingUser) {
//       return res.status(400).json({ 
//         message: 'A user with this email already exists in your company' 
//       });
//     }
    
//     // Check if there's a pending invitation
//     const existingInvitation = await Invitation.findOne({ 
//       email: email.toLowerCase(),
//       companyCode,
//       status: 'pending'
//     });
    
//     if (existingInvitation) {
//       return res.status(400).json({ 
//         message: 'An invitation has already been sent to this email' 
//       });
//     }
    
//     // Generate a random password
//     const password = Math.random().toString(36).slice(-8) + Math.random().toString(36).toUpperCase().slice(-2) + '!1';
    
//     // Generate a token for the invitation
//     const token = crypto.randomBytes(32).toString('hex');
    
//     // Create an invitation record
//     const invitation = new Invitation({
//       firstName,
//       middleName,
//       lastName,
//       email: email.toLowerCase(),
//       role,
//       companyCode,
//       invitedBy: adminId,
//       token,
//       expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
//     });
    
//     await invitation.save();
//     console.log('Invitation saved:', invitation._id);
    
//     // Create the user in the company database
//     try {
//       // Create the full name here as a fallback
//       const fullName = `${firstName}${middleName ? ' ' + middleName : ''} ${lastName}`;

//       console.log('Attempting to create user with data:', {
//         firstName,
//         lastName,
//         fullName,
//         email: email.toLowerCase(),
//         passwordLength: password.length,
//         password: password, // Log the actual password for debugging
//         role,
//         companyCode
//       });
      
//       // Create user using the new method that handles password hashing properly
//       const newUser = await CompanyUser.createWithPlainPassword({
//         firstName,
//         middleName: middleName || '',
//         lastName,
//         name: fullName,
//         email: email.toLowerCase(),
//         role,
//         companyCode,
//         isVerified: true,
//         isActive: false, // Set to false initially
//         isFirstLogin: true, // Mark as first login
//         invitationId: invitation._id, // Link to invitation
//         lastModified: new Date()
//       }, password);

//       console.log('User object created, about to save:', {
//         hasName: !!newUser.name,
//         hasPassword: !!newUser.password,
//         name: newUser.name,
//         passwordLength: newUser.password ? newUser.password.length : 0,
//         isFirstLogin: newUser.isFirstLogin,
//         invitationId: newUser.invitationId,
//         isPasswordHashed: newUser.password.startsWith('$2')
//       });
      
//       await newUser.save();
//       console.log('User created in company database:', newUser._id);
      
//       // Send invitation email
//       await sendInvitationEmail({
//         email: newUser.email,
//         firstName: newUser.firstName,
//         lastName: newUser.lastName,
//         middleName: newUser.middleName,
//         companyCode: newUser.companyCode,
//         role: newUser.role
//       }, password); // Send the plain password in email
      
//       console.log('Invitation email sent to:', newUser.email, 'with password:', password);
      
//       res.status(201).json({
//         message: 'User invited successfully',
//         user: {
//           name: newUser.name,
//           email: newUser.email,
//           role: newUser.role
//         }
//       });
//     } catch (userError) {
//       console.error('Error creating user or sending email:', userError);
      
//       // If user creation fails, delete the invitation
//       await Invitation.findByIdAndDelete(invitation._id);
      
//       throw userError;
//     }
//   } catch (error) {
//     console.error('Error inviting user:', error);
//     res.status(500).json({ message: error.message });
//   }
// };

// // Get all invitations for a company
// export const getInvitations = async (req, res) => {
//   try {
//     const { lastCheck } = req.query;
//     let query = { companyCode: req.companyCode };
    
//     // If lastCheck is provided, only return invitations modified after that time
//     if (lastCheck) {
//       query.lastModified = { $gt: new Date(lastCheck) };
//     }
    
//     const invitations = await Invitation.find(query).sort({ createdAt: -1 });
    
//     res.status(200).json({
//       invitations,
//       hasUpdates: invitations.length > 0,
//       lastCheck: new Date()
//     });
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };

// // Resend invitation
// export const resendInvitation = async (req, res) => {
//   try {
//     const { invitationId } = req.params;
    
//     const invitation = await Invitation.findOne({
//       _id: invitationId,
//       companyCode: req.companyCode
//     });
    
//     if (!invitation) {
//       return res.status(404).json({ message: 'Invitation not found' });
//     }
    
//     // Find the user to update their password
//     const CompanyUser = await getUserModel(req.companyCode);
//     const user = await CompanyUser.findOne({ email: invitation.email });
    
//     if (!user) {
//       return res.status(404).json({ message: 'User not found' });
//     }
    
//     // Generate a new password
//     const newPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).toUpperCase().slice(-2) + '!1';
    
//     console.log('Resending invitation with new password:', newPassword, 'for user:', user.email);
    
//     // Update user password using manual hashing to avoid double hashing
//     const saltRounds = 10;
//     user.password = await bcrypt.hash(newPassword, saltRounds);
//     user.isFirstLogin = true; // Reset first login flag
//     user.lastModified = new Date();
    
//     // Skip the password hashing middleware
//     user.$skipMiddleware = true;
//     await user.save();
    
//     // Update invitation expiry and status
//     invitation.expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
//     invitation.status = 'pending';
//     invitation.lastModified = new Date();
//     await invitation.save();
    
//     // Resend the email
//     await sendInvitationEmail({
//       email: user.email,
//       firstName: user.firstName,
//       lastName: user.lastName,
//       middleName: user.middleName,
//       companyCode: user.companyCode,
//       role: user.role
//     }, newPassword); // Send the plain password in email
    
//     console.log('Invitation resent to:', user.email, 'with new password:', newPassword);
    
//     res.status(200).json({
//       message: 'Invitation resent successfully'
//     });
//   } catch (error) {
//     console.error('Error resending invitation:', error);
//     res.status(500).json({ message: error.message });
//   }
// };

// // Cancel invitation
// export const cancelInvitation = async (req, res) => {
//   try {
//     const { invitationId } = req.params;
    
//     const invitation = await Invitation.findOne({
//       _id: invitationId,
//       companyCode: req.companyCode
//     });
    
//     if (!invitation) {
//       return res.status(404).json({ message: 'Invitation not found' });
//     }
    
//     // Find and delete the user if they haven't logged in yet
//     const CompanyUser = await getUserModel(req.companyCode);
//     const user = await CompanyUser.findOne({ email: invitation.email });
    
//     if (user && user.isFirstLogin) {
//       // Delete user if they haven't logged in yet
//       await CompanyUser.findByIdAndDelete(user._id);
//     } else if (user) {
//       // Just deactivate if they have already logged in
//       user.isActive = false;
//       user.lastModified = new Date();
//       await user.save();
//     }
    
//     // Delete the invitation
//     await Invitation.findByIdAndDelete(invitationId);
    
//     res.status(200).json({
//       message: 'Invitation cancelled successfully'
//     });
//   } catch (error) {
//     console.error('Error cancelling invitation:', error);
//     res.status(500).json({ message: error.message });
//   }
// };

// // Mark invitation as accepted (called when user first logs in)
// export const markInvitationAccepted = async (userId, companyCode) => {
//   try {
//     // Get the user to find their invitation
//     const CompanyUser = await getUserModel(companyCode);
//     const user = await CompanyUser.findById(userId);
    
//     if (!user || !user.invitationId) {
//       console.log('No invitation found for user:', userId);
//       return;
//     }
    
//     // Find and update the invitation
//     const invitation = await Invitation.findById(user.invitationId);
    
//     if (invitation) {
//       invitation.status = 'accepted';
//       await invitation.save();
//       console.log('Invitation marked as accepted:', invitation._id);
//     }
    
//     return invitation;
//   } catch (error) {
//     console.error('Error marking invitation as accepted:', error);
//     throw error;
//   }
// };

// import Invitation from '../models/Invitation.js';
// import { getUserModel } from '../models/User.js';
// import crypto from 'crypto';
// import nodemailer from 'nodemailer';
// import jwt from 'jsonwebtoken';

// // Create email transporter
// const transporter = nodemailer.createTransport({
//   service: 'gmail',
//   auth: {
//     user: 'a.dineshsundar02@gmail.com',
//     pass: 'xnbj tvjf odej ynit'
//   }
// });

// // Validate invitation token
// export const validateInvitationToken = async (req, res) => {
//   try {
//     const { token } = req.query;

//     if (!token) {
//       return res.status(400).json({ message: 'Token is required' });
//     }

//     let decoded;
//     try {
//       decoded = jwt.verify(token, process.env.JWT_SECRET);
//     } catch (error) {
//       if (error.name === 'TokenExpiredError') {
//         console.error('Token verification failed:', error.message);
//         return res.status(401).json({ message: 'Invitation token has expired. Please request a new invitation.' });
//       } else if (error.name === 'JsonWebTokenError') {
//         console.error('Token verification failed:', error.message);
//         return res.status(400).json({ message: 'Invalid invitation token.' });
//       } else {
//         console.error('Unexpected token verification error:', error.message);
//         return res.status(500).json({ message: 'Error verifying token.' });
//       }
//     }

//     const invitation = await Invitation.findOne({
//       token,
//       email: decoded.email.toLowerCase(),
//       companyCode: decoded.companyCode,
//       status: 'pending'
//     });

//     if (!invitation) {
//       return res.status(404).json({ message: 'Invitation not found or already used.' });
//     }

//     // Check if invitation has expired (optional safety check)
//     if (new Date() > new Date(invitation.expiresAt)) {
//       return res.status(410).json({ message: 'Invitation has expired.' });
//     }

//     res.status(200).json({
//       message: 'Invitation token is valid.',
//       invitation: {
//         email: invitation.email,
//         firstName: invitation.firstName,
//         lastName: invitation.lastName,
//         role: invitation.role,
//         companyCode: invitation.companyCode
//       }
//     });
//   } catch (error) {
//     console.error('Error validating invitation token:', error);
//     res.status(500).json({ message: 'Server error while validating invitation.' });
//   }
// };

// // Send invitation email function
// export const sendInvitationEmail = async (userData, password) => {
//   const fullName = `${userData.firstName} ${userData.middleName ? userData.middleName + ' ' : ''}${userData.lastName}`;
  
//   const mailOptions = {
//     from: '"HRMS Support" <a.dineshsundar02@gmail.com>',
//     to: userData.email,
//     subject: 'Welcome to HRMS - Your Account Invitation',
//     html: `
//       <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 5px;">
//         <div style="text-align: center; margin-bottom: 20px;">
//           <h1 style="color: #1976d2;">Welcome to HRMS</h1>
//         </div>
        
//         <p>Dear ${fullName},</p>
        
//         <p>You have been invited to join the HRMS platform for your company. Your account has been created with the following details:</p>
        
//         <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
//           <p><strong>Email:</strong> ${userData.email}</p>
//           <p><strong>Role:</strong> ${userData.role.charAt(0).toUpperCase() + userData.role.slice(1)}</p>
//           <p><strong>Company Code:</strong> ${userData.companyCode}</p>
//           <p><strong>Temporary Password:</strong> ${password}</p>
//         </div>
        
//         <p>Please use these credentials to log in to the HRMS platform. You will be prompted to change your password after your first login.</p>
        
//         <div style="text-align: center; margin: 30px 0;">
//           <a href="${process.env.CLIENT_URL || 'http://localhost:3000'}/login" 
//              style="background-color: #1976d2; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; font-weight: bold;">
//             Login to HRMS
//           </a>
//         </div>
        
//         <p>If you have any questions or need assistance, please contact your administrator.</p>
        
//         <p>Thank you,<br>HRMS Team</p>
        
//         <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #e0e0e0; font-size: 12px; color: #757575; text-align: center;">
//           <p>This is an automated email. Please do not reply to this message.</p>
//         </div>
//       </div>
//     `
//   };

//   return await transporter.sendMail(mailOptions);
// };

// // Create and send invitation
// export const createInvitation = async (req, res) => {
//   try {
//     console.log('Received invitation request:', {
//       body: req.body,
//       user: req.user ? { id: req.user.id } : 'No user',
//       companyCode: req.companyCode || 'No company code'
//     });
    
//     const { firstName, middleName, lastName, email, role } = req.body;
//     const companyCode = req.companyCode;
//     const adminId = req.user.id;
    
//     // Validate required fields
//     if (!firstName || !lastName || !email || !role) {
//       return res.status(400).json({ 
//         message: 'First name, last name, email, and role are required' 
//       });
//     }
    
//     // Check if email already exists in the company
//     const CompanyUser = await getUserModel(companyCode);
//     const existingUser = await CompanyUser.findOne({ email: email.toLowerCase() });
    
//     if (existingUser) {
//       return res.status(400).json({ 
//         message: 'A user with this email already exists in your company' 
//       });
//     }
    
//     // Check if there's a pending invitation
//     const existingInvitation = await Invitation.findOne({ 
//       email: email.toLowerCase(),
//       companyCode,
//       status: 'pending'
//     });
    
//     if (existingInvitation) {
//       return res.status(400).json({ 
//         message: 'An invitation has already been sent to this email' 
//       });
//     }
    
//     // Generate a random password
//     const password = Math.random().toString(36).slice(-8) + Math.random().toString(36).toUpperCase().slice(-2) + '!1';
    
//     // Generate a token for the invitation
//     const token = crypto.randomBytes(32).toString('hex');
    
//     // Create an invitation record
//     const invitation = new Invitation({
//       firstName,
//       middleName,
//       lastName,
//       email: email.toLowerCase(),
//       role,
//       companyCode,
//       invitedBy: adminId,
//       token,
//       expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
//     });
    
//     await invitation.save();
//     console.log('Invitation saved:', invitation._id);
    
//     // Create the user in the company database
//     try {
//       // Create the full name here as a fallback
//       const fullName = `${firstName}${middleName ? ' ' + middleName : ''} ${lastName}`;

//       console.log('Attempting to create user with data:', {
//         firstName,
//         lastName,
//         fullName,
//         email: email.toLowerCase(),
//         passwordLength: password.length,
//         role,
//         companyCode
//       });
      
//       // Try to create user with explicit name and password
//       const newUser = new CompanyUser({
//         firstName,
//         middleName: middleName || '',
//         lastName,
//         name: fullName, // Explicitly set the name
//         email: email.toLowerCase(),
//         password, // Explicitly set the password
//         role,
//         companyCode,
//         isVerified: true,
//         isActive: true
//       });

//       console.log('User object created, about to save:', {
//         hasName: !!newUser.name,
//         hasPassword: !!newUser.password,
//         name: newUser.name,
//         passwordLength: newUser.password ? newUser.password.length : 0
//       });
      
//       await newUser.save();
//       console.log('User created in company database:', newUser._id);
      
//       // Send invitation email
//       await sendInvitationEmail({
//         email: newUser.email,
//         firstName: newUser.firstName,
//         lastName: newUser.lastName,
//         middleName: newUser.middleName,
//         companyCode: newUser.companyCode,
//         role: newUser.role
//       }, password);
      
//       console.log('Invitation email sent to:', newUser.email);
      
//       res.status(201).json({
//         message: 'User invited successfully',
//         user: {
//           name: newUser.name,
//           email: newUser.email,
//           role: newUser.role
//         }
//       });
//     } catch (userError) {
//       console.error('Error creating user or sending email:', userError);
      
//       // If user creation fails, delete the invitation
//       await Invitation.findByIdAndDelete(invitation._id);
      
//       throw userError;
//     }
//   } catch (error) {
//     console.error('Error inviting user:', error);
//     res.status(500).json({ message: error.message });
//   }
// };

// // Get all invitations for a company
// export const getInvitations = async (req, res) => {
//   try {
//     const invitations = await Invitation.find({ 
//       companyCode: req.companyCode 
//     }).sort({ createdAt: -1 });
    
//     res.status(200).json(invitations);
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };

// // Resend invitation
// export const resendInvitation = async (req, res) => {
//   try {
//     const { invitationId } = req.params;
    
//     const invitation = await Invitation.findOne({
//       _id: invitationId,
//       companyCode: req.companyCode
//     });
    
//     if (!invitation) {
//       return res.status(404).json({ message: 'Invitation not found' });
//     }
    
//     // Find the user to get their password
//     const CompanyUser = await getUserModel(req.companyCode);
//     const user = await CompanyUser.findOne({ email: invitation.email });
    
//     if (!user) {
//       return res.status(404).json({ message: 'User not found' });
//     }
    
//     // Generate a new password
//     const newPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).toUpperCase().slice(-2) + '!1';
    
//     // Update user password
//     user.password = newPassword;
//     await user.save();
    
//     // Update invitation expiry
//     invitation.expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
//     invitation.status = 'pending';
//     await invitation.save();
    
//     // Resend the email
//     await sendInvitationEmail({
//       email: user.email,
//       firstName: user.firstName,
//       lastName: user.lastName,
//       middleName: user.middleName,
//       companyCode: user.companyCode,
//       role: user.role
//     }, newPassword);
    
//     res.status(200).json({
//       message: 'Invitation resent successfully'
//     });
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };

// // Cancel invitation
// export const cancelInvitation = async (req, res) => {
//   try {
//     const { invitationId } = req.params;
    
//     const invitation = await Invitation.findOne({
//       _id: invitationId,
//       companyCode: req.companyCode
//     });
    
//     if (!invitation) {
//       return res.status(404).json({ message: 'Invitation not found' });
//     }
    
//     // Delete the invitation
//     await Invitation.findByIdAndDelete(invitationId);
    
//     // Find and deactivate the user
//     const CompanyUser = await getUserModel(req.companyCode);
//     const user = await CompanyUser.findOne({ email: invitation.email });
    
//     if (user) {
//       user.isActive = false;
//       await user.save();
//     }
    
//     res.status(200).json({
//       message: 'Invitation cancelled successfully'
//     });
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };
