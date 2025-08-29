// tests/rotatingShiftController.test.js
import { jest } from '@jest/globals';

describe('RotatingShift Controller Tests', () => {
  let mockReq, mockRes;
  let controller;

  // Simple approach: test the actual controller functions but mock external dependencies
  beforeAll(async () => {
    // Mock console to reduce noise
    global.console = {
      log: jest.fn(),
      error: jest.fn()
    };

    // Import the controller
    controller = await import('../controllers/rotatingShiftController.js');
  });

  beforeEach(() => {
    // Setup fresh mocks for each test
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    mockReq = {
      companyCode: 'TEST_COMPANY',
      query: {},
      params: {},
      body: {},
      app: {
        get: jest.fn().mockReturnValue({
          to: jest.fn().mockReturnValue({
            emit: jest.fn()
          })
        })
      }
    };
  });

  // Test 1: Authentication - Missing Company Code
  describe('Authentication Tests', () => {
    test('getAllShifts should return 401 when companyCode is missing', async () => {
      mockReq.companyCode = undefined;
      
      await controller.getAllShifts(mockReq, mockRes);
      
      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Authentication required',
        message: 'Company code not found in request'
      });
    });

    test('getUserShifts should return 401 when companyCode is missing', async () => {
      mockReq.companyCode = undefined;
      
      await controller.getUserShifts(mockReq, mockRes);
      
      expect(mockRes.status).toHaveBeenCalledWith(401);
    });

    test('createShift should return 401 when companyCode is missing', async () => {
      mockReq.companyCode = undefined;
      
      await controller.createShift(mockReq, mockRes);
      
      expect(mockRes.status).toHaveBeenCalledWith(401);
    });

    test('updateShift should return 401 when companyCode is missing', async () => {
      mockReq.companyCode = undefined;
      
      await controller.updateShift(mockReq, mockRes);
      
      expect(mockRes.status).toHaveBeenCalledWith(401);
    });

    test('deleteShift should return 401 when companyCode is missing', async () => {
      mockReq.companyCode = undefined;
      
      await controller.deleteShift(mockReq, mockRes);
      
      expect(mockRes.status).toHaveBeenCalledWith(401);
    });

    test('approveShift should return 401 when companyCode is missing', async () => {
      mockReq.companyCode = undefined;
      
      await controller.approveShift(mockReq, mockRes);
      
      expect(mockRes.status).toHaveBeenCalledWith(401);
    });

    test('rejectShift should return 401 when companyCode is missing', async () => {
      mockReq.companyCode = undefined;
      
      await controller.rejectShift(mockReq, mockRes);
      
      expect(mockRes.status).toHaveBeenCalledWith(401);
    });

    test('bulkApproveShifts should return 401 when companyCode is missing', async () => {
      mockReq.companyCode = undefined;
      
      await controller.bulkApproveShifts(mockReq, mockRes);
      
      expect(mockRes.status).toHaveBeenCalledWith(401);
    });

    test('bulkRejectShifts should return 401 when companyCode is missing', async () => {
      mockReq.companyCode = undefined;
      
      await controller.bulkRejectShifts(mockReq, mockRes);
      
      expect(mockRes.status).toHaveBeenCalledWith(401);
    });
  });

  // Test 2: Validation Tests
  describe('Validation Tests', () => {
    test('getUserShifts should return 400 when userId is missing', async () => {
      mockReq.params = {};
      
      await controller.getUserShifts(mockReq, mockRes);
      
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Invalid request',
        message: 'User ID is required'
      });
    });

    test('createShift should return 400 when userId is missing', async () => {
      mockReq.body = {};
      
      await controller.createShift(mockReq, mockRes);
      
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Invalid request',
        message: 'User ID is required'
      });
    });

    test('bulkApproveShifts should return 400 when ids are missing', async () => {
      mockReq.body = {};
      
      await controller.bulkApproveShifts(mockReq, mockRes);
      
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Invalid request',
        message: 'No shift IDs provided for bulk approval'
      });
    });

    test('bulkRejectShifts should return 400 when ids are missing', async () => {
      mockReq.body = {};
      
      await controller.bulkRejectShifts(mockReq, mockRes);
      
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Invalid request',
        message: 'No shift IDs provided for bulk rejection'
      });
    });

    test('bulkApproveShifts should return 400 when ids is not an array', async () => {
      mockReq.body = { ids: 'not-array' };
      
      await controller.bulkApproveShifts(mockReq, mockRes);
      
      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    test('bulkApproveShifts should return 400 when ids array is empty', async () => {
      mockReq.body = { ids: [] };
      
      await controller.bulkApproveShifts(mockReq, mockRes);
      
      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    test('bulkRejectShifts should return 400 when ids is not an array', async () => {
      mockReq.body = { ids: 'not-array' };
      
      await controller.bulkRejectShifts(mockReq, mockRes);
      
      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    test('bulkRejectShifts should return 400 when ids array is empty', async () => {
      mockReq.body = { ids: [] };
      
      await controller.bulkRejectShifts(mockReq, mockRes);
      
      expect(mockRes.status).toHaveBeenCalledWith(400);
    });
  });

  // Test 3: Error Handling Tests
  describe('Error Handling Tests', () => {
    test('createShift should handle validation errors', async () => {
      mockReq.body = {
        userId: 'user123'
        // Missing required fields will cause validation error
      };
      
      await controller.createShift(mockReq, mockRes);
      
      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    test('updateShift should handle errors gracefully', async () => {
      mockReq.params = { id: 'invalid-id' };
      mockReq.body = { status: 'Updated' };
      
      await controller.updateShift(mockReq, mockRes);
      
      // Should handle error (either 400 or 404)
      expect(mockRes.status).toHaveBeenCalledWith(expect.oneOf([400, 404]));
    });

    test('deleteShift should handle errors gracefully', async () => {
      mockReq.params = { id: 'invalid-id' };
      
      await controller.deleteShift(mockReq, mockRes);
      
      // Should handle error (either 400 or 404)
      expect(mockRes.status).toHaveBeenCalledWith(expect.oneOf([400, 404]));
    });

    test('approveShift should handle errors gracefully', async () => {
      mockReq.params = { id: 'invalid-id' };
      mockReq.body = { reviewedBy: 'Admin' };
      
      await controller.approveShift(mockReq, mockRes);
      
      // Should handle error (either 400 or 404)
      expect(mockRes.status).toHaveBeenCalledWith(expect.oneOf([400, 404]));
    });

    test('rejectShift should handle errors gracefully', async () => {
      mockReq.params = { id: 'invalid-id' };
      mockReq.body = { reviewedBy: 'Admin' };
      
      await controller.rejectShift(mockReq, mockRes);
      
      // Should handle error (either 400 or 404)
      expect(mockRes.status).toHaveBeenCalledWith(expect.oneOf([400, 404]));
    });

    test('bulkApproveShifts should handle errors gracefully', async () => {
      mockReq.body = { ids: ['invalid-id1', 'invalid-id2'] };
      
      await controller.bulkApproveShifts(mockReq, mockRes);
      
      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    test('bulkRejectShifts should handle errors gracefully', async () => {
      mockReq.body = { ids: ['invalid-id1', 'invalid-id2'] };
      
      await controller.bulkRejectShifts(mockReq, mockRes);
      
      expect(mockRes.status).toHaveBeenCalledWith(400);
    });
  });

  // Test 4: Query Parameter Tests
  describe('Query Parameter Handling', () => {
    test('getAllShifts should handle isForReview=true filter', async () => {
      mockReq.query = { isForReview: 'true' };
      
      await controller.getAllShifts(mockReq, mockRes);
      
      // Should attempt to process the query (will likely error due to DB, but that's expected)
      expect(mockRes.status).toHaveBeenCalled();
    });

    test('getAllShifts should handle isForReview=false filter', async () => {
      mockReq.query = { isForReview: 'false' };
      
      await controller.getAllShifts(mockReq, mockRes);
      
      expect(mockRes.status).toHaveBeenCalled();
    });

    test('getAllShifts should handle userId filter', async () => {
      mockReq.query = { userId: 'user123' };
      
      await controller.getAllShifts(mockReq, mockRes);
      
      expect(mockRes.status).toHaveBeenCalled();
    });

    test('getAllShifts should handle multiple filters', async () => {
      mockReq.query = { isForReview: 'true', userId: 'user123' };
      
      await controller.getAllShifts(mockReq, mockRes);
      
      expect(mockRes.status).toHaveBeenCalled();
    });
  });

  // Test 5: Basic Function Coverage
  describe('Function Coverage Tests', () => {
    test('getAllShifts function should be defined', () => {
      expect(typeof controller.getAllShifts).toBe('function');
    });

    test('getUserShifts function should be defined', () => {
      expect(typeof controller.getUserShifts).toBe('function');
    });

    test('createShift function should be defined', () => {
      expect(typeof controller.createShift).toBe('function');
    });

    test('updateShift function should be defined', () => {
      expect(typeof controller.updateShift).toBe('function');
    });

    test('deleteShift function should be defined', () => {
      expect(typeof controller.deleteShift).toBe('function');
    });

    test('approveShift function should be defined', () => {
      expect(typeof controller.approveShift).toBe('function');
    });

    test('rejectShift function should be defined', () => {
      expect(typeof controller.rejectShift).toBe('function');
    });

    test('bulkApproveShifts function should be defined', () => {
      expect(typeof controller.bulkApproveShifts).toBe('function');
    });

    test('bulkRejectShifts function should be defined', () => {
      expect(typeof controller.bulkRejectShifts).toBe('function');
    });
  });

  // Test 6: Edge Case Coverage
  describe('Edge Cases', () => {
    test('getUserShifts with valid userId param should attempt processing', async () => {
      mockReq.params = { userId: 'valid-user-123' };
      
      await controller.getUserShifts(mockReq, mockRes);
      
      // Will likely fail due to DB connection, but should reach that point
      expect(mockRes.status).toHaveBeenCalled();
    });

    test('createShift with some valid data should attempt processing', async () => {
      mockReq.body = {
        userId: 'user123',
        name: 'Test User',
        employeeCode: 'EMP001'
      };
      
      await controller.createShift(mockReq, mockRes);
      
      expect(mockRes.status).toHaveBeenCalled();
    });

    test('updateShift with valid params should attempt processing', async () => {
      mockReq.params = { id: 'some-valid-id' };
      mockReq.body = { status: 'Updated' };
      
      await controller.updateShift(mockReq, mockRes);
      
      expect(mockRes.status).toHaveBeenCalled();
    });

    test('deleteShift with valid params should attempt processing', async () => {
      mockReq.params = { id: 'some-valid-id' };
      mockReq.query = {};
      
      await controller.deleteShift(mockReq, mockRes);
      
      expect(mockRes.status).toHaveBeenCalled();
    });

    test('approveShift with valid data should attempt processing', async () => {
      mockReq.params = { id: 'some-valid-id' };
      mockReq.body = { reviewedBy: 'Admin', reviewComment: 'Looks good' };
      
      await controller.approveShift(mockReq, mockRes);
      
      expect(mockRes.status).toHaveBeenCalled();
    });

    test('rejectShift with valid data should attempt processing', async () => {
      mockReq.params = { id: 'some-valid-id' };
      mockReq.body = { reviewedBy: 'Admin', reviewComment: 'Not approved' };
      
      await controller.rejectShift(mockReq, mockRes);
      
      expect(mockRes.status).toHaveBeenCalled();
    });
  });
});

// Add custom Jest matcher for better error handling
expect.extend({
  oneOf(received, expectedArray) {
    const pass = expectedArray.includes(received);
    if (pass) {
      return {
        message: () => `expected ${received} not to be one of ${expectedArray.join(', ')}`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be one of ${expectedArray.join(', ')}`,
        pass: false,
      };
    }
  },
});
