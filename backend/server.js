import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import http from 'http';
import { Server } from 'socket.io';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

import { connectMainDB } from './config/db.js';
import { authenticate, companyFilter } from './middleware/companyAuth.js';
import { printStartupDiagnostics, printSocketDiagnostics, checkMissingEnvVars } from './utils/diagnostics.js';

// Import route handlers
import employeesRouter from './routes/employeesRouter.js';
import authRouter from './routes/authRouter.js';
import profileRouter from './routes/profileRouter.js';
import applicantProfileRoutes from './routes/applicantProfileRoutes.js';
import candidateRoutes from './routes/candidateRoutes.js';
import employeeRoutes from './routes/employeeRoutes.js';
import interviewRoutes from './routes/interviewRoutes.js';
import skillZoneRoutes from './routes/skillZoneRoutes.js';
import surveyRoutes from './routes/surveyRoutes.js';
import assetDashboardRoutes from './routes/assetDashboardRoutes.js';
import assetBatchRoutes from './routes/assetBatchRoutes.js';
import assetRoutes from './routes/assetHistory.js';
import faqCategoryRoutes from './routes/faqCategoryRoutes.js';
import faqRoutes from './routes/faqRoutes.js';
import companyHolidaysRoute from './routes/companyHolidays.js';
import restrictLeaveRoutes from './routes/restrictLeaveRoutes.js';
import holidayRoutes from './routes/holidays.js';
import shiftRequestRoutes from './routes/shiftRequestRoutes.js';
import workTypeRequestRoutes from './routes/workTypeRequestRoutes.js';
import onboardingRoutes from './routes/onboardingRoutes.js';
import hiredEmployeeRoutes from './routes/hiredEmployeeRoutes.js';
import timesheetRoutes from './routes/timesheetRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import companyRoutes from './routes/companyRoutes.js';
import roleRoutes from './routes/roleRoutes.js';
import invitationRoutes from './routes/invitationRoutes.js';
// Sangeeta's routes
import objectiveRoutes from './routes/objectiveRoutes.js';
import offboardingRoutes from './routes/offboardingRoutes.js';
import resignationRoutes from './routes/resignationRoutes.js';
import feedbackRoutes from './routes/feedbackRoutes.js';
import payrollContractRoutes from './routes/payrollContractRoutes.js';
import payrollRoutes from './routes/PayrollRoutes.js';
// Harish's routes
import attendanceRoutes from './routes/attendanceRoutes.js';
import documentRoutes from './routes/documentRoutes.js';
import policyRoutes from './routes/policyRoutes.js';
import organizationRoutes from './routes/organizationRoutes.js';
import disciplinaryActionRoutes from './routes/disciplinaryActions.js';
import timeOffRequestRoutes from './routes/timeOffRequests.js';
import rotatingShiftRoutes from './routes/rotatingShiftRoutes.js';
import rotatingWorktypeRoutes from './routes/rotatingWorktypeRoutes.js';
import myLeaveRequestRoutes from './routes/myLeaveRequestRoutes.js';
import leaveRequestRoutes from './routes/leaveRequestRoutes.js';
import s3Routes from './routes/s3Routes.js';
import userRoutes from './routes/userRoutes.js';

// Determine directory name (for ES modules)
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config();

// Diagnostics for startup
printStartupDiagnostics();
checkMissingEnvVars();

// Initialize database connection (with retry on failure)
(async function setupDatabase() {
  try {
    console.log('Initializing database connection...');
    await connectMainDB();
    console.log('Main database connection established successfully');
  } catch (error) {
    console.error('Failed to connect to the main database:', error.message);
    console.log('Server will continue to run and retry connections as needed');
    // Server continues running; DB reconnection will be attempted when needed
  }
})();

// Create Express app and HTTP server
const app = express();
app.set('trust proxy', true);  // trust X-Forwarded-* headers from proxies (needed for real client IPs)
const server = http.createServer(app);

// Set up Socket.IO with CORS configuration
const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [
  'http://localhost:3000',
  'http://localhost:5002',
  'http://127.0.0.1:3000'
];
const io = new Server(server, {
  cors: {
    origin: (origin, callback) => {
      if (!origin) {
        return callback(null, true); // allow requests with no origin (e.g., mobile apps, Postman)
      }
      // Normalize origin and allowed list for comparison
      const normalizedOrigin = origin.toLowerCase();
      const normalizedAllowed = allowedOrigins.map(o => o.toLowerCase());
      if (normalizedOrigin.includes('localhost') || normalizedOrigin.includes('127.0.0.1')) {
        // Always allow local development origins
        return callback(null, true);
      }
      if (normalizedAllowed.includes(normalizedOrigin)) {
        // Origin is in the whitelist from environment
        return callback(null, true);
      }
      // Origin not allowed
      console.log(`Socket.IO CORS blocked: ${origin}`);
      return callback(null, true); // **Currently allowing all (for debugging); change to callback(new Error("Not allowed")) in production**
    },
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization", "x-company-code"]
  },
  transports: ['websocket', 'polling'],
  pingTimeout: 60000,
  pingInterval: 25000
});

// Handle Socket.IO connections
io.on('connection', (socket) => {
  console.log('📡 Socket.IO: User connected', socket.id);
  // Join a user-specific room for notifications
  socket.on('join', (data) => {
    let userId = (typeof data === 'object' && data.userId) ? data.userId 
                : (typeof data === 'string' ? data : null);
    if (userId) {
      socket.join(userId);
      console.log(`📡 Socket.IO: User ${userId} joined room ${userId}`);
      socket.emit('joined', { userId, message: 'Successfully joined notification room' });
    } else {
      console.error('📡 Socket.IO: Invalid join data:', data);
      socket.emit('error', { message: 'Invalid user data for joining room' });
    }
  });
  // Simple error and disconnect handlers
  socket.on('error', (error) => {
    console.error('📡 Socket.IO: Socket error:', error);
  });
  socket.on('disconnect', (reason) => {
    console.log('📡 Socket.IO: User disconnected:', socket.id, 'Reason:', reason);
  });
  // Heartbeat ping/pong to keep connection alive
  socket.on('ping', () => {
    socket.emit('pong');
  });
});

// Print Socket.IO diagnostics (allowed origins, etc.)
printSocketDiagnostics(allowedOrigins);

// CORS middleware for Express routes (using the same allowedOrigins list)
const corsOptions = {
  origin: function(origin, callback) {
    if (!origin) return callback(null, true); // allow requests with no origin
    const normalizedOrigin = origin.toLowerCase();
    const normalizedAllowed = allowedOrigins.map(o => o.toLowerCase());
    // Allow local dev origins
    if (normalizedOrigin.includes('localhost') || normalizedOrigin.includes('127.0.0.1')) {
      return callback(null, true);
    }
    // Allow if origin is in whitelist
    if (normalizedAllowed.includes(normalizedOrigin)) {
      return callback(null, true);
    }
    // Block other origins
    console.error(`Blocked by CORS: ${origin}`);
    return callback(new Error("Not allowed by CORS"));
  },
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
  credentials: true,
  allowedHeaders: [
    "Content-Type", "Authorization", "Access-Control-Allow-Methods",
    "Access-Control-Allow-Origin", "X-Company-Code"
  ]
};
app.use(cors(corsOptions));
// Handle pre-flight OPTIONS requests globally
app.options('*', cors(corsOptions));

// Global error handling middleware (to catch internal errors)
app.use(express.json());
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Internal Server Error' });
});

// **Static Files Middleware** – must come before auth-protected routes
app.use('/uploads', (req, res, next) => {
  // Allow all origins to access static files (images, etc.)
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  // Permit embedding and cross-origin use of these resources
  res.header('Cross-Origin-Resource-Policy', 'cross-origin');
  res.header('Cross-Origin-Embedder-Policy', 'unsafe-none');
  if (req.method === 'OPTIONS') {
    // Short-circuit preflight requests for static files
    return res.sendStatus(200);
  }
  // Set content type and cache headers for static image files
  if (req.path.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i)) {
    res.header('Cache-Control', 'public, max-age=86400');
    if (req.path.match(/\.(jpg|jpeg)$/i)) {
      res.header('Content-Type', 'image/jpeg');
    } else if (req.path.match(/\.png$/i)) {
      res.header('Content-Type', 'image/png');
    }
  }
  next();
}, express.static('uploads', {
  etag: false,
  setHeaders: function(res, filePath) {
    // Set permissive headers on static file responses as well
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Cross-Origin-Resource-Policy', 'cross-origin');
  }
}));

// Ensure the uploads directory exists (for file uploads)
const uploadsDir = path.join(process.cwd(), 'uploads', 'contracts');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log('Created uploads/contracts directory');
}

            // user management (some endpoints may be public/protected internally)

// **Public Routes** (no authentication middleware)
app.use('/api/auth', authRouter);
app.use('/api/companies', companyRoutes); 
app.use('/api/users', userRoutes);

// **Protected Routes** (routes will handle their own auth checks)

app.use('/api/employees', employeesRouter);
app.use('/api/profiles', profileRouter);
app.use(candidateRoutes);
app.use(surveyRoutes);
app.use('/api/applicantProfiles', applicantProfileRoutes);
app.use('/api/interviews', interviewRoutes);
app.use(skillZoneRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/onboarding', onboardingRoutes);
app.use('/api/dashboard', assetDashboardRoutes);
app.use('/api/asset-batches', assetBatchRoutes);
app.use('/api/assets', assetRoutes);
app.use('/api/holidays', holidayRoutes);
app.use('/api/companyHolidays', companyHolidaysRoute);
app.use('/api/restrictLeaves', restrictLeaveRoutes);
app.use('/api/faqs', faqRoutes);
app.use('/api/faqCategories', faqCategoryRoutes);
app.use('/api/hired-employees', hiredEmployeeRoutes);
app.use('/api/shift-request', shiftRequestRoutes);
app.use('/api/work-type-requests', workTypeRequestRoutes);
app.use('/api/timesheet', timesheetRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/payroll-contracts', payrollContractRoutes);
app.use('/api/objectives', objectiveRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/offboarding', offboardingRoutes);
app.use('/api/resignations', resignationRoutes);
app.use('/api/payroll', payrollRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api', documentRoutes);           // these might include multiple endpoints (documents, policies, etc.)
app.use('/api', policyRoutes);
app.use('/api/organization', organizationRoutes);
app.use('/api/disciplinary-actions', disciplinaryActionRoutes);
app.use('/api/time-off-requests', timeOffRequestRoutes);
app.use('/api/rotating-shift', rotatingShiftRoutes);
app.use('/api/rotating-worktype', rotatingWorktypeRoutes);
app.use('/api/leave-requests', myLeaveRequestRoutes);  // possibly overlaps with next line if not differentiated
app.use('/api/leave-requests', leaveRequestRoutes);
app.use('/api/s3', s3Routes);
app.use('/api/roles', roleRoutes);
app.use('/api/invitations', invitationRoutes);

// Attach Socket.IO instance to app for use in routes if needed
app.set('io', io);

// Start the server
const PORT = process.env.PORT || 5002;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`✨ Server running on port 0.0.0.0:${PORT}`);
});

// Graceful shutdown handlers for PM2, Docker, etc.
process.on('SIGINT', async () => {
  console.log('Shutting down gracefully (SIGINT)...');
  const { closeAllConnections } = await import('./config/db.js');
  await closeAllConnections();
  process.exit(0);
});
process.on('SIGTERM', async () => {
  console.log('Shutting down gracefully (SIGTERM)...');
  const { closeAllConnections } = await import('./config/db.js');
  await closeAllConnections();
  process.exit(0);
});

// import express from "express"
// import dotenv from 'dotenv';
// import cors from 'cors';
// import fs from 'fs';
// import path from 'path';

// //import connectDB from './config/db.js';
// import { connectMainDB } from './config/db.js';
// import employeesRouter from './routes/employeesRouter.js'
// import authRouter from './routes/authRouter.js'
// import profileRouter from './routes/profileRouter.js'
// // import contractRouter from './routes/contractRouter.js'
// import applicantProfileRoutes from './routes/applicantProfileRoutes.js'
// import candidateRoutes from './routes/candidateRoutes.js'
// import employeeRoutes from './routes/employeeRoutes.js'
// import interviewRoutes from './routes/interviewRoutes.js'

// import skillZoneRoutes from './routes/skillZoneRoutes.js'
// import surveyRoutes from './routes/surveyRoutes.js'
// // import assetRoutes from './routes/assets.js';
// import assetDashboardRoutes from './routes/assetDashboardRoutes.js';
// import assetBatchRoutes from './routes/assetBatchRoutes.js';
// // import assetHistoryRoutes from './routes/assetHistory.js';
// import assetRoutes from './routes/assetHistory.js';
// import faqCategoryRoutes from './routes/faqCategoryRoutes.js';
// import faqRoutes from './routes/faqRoutes.js';
// import companyHolidaysRoute from './routes/companyHolidays.js';
// import restrictLeaveRoutes from './routes/restrictLeaveRoutes.js';
// import holidayRoutes from './routes/holidays.js';
// import shiftRequestRoutes from './routes/shiftRequestRoutes.js';
// import workTypeRequestRoutes from './routes/workTypeRequestRoutes.js';
// import onboardingRoutes from './routes/onboardingRoutes.js';
// import hiredEmployeeRoutes from './routes/hiredEmployeeRoutes.js';
// import timesheetRoutes from './routes/timesheetRoutes.js';
// import notificationRoutes from './routes/notificationRoutes.js';

// import companyRoutes from './routes/companyRoutes.js';
// import roleRoutes from './routes/roleRoutes.js';
// import { authenticate, companyFilter } from './middleware/companyAuth.js';
// import invitationRoutes from './routes/invitationRoutes.js';
// //import authTestRoutes from './routes/authTestRoutes.js';

// import userRoutes from './routes/userRoutes.js';

// // import { startAllJobs } from './Jobs/index.js'; // Import the job scheduler

// import { fileURLToPath } from 'url';
// import { dirname} from "path";

// import { Server } from 'socket.io';
// import http from 'http';

// // // Sangeeta 
// import objectiveRoutes from './routes/objectiveRoutes.js';
// import offboardingRoutes from './routes/offboardingRoutes.js';
// import resignationRoutes from './routes/resignationRoutes.js';
// import Feedback from './routes/feedbackRoutes.js';
// import payrollContractRoutes from './routes/payrollContractRoutes.js';
// import payrollRoutes from './routes/PayrollRoutes.js';

// // Harish
// import attendanceRoutes from './routes/attendanceRoutes.js';
// import documentRoutes from './routes/documentRoutes.js';
// import policyRoutes from './routes/policyRoutes.js';
// import organizationRoutes from './routes/organizationRoutes.js';
// import disciplinaryActionRoutes from './routes/disciplinaryActions.js'; 
// import timeOffRequestRoutes from './routes/timeOffRequests.js'; 
// import rotatingShiftRoutes from './routes/rotatingShiftRoutes.js';
// import rotatingWorktypeRoutes from './routes/rotatingWorktypeRoutes.js';
// import myLeaveRequestRoutes from './routes/myLeaveRequestRoutes.js';
// import leaveRequestRoutes from './routes/leaveRequestRoutes.js';
// import s3Routes from './routes/s3Routes.js';
// import { printStartupDiagnostics, printSocketDiagnostics, checkMissingEnvVars } from './utils/diagnostics.js';
// // import documentRoute from './routes/documentRoutes-1.js';

// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);



// dotenv.config();

// // Print startup diagnostics
// printStartupDiagnostics();
// checkMissingEnvVars();

// // Connect to the main database with error handling and retry
// (async function setupDatabase() {
//   try {
//     console.log('Initializing database connection...');
//     await connectMainDB();
//     console.log('Main database connection established successfully');
//   } catch (error) {
//     console.error('Failed to connect to the main database:', error.message);
//     console.log('Server will continue to run and retry connections as needed');
//     // The server will continue running and connections will be retried when needed
//   }
// })();

// const app = express();
// app.set('trust proxy', true); // which enable ALB/ELB to pass the real IP address of the client

// // // Start scheduled jobs after server setup
// // startAllJobs();

// // Add a graceful shutdown handler
// process.on('SIGINT', async () => {
//   console.log('Shutting down gracefully...');
//   const { closeAllConnections } = await import('./config/db.js');
//   await closeAllConnections();
//   process.exit(0);
// });

// process.on('SIGTERM', async () => {
//   console.log('Shutting down gracefully...');
//   const { closeAllConnections } = await import('./config/db.js');
//   await closeAllConnections();
//   process.exit(0);
// });

// // Create HTTP server
// const server = http.createServer(app);

// // Middleware to parse JSON request bodies
// const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [
//   'http://localhost:3000',
//   'http://localhost:5002',
//   'http://127.0.0.1:3000'
// ];

// // Set up Socket.io with enhanced CORS and configuration
// const io = new Server(server, {
//   cors: {
//     origin: function (origin, callback) {
//       // Allow requests with no origin (mobile apps, postman, etc.)
//       if (!origin) return callback(null, true);
      
//       // Allow localhost for development
//       if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
//         return callback(null, true);
//       }
      
//       // Check against allowed origins
//       const normalizedOrigin = origin.toLowerCase();
//       const normalizedAllowed = allowedOrigins.map(o => o.toLowerCase());
      
//       if (normalizedAllowed.includes(normalizedOrigin)) {
//         return callback(null, true);
//       }
      
//       // For debugging - log blocked origins
//       console.log(`Socket.IO CORS blocked: ${origin}`);
//       return callback(null, true); // Allow for now, remove in production
//     },
//     methods: ["GET", "POST", "PUT", "DELETE"],
//     credentials: true,
//     allowedHeaders: ["Content-Type", "Authorization", "x-company-code"]
//   },
//   transports: ['websocket', 'polling'],
//   pingTimeout: 60000,
//   pingInterval: 25000
// });

// // Socket.io connection handling with enhanced error handling
// io.on('connection', (socket) => {
//   console.log('📡 Socket.IO: User connected', socket.id);
  
//   // Handle user joining a room - support both object and direct userId
//   socket.on('join', (data) => {
//     let userId;
    
//     // Handle both { userId: 'xxx' } and direct 'xxx' formats
//     if (typeof data === 'object' && data.userId) {
//       userId = data.userId;
//     } else if (typeof data === 'string') {
//       userId = data;
//     }
    
//     if (userId) {
//       socket.join(userId);
//       console.log(`📡 Socket.IO: User ${userId} joined room ${userId}`);
      
//       // Send confirmation back to client
//       socket.emit('joined', { userId, message: 'Successfully joined notification room' });
//     } else {
//       console.error('📡 Socket.IO: Invalid join data:', data);
//       socket.emit('error', { message: 'Invalid user data for joining room' });
//     }
//   });
  
//   // Handle errors
//   socket.on('error', (error) => {
//     console.error('📡 Socket.IO: Socket error:', error);
//   });
  
//   socket.on('disconnect', (reason) => {
//     console.log('📡 Socket.IO: User disconnected:', socket.id, 'Reason:', reason);
//   });
  
//   // Heartbeat to keep connection alive
//   socket.on('ping', () => {
//     socket.emit('pong');
//   });
// });

// // Print Socket.IO diagnostics
// printSocketDiagnostics(allowedOrigins);




// // console.log('Notification routes registered');



// const corsOptions = {
//   origin: function (origin, callback) {
//     // Always allow requests without origin (mobile apps, Postman, etc.)
//     if (!origin) return callback(null, true);

//     // Handle ALB forwarded headers
//     const normalizedOrigin = origin.toLowerCase();
//     const normalizedAllowed = allowedOrigins.map(o => o.toLowerCase());

//     // Allow localhost for development
//     if (normalizedOrigin.includes('localhost') || normalizedOrigin.includes('127.0.0.1')) {
//       return callback(null, true);
//     }

//     if (normalizedAllowed.includes(normalizedOrigin)) {
//       return callback(null, true);
//     } else {
//       console.error(`Blocked by CORS: ${origin}`);
//       return callback(new Error("Not allowed by CORS"));
//     }
//   },





//   methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
//   credentials: true,
//   allowedHeaders: [
//     'Content-Type',
//     'Authorization',
//     'Access-Control-Allow-Methods',
//     'Access-Control-Allow-Origin',
//     'X-Company-Code'
//   ]
// };

// app.use(cors(corsOptions));
// app.options('*', cors(corsOptions));


 

// // Error handling middleware
// app.use((err, req, res, next) => {
//     console.error(err.stack);
//     res.status(500).json({ message: 'Internal Server Error' });
// });

// app.use(express.json());

// // CRITICAL: Serve static files BEFORE any authentication middleware to prevent 401 errors
// app.use('/uploads', (req, res, next) => {
//   // Always allow cross-origin for static files (prevents CORB)
//   res.header('Access-Control-Allow-Origin', '*');
//   res.header('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
//   res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
//   res.header('Cross-Origin-Resource-Policy', 'cross-origin');
//   res.header('Cross-Origin-Embedder-Policy', 'unsafe-none');
  
//   // Handle preflight requests
//   if (req.method === 'OPTIONS') {
//     res.status(200).end();
//     return;
//   }
  
//   // Set proper content types and cache headers for images
//   if (req.path.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i)) {
//     res.header('Cache-Control', 'public, max-age=86400');
//     if (req.path.match(/\.(jpg|jpeg)$/i)) {
//       res.header('Content-Type', 'image/jpeg');
//     } else if (req.path.match(/\.png$/i)) {
//       res.header('Content-Type', 'image/png');
//     }
//   }
  
//   next();
// }, express.static('uploads', {
//   etag: false,
//   setHeaders: function (res, path, stat) {
//     res.set('Access-Control-Allow-Origin', '*');
//     res.set('Cross-Origin-Resource-Policy', 'cross-origin');
//   }
// }));

// // Ensure uploads directory exists
// const uploadsDir = path.join(process.cwd(), 'uploads', 'contracts');
// if (!fs.existsSync(uploadsDir)) {
//   fs.mkdirSync(uploadsDir, { recursive: true });
//   console.log('Created uploads/contracts directory');
// }


// app.use('/api/users', userRoutes);

// // IMPORTANT: Do NOT apply authentication middleware globally here
// // Instead, apply it within each route file for protected routes only

// // Public routes - no authentication required
// app.use("/api/auth", authRouter);
// app.use("/api/companies", companyRoutes); // Company routes handle their own authentication

// // Protected routes - these routes should handle their own authentication
// app.use("/api/employees", employeesRouter);
// app.use("/api/profiles", profileRouter);
// // app.use("/api/contracts", contractRouter);
// app.use(candidateRoutes);
// app.use(surveyRoutes);
// app.use('/api/applicantProfiles', applicantProfileRoutes);
// app.use('/api/interviews', interviewRoutes);
// app.use(skillZoneRoutes);
// app.use('/api/employees',employeeRoutes);
// app.use('/api/onboarding', onboardingRoutes);
// // app.use('/api/assets', assetRoutes);
// app.use('/api/dashboard', assetDashboardRoutes);
// app.use('/api/asset-batches', assetBatchRoutes);
// // app.use('/api/assethistory', assetHistoryRoutes);
// app.use('/api/assets', assetRoutes);
// app.use('/api/holidays', holidayRoutes);
// app.use('/api/companyHolidays', companyHolidaysRoute);
// app.use('/api/restrictLeaves', restrictLeaveRoutes);
// app.use('/api/faqs', faqRoutes);
// app.use('/api/faqCategories', faqCategoryRoutes);
// app.use('/api/hired-employees', hiredEmployeeRoutes);
// app.use('/api/shift-request', shiftRequestRoutes);
// app.use('/api/work-type-requests', workTypeRequestRoutes);
// app.use('/api/timesheet', timesheetRoutes);
// app.use('/api/notifications', notificationRoutes);


// app.use('/api/payroll-contracts', payrollContractRoutes);
// app.use('/api/objectives', objectiveRoutes);
// app.use('/api/feedback', Feedback);
// app.use('/api/offboarding', offboardingRoutes);
// app.use('/api/resignations', resignationRoutes);
// app.use('/api/payroll', payrollRoutes);

// // Harish
// app.use('/api/attendance', attendanceRoutes);
// app.use('/api', documentRoutes);
// app.use('/api', policyRoutes);
// // app.use('/api', organizationRoutes);
// app.use('/api/organization', organizationRoutes);
// // app.use('/api/disciplinary-actions', disciplinaryActionRoutes);
// app.use('/api/disciplinary-actions', disciplinaryActionRoutes)
// app.use('/api/time-off-requests', timeOffRequestRoutes);
// app.use('/api/rotating-shift', rotatingShiftRoutes);
// app.use('/api/rotating-worktype', rotatingWorktypeRoutes);
// app.use('/api/leave-requests', myLeaveRequestRoutes);
// app.use('/api/leave-requests', leaveRequestRoutes);
// app.use('/api/s3', s3Routes);
// // app.use('/api/documents', documentRoute);

// // User management routes
// app.use('/api/roles', roleRoutes);
// app.use('/api/invitations', invitationRoutes);

// // After creating the io instance
// app.set('io', io);

// app.use('/api/roles', roleRoutes);
// // app.use('/api/test', authTestRoutes);

// const PORT = process.env.PORT || 5002;

// server.listen(PORT, '0.0.0.0', () => {
//   //console.log(`✨ Server running on port ${PORT}`.yellow.bold);
//   console.log(`✨ Server running on port 0.0.0.0:${PORT}`.yellow.bold);
// });
