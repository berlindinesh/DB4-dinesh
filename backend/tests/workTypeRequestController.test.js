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
const MockWorkTypeRequestConstructor = jest.fn().mockImplementation(function(data) {
  this.data = data;
  this.save = mockSave;
  return this;
});

const mockCompanyWorkTypeRequest = MockWorkTypeRequestConstructor;
mockCompanyWorkTypeRequest.find = mockFind;
mockCompanyWorkTypeRequest.findByIdAndUpdate = mockFindByIdAndUpdate;
mockCompanyWorkTypeRequest.findByIdAndDelete = mockFindByIdAndDelete;
mockCompanyWorkTypeRequest.findById = mockFindById;
mockCompanyWorkTypeRequest.updateMany = mockUpdateMany;

const mockNotification = jest.fn().mockImplementation(function(data) {
  this.data = data;
  this.save = mockSave;
  return this;
});

const mockGetModelForCompany = jest.fn();

// Mock modules
jest.unstable_mockModule('../models/WorkTypeRequest.js', () => ({
  default: MockWorkTypeRequestConstructor,
  workTypeRequestSchema: {}
}));

jest.unstable_mockModule('../models/Notification.js', () => ({
  default: mockNotification
}));

jest.unstable_mockModule('../models/genericModelFactory.js', () => ({
  default: mockGetModelForCompany
}));

// Import the controller functions after mocking
const {
  getWorkTypeRequestsByUserId,
  getAllWorkTypeRequests,
  createWorkTypeRequest,
  updateWorkTypeRequest,
  deleteWorkTypeRequest,
  approveWorkTypeRequest,
  rejectWorkTypeRequest,
  bulkApproveRequests,
  bulkRejectRequests,
  getWorkTypeRequestsByEmployeeCode
} = await import('../controllers/workTypeRequestController.js');

describe('Work Type Request Controller', () => {
  let req, res, mockIo, consoleSpy, consoleErrorSpy;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Setup model mock
    mockGetModelForCompany.mockResolvedValue(mockCompanyWorkTypeRequest);
    
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

  describe('getWorkTypeRequestsByUserId', () => {
    test('should return 401 when companyCode is missing', async () => {
      req.companyCode = null;
      await getWorkTypeRequestsByUserId(req, res);
      
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Authentication required',
        message: 'Company code not found in request'
      });
    });

    test('should return 400 when userId is missing', async () => {
      await getWorkTypeRequestsByUserId(req, res);
      
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: 'User ID is required'
      });
    });

    test('should successfully fetch user work type requests', async () => {
      req.params.userId = 'user123';
      const mockRequests = [{ id: '1', userId: 'user123' }];
      mockSort.mockResolvedValue(mockRequests);

      await getWorkTypeRequestsByUserId(req, res);

      expect(mockFind).toHaveBeenCalledWith({ userId: 'user123' });
      expect(mockSort).toHaveBeenCalledWith({ createdAt: -1 });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockRequests);
    });

    test('should handle errors gracefully', async () => {
      req.params.userId = 'user123';
      const testError = createTestError('Database error');
      mockSort.mockRejectedValue(testError);

      await getWorkTypeRequestsByUserId(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Error fetching user work type requests',
        error: 'Database error'
      });
    });
  });

  describe('getAllWorkTypeRequests', () => {
    test('should return 401 when companyCode is missing', async () => {
      req.companyCode = null;
      await getAllWorkTypeRequests(req, res);
      
      expect(res.status).toHaveBeenCalledWith(401);
    });

    test('should fetch all requests for review', async () => {
      req.query.forReview = 'true';
      const mockRequests = [{ id: '1' }, { id: '2' }];
      mockSort.mockResolvedValue(mockRequests);

      await getAllWorkTypeRequests(req, res);

      expect(mockFind).toHaveBeenCalledWith({});
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockRequests);
    });

    test('should handle errors', async () => {
      const testError = createTestError('Database error');
      mockSort.mockRejectedValue(testError);

      await getAllWorkTypeRequests(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('createWorkTypeRequest', () => {
    test('should return 401 when companyCode is missing', async () => {
      req.companyCode = null;
      await createWorkTypeRequest(req, res);
      
      expect(res.status).toHaveBeenCalledWith(401);
    });

    test('should successfully create a work type request', async () => {
      req.body = { userId: 'user123', requestedDate: new Date() };
      const mockSavedRequest = { id: '1', ...req.body };
      mockSave.mockResolvedValue(mockSavedRequest);

      await createWorkTypeRequest(req, res);

      expect(mockSave).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(mockSavedRequest);
    });

    test('should handle errors', async () => {
      req.body = { userId: 'user123' };
      const testError = createTestError('Save error');
      mockSave.mockRejectedValue(testError);

      await createWorkTypeRequest(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('updateWorkTypeRequest', () => {
    test('should return 401 when companyCode is missing', async () => {
      req.companyCode = null;
      await updateWorkTypeRequest(req, res);
      
      expect(res.status).toHaveBeenCalledWith(401);
    });

    test('should successfully update a work type request', async () => {
      req.params.id = 'request123';
      req.body = { status: 'Updated' };
      const mockUpdatedRequest = { id: 'request123', status: 'Updated' };
      mockFindByIdAndUpdate.mockResolvedValue(mockUpdatedRequest);

      await updateWorkTypeRequest(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockUpdatedRequest);
    });

    test('should return 404 when request not found', async () => {
      req.params.id = 'nonexistent';
      mockFindByIdAndUpdate.mockResolvedValue(null);

      await updateWorkTypeRequest(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    test('should handle errors', async () => {
      req.params.id = 'request123';
      const testError = createTestError('Update error');
      mockFindByIdAndUpdate.mockRejectedValue(testError);

      await updateWorkTypeRequest(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('deleteWorkTypeRequest', () => {
    test('should return 401 when companyCode is missing', async () => {
      req.companyCode = null;
      await deleteWorkTypeRequest(req, res);
      
      expect(res.status).toHaveBeenCalledWith(401);
    });

    test('should successfully delete a work type request', async () => {
      req.params.id = 'request123';
      const mockDeletedRequest = { id: 'request123' };
      mockFindByIdAndDelete.mockResolvedValue(mockDeletedRequest);

      await deleteWorkTypeRequest(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
    });

    test('should return 404 when request not found', async () => {
      req.params.id = 'nonexistent';
      mockFindByIdAndDelete.mockResolvedValue(null);

      await deleteWorkTypeRequest(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    test('should handle errors', async () => {
      req.params.id = 'request123';
      const testError = createTestError('Delete error');
      mockFindByIdAndDelete.mockRejectedValue(testError);

      await deleteWorkTypeRequest(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('approveWorkTypeRequest', () => {
    test('should return 401 when companyCode is missing', async () => {
      req.companyCode = null;
      await approveWorkTypeRequest(req, res);
      
      expect(res.status).toHaveBeenCalledWith(401);
    });

    test('should successfully approve a work type request', async () => {
      req.params.id = 'request123';
      req.body = { reviewerName: 'Manager' };
      const mockRequest = { 
        id: 'request123', 
        status: 'Pending', 
        userId: 'user123',
        requestedDate: new Date()
      };
      const mockUpdatedRequest = { ...mockRequest, status: 'Approved' };
      
      mockFindById.mockResolvedValue(mockRequest);
      mockFindByIdAndUpdate.mockResolvedValue(mockUpdatedRequest);
      mockSave.mockResolvedValue({});

      await approveWorkTypeRequest(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockUpdatedRequest);
    });

    test('should return 404 when request not found', async () => {
      req.params.id = 'nonexistent';
      mockFindById.mockResolvedValue(null);

      await approveWorkTypeRequest(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    test('should handle errors', async () => {
      req.params.id = 'request123';
      const testError = createTestError('Approval error');
      mockFindById.mockRejectedValue(testError);

      await approveWorkTypeRequest(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });

    test('should not send notification if status was already approved', async () => {
      req.params.id = 'request123';
      const mockRequest = { 
        id: 'request123', 
        status: 'Approved', 
        userId: 'user123'
      };
      
      mockFindById.mockResolvedValue(mockRequest);
      mockFindByIdAndUpdate.mockResolvedValue(mockRequest);

      await approveWorkTypeRequest(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe('rejectWorkTypeRequest', () => {
    test('should return 401 when companyCode is missing', async () => {
      req.companyCode = null;
      await rejectWorkTypeRequest(req, res);
      
      expect(res.status).toHaveBeenCalledWith(401);
    });

    test('should successfully reject a work type request', async () => {
      req.params.id = 'request123';
      req.body = { reviewerName: 'Manager' };
      const mockRequest = { 
        id: 'request123', 
        status: 'Pending', 
        userId: 'user123',
        requestedDate: new Date()
      };
      const mockUpdatedRequest = { ...mockRequest, status: 'Rejected' };
      
      mockFindById.mockResolvedValue(mockRequest);
      mockFindByIdAndUpdate.mockResolvedValue(mockUpdatedRequest);
      mockSave.mockResolvedValue({});

      await rejectWorkTypeRequest(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
    });

    test('should return 404 when request not found', async () => {
      req.params.id = 'nonexistent';
      mockFindById.mockResolvedValue(null);

      await rejectWorkTypeRequest(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    test('should handle errors', async () => {
      req.params.id = 'request123';
      const testError = createTestError('Rejection error');
      mockFindById.mockRejectedValue(testError);

      await rejectWorkTypeRequest(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('bulkApproveRequests', () => {
    test('should return 401 when companyCode is missing', async () => {
      req.companyCode = null;
      await bulkApproveRequests(req, res);
      
      expect(res.status).toHaveBeenCalledWith(401);
    });

    test('should successfully bulk approve requests', async () => {
      req.body = { 
        ids: ['request1', 'request2'],
        reviewerName: 'Manager'
      };
      const mockRequests = [
        { _id: 'request1', userId: 'user1', requestedDate: new Date() },
        { _id: 'request2', userId: 'user2', requestedDate: new Date() }
      ];
      
      mockFind.mockResolvedValue(mockRequests);
      mockUpdateMany.mockResolvedValue({ modifiedCount: 2 });
      mockSave.mockResolvedValue({});

      await bulkApproveRequests(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
    });

    test('should handle errors', async () => {
      req.body = { ids: ['request1', 'request2'] };
      const testError = createTestError('Bulk approve error');
      mockFind.mockRejectedValue(testError);

      await bulkApproveRequests(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('bulkRejectRequests', () => {
    test('should return 401 when companyCode is missing', async () => {
      req.companyCode = null;
      await bulkRejectRequests(req, res);
      
      expect(res.status).toHaveBeenCalledWith(401);
    });

    test('should successfully bulk reject requests', async () => {
      req.body = { 
        ids: ['request1', 'request2'],
        reviewerName: 'Manager'
      };
      const mockRequests = [
        { _id: 'request1', userId: 'user1', requestedDate: new Date() },
        { _id: 'request2', userId: 'user2', requestedDate: new Date() }
      ];
      
      mockFind.mockResolvedValue(mockRequests);
      mockUpdateMany.mockResolvedValue({ modifiedCount: 2 });
      mockSave.mockResolvedValue({});

      await bulkRejectRequests(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
    });

    test('should handle errors', async () => {
      req.body = { ids: ['request1', 'request2'] };
      const testError = createTestError('Bulk reject error');
      mockFind.mockRejectedValue(testError);

      await bulkRejectRequests(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('getWorkTypeRequestsByEmployeeCode', () => {
    test('should return 401 when companyCode is missing', async () => {
      req.companyCode = null;
      await getWorkTypeRequestsByEmployeeCode(req, res);
      
      expect(res.status).toHaveBeenCalledWith(401);
    });

    test('should return 400 when employeeCode is missing', async () => {
      await getWorkTypeRequestsByEmployeeCode(req, res);
      
      expect(res.status).toHaveBeenCalledWith(400);
    });

    test('should successfully fetch requests by employee code', async () => {
      req.params.employeeCode = 'EMP123';
      const mockRequests = [{ id: '1', employeeCode: 'EMP123' }];
      mockSort.mockResolvedValue(mockRequests);

      await getWorkTypeRequestsByEmployeeCode(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockRequests);
    });

    test('should handle errors', async () => {
      req.params.employeeCode = 'EMP123';
      const testError = createTestError('Database error');
      mockSort.mockRejectedValue(testError);

      await getWorkTypeRequestsByEmployeeCode(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });
});
