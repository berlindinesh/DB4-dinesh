import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { sendOtpEmail, sendResetEmail } from '../utils/mailer.js';

// Register User and send OTP
export const registerAuth = async (req, res) => {
  try {
    const { firstName, middleName, lastName, name, email, password } = req.body;

    // Add validation for required name field
    if (!name) {
      return res.status(400).json({ message: 'Name is required' });
    }
    
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ message: 'User already exists. Please try login!' });
    }

    // Generate userId
    const emailParts = email.split('@');
    const domain = emailParts[1].split('.')[0];
    const baseId = `${firstName.charAt(0)}${lastName.charAt(0)}-${domain}`.toUpperCase();
    
    // Find the count of existing users with similar userId pattern
    const count = await User.countDocuments({
      userId: new RegExp(`^${baseId}`)
    });
    
    // Create userId with sequential number
    const userId = `${baseId}-${(count + 1).toString().padStart(4, '0')}`;

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000);
    const otpExpires = Date.now() + 10 * 60 * 1000; // 10 minutes

    // Create new user with all fields including userId using safeSave
    const userData = {
      userId,
      firstName,
      middleName,
      lastName,
      name,
      email,
      password: hashedPassword,
      otp: otp.toString(),
      otpExpires
    };
    
    // Save user to database with duplicate key error handling
    const newUser = await User.safeSave(userData);

    // Send OTP email
    await sendOtpEmail(email, otp);
    
    res.status(200).json({ 
      message: 'Registration successful. Please check your email for the OTP.',
      userId: newUser.userId
    });
  } catch (err) {
    console.error('Registration error:', err);
    
    // Handle duplicate key error (usually email)
    if (err.code === 11000) {
      return res.status(409).json({ message: 'User already exists. Please try login!' });
    }
    
    // Handle validation errors
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map(val => val.message);
      return res.status(400).json({ message: messages.join(', ') });
    }
    
    res.status(500).json({ message: 'Server error. Please try again.', error: err.message });
  }
};

// Login User
export const loginAuth = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Check if user is verified
    if (!user.isVerified) {
      // Generate new OTP for unverified users
      const otp = Math.floor(100000 + Math.random() * 900000);
      const otpExpires = Date.now() + 10 * 60 * 1000; // 10 minutes

      user.otp = otp.toString();
      user.otpExpires = otpExpires;
      await user.save();

      // Send new OTP
      await sendOtpEmail(email, otp);
      
      return res.status(403).json({ 
        message: 'Account not verified. A new OTP has been sent to your email.',
        requiresVerification: true,
        email: user.email
      });
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        id: user._id,
        userId: user.userId,
        name: user.name,
        email: user.email
      }, 
      process.env.JWT_SECRET, 
      { expiresIn: '1d' }
    );

    res.status(200).json({ 
      token,
      user: {
        id: user._id,
        userId: user.userId,
        name: user.name,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Server error. Please try again.' });
  }
};

// Forgot Password
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const resetToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { 
      expiresIn: '1h' 
    });

    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
    await user.save();

    await sendResetEmail(email, resetToken);
    res.status(200).json({ message: 'Reset link sent successfully' });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ message: 'Failed to send reset link' });
  }
};

// Reset Password
// Add this to your authController.js file or wherever your reset password route is handled

export const resetPassword = async (req, res) => {
  try {
      const { token } = req.params;
      const { password } = req.body;

      // Find user with this reset token and check if it's still valid
      const user = await User.findOne({
          resetPasswordToken: token,
          resetPasswordExpires: { $gt: Date.now() }
      });

      if (!user) {
          return res.status(400).json({ message: 'Password reset token is invalid or has expired.' });
      }

      // Check if new password is the same as the old one
      const isSamePassword = await bcrypt.compare(password, user.password);
      if (isSamePassword) {
          return res.status(400).json({ 
              message: 'New password cannot be the same as your old password. Please choose a different password.' 
          });
      }

      // Hash the new password
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(password, salt);
      
      // Clear reset token fields
      user.resetPasswordToken = undefined;
      user.resetPasswordExpires = undefined;

      await user.save();

      res.status(200).json({ message: 'Password has been reset successfully. You can now log in with your new password.' });
  } catch (error) {
      console.error('Reset password error:', error);
      res.status(500).json({ message: 'Server error during password reset.' });
  }
};

// Verify OTP
export const verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'User not found' });
    }

    // Check if OTP is valid and not expired
    if (user.otp !== otp || user.otpExpires < Date.now()) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    // OTP verified successfully, clear OTP and expiration time
    user.otp = undefined;
    user.otpExpires = undefined;
    user.isVerified = true;
    await user.save();

    // Generate JWT token for auto-login after verification
    const token = jwt.sign(
      { 
        id: user._id,
        userId: user.userId,
        name: user.name,
        email: user.email
      }, 
      process.env.JWT_SECRET, 
      { expiresIn: '1d' }
    );

    res.status(200).json({ 
      message: 'OTP verified successfully. Registration completed.',
      token,
      user: {
        id: user._id,
        userId: user.userId,
        name: user.name,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email
      }
    });
  } catch (err) {
    console.error('OTP verification error:', err);
    res.status(500).json({ message: 'Server error. Please try again.' });
  }
};

// Resend OTP
export const resendOtp = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'User not found' });
    }

    // Generate new OTP
    const otp = Math.floor(100000 + Math.random() * 900000);
    const otpExpires = Date.now() + 10 * 60 * 1000; // 10 minutes

    user.otp = otp.toString();
    user.otpExpires = otpExpires;
    await user.save();

    // Send OTP email
    await sendOtpEmail(email, otp);
    
    res.status(200).json({ message: 'OTP resent successfully' });
  } catch (err) {
    console.error('Resend OTP error:', err);
    res.status(500).json({ message: 'Server error. Please try again.' });
  }
};

// Get current user profile
export const getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password -otp -otpExpires');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.status(200).json(user);
  } catch (err) {
    console.error('Get current user error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Add this function to your authController.js

export const getUserId = async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email is required' 
      });
    }
    
    const user = await User.findOne({ email });
    
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }
    
    res.json({ 
      success: true, 
      userId: user.userId 
    });
  } catch (error) {
    console.error('Error getting user ID:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
};









