import express from "express"
import dotenv from 'dotenv';
import cors from 'cors';
import fs from 'fs';
import path from 'path';

//import connectDB from './config/db.js';
import { connectMainDB } from './config/db.js';
import employeesRouter from './routes/employeesRouter.js'
import authRouter from './routes/authRouter.js'
import profileRouter from './routes/profileRouter.js'
// import contractRouter from './routes/contractRouter.js'
import applicantProfileRoutes from './routes/applicantProfileRoutes.js'
import candidateRoutes from './routes/candidateRoutes.js'
import employeeRoutes from './routes/employeeRoutes.js'
import interviewRoutes from './routes/interviewRoutes.js'

import skillZoneRoutes from './routes/skillZoneRoutes.js'
import surveyRoutes from './routes/surveyRoutes.js'
// import assetRoutes from './routes/assets.js';
import assetDashboardRoutes from './routes/assetDashboardRoutes.js';
import assetBatchRoutes from './routes/assetBatchRoutes.js';
// import assetHistoryRoutes from './routes/assetHistory.js';
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
import { authenticate, companyFilter } from './middleware/companyAuth.js';
import invitationRoutes from './routes/invitationRoutes.js';
//import authTestRoutes from './routes/authTestRoutes.js';

import userRoutes from './routes/userRoutes.js';

// import { startAllJobs } from './Jobs/index.js'; // Import the job scheduler

import { fileURLToPath } from 'url';
import { dirname} from "path";

import { Server } from 'socket.io';
import http from 'http';

// // Sangeeta 
import objectiveRoutes from './routes/objectiveRoutes.js';
import offboardingRoutes from './routes/offboardingRoutes.js';
import resignationRoutes from './routes/resignationRoutes.js';
import Feedback from './routes/feedbackRoutes.js';
import payrollContractRoutes from './routes/payrollContractRoutes.js';
import payrollRoutes from './routes/PayrollRoutes.js';

// Harish
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
// import documentRoute from './routes/documentRoutes-1.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);



dotenv.config();


// Connect to the main database with error handling and retry
(async function setupDatabase() {
  try {
    console.log('Initializing database connection...');
    await connectMainDB();
    console.log('Main database connection established successfully');
  } catch (error) {
    console.error('Failed to connect to the main database:', error.message);
    console.log('Server will continue to run and retry connections as needed');
    // The server will continue running and connections will be retried when needed
  }
})();

const app = express();
app.set('trust proxy', true); // which enable ALB/ELB to pass the real IP address of the client

// // Start scheduled jobs after server setup
// startAllJobs();

// Add a graceful shutdown handler
process.on('SIGINT', async () => {
  console.log('Shutting down gracefully...');
  const { closeAllConnections } = await import('./config/db.js');
  await closeAllConnections();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('Shutting down gracefully...');
  const { closeAllConnections } = await import('./config/db.js');
  await closeAllConnections();
  process.exit(0);
});

// Create HTTP server
const server = http.createServer(app);

// Middleware to parse JSON request bodies
const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [];

// Set up Socket.io
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('A user connected');
  
  // Handle user joining a room
  socket.on('join', ({ userId }) => {
    if (userId) {
      socket.join(userId);
      console.log(`User ${userId} joined their room`);
    }
  });
  
  socket.on('disconnect', () => {
    console.log('A user disconnected');
  });
});




// console.log('Notification routes registered');



const corsOptions = {
  origin: function (origin, callback) {
    // Always allow requests without origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);

    // Handle ALB forwarded headers
    const normalizedOrigin = origin.toLowerCase();
    const normalizedAllowed = allowedOrigins.map(o => o.toLowerCase());

    // Allow localhost for development
    if (normalizedOrigin.includes('localhost') || normalizedOrigin.includes('127.0.0.1')) {
      return callback(null, true);
    }

    if (normalizedAllowed.includes(normalizedOrigin)) {
      return callback(null, true);
    } else {
      console.error(`Blocked by CORS: ${origin}`);
      return callback(new Error("Not allowed by CORS"));
    }
  },





  methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
  credentials: true,
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'Access-Control-Allow-Methods',
    'Access-Control-Allow-Origin',
    'X-Company-Code'
  ]
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));


 

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: 'Internal Server Error' });
});

app.use(express.json());

// CRITICAL: Serve static files BEFORE any authentication middleware to prevent 401 errors
app.use('/uploads', (req, res, next) => {
  // Always allow cross-origin for static files (prevents CORB)
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  res.header('Cross-Origin-Resource-Policy', 'cross-origin');
  res.header('Cross-Origin-Embedder-Policy', 'unsafe-none');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  // Set proper content types and cache headers for images
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
  setHeaders: function (res, path, stat) {
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Cross-Origin-Resource-Policy', 'cross-origin');
  }
}));

// Ensure uploads directory exists
const uploadsDir = path.join(process.cwd(), 'uploads', 'contracts');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log('Created uploads/contracts directory');
}


app.use('/api/users', userRoutes);

// IMPORTANT: Do NOT apply authentication middleware globally here
// Instead, apply it within each route file for protected routes only

// Public routes - no authentication required
app.use("/api/auth", authRouter);
app.use("/api/companies", companyRoutes); // Company routes handle their own authentication

// Protected routes - these routes should handle their own authentication
app.use("/api/employees", employeesRouter);
app.use("/api/profiles", profileRouter);
// app.use("/api/contracts", contractRouter);
app.use(candidateRoutes);
app.use(surveyRoutes);
app.use('/api/applicantProfiles', applicantProfileRoutes);
app.use('/api/interviews', interviewRoutes);
app.use(skillZoneRoutes);
app.use('/api/employees',employeeRoutes);
app.use('/api/onboarding', onboardingRoutes);
// app.use('/api/assets', assetRoutes);
app.use('/api/dashboard', assetDashboardRoutes);
app.use('/api/asset-batches', assetBatchRoutes);
// app.use('/api/assethistory', assetHistoryRoutes);
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
app.use('/api/feedback', Feedback);
app.use('/api/offboarding', offboardingRoutes);
app.use('/api/resignations', resignationRoutes);
app.use('/api/payroll', payrollRoutes);

// Harish
app.use('/api/attendance', attendanceRoutes);
app.use('/api', documentRoutes);
app.use('/api', policyRoutes);
// app.use('/api', organizationRoutes);
app.use('/api/organization', organizationRoutes);
// app.use('/api/disciplinary-actions', disciplinaryActionRoutes);
app.use('/api/disciplinary-actions', disciplinaryActionRoutes)
app.use('/api/time-off-requests', timeOffRequestRoutes);
app.use('/api/rotating-shift', rotatingShiftRoutes);
app.use('/api/rotating-worktype', rotatingWorktypeRoutes);
app.use('/api/leave-requests', myLeaveRequestRoutes);
app.use('/api/leave-requests', leaveRequestRoutes);
app.use('/api/s3', s3Routes);
// app.use('/api/documents', documentRoute);

// User management routes
app.use('/api/roles', roleRoutes);
app.use('/api/invitations', invitationRoutes);

// After creating the io instance
app.set('io', io);

app.use('/api/roles', roleRoutes);
// app.use('/api/test', authTestRoutes);

const PORT = process.env.PORT || 5002;

server.listen(PORT, '0.0.0.0', () => {
  console.log(`✨ Server running on port ${PORT}`.yellow.bold);
});
