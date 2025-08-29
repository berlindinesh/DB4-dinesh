import { jest } from '@jest/globals';

// Create a safe error helper function
const createTestError = (message) => ({
  message,
  toString: () => message
});

// Mock all external dependencies
const mockSave = jest.fn();
const mockSort = jest.fn();
const mockSelect = jest.fn();
const mockFind = jest.fn();
const mockFindOne = jest.fn();
const mockFindById = jest.fn();
const mockFindByIdAndUpdate = jest.fn();
const mockFindByIdAndDelete = jest.fn();
const mockCountDocuments = jest.fn();

// Create mock user model
const mockUserModel = {
  find: mockFind,
  findOne: mockFindOne,
  findById: mockFindById,
  findByIdAndUpdate: mockFindByIdAndUpdate,
  findByIdAndDelete: mockFindByIdAndDelete,
  countDocuments: mockCountDocuments
};

// Mock user instance
const createMockUser = (overrides = {}) => ({
  _id: 'user123',
  email: 'test@example.com',
  name: 'Test User',
  firstName: 'Test',
  middleName: '',
  lastName: 'User',
  role: 'employee',
  permissions: [],
  isActive: true,
  isFirstLogin: false,
  invitationId: null,
  assignPermissions: jest.fn(),
  save: mockSave,
  lastModified: new Date(),
  $skipMiddleware: false,
  ...overrides
});

// Mock bcrypt
const mockBcrypt = {
  hash: jest.fn()
};

// Mock Invitation model
const mockInvitation = {
  findByIdAndUpdate: jest.fn()
};

// Mock getUserModel
const mockGetUserModel = jest.fn();

// Mock modules
jest.unstable_mockModule('../models/User.js', () => ({
  getUserModel: mockGetUserModel
}));

jest.unstable_mockModule('../models/Invitation.js', () => ({
  default: mockInvitation
}));

jest.unstable_mockModule('bcryptjs', () => ({
  default: mockBcrypt
}));

// Import the controller functions after mocking
const {
  getUsers,
  getUser,
  updateUserRole,
  updateUserStatus,
  updateUserProfile,
  deleteUser,
  resetUserPassword
} = await import('../controllers/userController.js');

describe('User Controller', () => {
  let req, res, consoleSpy, consoleErrorSpy;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Setup model mock
    mockGetUserModel.mockResolvedValue(mockUserModel);

    // Mock req and res
    req = {
      companyCode: 'TEST_COMPANY',
      params: {},
      query: {},
      body: {},
      user: { role: 'admin' }
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    // Suppress console output
    consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleSpy?.mockRestore();
    consoleErrorSpy?.mockRestore();
  });

  describe('getUsers', () => {
    test('should successfully fetch all users', async () => {
      const mockUsers = [
        { _id: '1', email: 'user1@test.com', name: 'User 1' },
        { _id: '2', email: 'user2@test.com', name: 'User 2' }
      ];
      
      // Mock the complete chain: find().select().sort()
      const mockSortChain = jest.fn().mockResolvedValue(mockUsers);
      const mockSelectChain = jest.fn().mockReturnValue({ sort: mockSortChain });
      const mockFindChain = jest.fn().mockReturnValue({ select: mockSelectChain });
      
      mockFind.mockImplementation(mockFindChain);

      await getUsers(req, res);

      expect(mockFind).toHaveBeenCalledWith({
        $or: [
          { isFirstLogin: false },
          { isActive: true, isFirstLogin: true }
        ]
      });
      expect(mockSelectChain).toHaveBeenCalledWith('-password');
      expect(mockSortChain).toHaveBeenCalledWith({ createdAt: -1 });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockUsers);
    });

    test('should handle errors', async () => {
      const testError = createTestError('Database error');
      const mockSortChain = jest.fn().mockRejectedValue(testError);
      const mockSelectChain = jest.fn().mockReturnValue({ sort: mockSortChain });
      const mockFindChain = jest.fn().mockReturnValue({ select: mockSelectChain });
      
      mockFind.mockImplementation(mockFindChain);

      await getUsers(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: 'Database error' });
    });
  });

  describe('getUser', () => {
    test('should successfully fetch a single user', async () => {
      req.params.userId = 'user123';
      const mockUser = { _id: 'user123', email: 'test@example.com', name: 'Test User' };
      
      // Mock the chain: findById().select()
      const mockSelectResult = jest.fn().mockResolvedValue(mockUser);
      const mockFindByIdChain = jest.fn().mockReturnValue({ select: mockSelectResult });
      
      mockFindById.mockImplementation(mockFindByIdChain);

      await getUser(req, res);

      expect(mockFindById).toHaveBeenCalledWith('user123');
      expect(mockSelectResult).toHaveBeenCalledWith('-password');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockUser);
    });

    test('should return 404 when user not found', async () => {
      req.params.userId = 'nonexistent';
      const mockSelectResult = jest.fn().mockResolvedValue(null);
      const mockFindByIdChain = jest.fn().mockReturnValue({ select: mockSelectResult });
      
      mockFindById.mockImplementation(mockFindByIdChain);

      await getUser(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: 'User not found' });
    });

    test('should handle errors', async () => {
      req.params.userId = 'user123';
      const testError = createTestError('Database error');
      const mockSelectResult = jest.fn().mockRejectedValue(testError);
      const mockFindByIdChain = jest.fn().mockReturnValue({ select: mockSelectResult });
      
      mockFindById.mockImplementation(mockFindByIdChain);

      await getUser(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('updateUserRole', () => {
    test('should successfully update user role', async () => {
      req.params.userId = 'user123';
      req.body = { role: 'admin' };
      const mockUser = createMockUser({ role: 'employee' });
      mockFindById.mockResolvedValue(mockUser);

      await updateUserRole(req, res);

      expect(mockFindById).toHaveBeenCalledWith('user123');
      expect(mockUser.assignPermissions).toHaveBeenCalled();
      expect(mockSave).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        message: 'User role updated successfully'
      }));
    });

    test('should return 400 for invalid role', async () => {
      req.params.userId = 'user123';
      req.body = { role: 'invalid' };

      await updateUserRole(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'Valid role is required' });
    });

    test('should return 404 when user not found', async () => {
      req.params.userId = 'nonexistent';
      req.body = { role: 'admin' };
      mockFindById.mockResolvedValue(null);

      await updateUserRole(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: 'User not found' });
    });
  });

  describe('updateUserStatus', () => {
    test('should successfully activate user', async () => {
      req.params.userId = 'user123';
      req.body = { isActive: true };
      const mockUser = createMockUser({ isActive: false });
      mockFindById.mockResolvedValue(mockUser);

      await updateUserStatus(req, res);

      expect(mockSave).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
    });

    test('should prevent deactivating last admin', async () => {
      req.params.userId = 'user123';
      req.body = { isActive: false };
      const mockUser = createMockUser({ role: 'admin', isActive: true });
      mockFindById.mockResolvedValue(mockUser);
      mockCountDocuments.mockResolvedValue(0);

      await updateUserStatus(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Cannot deactivate the last admin user'
      });
    });

    test('should return 400 for invalid isActive value', async () => {
      req.params.userId = 'user123';
      req.body = { isActive: 'invalid' };

      await updateUserStatus(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: 'isActive must be a boolean value'
      });
    });
  });

  describe('updateUserProfile', () => {
    test('should successfully update user profile', async () => {
      req.params.userId = 'user123';
      req.body = {
        firstName: 'John',
        middleName: 'M',
        lastName: 'Doe',
        email: 'john.doe@example.com'
      };
      const mockUser = createMockUser();
      mockFindById.mockResolvedValue(mockUser);
      mockFindOne.mockResolvedValue(null);

      await updateUserProfile(req, res);

      expect(mockSave).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
    });

    test('should return 400 for missing required fields', async () => {
      req.params.userId = 'user123';
      req.body = { firstName: 'John' };

      await updateUserProfile(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: 'First name, last name, and email are required'
      });
    });

    test('should return 400 when email is already taken', async () => {
      req.params.userId = 'user123';
      req.body = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'existing@example.com'
      };
      const mockUser = createMockUser({ email: 'test@example.com' });
      mockFindById.mockResolvedValue(mockUser);
      mockFindOne.mockResolvedValue({ email: 'existing@example.com' });

      await updateUserProfile(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe('deleteUser', () => {
    test('should successfully delete non-admin user', async () => {
      req.params.userId = 'user123';
      const mockUser = createMockUser({ role: 'employee' });
      mockFindById.mockResolvedValue(mockUser);
      mockFindByIdAndDelete.mockResolvedValue(mockUser);

      await deleteUser(req, res);

      expect(mockFindByIdAndDelete).toHaveBeenCalledWith('user123');
      expect(res.status).toHaveBeenCalledWith(200);
    });

    test('should prevent deleting last admin', async () => {
      req.params.userId = 'user123';
      const mockUser = createMockUser({ role: 'admin' });
      mockFindById.mockResolvedValue(mockUser);
      mockCountDocuments.mockResolvedValue(0);

      await deleteUser(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe('resetUserPassword', () => {
    test('should successfully reset user password', async () => {
      req.params.userId = 'user123';
      const mockUser = createMockUser();
      mockFindById.mockResolvedValue(mockUser);
      mockBcrypt.hash.mockResolvedValue('hashedTempPassword');

      await resetUserPassword(req, res);

      expect(mockBcrypt.hash).toHaveBeenCalledWith(expect.any(String), 10);
      expect(mockSave).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
    });

    test('should return 404 when user not found', async () => {
      req.params.userId = 'nonexistent';
      mockFindById.mockResolvedValue(null);

      await resetUserPassword(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });
});
