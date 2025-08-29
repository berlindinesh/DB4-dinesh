import { jest } from '@jest/globals';

// Create a safe error helper function
const createTestError = (message) => ({
  message,
  toString: () => message
});

// Mock all external dependencies
const mockFindById = jest.fn();
const mockFindByIdAndUpdate = jest.fn();
const mockFind = jest.fn();

// Mock Profile model
const mockProfile = {
  findById: mockFindById,
  findByIdAndUpdate: mockFindByIdAndUpdate,
  find: mockFind
};

// Mock profile instance
const createMockProfile = (overrides = {}) => ({
  _id: 'profile123',
  name: 'John Doe',
  email: 'john@example.com',
  phone: '+1234567890',
  address: '123 Main St',
  dateOfBirth: new Date('1990-01-01'),
  ...overrides
});

// Mock modules
jest.unstable_mockModule('../models/profileModels.js', () => ({
  default: mockProfile
}));

jest.unstable_mockModule('bcryptjs', () => ({
  default: {
    hash: jest.fn(),
    compare: jest.fn()
  }
}));

jest.unstable_mockModule('jsonwebtoken', () => ({
  default: {
    sign: jest.fn(),
    verify: jest.fn()
  }
}));

// Import the controller functions after mocking
const {
  getUserProfile,
  updateUserProfile,
  getAllProfiles
} = await import('../controllers/profileController.js');

describe('Profile Controller', () => {
  let req, res;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Default resolved values
    mockFindById.mockResolvedValue(null);
    mockFindByIdAndUpdate.mockResolvedValue(null);
    mockFind.mockResolvedValue([]);

    // Mock req and res
    req = {
      params: {},
      body: {}
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
  });

  describe('getUserProfile', () => {
    test('should return 404 when profile not found', async () => {
      req.params.id = 'nonexistent';
      mockFindById.mockResolvedValue(null);

      await getUserProfile(req, res);

      expect(mockFindById).toHaveBeenCalledWith('nonexistent');
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ msg: 'Profile not found' });
    });

    test('should return profile when found', async () => {
      req.params.id = 'profile123';
      const mockProfileData = createMockProfile();
      mockFindById.mockResolvedValue(mockProfileData);

      await getUserProfile(req, res);

      expect(mockFindById).toHaveBeenCalledWith('profile123');
      expect(res.json).toHaveBeenCalledWith(mockProfileData);
      expect(res.status).not.toHaveBeenCalled();
    });

    test('should handle database errors', async () => {
      req.params.id = 'profile123';
      const testError = createTestError('Database connection failed');
      mockFindById.mockRejectedValue(testError);

      await getUserProfile(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Database connection failed'
      });
    });

    test('should handle invalid ObjectId format', async () => {
      req.params.id = 'invalid-id';
      const castError = createTestError('Cast to ObjectId failed');
      castError.name = 'CastError';
      mockFindById.mockRejectedValue(castError);

      await getUserProfile(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Cast to ObjectId failed'
      });
    });
  });

  describe('updateUserProfile', () => {
    test('should successfully update profile', async () => {
      req.params.id = 'profile123';
      req.body = {
        name: 'Jane Doe',
        email: 'jane@example.com',
        phone: '+9876543210'
      };
      const updatedProfile = createMockProfile({
        name: 'Jane Doe',
        email: 'jane@example.com',
        phone: '+9876543210'
      });
      mockFindByIdAndUpdate.mockResolvedValue(updatedProfile);

      await updateUserProfile(req, res);

      expect(mockFindByIdAndUpdate).toHaveBeenCalledWith(
        'profile123',
        req.body,
        { new: true }
      );
      expect(res.json).toHaveBeenCalledWith(updatedProfile);
      expect(res.status).not.toHaveBeenCalled();
    });

    test('should update partial profile data', async () => {
      req.params.id = 'profile123';
      req.body = { name: 'Updated Name' };
      const updatedProfile = createMockProfile({ name: 'Updated Name' });
      mockFindByIdAndUpdate.mockResolvedValue(updatedProfile);

      await updateUserProfile(req, res);

      expect(mockFindByIdAndUpdate).toHaveBeenCalledWith(
        'profile123',
        { name: 'Updated Name' },
        { new: true }
      );
      expect(res.json).toHaveBeenCalledWith(updatedProfile);
    });

    test('should handle database errors during update', async () => {
      req.params.id = 'profile123';
      req.body = { name: 'Updated Name' };
      const testError = createTestError('Update failed');
      mockFindByIdAndUpdate.mockRejectedValue(testError);

      await updateUserProfile(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Update failed'
      });
    });

    test('should handle validation errors', async () => {
      req.params.id = 'profile123';
      req.body = { email: 'invalid-email' };
      const validationError = createTestError('Validation failed');
      validationError.name = 'ValidationError';
      mockFindByIdAndUpdate.mockRejectedValue(validationError);

      await updateUserProfile(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Validation failed'
      });
    });

    test('should handle empty update body', async () => {
      req.params.id = 'profile123';
      req.body = {};
      const existingProfile = createMockProfile();
      mockFindByIdAndUpdate.mockResolvedValue(existingProfile);

      await updateUserProfile(req, res);

      expect(mockFindByIdAndUpdate).toHaveBeenCalledWith(
        'profile123',
        {},
        { new: true }
      );
      expect(res.json).toHaveBeenCalledWith(existingProfile);
    });
  });

  describe('getAllProfiles', () => {
    test('should return all profiles', async () => {
      const mockProfiles = [
        createMockProfile({ _id: 'profile1', name: 'John Doe' }),
        createMockProfile({ _id: 'profile2', name: 'Jane Smith' }),
        createMockProfile({ _id: 'profile3', name: 'Bob Johnson' })
      ];
      mockFind.mockResolvedValue(mockProfiles);

      await getAllProfiles(req, res);

      expect(mockFind).toHaveBeenCalledWith();
      expect(res.json).toHaveBeenCalledWith(mockProfiles);
      expect(res.status).not.toHaveBeenCalled();
    });

    test('should return empty array when no profiles exist', async () => {
      mockFind.mockResolvedValue([]);

      await getAllProfiles(req, res);

      expect(mockFind).toHaveBeenCalledWith();
      expect(res.json).toHaveBeenCalledWith([]);
    });

    test('should handle database errors when fetching all profiles', async () => {
      const testError = createTestError('Database query failed');
      mockFind.mockRejectedValue(testError);

      await getAllProfiles(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Database query failed'
      });
    });

    test('should handle connection timeout errors', async () => {
      const timeoutError = createTestError('Connection timeout');
      timeoutError.code = 'ETIMEDOUT';
      mockFind.mockRejectedValue(timeoutError);

      await getAllProfiles(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Connection timeout'
      });
    });
  });

  describe('Edge cases and error handling', () => {
    test('should handle null profile id gracefully', async () => {
      req.params.id = null;
      const testError = createTestError('Cast to ObjectId failed');
      mockFindById.mockRejectedValue(testError);

      await getUserProfile(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });

    test('should handle undefined profile id gracefully', async () => {
      req.params.id = undefined;
      const testError = createTestError('Cast to ObjectId failed');
      mockFindById.mockRejectedValue(testError);

      await getUserProfile(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });

    test('should handle large profile data', async () => {
      req.params.id = 'profile123';
      req.body = {
        name: 'A'.repeat(1000), // Very long name
        description: 'B'.repeat(5000) // Very long description
      };
      const updatedProfile = createMockProfile(req.body);
      mockFindByIdAndUpdate.mockResolvedValue(updatedProfile);

      await updateUserProfile(req, res);

      expect(res.json).toHaveBeenCalledWith(updatedProfile);
    });

    test('should handle special characters in profile data', async () => {
      req.params.id = 'profile123';
      req.body = {
        name: 'José María García-Pérez',
        email: 'josé@example.com',
        address: '123 Müller Straße, Berlin'
      };
      const updatedProfile = createMockProfile(req.body);
      mockFindByIdAndUpdate.mockResolvedValue(updatedProfile);

      await updateUserProfile(req, res);

      expect(res.json).toHaveBeenCalledWith(updatedProfile);
    });
  });
});
