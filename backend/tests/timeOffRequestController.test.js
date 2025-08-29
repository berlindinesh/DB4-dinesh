import { jest } from '@jest/globals';

// Create a safe error helper function
const createTestError = (message) => ({
  message,
  toString: () => message
});

// Mock all external dependencies
const mockSave = jest.fn();
const mockSort = jest.fn();
const mockLimit = jest.fn();
const mockFind = jest.fn();
const mockFindById = jest.fn();
const mockFindByIdAndUpdate = jest.fn();
const mockFindByIdAndDelete = jest.fn();
const mockCountDocuments = jest.fn();

// Create mock time off request model
const mockCompanyTimeOffRequest = {
  find: mockFind,
  findById: mockFindById,
  findByIdAndUpdate: mockFindByIdAndUpdate,
  findByIdAndDelete: mockFindByIdAndDelete,
  countDocuments: mockCountDocuments
};

// Mock time off request instance
const createMockRequest = (overrides = {}) => ({
  _id: 'request123',
  name: 'John Doe',
  empId: 'EMP001',
  userId: 'user123',
  date: new Date('2025-08-29'),
  day: 'Friday',
  checkIn: '09:00',
  checkOut: '17:00',
  shift: 'Day',
  workType: 'Office',
  minHour: 8,
  atWork: 8,
  overtime: 0,
  status: 'Pending',
  save: mockSave,
  ...overrides
});

// Mock notification constructor - FIXED
const mockNotificationSave = jest.fn();
const mockNotificationConstructor = jest.fn().mockImplementation(function(data) {
  this.data = data;
  this.save = mockNotificationSave;
  return this;
});

// Mock socket.io - FIXED
const mockSocketEmit = jest.fn();
const mockSocketTo = jest.fn().mockReturnValue({ emit: mockSocketEmit });
const mockIo = { to: mockSocketTo };

// Mock getModelForCompany
const mockGetModelForCompany = jest.fn();

// Mock modules
jest.unstable_mockModule('../models/TimeOffRequest.js', () => ({
  default: {},
  timeOffRequestSchema: {}
}));

jest.unstable_mockModule('../models/Notification.js', () => ({
  default: mockNotificationConstructor
}));

jest.unstable_mockModule('../models/genericModelFactory.js', () => ({
  default: mockGetModelForCompany
}));

// Import the controller functions after mocking
const {
  getAllRequests,
  getRequestsByUserId,
  createRequest,
  getRequestById,
  updateRequest,
  deleteRequest,
  getRequestStats
} = await import('../controllers/timeOffRequestController.js');

describe('Time Off Request Controller', () => {
  let req, res, consoleSpy, consoleErrorSpy;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Setup model mock
    mockGetModelForCompany.mockResolvedValue(mockCompanyTimeOffRequest);
    
    // Setup find chain mock
    mockFind.mockReturnValue({ 
      sort: mockSort,
      limit: mockLimit 
    });
    mockSort.mockReturnValue({ limit: mockLimit });
    mockLimit.mockResolvedValue([]);
    mockSort.mockResolvedValue([]);
    
    // Default resolved values
    mockSave.mockResolvedValue({});
    mockNotificationSave.mockResolvedValue({});
    mockFindById.mockResolvedValue(null);
    mockFindByIdAndUpdate.mockResolvedValue(null);
    mockFindByIdAndDelete.mockResolvedValue(null);
    mockCountDocuments.mockResolvedValue(0);

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

  describe('getAllRequests', () => {
    test('should return 401 when companyCode is missing', async () => {
      req.companyCode = null;
      
      await getAllRequests(req, res);
      
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Authentication required',
        message: 'Company code not found in request'
      });
    });

    test('should successfully fetch all requests without filters', async () => {
      const mockRequests = [createMockRequest()];
      mockSort.mockResolvedValue(mockRequests);

      await getAllRequests(req, res);

      expect(mockFind).toHaveBeenCalledWith({});
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockRequests);
    });

    test('should fetch requests with search filter', async () => {
      req.query = { searchTerm: 'John' };
      const mockRequests = [createMockRequest()];
      mockSort.mockResolvedValue(mockRequests);

      await getAllRequests(req, res);

      expect(mockFind).toHaveBeenCalledWith({
        $or: [
          { name: { $regex: 'John', $options: 'i' } },
          { empId: { $regex: 'John', $options: 'i' } }
        ]
      });
      expect(res.status).toHaveBeenCalledWith(200);
    });

    test('should fetch requests with status filter', async () => {
      req.query = { status: 'Approved' };
      const mockRequests = [createMockRequest()];
      mockSort.mockResolvedValue(mockRequests);

      await getAllRequests(req, res);

      expect(mockFind).toHaveBeenCalledWith({ status: 'Approved' });
      expect(res.status).toHaveBeenCalledWith(200);
    });

    test('should handle errors', async () => {
      const testError = createTestError('Database error');
      mockSort.mockRejectedValue(testError);

      await getAllRequests(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('getRequestsByUserId', () => {
    test('should return 401 when companyCode is missing', async () => {
      req.companyCode = null;
      
      await getRequestsByUserId(req, res);
      
      expect(res.status).toHaveBeenCalledWith(401);
    });

    test('should return 400 when userId is missing', async () => {
      req.params = {};
      
      await getRequestsByUserId(req, res);
      
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Invalid request',
        message: 'User ID is required'
      });
    });

    test('should successfully fetch user requests', async () => {
      req.params = { userId: 'user123' };
      const mockRequests = [createMockRequest()];
      mockSort.mockResolvedValue(mockRequests);

      await getRequestsByUserId(req, res);

      expect(mockFind).toHaveBeenCalledWith({ userId: 'user123' });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockRequests);
    });

    test('should handle errors', async () => {
      req.params = { userId: 'user123' };
      const testError = createTestError('Database error');
      mockSort.mockRejectedValue(testError);

      await getRequestsByUserId(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('createRequest', () => {
    test('should return 401 when companyCode is missing', async () => {
      req.companyCode = null;
      
      await createRequest(req, res);
      
      expect(res.status).toHaveBeenCalledWith(401);
    });

    test('should return 400 when required fields are missing', async () => {
      req.body = { name: 'John Doe' };
      
      await createRequest(req, res);
      
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Validation error',
        message: expect.stringContaining('Missing required fields:')
      });
    });

    test('should successfully create a request', async () => {
      const mockRequest = createMockRequest();
      const MockRequestConstructor = jest.fn().mockImplementation(function(data) {
        Object.assign(this, data);
        this.save = jest.fn().mockResolvedValue(mockRequest);
        return this;
      });
      
      mockGetModelForCompany.mockResolvedValue(MockRequestConstructor);
      
      req.body = {
        name: 'John Doe',
        empId: 'EMP001',
        userId: 'user123',
        date: '2025-08-29',
        day: 'Friday',
        checkIn: '09:00',
        checkOut: '17:00',
        shift: 'Day',
        workType: 'Office',
        minHour: '8',
        atWork: '8'
      };

      await createRequest(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
    });

    test('should handle validation errors', async () => {
      const validationError = createTestError('Validation failed');
      validationError.name = 'ValidationError';
      validationError.errors = {
        field1: { message: 'Field is required' }
      };
      
      const MockRequestConstructor = jest.fn().mockImplementation(function() {
        this.save = jest.fn().mockRejectedValue(validationError);
        return this;
      });
      
      mockGetModelForCompany.mockResolvedValue(MockRequestConstructor);
      
      req.body = {
        name: 'John Doe',
        empId: 'EMP001',
        userId: 'user123',
        date: '2025-08-29',
        day: 'Friday',
        checkIn: '09:00',
        checkOut: '17:00',
        shift: 'Day',
        workType: 'Office',
        minHour: '8',
        atWork: '8'
      };

      await createRequest(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    test('should handle duplicate entry errors', async () => {
      const duplicateError = createTestError('Duplicate entry');
      duplicateError.name = 'MongoServerError';
      duplicateError.code = 11000;
      
      const MockRequestConstructor = jest.fn().mockImplementation(function() {
        this.save = jest.fn().mockRejectedValue(duplicateError);
        return this;
      });
      
      mockGetModelForCompany.mockResolvedValue(MockRequestConstructor);
      
      req.body = {
        name: 'John Doe',
        empId: 'EMP001',
        userId: 'user123',
        date: '2025-08-29',
        day: 'Friday',
        checkIn: '09:00',
        checkOut: '17:00',
        shift: 'Day',
        workType: 'Office',
        minHour: '8',
        atWork: '8'
      };

      await createRequest(req, res);

      expect(res.status).toHaveBeenCalledWith(409);
    });
  });

  describe('getRequestById', () => {
    test('should return 401 when companyCode is missing', async () => {
      req.companyCode = null;
      
      await getRequestById(req, res);
      
      expect(res.status).toHaveBeenCalledWith(401);
    });

    test('should return 400 when id is missing', async () => {
      req.params = {};
      
      await getRequestById(req, res);
      
      expect(res.status).toHaveBeenCalledWith(400);
    });

    test('should successfully fetch request by id', async () => {
      req.params = { id: 'request123' };
      const mockRequest = createMockRequest();
      mockFindById.mockResolvedValue(mockRequest);

      await getRequestById(req, res);

      expect(mockFindById).toHaveBeenCalledWith('request123');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockRequest);
    });

    test('should return 404 when request not found', async () => {
      req.params = { id: 'nonexistent' };
      mockFindById.mockResolvedValue(null);

      await getRequestById(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    test('should handle CastError for invalid ObjectId', async () => {
      req.params = { id: 'invalid-id' };
      const castError = createTestError('Cast error');
      castError.name = 'CastError';
      castError.kind = 'ObjectId';
      mockFindById.mockRejectedValue(castError);

      await getRequestById(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    test('should handle general errors', async () => {
      req.params = { id: 'request123' };
      const testError = createTestError('Database error');
      mockFindById.mockRejectedValue(testError);

      await getRequestById(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('updateRequest', () => {
    test('should return 401 when companyCode is missing', async () => {
      req.companyCode = null;
      
      await updateRequest(req, res);
      
      expect(res.status).toHaveBeenCalledWith(401);
    });

    test('should return 400 when id is missing', async () => {
      req.params = {};
      
      await updateRequest(req, res);
      
      expect(res.status).toHaveBeenCalledWith(400);
    });

    test('should return 404 when request not found', async () => {
      req.params = { id: 'nonexistent' };
      req.body = { status: 'Approved' };
      mockFindById.mockResolvedValue(null);

      await updateRequest(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    test('should successfully update request without status change', async () => {
      req.params = { id: 'request123' };
      req.body = { workType: 'Remote' };
      const existingRequest = createMockRequest();
      const updatedRequest = createMockRequest({ workType: 'Remote' });
      
      mockFindById.mockResolvedValue(existingRequest);
      mockFindByIdAndUpdate.mockResolvedValue(updatedRequest);

      await updateRequest(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(updatedRequest);
    });

    test('should successfully update request with status change and send notification', async () => {
      req.params = { id: 'request123' };
      req.body = { status: 'Approved', reviewedBy: 'Manager' };
      const existingRequest = createMockRequest({ status: 'Pending' });
      const updatedRequest = createMockRequest({ status: 'Approved' });
      
      // FIXED: Setup proper mocks for notification flow
      mockFindById.mockResolvedValue(existingRequest);
      mockFindByIdAndUpdate.mockResolvedValue(updatedRequest);
      
      // Mock the company notification model
      mockGetModelForCompany
        .mockResolvedValueOnce(mockCompanyTimeOffRequest) // First call for TimeOffRequest
        .mockResolvedValueOnce(mockNotificationConstructor); // Second call for Notification

      await updateRequest(req, res);

      expect(mockNotificationConstructor).toHaveBeenCalled();
      expect(mockSocketTo).toHaveBeenCalledWith('user123');
      expect(mockSocketEmit).toHaveBeenCalledWith('new-notification', expect.any(Object));
      expect(res.status).toHaveBeenCalledWith(200);
    });

    test('should handle notification errors gracefully', async () => {
      req.params = { id: 'request123' };
      req.body = { status: 'Approved' };
      const existingRequest = createMockRequest({ status: 'Pending' });
      const updatedRequest = createMockRequest({ status: 'Approved' });
      
      mockFindById.mockResolvedValue(existingRequest);
      mockFindByIdAndUpdate.mockResolvedValue(updatedRequest);
      mockNotificationSave.mockRejectedValue(createTestError('Notification error'));

      await updateRequest(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
    });

    test('should handle validation errors', async () => {
      req.params = { id: 'request123' };
      req.body = { status: 'Invalid' };
      const existingRequest = createMockRequest();
      const validationError = createTestError('Validation failed');
      validationError.name = 'ValidationError';
      validationError.errors = {
        status: { message: 'Invalid status' }
      };
      
      mockFindById.mockResolvedValue(existingRequest);
      mockFindByIdAndUpdate.mockRejectedValue(validationError);

      await updateRequest(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    test('should handle CastError', async () => {
      req.params = { id: 'invalid-id' };
      req.body = { status: 'Approved' };
      const existingRequest = createMockRequest();
      const castError = createTestError('Cast error');
      castError.name = 'CastError';
      castError.kind = 'ObjectId';
      
      mockFindById.mockResolvedValue(existingRequest);
      mockFindByIdAndUpdate.mockRejectedValue(castError);

      await updateRequest(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    test('should handle general errors', async () => {
      req.params = { id: 'request123' };
      req.body = { status: 'Approved' };
      const testError = createTestError('Database error');
      mockFindById.mockRejectedValue(testError);

      await updateRequest(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('deleteRequest', () => {
    test('should return 401 when companyCode is missing', async () => {
      req.companyCode = null;
      
      await deleteRequest(req, res);
      
      expect(res.status).toHaveBeenCalledWith(401);
    });

    test('should return 400 when id is missing', async () => {
      req.params = {};
      
      await deleteRequest(req, res);
      
      expect(res.status).toHaveBeenCalledWith(400);
    });

    test('should successfully delete request', async () => {
      req.params = { id: 'request123' };
      const mockRequest = createMockRequest();
      mockFindByIdAndDelete.mockResolvedValue(mockRequest);

      await deleteRequest(req, res);

      expect(mockFindByIdAndDelete).toHaveBeenCalledWith('request123');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Time off request deleted successfully'
      });
    });

    test('should return 404 when request not found', async () => {
      req.params = { id: 'nonexistent' };
      mockFindByIdAndDelete.mockResolvedValue(null);

      await deleteRequest(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    test('should handle CastError', async () => {
      req.params = { id: 'invalid-id' };
      const castError = createTestError('Cast error');
      castError.name = 'CastError';
      castError.kind = 'ObjectId';
      mockFindByIdAndDelete.mockRejectedValue(castError);

      await deleteRequest(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    test('should handle general errors', async () => {
      req.params = { id: 'request123' };
      const testError = createTestError('Database error');
      mockFindByIdAndDelete.mockRejectedValue(testError);

      await deleteRequest(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('getRequestStats', () => {
    test('should return 401 when companyCode is missing', async () => {
      req.companyCode = null;
      
      await getRequestStats(req, res);
      
      expect(res.status).toHaveBeenCalledWith(401);
    });

    test('should successfully fetch request statistics', async () => {
      // FIXED: Setup count mocks properly
      mockCountDocuments.mockResolvedValueOnce(5); // pending
      mockCountDocuments.mockResolvedValueOnce(10); // approved
      mockCountDocuments.mockResolvedValueOnce(2); // rejected
      
      // FIXED: Setup the chain properly for recent requests
      const mockRecentRequests = [createMockRequest()];
      mockSort.mockReturnValue({ limit: mockLimit });
      mockLimit.mockResolvedValue(mockRecentRequests);

      await getRequestStats(req, res);

      expect(mockCountDocuments).toHaveBeenCalledTimes(3);
      expect(mockFind).toHaveBeenCalled();
      expect(mockLimit).toHaveBeenCalledWith(5);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        totalCount: 17,
        pendingCount: 5,
        approvedCount: 10,
        rejectedCount: 2,
        recentRequests: mockRecentRequests
      });
    });

    test('should handle errors', async () => {
      const testError = createTestError('Database error');
      mockCountDocuments.mockRejectedValue(testError);

      await getRequestStats(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });
});
