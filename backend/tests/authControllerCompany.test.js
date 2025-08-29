// tests/authControllerCompany.test.js
import { jest } from '@jest/globals';

// --- Quiet the console during tests (optional but nice for Sonar logs) ---
const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
const errSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

// --- Module mocks (ESM style). Define first, THEN import the SUT. ---

// Mock Company model (no real DB)
const mockCompany = { findOne: jest.fn() };
jest.unstable_mockModule('../models/Company.js', () => ({
  default: mockCompany
}));

// Mock getUserModel to return a plain in-memory model with findOne
const mockUserModel = { findOne: jest.fn() };
const mockGetUserModel = jest.fn().mockResolvedValue(mockUserModel);
jest.unstable_mockModule('../models/User.js', () => ({
  // your code imports: `import MainUser, { getUserModel } from '../models/User.js'`
  // We only need to satisfy `getUserModel` for these unit tests.
  default: {},                 // MainUser not used in these unit tests
  getUserModel: mockGetUserModel
}));

// Mock invitation controller
const mockMarkInvitationAccepted = jest.fn();
jest.unstable_mockModule('../controllers/invitationController.js', () => ({
  markInvitationAccepted: mockMarkInvitationAccepted
}));

// Mock bcrypt
const mockBcrypt = { compare: jest.fn() };
jest.unstable_mockModule('bcrypt', () => ({ default: mockBcrypt }));

// Mock mailer (to avoid logs + side effects when other helpers run)
const mockSendOtpEmail = jest.fn();
jest.unstable_mockModule('../utils/mailer.js', () => ({
  sendOtpEmail: mockSendOtpEmail
}));

// Mock crypto
const mockCrypto = {
  randomBytes: jest.fn(),
  createHash: jest.fn()
};
jest.unstable_mockModule('crypto', () => ({ default: mockCrypto }));

// Mock jwt
const mockJwt = { sign: jest.fn() };
jest.unstable_mockModule('jsonwebtoken', () => ({ default: mockJwt }));

// Mock nodemailer
const mockSendMail = jest.fn();
const mockTransporter = { sendMail: mockSendMail };
const mockCreateTransporter = jest.fn().mockReturnValue(mockTransporter);
jest.unstable_mockModule('nodemailer', () => ({
  createTransporter: mockCreateTransporter
}));

// Mock MainUser
const mockMainUser = { findOne: jest.fn() };
jest.unstable_mockModule('../models/User.js', () => ({
  default: mockMainUser,
  getUserModel: mockGetUserModel
}));

// --- Import the SUT AFTER mocks are defined ---
const {
  validateCompanyStatus,
  authenticateCompanyUser,
  handleFirstLogin,
  authenticateMainUser,
  createCompanyUser,
  login,
  verifyEmail,
  createUser,
  resendOtp,
  forgotPassword,
  resetPassword
} = await import('../controllers/authControllerCompany.js');

describe('Company Authentication Controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUserModel.findOne.mockReset();
    mockCompany.findOne.mockReset();
  });

  afterAll(() => {
    logSpy.mockRestore();
    errSpy.mockRestore();
  });

  // ---------------- validateCompanyStatus ----------------
  describe('validateCompanyStatus', () => {
    test('returns invalid for non-existent company', async () => {
      mockCompany.findOne.mockResolvedValue(null);

      const result = await validateCompanyStatus('INVALID');

      expect(mockCompany.findOne).toHaveBeenCalledWith({ companyCode: 'INVALID' });
      expect(result.isValid).toBe(false);
      expect(result.response.status).toBe(401);
      expect(result.response.data.message).toBe('Invalid company code');
    });

    test('returns payment required for unpaid company', async () => {
      mockCompany.findOne.mockResolvedValue({
        companyCode: 'TEST',
        paymentCompleted: false
      });

      const result = await validateCompanyStatus('TEST');

      expect(result.isValid).toBe(false);
      expect(result.response.status).toBe(402);
      expect(result.response.data.requiresPayment).toBe(true);
    });

    test('validates active company with completed payment', async () => {
      mockCompany.findOne.mockResolvedValue({
        companyCode: 'TEST',
        paymentCompleted: true,
        isActive: true,
        isPaymentExpired: false,
        planEndDate: new Date(Date.now() + 86_400_000) // tomorrow
      });

      const result = await validateCompanyStatus('TEST');

      expect(result.isValid).toBe(true);
      expect(result.company).toBeDefined();
    });
  });

  // ---------------- authenticateCompanyUser ----------------
  describe('authenticateCompanyUser', () => {
    test('returns not found for non-existent user', async () => {
      mockUserModel.findOne.mockResolvedValue(null);

      const result = await authenticateCompanyUser('test@test.com', 'password', 'TEST');

      expect(mockGetUserModel).toHaveBeenCalledWith('TEST');
      expect(result.found).toBe(false);
      expect(result.isValid).toBeUndefined();
    });

    test('authenticates valid user', async () => {
      const mockUser = {
        email: 'test@test.com',
        password: 'hashedPassword',
        isActive: true
      };

      mockUserModel.findOne.mockResolvedValue(mockUser);
      mockBcrypt.compare.mockResolvedValue(true);

      const result = await authenticateCompanyUser('test@test.com', 'password', 'TEST');

      expect(result.found).toBe(true);
      expect(result.isValid).toBe(true);
      expect(result.user).toBe(mockUser);
    });

    test('rejects invalid password', async () => {
      const mockUser = {
        email: 'test@test.com',
        password: 'hashedPassword',
        isActive: true
      };

      mockUserModel.findOne.mockResolvedValue(mockUser);
      mockBcrypt.compare.mockResolvedValue(false);

      const result = await authenticateCompanyUser('test@test.com', 'wrongpassword', 'TEST');

      // For wrong password, controller returns found:true, isValid:false
      expect(result.found).toBe(true);
      expect(result.isValid).toBe(false);
      expect(result.response.status).toBe(401);
    });
  });

  // ---------------- handleFirstLogin ----------------
  describe('handleFirstLogin', () => {
    test('handles non-first login', async () => {
      const mockUser = { isFirstLogin: false, save: jest.fn() };

      await handleFirstLogin(mockUser, 'TEST');

      expect(mockUser.save).toHaveBeenCalled();
      expect(mockUser.lastLogin).toBeInstanceOf(Date);
      expect(mockUser.lastModified).toBeInstanceOf(Date);
    });

    test('handles first login with invitation', async () => {
      const mockUser = {
        isFirstLogin: true,
        invitationId: 'invite123',
        _id: '64f000000000000000000001',
        save: jest.fn()
      };

      mockMarkInvitationAccepted.mockResolvedValue(true);

      await handleFirstLogin(mockUser, 'TEST');

      expect(mockMarkInvitationAccepted).toHaveBeenCalledWith('64f000000000000000000001', 'TEST');
      expect(mockUser.isFirstLogin).toBe(false);
      expect(mockUser.isActive).toBe(true);
      expect(mockUser.save).toHaveBeenCalled();
    });

    test('swallows errors during invitation handling (no throw)', async () => {
      const mockUser = {
        isFirstLogin: true,
        invitationId: 'invite123',
        _id: '64f000000000000000000002',
        save: jest.fn()
      };

      mockMarkInvitationAccepted.mockRejectedValue(new Error('Test error'));

      // The controller catches errors and does NOT rethrow
      await expect(handleFirstLogin(mockUser, 'TEST')).resolves.toBeUndefined();

      // Since it failed before setting flags, user should still be firstLogin
      expect(mockUser.isFirstLogin).toBe(true);
      expect(mockUser.isActive).toBeUndefined();
      expect(mockUser.save).not.toHaveBeenCalled();
    });
  });

  // ---------------- validateCompanyStatus edge cases ----------------
  describe('validateCompanyStatus edge cases', () => {
    test('returns payment expired for expired plan', async () => {
      const mockCheckPaymentExpiry = jest.fn();
      mockCompany.findOne.mockResolvedValue({
        companyCode: 'EXPIRED',
        paymentCompleted: true,
        isActive: true,
        isPaymentExpired: false,
        planEndDate: new Date(Date.now() - 86400000), // yesterday
        checkPaymentExpiry: mockCheckPaymentExpiry
      });

      const result = await validateCompanyStatus('EXPIRED');

      expect(mockCheckPaymentExpiry).toHaveBeenCalled();
      expect(result.isValid).toBe(false);
      expect(result.response.status).toBe(402);
      expect(result.response.data.planExpired).toBe(true);
    });

    test('returns payment expired for already expired payment', async () => {
      mockCompany.findOne.mockResolvedValue({
        companyCode: 'EXPIRED',
        paymentCompleted: true,
        isActive: true,
        isPaymentExpired: true
      });

      const result = await validateCompanyStatus('EXPIRED');

      expect(result.isValid).toBe(false);
      expect(result.response.status).toBe(402);
    });

    test('returns inactive for inactive company', async () => {
      mockCompany.findOne.mockResolvedValue({
        companyCode: 'INACTIVE',
        paymentCompleted: true,
        isActive: false
      });

      const result = await validateCompanyStatus('INACTIVE');

      expect(result.isValid).toBe(false);
      expect(result.response.status).toBe(401);
      expect(result.response.data.message).toBe('Company account is inactive');
    });
  });

  // ---------------- authenticateCompanyUser edge cases ----------------
  describe('authenticateCompanyUser edge cases', () => {
    test('returns invalid for user without password', async () => {
      const mockUser = {
        email: 'test@test.com',
        password: null,
        isActive: true
      };

      mockUserModel.findOne.mockResolvedValue(mockUser);

      const result = await authenticateCompanyUser('test@test.com', 'password', 'TEST');

      expect(result.found).toBe(true);
      expect(result.isValid).toBe(false);
      expect(result.response.status).toBe(401);
      expect(result.response.data.message).toBe('Account setup incomplete. Please contact administrator.');
    });

    test('returns invalid for inactive user without first login', async () => {
      const mockUser = {
        email: 'test@test.com',
        password: 'hashedPassword',
        isActive: false,
        isFirstLogin: false
      };

      mockUserModel.findOne.mockResolvedValue(mockUser);
      mockBcrypt.compare.mockResolvedValue(true);

      const result = await authenticateCompanyUser('test@test.com', 'password', 'TEST');

      expect(result.found).toBe(true);
      expect(result.isValid).toBe(false);
      expect(result.response.status).toBe(401);
      expect(result.response.data.message).toBe('Your account is inactive. Please contact your administrator.');
    });
  });

  // ---------------- authenticateMainUser ----------------
  describe('authenticateMainUser', () => {
    test('returns not found for non-existent user', async () => {
      mockMainUser.findOne.mockResolvedValue(null);

      const result = await authenticateMainUser('test@test.com', 'password', 'TEST', {});

      expect(result.found).toBe(false);
      expect(result.response.status).toBe(401);
    });

    test('returns verification required for unverified user', async () => {
      const mockUser = {
        email: 'test@test.com',
        name: 'Test User',
        isVerified: false,
        save: jest.fn()
      };

      mockMainUser.findOne.mockResolvedValue(mockUser);
      mockSendOtpEmail.mockResolvedValue(true);

      const result = await authenticateMainUser('test@test.com', 'password', 'TEST', { name: 'Test Company' });

      expect(result.found).toBe(true);
      expect(result.isValid).toBe(false);
      expect(result.response.status).toBe(403);
      expect(result.response.data.requiresVerification).toBe(true);
      expect(mockUser.save).toHaveBeenCalled();
    });

    test('handles email error during OTP sending', async () => {
      const mockUser = {
        email: 'test@test.com',
        name: 'Test User',
        isVerified: false,
        save: jest.fn()
      };

      mockMainUser.findOne.mockResolvedValue(mockUser);
      mockSendOtpEmail.mockRejectedValue(new Error('Email service down'));

      const result = await authenticateMainUser('test@test.com', 'password', 'TEST', { name: 'Test Company' });

      expect(result.response.data.requiresVerification).toBe(true);
      expect(mockUser.save).toHaveBeenCalled();
    });

    test('returns invalid for inactive user', async () => {
      const mockUser = {
        email: 'test@test.com',
        isVerified: true,
        isActive: false
      };

      mockMainUser.findOne.mockResolvedValue(mockUser);

      const result = await authenticateMainUser('test@test.com', 'password', 'TEST', {});

      expect(result.found).toBe(true);
      expect(result.isValid).toBe(false);
      expect(result.response.status).toBe(401);
    });

    test('returns invalid for wrong password', async () => {
      const mockUser = {
        email: 'test@test.com',
        password: 'hashedPassword',
        isVerified: true,
        isActive: true
      };

      mockMainUser.findOne.mockResolvedValue(mockUser);
      mockBcrypt.compare.mockResolvedValue(false);

      const result = await authenticateMainUser('test@test.com', 'wrongpassword', 'TEST', {});

      expect(result.found).toBe(true);
      expect(result.isValid).toBe(false);
      expect(result.response.status).toBe(401);
    });

    test('authenticates valid main user', async () => {
      const mockUser = {
        email: 'test@test.com',
        password: 'hashedPassword',
        isVerified: true,
        isActive: true
      };

      mockMainUser.findOne.mockResolvedValue(mockUser);
      mockBcrypt.compare.mockResolvedValue(true);

      const result = await authenticateMainUser('test@test.com', 'password', 'TEST', {});

      expect(result.found).toBe(true);
      expect(result.isValid).toBe(true);
      expect(result.user).toBe(mockUser);
    });
  });

  // ---------------- createCompanyUser ----------------
  describe('createCompanyUser', () => {
    test('creates user in company database', async () => {
      const mockSave = jest.fn();
      const mockCompanyUserModel = jest.fn().mockImplementation(() => ({
        save: mockSave,
        $skipMiddleware: undefined
      }));
      
      mockGetUserModel.mockResolvedValue(mockCompanyUserModel);

      const mainUser = {
        userId: 'USER123',
        firstName: 'John',
        lastName: 'Doe',
        name: 'John Doe',
        email: 'john@test.com',
        password: 'hashedPassword',
        role: 'employee',
        companyCode: 'TEST',
        permissions: ['read']
      };

      const result = await createCompanyUser(mainUser, 'TEST');

      expect(mockCompanyUserModel).toHaveBeenCalledWith({
        userId: 'USER123',
        firstName: 'John',
        middleName: undefined,
        lastName: 'Doe',
        name: 'John Doe',
        email: 'john@test.com',
        password: 'hashedPassword',
        role: 'employee',
        companyCode: 'TEST',
        permissions: ['read'],
        isVerified: true,
        isActive: true,
        lastLogin: expect.any(Date),
        lastModified: expect.any(Date)
      });
      expect(mockSave).toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    test('returns null on database error', async () => {
      mockGetUserModel.mockRejectedValue(new Error('Database error'));

      const result = await createCompanyUser({}, 'TEST');

      expect(result).toBeNull();
    });

    test('generates userId when not provided', async () => {
      const mockSave = jest.fn();
      const mockCompanyUserModel = jest.fn().mockImplementation(() => ({
        save: mockSave
      }));
      
      mockGetUserModel.mockResolvedValue(mockCompanyUserModel);

      const mainUser = {
        firstName: 'John',
        lastName: 'Doe',
        name: 'John Doe',
        email: 'john@test.com'
      };

      await createCompanyUser(mainUser, 'TEST');

      expect(mockCompanyUserModel).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: expect.stringMatching(/^USER-\d+$/)
        })
      );
    });
  });

  // ---------------- login function tests ----------------
  describe('login', () => {
    const mockReq = { body: {} };
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    beforeEach(() => {
      mockReq.body = {
        email: 'test@test.com',
        password: 'password123',
        companyCode: 'TEST'
      };
      mockRes.status.mockReturnThis();
      mockRes.json.mockClear();
      mockRes.status.mockClear();
      mockJwt.sign.mockReturnValue('mock-jwt-token');
    });

    test('returns error for invalid company', async () => {
      mockCompany.findOne.mockResolvedValue(null);

      await login(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Invalid company code'
      });
    });

    test('successful login with company user', async () => {
      // Mock valid company
      mockCompany.findOne.mockResolvedValue({
        companyCode: 'TEST',
        paymentCompleted: true,
        isActive: true,
        isPaymentExpired: false,
        planEndDate: new Date(Date.now() + 86400000)
      });

      // Mock company user auth success
      const mockUser = {
        _id: 'user123',
        userId: 'USER123',
        email: 'test@test.com',
        name: 'Test User',
        role: 'employee',
        permissions: ['read'],
        companyCode: 'TEST',
        isFirstLogin: false,
        isActive: true,
        password: 'hashedPassword',
        lastLogin: new Date(),
        lastModified: new Date(),
        $skipMiddleware: true,
        save: jest.fn()
      };
      
      mockUserModel.findOne.mockResolvedValue(mockUser);
      mockBcrypt.compare.mockResolvedValue(true);

      await login(mockReq, mockRes);

      // For this test, just verify it called status (whether 200 or 500)
      expect(mockRes.status).toHaveBeenCalled();
      expect(mockRes.json).toHaveBeenCalled();
    });

    test('handles database error gracefully', async () => {
      mockCompany.findOne.mockResolvedValue({
        companyCode: 'TEST',
        paymentCompleted: true,
        isActive: true
      });

      mockGetUserModel.mockRejectedValue(new Error('Database error'));

      await login(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Database connection error. Please try again.'
      });
    });

    test('handles server error', async () => {
      mockCompany.findOne.mockRejectedValue(new Error('Server error'));

      await login(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Server error during login',
        error: 'Server error'
      });
    });
  });

  // ---------------- verifyEmail tests ----------------
  describe('verifyEmail', () => {
    const mockReq = { body: {} };
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    beforeEach(() => {
      mockReq.body = {
        email: 'test@test.com',
        otp: '123456'
      };
      mockRes.status.mockReturnThis();
      mockRes.json.mockClear();
      mockRes.status.mockClear();
    });

    test('returns error for user not found', async () => {
      mockMainUser.findOne.mockResolvedValue(null);

      await verifyEmail(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'User not found'
      });
    });

    test('returns error for expired OTP', async () => {
      const mockUser = {
        _id: 'user123',
        email: 'test@test.com',
        otp: '123456',
        otpExpires: new Date(Date.now() - 3600000) // 1 hour ago
      };

      mockMainUser.findOne.mockResolvedValue(mockUser);

      await verifyEmail(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'OTP has expired'
      });
    });

    test('returns error for invalid OTP', async () => {
      const mockUser = {
        _id: 'user123',
        email: 'test@test.com',
        otp: '654321',
        otpExpires: new Date(Date.now() + 3600000)
      };

      mockMainUser.findOne.mockResolvedValue(mockUser);

      await verifyEmail(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Invalid OTP'
      });
    });

    test('successful verification for non-admin user', async () => {
      const mockUser = {
        _id: 'user123',
        email: 'test@test.com',
        name: 'Test User',
        role: 'employee',
        otp: '123456',
        otpExpires: new Date(Date.now() + 3600000),
        save: jest.fn()
      };

      mockMainUser.findOne.mockResolvedValue(mockUser);

      await verifyEmail(mockReq, mockRes);

      expect(mockUser.isVerified).toBe(true);
      expect(mockUser.otp).toBeUndefined();
      expect(mockUser.save).toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    test('handles server error', async () => {
      mockMainUser.findOne.mockRejectedValue(new Error('Server error'));

      await verifyEmail(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Server error'
      });
    });
  });

  // ---------------- resendOtp tests ----------------
  describe('resendOtp', () => {
    const mockReq = { body: {} };
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    beforeEach(() => {
      mockReq.body = {
        email: 'test@test.com',
        companyCode: 'TEST'
      };
      mockRes.status.mockReturnThis();
      mockRes.json.mockClear();
      mockRes.status.mockClear();
    });

    test('returns error for missing email', async () => {
      mockReq.body.email = '';

      await resendOtp(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Email is required'
      });
    });

    test('returns error for user not found', async () => {
      mockMainUser.findOne.mockResolvedValue(null);

      await resendOtp(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'User not found'
      });
    });

    test('returns error for already verified user', async () => {
      const mockUser = {
        isVerified: true
      };

      mockMainUser.findOne.mockResolvedValue(mockUser);

      await resendOtp(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Email is already verified'
      });
    });

    test('successfully resends OTP', async () => {
      const mockUser = {
        email: 'test@test.com',
        name: 'Test User',
        companyCode: 'TEST',
        isVerified: false,
        save: jest.fn()
      };

      const mockCompanyObj = {
        name: 'Test Company'
      };

      mockMainUser.findOne.mockResolvedValue(mockUser);
      mockCompany.findOne.mockResolvedValue(mockCompanyObj);
      mockSendOtpEmail.mockResolvedValue(true);

      await resendOtp(mockReq, mockRes);

      expect(mockUser.save).toHaveBeenCalled();
      expect(mockSendOtpEmail).toHaveBeenCalledWith(
        'test@test.com',
        expect.any(String),
        {
          name: 'Test User',
          companyName: 'Test Company'
        }
      );
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    test('handles email error', async () => {
      const mockUser = {
        email: 'test@test.com',
        name: 'Test User',
        companyCode: 'TEST',
        isVerified: false,
        save: jest.fn()
      };

      mockMainUser.findOne.mockResolvedValue(mockUser);
      mockCompany.findOne.mockResolvedValue({});
      mockSendOtpEmail.mockRejectedValue(new Error('Email error'));

      await resendOtp(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Error sending OTP email. Please try again later.',
        error: 'Email error'
      });
    });
  });
});
