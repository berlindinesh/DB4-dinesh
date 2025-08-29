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
const MockRotatingWorktypeConstructor = jest.fn().mockImplementation(function(data) {
  this.data = data;
  this.save = mockSave;
  return this;
});

const mockCompanyRotatingWorktype = MockRotatingWorktypeConstructor;
mockCompanyRotatingWorktype.find = mockFind;
mockCompanyRotatingWorktype.findByIdAndUpdate = mockFindByIdAndUpdate;
mockCompanyRotatingWorktype.findByIdAndDelete = mockFindByIdAndDelete;
mockCompanyRotatingWorktype.findById = mockFindById;
mockCompanyRotatingWorktype.updateMany = mockUpdateMany;

const mockNotification = jest.fn().mockImplementation(function(data) {
  this.data = data;
  this.save = mockSave;
  return this;
});

const mockGetModelForCompany = jest.fn();

// Mock modules
jest.unstable_mockModule('../models/RotatingWorktype.js', () => ({
  default: MockRotatingWorktypeConstructor,
  rotatingWorktypeSchema: {}
}));

jest.unstable_mockModule('../models/Notification.js', () => ({
  default: mockNotification
}));

jest.unstable_mockModule('../models/genericModelFactory.js', () => ({
  default: mockGetModelForCompany
}));

// Import the controller functions after mocking
const {
  getAllWorktypes,
  getUserWorktypes,
  createWorktype,
  updateWorktype,
  deleteWorktype,
  approveWorktype,
  rejectWorktype,
  bulkApproveWorktypes,
  bulkRejectWorktypes,
  getWorktypesByEmployeeCode
} = await import('../controllers/rotatingWorktypeController.js');

describe('Rotating Worktype Controller', () => {
  let req, res, mockIo, consoleSpy, consoleErrorSpy;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Setup model mock
    mockGetModelForCompany.mockResolvedValue(mockCompanyRotatingWorktype);
    
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

  describe('getAllWorktypes', () => {
    test('should return 401 when companyCode is missing', async () => {
      req.companyCode = null;
      await getAllWorktypes(req, res);
      
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Authentication required',
        message: 'Company code not found in request'
      });
    });

    test('should fetch all worktypes without filters', async () => {
      const mockWorktypes = [{ id: '1', userId: 'user1' }];
      mockSort.mockResolvedValue(mockWorktypes);

      await getAllWorktypes(req, res);

      expect(mockFind).toHaveBeenCalledWith({});
      expect(mockSort).toHaveBeenCalledWith('-createdAt');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockWorktypes);
    });

    test('should fetch worktypes with userId filter', async () => {
      req.query.userId = 'user123';
      const mockWorktypes = [{ id: '1', userId: 'user123' }];
      mockSort.mockResolvedValue(mockWorktypes);

      await getAllWorktypes(req, res);

      expect(mockFind).toHaveBeenCalledWith({ userId: 'user123' });
      expect(res.status).toHaveBeenCalledWith(200);
    });

    test('should fetch worktypes with isForReview filter true', async () => {
      req.query.isForReview = 'true';
      const mockWorktypes = [{ id: '1', isForReview: true }];
      mockSort.mockResolvedValue(mockWorktypes);

      await getAllWorktypes(req, res);

      expect(mockFind).toHaveBeenCalledWith({ isForReview: true });
      expect(res.status).toHaveBeenCalledWith(200);
    });

    test('should fetch worktypes with isForReview filter false', async () => {
      req.query.isForReview = 'false';
      const mockWorktypes = [{ id: '1', isForReview: false }];
      mockSort.mockResolvedValue(mockWorktypes);

      await getAllWorktypes(req, res);

      expect(mockFind).toHaveBeenCalledWith({ isForReview: false });
      expect(res.status).toHaveBeenCalledWith(200);
    });

    test('should handle errors with development stack trace', async () => {
      process.env.NODE_ENV = 'development';
      const testError = createTestError('Database error');
      testError.stack = 'Error stack trace';
      mockSort.mockRejectedValue(testError);

      await getAllWorktypes(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Error fetching worktypes',
        message: 'Database error',
        stack: 'Error stack trace'
      });
    });

    test('should handle errors without stack trace in production', async () => {
      process.env.NODE_ENV = 'production';
      const testError = createTestError('Database error');
      mockSort.mockRejectedValue(testError);

      await getAllWorktypes(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Error fetching worktypes',
        message: 'Database error',
        stack: undefined
      });
    });
  });

  describe('getUserWorktypes', () => {
    test('should return 401 when companyCode is missing', async () => {
      req.companyCode = null;
      await getUserWorktypes(req, res);
      
      expect(res.status).toHaveBeenCalledWith(401);
    });

    test('should return 400 when userId is missing', async () => {
      await getUserWorktypes(req, res);
      
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Invalid request',
        message: 'User ID is required'
      });
    });

    test('should successfully fetch user worktypes', async () => {
      req.params.userId = 'user123';
      const mockWorktypes = [{ id: '1', userId: 'user123' }];
      mockSort.mockResolvedValue(mockWorktypes);

      await getUserWorktypes(req, res);

      expect(mockFind).toHaveBeenCalledWith({ userId: 'user123' });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockWorktypes);
    });

    test('should handle errors', async () => {
      req.params.userId = 'user123';
      const testError = createTestError('Database error');
      mockSort.mockRejectedValue(testError);

      await getUserWorktypes(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('createWorktype', () => {
    test('should return 401 when companyCode is missing', async () => {
      req.companyCode = null;
      await createWorktype(req, res);
      
      expect(res.status).toHaveBeenCalledWith(401);
    });

    test('should return 400 when userId is missing', async () => {
      req.body = {};
      await createWorktype(req, res);
      
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Invalid request',
        message: 'User ID is required'
      });
    });

    test('should successfully create a worktype', async () => {
      req.body = { userId: 'user123', requestedWorktype: 'Day Shift' };
      const mockSavedWorktype = { id: '1', ...req.body };
      mockSave.mockResolvedValue(mockSavedWorktype);

      await createWorktype(req, res);

      expect(mockSave).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(mockSavedWorktype);
    });

    test('should handle creation errors', async () => {
      req.body = { userId: 'user123' };
      const testError = createTestError('Validation error');
      mockSave.mockRejectedValue(testError);

      await createWorktype(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe('updateWorktype', () => {
    test('should return 401 when companyCode is missing', async () => {
      req.companyCode = null;
      await updateWorktype(req, res);
      
      expect(res.status).toHaveBeenCalledWith(401);
    });

    test('should successfully update worktype without userId check', async () => {
      req.params.id = 'worktype123';
      req.body = { status: 'Updated' };
      const mockUpdatedWorktype = { id: 'worktype123', status: 'Updated' };
      mockFindByIdAndUpdate.mockResolvedValue(mockUpdatedWorktype);

      await updateWorktype(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockUpdatedWorktype);
    });

    test('should return 404 when worktype not found during ownership check', async () => {
      req.params.id = 'nonexistent';
      req.body = { userId: 'user123' };
      mockFindById.mockResolvedValue(null);

      await updateWorktype(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Not found',
        message: 'Worktype request not found'
      });
    });

    test('should return 403 when user does not own the worktype', async () => {
      req.params.id = 'worktype123';
      req.body = { userId: 'user123' };
      const mockWorktype = { id: 'worktype123', userId: 'differentUser' };
      mockFindById.mockResolvedValue(mockWorktype);

      await updateWorktype(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Forbidden',
        message: 'You do not have permission to update this request'
      });
    });

    test('should successfully update when user owns the worktype', async () => {
      req.params.id = 'worktype123';
      req.body = { userId: 'user123', status: 'Updated' };
      const mockWorktype = { id: 'worktype123', userId: 'user123' };
      const mockUpdatedWorktype = { ...mockWorktype, status: 'Updated' };
      
      mockFindById.mockResolvedValue(mockWorktype);
      mockFindByIdAndUpdate.mockResolvedValue(mockUpdatedWorktype);

      await updateWorktype(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockUpdatedWorktype);
    });

    test('should return 404 when worktype not found for update', async () => {
      req.params.id = 'nonexistent';
      req.body = { status: 'Updated' };
      mockFindByIdAndUpdate.mockResolvedValue(null);

      await updateWorktype(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    test('should handle update errors', async () => {
      req.params.id = 'worktype123';
      const testError = createTestError('Update error');
      mockFindByIdAndUpdate.mockRejectedValue(testError);

      await updateWorktype(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe('deleteWorktype', () => {
    test('should return 401 when companyCode is missing', async () => {
      req.companyCode = null;
      await deleteWorktype(req, res);
      
      expect(res.status).toHaveBeenCalledWith(401);
    });

    test('should successfully delete worktype without ownership check', async () => {
      req.params.id = 'worktype123';
      const mockDeletedWorktype = { id: 'worktype123' };
      mockFindByIdAndDelete.mockResolvedValue(mockDeletedWorktype);

      await deleteWorktype(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Worktype request deleted successfully'
      });
    });

    test('should return 404 when worktype not found during ownership check', async () => {
      req.params.id = 'nonexistent';
      req.query.userId = 'user123';
      mockFindById.mockResolvedValue(null);

      await deleteWorktype(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    test('should return 403 when user does not own the worktype', async () => {
      req.params.id = 'worktype123';
      req.query.userId = 'user123';
      const mockWorktype = { id: 'worktype123', userId: 'differentUser' };
      mockFindById.mockResolvedValue(mockWorktype);

      await deleteWorktype(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
    });

    test('should successfully delete when user owns the worktype', async () => {
      req.params.id = 'worktype123';
      req.query.userId = 'user123';
      const mockWorktype = { id: 'worktype123', userId: 'user123' };
      const mockDeletedWorktype = { id: 'worktype123' };
      
      mockFindById.mockResolvedValue(mockWorktype);
      mockFindByIdAndDelete.mockResolvedValue(mockDeletedWorktype);

      await deleteWorktype(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
    });

    test('should return 404 when worktype not found for deletion', async () => {
      req.params.id = 'nonexistent';
      mockFindByIdAndDelete.mockResolvedValue(null);

      await deleteWorktype(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    test('should handle deletion errors', async () => {
      req.params.id = 'worktype123';
      const testError = createTestError('Delete error');
      mockFindByIdAndDelete.mockRejectedValue(testError);

      await deleteWorktype(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe('approveWorktype', () => {
    test('should return 401 when companyCode is missing', async () => {
      req.companyCode = null;
      await approveWorktype(req, res);
      
      expect(res.status).toHaveBeenCalledWith(401);
    });

    test('should return 404 when worktype not found', async () => {
      req.params.id = 'nonexistent';
      mockFindById.mockResolvedValue(null);

      await approveWorktype(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    test('should successfully approve worktype with notification', async () => {
      req.params.id = 'worktype123';
      req.body = { reviewerName: 'Manager' };
      const mockWorktype = {
        id: 'worktype123',
        userId: 'user123',
        requestedWorktype: 'Day Shift',
        requestedDate: new Date(),
        requestedTill: new Date()
      };
      const mockUpdatedWorktype = { ...mockWorktype, status: 'Approved' };
      
      mockFindById.mockResolvedValue(mockWorktype);
      mockFindByIdAndUpdate.mockResolvedValue(mockUpdatedWorktype);
      mockSave.mockResolvedValue({});

      await approveWorktype(req, res);

      expect(mockNotification).toHaveBeenCalled();
      expect(mockIo.to).toHaveBeenCalledWith('user123');
      expect(mockIo.emit).toHaveBeenCalledWith('new-notification', expect.any(Object));
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockUpdatedWorktype);
    });

    test('should handle notification errors gracefully', async () => {
      req.params.id = 'worktype123';
      const mockWorktype = {
        id: 'worktype123',
        userId: 'user123',
        requestedWorktype: 'Day Shift',
        requestedDate: new Date(),
        requestedTill: new Date()
      };
      const mockUpdatedWorktype = { ...mockWorktype, status: 'Approved' };
      
      mockFindById.mockResolvedValue(mockWorktype);
      mockFindByIdAndUpdate.mockResolvedValue(mockUpdatedWorktype);
      mockSave.mockRejectedValue(createTestError('Notification error'));

      await approveWorktype(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
    });

    test('should handle missing io gracefully', async () => {
      req.params.id = 'worktype123';
      req.app.get = jest.fn().mockReturnValue(null);
      const mockWorktype = {
        id: 'worktype123',
        userId: 'user123',
        requestedWorktype: 'Day Shift',
        requestedDate: new Date(),
        requestedTill: new Date()
      };
      const mockUpdatedWorktype = { ...mockWorktype, status: 'Approved' };
      
      mockFindById.mockResolvedValue(mockWorktype);
      mockFindByIdAndUpdate.mockResolvedValue(mockUpdatedWorktype);
      mockSave.mockResolvedValue({});

      await approveWorktype(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
    });

    test('should handle approval errors', async () => {
      req.params.id = 'worktype123';
      const testError = createTestError('Approval error');
      mockFindById.mockRejectedValue(testError);

      await approveWorktype(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe('rejectWorktype', () => {
    test('should return 401 when companyCode is missing', async () => {
      req.companyCode = null;
      await rejectWorktype(req, res);
      
      expect(res.status).toHaveBeenCalledWith(401);
    });

    test('should return 404 when worktype not found', async () => {
      req.params.id = 'nonexistent';
      mockFindById.mockResolvedValue(null);

      await rejectWorktype(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    test('should successfully reject worktype with notification', async () => {
      req.params.id = 'worktype123';
      req.body = { reviewerName: 'Manager' };
      const mockWorktype = {
        id: 'worktype123',
        userId: 'user123',
        requestedWorktype: 'Day Shift',
        requestedDate: new Date(),
        requestedTill: new Date()
      };
      const mockUpdatedWorktype = { ...mockWorktype, status: 'Rejected' };
      
      mockFindById.mockResolvedValue(mockWorktype);
      mockFindByIdAndUpdate.mockResolvedValue(mockUpdatedWorktype);
      mockSave.mockResolvedValue({});

      await rejectWorktype(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockUpdatedWorktype);
    });

    test('should handle rejection errors', async () => {
      req.params.id = 'worktype123';
      const testError = createTestError('Rejection error');
      mockFindById.mockRejectedValue(testError);

      await rejectWorktype(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe('bulkApproveWorktypes', () => {
    test('should return 401 when companyCode is missing', async () => {
      req.companyCode = null;
      await bulkApproveWorktypes(req, res);
      
      expect(res.status).toHaveBeenCalledWith(401);
    });

    test('should return 400 when no IDs provided', async () => {
      req.body = {};
      await bulkApproveWorktypes(req, res);
      
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Invalid request',
        message: 'No worktype IDs provided for bulk approval'
      });
    });

    test('should return 400 when empty IDs array provided', async () => {
      req.body = { ids: [] };
      await bulkApproveWorktypes(req, res);
      
      expect(res.status).toHaveBeenCalledWith(400);
    });

    test('should successfully bulk approve worktypes', async () => {
      req.body = {
        ids: ['worktype1', 'worktype2'],
        reviewerName: 'Manager'
      };
      const mockWorktypes = [
        {
          _id: 'worktype1',
          userId: 'user1',
          requestedWorktype: 'Day Shift',
          requestedDate: new Date(),
          requestedTill: new Date()
        },
        {
          _id: 'worktype2',
          userId: 'user2',
          requestedWorktype: 'Night Shift',
          requestedDate: new Date(),
          requestedTill: new Date()
        }
      ];
      
      mockFind.mockResolvedValue(mockWorktypes);
      mockUpdateMany.mockResolvedValue({ modifiedCount: 2 });
      mockSave.mockResolvedValue({});

      await bulkApproveWorktypes(req, res);

      expect(mockFind).toHaveBeenCalledWith({ _id: { $in: ['worktype1', 'worktype2'] } });
      expect(mockUpdateMany).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: '2 worktype requests approved successfully'
      });
    });

    test('should handle notification errors during bulk approve', async () => {
      req.body = {
        ids: ['worktype1'],
        reviewerName: 'Manager'
      };
      const mockWorktypes = [
        {
          _id: 'worktype1',
          userId: 'user1',
          requestedWorktype: 'Day Shift',
          requestedDate: new Date(),
          requestedTill: new Date()
        }
      ];
      
      mockFind.mockResolvedValue(mockWorktypes);
      mockUpdateMany.mockResolvedValue({ modifiedCount: 1 });
      mockSave.mockRejectedValue(createTestError('Notification error'));

      await bulkApproveWorktypes(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
    });

    test('should handle bulk approval errors', async () => {
      req.body = { ids: ['worktype1', 'worktype2'] };
      const testError = createTestError('Bulk approval error');
      mockFind.mockRejectedValue(testError);

      await bulkApproveWorktypes(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe('bulkRejectWorktypes', () => {
    test('should return 401 when companyCode is missing', async () => {
      req.companyCode = null;
      await bulkRejectWorktypes(req, res);
      
      expect(res.status).toHaveBeenCalledWith(401);
    });

    test('should return 400 when no IDs provided', async () => {
      req.body = {};
      await bulkRejectWorktypes(req, res);
      
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Invalid request',
        message: 'No worktype IDs provided for bulk rejection'
      });
    });

    test('should successfully bulk reject worktypes', async () => {
      req.body = {
        ids: ['worktype1', 'worktype2'],
        reviewerName: 'Manager'
      };
      const mockWorktypes = [
        {
          _id: 'worktype1',
          userId: 'user1',
          requestedWorktype: 'Day Shift',
          requestedDate: new Date(),
          requestedTill: new Date()
        }
      ];
      
      mockFind.mockResolvedValue(mockWorktypes);
      mockUpdateMany.mockResolvedValue({ modifiedCount: 2 });
      mockSave.mockResolvedValue({});

      await bulkRejectWorktypes(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: '2 worktype requests rejected successfully'
      });
    });

    test('should handle bulk rejection errors', async () => {
      req.body = { ids: ['worktype1', 'worktype2'] };
      const testError = createTestError('Bulk rejection error');
      mockFind.mockRejectedValue(testError);

      await bulkRejectWorktypes(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe('getWorktypesByEmployeeCode', () => {
    test('should return 401 when companyCode is missing', async () => {
      req.companyCode = null;
      await getWorktypesByEmployeeCode(req, res);
      
      expect(res.status).toHaveBeenCalledWith(401);
    });

    test('should return 400 when employeeCode is missing', async () => {
      await getWorktypesByEmployeeCode(req, res);
      
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Invalid request',
        message: 'Employee code is required'
      });
    });

    test('should successfully fetch worktypes by employee code', async () => {
      req.params.employeeCode = 'EMP123';
      const mockWorktypes = [{ id: '1', employeeCode: 'EMP123' }];
      mockSort.mockResolvedValue(mockWorktypes);

      await getWorktypesByEmployeeCode(req, res);

      expect(mockFind).toHaveBeenCalledWith({ employeeCode: 'EMP123' });
      expect(mockSort).toHaveBeenCalledWith('-createdAt');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockWorktypes);
    });

    test('should handle errors', async () => {
      req.params.employeeCode = 'EMP123';
      const testError = createTestError('Database error');
      mockSort.mockRejectedValue(testError);

      await getWorktypesByEmployeeCode(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });
});
