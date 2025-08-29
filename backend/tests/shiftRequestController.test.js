import { jest } from '@jest/globals';

// Create a safe error helper function
const createTestError = (message) => ({
  message,
  toString: () => message
});

// Mock all external dependencies
const mockSort = jest.fn();
const mockFind = jest.fn();
const mockFindByIdAndUpdate = jest.fn();
const mockFindByIdAndDelete = jest.fn();
const mockFindById = jest.fn();
const mockUpdateMany = jest.fn();
const mockSave = jest.fn();

// Create a proper constructor mock
const MockShiftRequestConstructor = jest.fn().mockImplementation(function(data) {
  this.data = data;
  this.save = mockSave;
  return this;
});

const mockCompanyShiftRequest = MockShiftRequestConstructor;
mockCompanyShiftRequest.find = mockFind;
mockCompanyShiftRequest.findByIdAndUpdate = mockFindByIdAndUpdate;
mockCompanyShiftRequest.findByIdAndDelete = mockFindByIdAndDelete;
mockCompanyShiftRequest.findById = mockFindById;
mockCompanyShiftRequest.updateMany = mockUpdateMany;

const mockNotification = jest.fn().mockImplementation(function(data) {
  this.data = data;
  this.save = mockSave;
  return this;
});

const mockGetModelForCompany = jest.fn();

// Mock modules
jest.unstable_mockModule('../models/ShiftRequest.js', () => ({
  default: MockShiftRequestConstructor,
  shiftRequestSchema: {}
}));

jest.unstable_mockModule('../models/Notification.js', () => ({
  default: mockNotification
}));

jest.unstable_mockModule('../models/genericModelFactory.js', () => ({
  default: mockGetModelForCompany
}));

// Import the controller functions after mocking
const {
  getAllShiftRequests,
  getUserShiftRequests,
  createShiftRequest,
  updateShiftRequest,
  deleteShiftRequest,
  approveShiftRequest,
  rejectShiftRequest,
  bulkApproveRequests,
  bulkRejectRequests
} = await import('../controllers/shiftRequestController.js');

describe('Shift Request Controller', () => {
  let req, res, mockIo, consoleSpy, consoleErrorSpy;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Setup model mock
    mockGetModelForCompany.mockResolvedValue(mockCompanyShiftRequest);
    
    // Setup find chain mock
    mockFind.mockReturnValue({ sort: mockSort });
    mockSort.mockResolvedValue([]);
    
    // Mock io
    mockIo = {
      to: jest.fn().mockReturnThis(),
      emit: jest.fn()
    };

    // Mock req and res
    req = {
      companyCode: 'TEST_COMPANY',
      params: {},
      query: {},
      body: {},
      user: { role: 'user' },
      app: {
        get: jest.fn().mockReturnValue(mockIo)
      }
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

  describe('getAllShiftRequests', () => {
    test('should return 401 when companyCode is missing', async () => {
      req.companyCode = null;
      await getAllShiftRequests(req, res);
      
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Authentication required',
        message: 'Company code not found in request'
      });
    });

    test('should fetch all shift requests without filters', async () => {
      const mockShifts = [{ id: '1', userId: 'user1' }];
      mockSort.mockResolvedValue(mockShifts);

      await getAllShiftRequests(req, res);

      expect(mockFind).toHaveBeenCalledWith({});
      expect(mockSort).toHaveBeenCalledWith('-createdAt');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockShifts);
    });

    test('should fetch shift requests with isForReview filter true', async () => {
      req.query.isForReview = 'true';
      const mockShifts = [{ id: '1', isForReview: true }];
      mockSort.mockResolvedValue(mockShifts);

      await getAllShiftRequests(req, res);

      expect(mockFind).toHaveBeenCalledWith({ isForReview: true });
      expect(res.status).toHaveBeenCalledWith(200);
    });

    test('should fetch shift requests with isForReview filter false', async () => {
      req.query.isForReview = 'false';
      const mockShifts = [{ id: '1', isForReview: false }];
      mockSort.mockResolvedValue(mockShifts);

      await getAllShiftRequests(req, res);

      expect(mockFind).toHaveBeenCalledWith({ isForReview: false });
      expect(res.status).toHaveBeenCalledWith(200);
    });

    test('should fetch shift requests with userId filter', async () => {
      req.query.userId = 'user123';
      const mockShifts = [{ id: '1', userId: 'user123' }];
      mockSort.mockResolvedValue(mockShifts);

      await getAllShiftRequests(req, res);

      expect(mockFind).toHaveBeenCalledWith({ userId: 'user123' });
      expect(res.status).toHaveBeenCalledWith(200);
    });

    test('should fetch shift requests with both filters', async () => {
      req.query.isForReview = 'true';
      req.query.userId = 'user123';
      const mockShifts = [{ id: '1', isForReview: true, userId: 'user123' }];
      mockSort.mockResolvedValue(mockShifts);

      await getAllShiftRequests(req, res);

      expect(mockFind).toHaveBeenCalledWith({ isForReview: true, userId: 'user123' });
      expect(res.status).toHaveBeenCalledWith(200);
    });

    test('should handle errors', async () => {
      const testError = createTestError('Database error');
      mockSort.mockRejectedValue(testError);

      await getAllShiftRequests(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: 'Database error' });
    });
  });

  describe('getUserShiftRequests', () => {
    test('should return 401 when companyCode is missing', async () => {
      req.companyCode = null;
      await getUserShiftRequests(req, res);
      
      expect(res.status).toHaveBeenCalledWith(401);
    });

    test('should return 400 when userId is missing', async () => {
      await getUserShiftRequests(req, res);
      
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'User ID is required' });
    });

    test('should successfully fetch user shift requests', async () => {
      req.params.userId = 'user123';
      const mockShifts = [{ id: '1', userId: 'user123' }];
      mockSort.mockResolvedValue(mockShifts);

      await getUserShiftRequests(req, res);

      expect(mockFind).toHaveBeenCalledWith({ userId: 'user123' });
      expect(mockSort).toHaveBeenCalledWith('-createdAt');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockShifts);
    });

    test('should handle errors', async () => {
      req.params.userId = 'user123';
      const testError = createTestError('Database error');
      mockSort.mockRejectedValue(testError);

      await getUserShiftRequests(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('createShiftRequest', () => {
    test('should return 401 when companyCode is missing', async () => {
      req.companyCode = null;
      await createShiftRequest(req, res);
      
      expect(res.status).toHaveBeenCalledWith(401);
    });

    test('should return 400 when userId is missing', async () => {
      req.body = {};
      await createShiftRequest(req, res);
      
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'User ID is required' });
    });

    test('should successfully create a shift request', async () => {
      req.body = {
        userId: 'user123',
        name: 'John Doe',
        employeeCode: 'EMP123',
        requestedShift: 'Day',
        currentShift: 'Night',
        requestedDate: new Date(),
        requestedTill: new Date(),
        description: 'Need day shift',
        isPermanentRequest: false,
        isAllocated: false
      };
      const mockSavedRequest = { id: '1', ...req.body, isForReview: true };
      mockSave.mockResolvedValue(mockSavedRequest);

      await createShiftRequest(req, res);

      expect(MockShiftRequestConstructor).toHaveBeenCalledWith({
        userId: 'user123',
        name: 'John Doe',
        employeeCode: 'EMP123',
        requestedShift: 'Day',
        currentShift: 'Night',
        requestedDate: req.body.requestedDate,
        requestedTill: req.body.requestedTill,
        description: 'Need day shift',
        isPermanentRequest: false,
        isForReview: true,
        isAllocated: false
      });
      expect(mockSave).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(mockSavedRequest);
    });

    test('should handle creation errors', async () => {
      req.body = { userId: 'user123' };
      const testError = createTestError('Validation error');
      mockSave.mockRejectedValue(testError);

      await createShiftRequest(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe('updateShiftRequest', () => {
    test('should return 401 when companyCode is missing', async () => {
      req.companyCode = null;
      await updateShiftRequest(req, res);
      
      expect(res.status).toHaveBeenCalledWith(401);
    });

    test('should return 404 when shift request not found', async () => {
      req.params.id = 'nonexistent';
      mockFindById.mockResolvedValue(null);

      await updateShiftRequest(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: 'Shift request not found' });
    });

    test('should return 403 when user does not own the request', async () => {
      req.params.id = 'shift123';
      req.body = { userId: 'user123' };
      const mockShiftRequest = { id: 'shift123', userId: 'differentUser' };
      mockFindById.mockResolvedValue(mockShiftRequest);

      await updateShiftRequest(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ message: 'You can only update your own requests' });
    });

    test('should successfully update when user owns the request', async () => {
      req.params.id = 'shift123';
      req.body = { userId: 'user123', status: 'Updated' };
      const mockShiftRequest = { id: 'shift123', userId: 'user123' };
      const mockUpdatedRequest = { ...mockShiftRequest, status: 'Updated' };
      
      mockFindById.mockResolvedValue(mockShiftRequest);
      mockFindByIdAndUpdate.mockResolvedValue(mockUpdatedRequest);

      await updateShiftRequest(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockUpdatedRequest);
    });

    test('should successfully update when user is admin', async () => {
      req.params.id = 'shift123';
      req.body = { userId: 'user123', status: 'Updated' };
      req.user = { role: 'admin' };
      const mockShiftRequest = { id: 'shift123', userId: 'differentUser' };
      const mockUpdatedRequest = { ...mockShiftRequest, status: 'Updated' };
      
      mockFindById.mockResolvedValue(mockShiftRequest);
      mockFindByIdAndUpdate.mockResolvedValue(mockUpdatedRequest);

      await updateShiftRequest(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
    });

    test('should successfully update without userId check', async () => {
      req.params.id = 'shift123';
      req.body = { status: 'Updated' };
      const mockShiftRequest = { id: 'shift123', userId: 'user123' };
      const mockUpdatedRequest = { ...mockShiftRequest, status: 'Updated' };
      
      mockFindById.mockResolvedValue(mockShiftRequest);
      mockFindByIdAndUpdate.mockResolvedValue(mockUpdatedRequest);

      await updateShiftRequest(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
    });

    test('should handle update errors', async () => {
      req.params.id = 'shift123';
      const testError = createTestError('Update error');
      mockFindById.mockRejectedValue(testError);

      await updateShiftRequest(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe('deleteShiftRequest', () => {
    test('should return 401 when companyCode is missing', async () => {
      req.companyCode = null;
      await deleteShiftRequest(req, res);
      
      expect(res.status).toHaveBeenCalledWith(401);
    });

    test('should return 404 when shift request not found', async () => {
      req.params.id = 'nonexistent';
      mockFindById.mockResolvedValue(null);

      await deleteShiftRequest(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    test('should successfully delete without ownership check', async () => {
      req.params.id = 'shift123';
      const mockShiftRequest = { id: 'shift123', userId: 'user123' };
      mockFindById.mockResolvedValue(mockShiftRequest);
      mockFindByIdAndDelete.mockResolvedValue(mockShiftRequest);

      await deleteShiftRequest(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ message: 'Shift request deleted successfully' });
    });

    test('should return 403 when user does not own the request', async () => {
      req.params.id = 'shift123';
      req.query.userId = 'user123';
      const mockShiftRequest = { id: 'shift123', userId: 'differentUser' };
      mockFindById.mockResolvedValue(mockShiftRequest);

      await deleteShiftRequest(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
    });

    test('should successfully delete when user owns the request', async () => {
      req.params.id = 'shift123';
      req.query.userId = 'user123';
      const mockShiftRequest = { id: 'shift123', userId: 'user123' };
      mockFindById.mockResolvedValue(mockShiftRequest);
      mockFindByIdAndDelete.mockResolvedValue(mockShiftRequest);

      await deleteShiftRequest(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
    });

    test('should successfully delete when user is admin', async () => {
      req.params.id = 'shift123';
      req.query.userId = 'user123';
      req.user = { role: 'admin' };
      const mockShiftRequest = { id: 'shift123', userId: 'differentUser' };
      mockFindById.mockResolvedValue(mockShiftRequest);
      mockFindByIdAndDelete.mockResolvedValue(mockShiftRequest);

      await deleteShiftRequest(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
    });

    test('should handle deletion errors', async () => {
      req.params.id = 'shift123';
      const testError = createTestError('Delete error');
      mockFindById.mockRejectedValue(testError);

      await deleteShiftRequest(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe('approveShiftRequest', () => {
    test('should return 401 when companyCode is missing', async () => {
      req.companyCode = null;
      await approveShiftRequest(req, res);
      
      expect(res.status).toHaveBeenCalledWith(401);
    });

    test('should return 404 when shift request not found', async () => {
      req.params.id = 'nonexistent';
      mockFindById.mockResolvedValue(null);

      await approveShiftRequest(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    test('should successfully approve shift request with notification', async () => {
      req.params.id = 'shift123';
      req.body = { reviewedBy: 'Manager' };
      const mockShiftRequest = {
        id: 'shift123',
        userId: 'user123',
        status: 'Pending',
        requestedDate: new Date()
      };
      const mockUpdatedRequest = { ...mockShiftRequest, status: 'Approved' };
      
      mockFindById.mockResolvedValue(mockShiftRequest);
      mockFindByIdAndUpdate.mockResolvedValue(mockUpdatedRequest);
      mockSave.mockResolvedValue({});

      await approveShiftRequest(req, res);

      expect(mockNotification).toHaveBeenCalled();
      expect(mockIo.to).toHaveBeenCalledWith('user123');
      expect(mockIo.emit).toHaveBeenCalledWith('new-notification', expect.any(Object));
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockUpdatedRequest);
    });

    test('should handle notification errors gracefully', async () => {
      req.params.id = 'shift123';
      const mockShiftRequest = {
        id: 'shift123',
        userId: 'user123',
        status: 'Pending',
        requestedDate: new Date()
      };
      const mockUpdatedRequest = { ...mockShiftRequest, status: 'Approved' };
      
      mockFindById.mockResolvedValue(mockShiftRequest);
      mockFindByIdAndUpdate.mockResolvedValue(mockUpdatedRequest);
      mockSave.mockRejectedValue(createTestError('Notification error'));

      await approveShiftRequest(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
    });

    test('should handle missing io gracefully', async () => {
      req.params.id = 'shift123';
      req.app.get = jest.fn().mockReturnValue(null);
      const mockShiftRequest = {
        id: 'shift123',
        userId: 'user123',
        status: 'Pending',
        requestedDate: new Date()
      };
      const mockUpdatedRequest = { ...mockShiftRequest, status: 'Approved' };
      
      mockFindById.mockResolvedValue(mockShiftRequest);
      mockFindByIdAndUpdate.mockResolvedValue(mockUpdatedRequest);
      mockSave.mockResolvedValue({});

      await approveShiftRequest(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
    });

    test('should not send notification if status was already approved', async () => {
      req.params.id = 'shift123';
      const mockShiftRequest = {
        id: 'shift123',
        userId: 'user123',
        status: 'Approved',
        requestedDate: new Date()
      };
      
      mockFindById.mockResolvedValue(mockShiftRequest);
      mockFindByIdAndUpdate.mockResolvedValue(mockShiftRequest);

      await approveShiftRequest(req, res);

      expect(mockNotification).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
    });

    test('should handle approval errors', async () => {
      req.params.id = 'shift123';
      const testError = createTestError('Approval error');
      mockFindById.mockRejectedValue(testError);

      await approveShiftRequest(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe('rejectShiftRequest', () => {
    test('should return 401 when companyCode is missing', async () => {
      req.companyCode = null;
      await rejectShiftRequest(req, res);
      
      expect(res.status).toHaveBeenCalledWith(401);
    });

    test('should return 404 when shift request not found', async () => {
      req.params.id = 'nonexistent';
      mockFindById.mockResolvedValue(null);

      await rejectShiftRequest(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    test('should successfully reject shift request with notification', async () => {
      req.params.id = 'shift123';
      req.body = { reviewedBy: 'Manager' };
      const mockShiftRequest = {
        id: 'shift123',
        userId: 'user123',
        status: 'Pending',
        requestedDate: new Date()
      };
      const mockUpdatedRequest = { ...mockShiftRequest, status: 'Rejected' };
      
      mockFindById.mockResolvedValue(mockShiftRequest);
      mockFindByIdAndUpdate.mockResolvedValue(mockUpdatedRequest);
      mockSave.mockResolvedValue({});

      await rejectShiftRequest(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockUpdatedRequest);
    });

    test('should handle rejection errors', async () => {
      req.params.id = 'shift123';
      const testError = createTestError('Rejection error');
      mockFindById.mockRejectedValue(testError);

      await rejectShiftRequest(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe('bulkApproveRequests', () => {
    test('should return 401 when companyCode is missing', async () => {
      req.companyCode = null;
      await bulkApproveRequests(req, res);
      
      expect(res.status).toHaveBeenCalledWith(401);
    });

    test('should return 400 when no requestIds provided', async () => {
      req.body = {};
      await bulkApproveRequests(req, res);
      
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'Request IDs array is required' });
    });

    test('should return 400 when empty requestIds array provided', async () => {
      req.body = { requestIds: [] };
      await bulkApproveRequests(req, res);
      
      expect(res.status).toHaveBeenCalledWith(400);
    });

    test('should successfully bulk approve requests', async () => {
      req.body = {
        requestIds: ['shift1', 'shift2'],
        reviewedBy: 'Manager'
      };
      const mockShiftRequests = [
        {
          _id: 'shift1',
          userId: 'user1',
          status: 'Pending',
          requestedDate: new Date()
        },
        {
          _id: 'shift2',
          userId: 'user2',
          status: 'Pending',
          requestedDate: new Date()
        }
      ];
      
      mockFind.mockResolvedValue(mockShiftRequests);
      mockUpdateMany.mockResolvedValue({ modifiedCount: 2 });
      mockSave.mockResolvedValue({});

      await bulkApproveRequests(req, res);

      expect(mockFind).toHaveBeenCalledWith({ _id: { $in: ['shift1', 'shift2'] } });
      expect(mockUpdateMany).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: '2 shift requests approved successfully',
        notifications: expect.any(Array)
      });
    });

    test('should handle notification errors during bulk approve', async () => {
      req.body = {
        requestIds: ['shift1'],
        reviewedBy: 'Manager'
      };
      const mockShiftRequests = [
        {
          _id: 'shift1',
          userId: 'user1',
          status: 'Pending',
          requestedDate: new Date()
        }
      ];
      
      mockFind.mockResolvedValue(mockShiftRequests);
      mockUpdateMany.mockResolvedValue({ modifiedCount: 1 });
      mockSave.mockRejectedValue(createTestError('Notification error'));

      await bulkApproveRequests(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
    });

    test('should handle bulk approval errors', async () => {
      req.body = { requestIds: ['shift1', 'shift2'] };
      const testError = createTestError('Bulk approval error');
      mockFind.mockRejectedValue(testError);

      await bulkApproveRequests(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe('bulkRejectRequests', () => {
    test('should return 401 when companyCode is missing', async () => {
      req.companyCode = null;
      await bulkRejectRequests(req, res);
      
      expect(res.status).toHaveBeenCalledWith(401);
    });

    test('should return 400 when no requestIds provided', async () => {
      req.body = {};
      await bulkRejectRequests(req, res);
      
      expect(res.status).toHaveBeenCalledWith(400);
    });

    test('should successfully bulk reject requests', async () => {
      req.body = {
        requestIds: ['shift1', 'shift2'],
        reviewedBy: 'Manager'
      };
      const mockShiftRequests = [
        {
          _id: 'shift1',
          userId: 'user1',
          status: 'Pending',
          requestedDate: new Date()
        }
      ];
      
      mockFind.mockResolvedValue(mockShiftRequests);
      mockUpdateMany.mockResolvedValue({ modifiedCount: 2 });
      mockSave.mockResolvedValue({});

      await bulkRejectRequests(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: '2 shift requests rejected successfully',
        notifications: expect.any(Array)
      });
    });

    test('should handle bulk rejection errors', async () => {
      req.body = { requestIds: ['shift1', 'shift2'] };
      const testError = createTestError('Bulk rejection error');
      mockFind.mockRejectedValue(testError);

      await bulkRejectRequests(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });
});
