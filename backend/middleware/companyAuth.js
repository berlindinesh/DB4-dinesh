// import jwt from 'jsonwebtoken';
// import { getUserModel } from '../models/User.js';

// // Authenticate middleware

// export const authenticate = async (req, res, next) => {
//   try {
//     console.log("Headers:", req.headers);
    
//     // Get token from header
//     const authHeader = req.headers.authorization;
//     if (!authHeader || !authHeader.startsWith('Bearer ')) {
//       console.log("Missing or invalid Authorization header:", authHeader);
//       return res.status(401).json({ message: 'No token, authorization denied' });
//     }
    
//     const token = authHeader.split(' ')[1];
//     console.log("Token extracted:", token.substring(0, 10) + "...");
    
//     // Get company code from header
//     const companyCode = req.headers['x-company-code'];
//     if (!companyCode) {
//       console.log("Missing company code header");
//       return res.status(401).json({ message: 'Company code required' });
//     }
//     console.log("Company code:", companyCode);
    
//     // Verify token
//     console.log("JWT_SECRET exists:", !!process.env.JWT_SECRET);
//     // const decoded = jwt.verify(token, process.env.JWT_SECRET);
//     const decoded = jwt.verify(token, process.env.JWT_SECRET, { 
//   clockTolerance: 60 // Allow 60 seconds of clock skew
// });
//     console.log("Token decoded successfully:", decoded);
    
//     // Check if token is for the correct company
//     if (decoded.companyCode !== companyCode) {
//       console.log("Company code mismatch:", decoded.companyCode, "vs", companyCode);
//       return res.status(401).json({ message: 'Invalid token for this company' });
//     }
    
//     // Get user from company database
//     const CompanyUser = await getUserModel(companyCode);
//     console.log("Got user model for company:", companyCode);
    
//     const user = await CompanyUser.findById(decoded.userId);
//     console.log("User found:", !!user);
    
//     if (!user) {
//       return res.status(401).json({ message: 'User not found' });
//     }
    
//     if (!user.isActive) {
//       console.log("User account is inactive");
//       return res.status(401).json({ message: 'User account is inactive' });
//     }
    
//     // Add user and company code to request
//     req.user = user;
//     req.companyCode = companyCode;
    
//     next();
//   } catch (error) {
//     console.error('Authentication error:', error);
    
//     if (error.name === 'JsonWebTokenError') {
//       return res.status(401).json({ message: 'Invalid token' });
//     }
    
//     if (error.name === 'TokenExpiredError') {
//       return res.status(401).json({ message: 'Token expired' });
//     }
    
//     res.status(500).json({ message: 'Server error' });
//   }
// };

// export const authorize = (permissions) => {
//   return (req, res, next) => {
//     // Skip authorization check if no permissions are required
//     if (!permissions || permissions.length === 0) {
//       return next();
//     }
    
//     // Check if user has admin role (admins have all permissions)
//     if (req.user.role === 'admin') {
//       return next();
//     }
    
//     // Check if user has required permissions
//     const hasPermission = permissions.some(permission => 
//       req.user.permissions.includes(permission)
//     );
    
//     if (!hasPermission) {
//       return res.status(403).json({ 
//         message: 'You do not have permission to perform this action' 
//       });
//     }
    
//     next();
//   };
// };

// // Company filter middleware
// export const companyFilter = (req, res, next) => {
//   // Add company code to request if it exists in headers
//   const companyCode = req.headers['x-company-code'];
//   if (companyCode) {
//     req.companyCode = companyCode;
//   }
  
//   next();
// };

import jwt from 'jsonwebtoken';
import { getUserModel } from '../models/User.js';

// Authenticate middleware
export const authenticate = async (req, res, next) => {
  try {
    console.log("Authentication middleware called for:", req.method, req.url);
    console.log("Headers:", req.headers);
    
    // Get token from header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log("Missing or invalid Authorization header:", authHeader);
      console.log("Request URL:", req.url);
      console.log("Request method:", req.method);
      return res.status(401).json({ message: 'No token, authorization denied' });
    }
    
    const token = authHeader.split(' ')[1];
    console.log("Token extracted:", token.substring(0, 10) + "...");
    
    // Get company code from header
    const companyCode = req.headers['x-company-code'];
    if (!companyCode) {
      console.log("Missing company code header");
      return res.status(401).json({ message: 'Company code required' });
    }
    console.log("Company code:", companyCode);
    
    // Verify token
    console.log("JWT_SECRET exists:", !!process.env.JWT_SECRET);
    const decoded = jwt.verify(token, process.env.JWT_SECRET, { 
      clockTolerance: 60 // Allow 60 seconds of clock skew
    });
    console.log("Token decoded successfully:", decoded);
    
    // Check if token is for the correct company
    if (decoded.companyCode !== companyCode) {
      console.log("Company code mismatch:", decoded.companyCode, "vs", companyCode);
      return res.status(401).json({ message: 'Invalid token for this company' });
    }
    
    // Get user from company database
    const CompanyUser = await getUserModel(companyCode);
    console.log("Got user model for company:", companyCode);
    
    const user = await CompanyUser.findById(decoded.userId);
    console.log("User found:", !!user);
    
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }
    
    if (!user.isActive) {
      console.log("User account is inactive");
      return res.status(401).json({ message: 'User account is inactive' });
    }
    
    // Add user and company code to request
    req.user = user;
    req.companyCode = companyCode;
    
    // ADD THESE LINES - Extract user info for payroll system
    req.userId = user._id.toString();
    req.userEmail = user.email;
    
    console.log("User info added to request:", {
      userId: req.userId,
      userEmail: req.userEmail,
      companyCode: req.companyCode
    });
    
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Invalid token' });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired' });
    }
    
    res.status(500).json({ message: 'Server error' });
  }
};

export const authorize = (permissions) => {
  return (req, res, next) => {
    // Skip authorization check if no permissions are required
    if (!permissions || permissions.length === 0) {
      return next();
    }
    
    // Check if user has admin role (admins have all permissions)
    if (req.user.role === 'admin') {
      return next();
    }
    
    // Check if user has required permissions
    const hasPermission = permissions.some(permission => 
      req.user.permissions.includes(permission)
    );
    
    if (!hasPermission) {
      return res.status(403).json({ 
        message: 'You do not have permission to perform this action' 
      });
    }
    
    next();
  };
};

// Company filter middleware
export const companyFilter = (req, res, next) => {
  // Add company code to request if it exists in headers
  const companyCode = req.headers['x-company-code'];
  if (companyCode) {
    req.companyCode = companyCode;
  }
  
  next();
};
