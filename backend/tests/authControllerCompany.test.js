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

// --- Import the SUT AFTER mocks are defined ---
const {
  validateCompanyStatus,
  authenticateCompanyUser,
  handleFirstLogin
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
});
