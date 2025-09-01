import { jest } from '@jest/globals';

// Create a safe error helper function
const createTestError = (message) => ({
  message,
  toString: () => message
});

// Mock all external dependencies
const mockSave = jest.fn();
const mockSort = jest.fn();
const mockFind = jest.fn();
const mockFindOne = jest.fn();
const mockFindById = jest.fn();
const mockFindByIdAndUpdate = jest.fn();
const mockFindByIdAndDelete = jest.fn();
const mockCreate = jest.fn();
const mockToObject = jest.fn();

// Create mock timesheet model
const mockCompanyTimesheet = {
  find: mockFind,
  findOne: mockFindOne,
  findById: mockFindById,
  findByIdAndUpdate: mockFindByIdAndUpdate,
  findByIdAndDelete: mockFindByIdAndDelete,
  create: mockCreate
};

// Mock timesheet instance
const createMockTimesheet = (overrides = {}) => ({
  _id: 'timesheet123',
  employeeId: 'emp123',
  employeeName: 'John Doe',
  checkInTime: new Date('2025-08-29T09:00:00Z'),
  checkOutTime: null,
  duration: null,
  status: 'active',
  autoCheckOut: false,
  save: jest.fn().mockResolvedValue({}),
  toObject: jest.fn().mockReturnValue({}),
  ...overrides
});

// Mock getModelForCompany
const mockGetModelForCompany = jest.fn();

// Mock modules
jest.unstable_mockModule('../models/Timesheet.js', () => ({
  default: {},
  timesheetSchema: {}
}));

jest.unstable_mockModule('../models/genericModelFactory.js', () => ({
  default: mockGetModelForCompany
}));

// Import the controller functions after mocking
const {
  checkIn,
  checkOut,
  forceCheckIn,
  getTodayTimesheet,
  getWeeklyTimesheets,
  getAllTimesheets,
  getTimesheetById,
  updateTimesheet,
  deleteTimesheet,
  getTimesheetsByDateRange
} = await import('../controllers/timesheetController.js');

describe('Timesheet Controller', () => {
  let req, res, consoleSpy, consoleErrorSpy;

  beforeEach(() => {
    // Reset all mocks with safe defaults
    jest.clearAllMocks();
    
    // Setup model mock
    mockGetModelForCompany.mockResolvedValue(mockCompanyTimesheet);
    
    // Setup find chain mock with safe defaults
    mockFind.mockReturnValue({ sort: mockSort });
    mockSort.mockResolvedValue([]);
    mockSave.mockResolvedValue({});
    mockCreate.mockResolvedValue(createMockTimesheet());
    mockToObject.mockReturnValue({});
    mockFindOne.mockResolvedValue(null);
    mockFindById.mockResolvedValue(null);
    mockFindByIdAndUpdate.mockResolvedValue(null);
    mockFindByIdAndDelete.mockResolvedValue(null);

    // Mock req and res
    req = {
      companyCode: 'TEST_COMPANY',
      params: {},
      query: {},
      body: {},
      user: { role: 'employee' }
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

  describe('checkIn', () => {
    test('should return 401 when companyCode is missing', async () => {
      req.companyCode = null;
      
      await checkIn(req, res);
      
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Authentication required',
        message: 'Company code not found in request'
      });
    });

    test('should return 400 when employeeId is missing', async () => {
      req.body = { employeeName: 'John Doe' };
      
      await checkIn(req, res);
      
      expect(res.status).toHaveBeenCalledWith(400);
    });

    test('should successfully check in when no active session exists', async () => {
      req.body = { employeeId: 'emp123', employeeName: 'John Doe' };
      const mockTimesheet = createMockTimesheet();
      
      mockFindOne.mockResolvedValue(null);
      mockCreate.mockResolvedValue(mockTimesheet);
      mockTimesheet.toObject.mockReturnValue(mockTimesheet);

      await checkIn(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
    });

    test('should handle errors gracefully', async () => {
      req.body = { employeeId: 'emp123', employeeName: 'John Doe' };
      const testError = createTestError('Database error');
      mockFindOne.mockRejectedValue(testError);

      await checkIn(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('checkOut', () => {
    test('should return 401 when companyCode is missing', async () => {
      req.companyCode = null;
      
      await checkOut(req, res);
      
      expect(res.status).toHaveBeenCalledWith(401);
    });

    test('should return 400 when employeeId is missing', async () => {
      req.body = {};
      
      await checkOut(req, res);
      
      expect(res.status).toHaveBeenCalledWith(400);
    });

    test('should return 400 when no active check-in found', async () => {
      req.body = { employeeId: 'emp123' };
      mockFindOne.mockResolvedValue(null);

      await checkOut(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    test('should successfully check out', async () => {
      req.body = { employeeId: 'emp123' };
      const activeTimesheet = createMockTimesheet();
      
      mockFindOne.mockResolvedValue(activeTimesheet);

      await checkOut(req, res);

      expect(res.json).toHaveBeenCalledWith(activeTimesheet);
    });

    test('should handle errors', async () => {
      req.body = { employeeId: 'emp123' };
      const testError = createTestError('Database error');
      mockFindOne.mockRejectedValue(testError);

      await checkOut(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('forceCheckIn', () => {
    test('should return 401 when companyCode is missing', async () => {
      req.companyCode = null;
      
      await forceCheckIn(req, res);
      
      expect(res.status).toHaveBeenCalledWith(401);
    });

    test('should successfully force check-in', async () => {
      req.body = { employeeId: 'emp123', employeeName: 'John Doe' };
      const newTimesheet = createMockTimesheet();
      
      mockFindOne.mockResolvedValue(null);
      mockCreate.mockResolvedValue(newTimesheet);
      newTimesheet.toObject.mockReturnValue(newTimesheet);

      await forceCheckIn(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
    });

    test('should handle errors', async () => {
      req.body = { employeeId: 'emp123', employeeName: 'John Doe' };
      const testError = createTestError('Database error');
      mockFindOne.mockRejectedValue(testError);

      await forceCheckIn(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('getTodayTimesheet', () => {
    test('should return 401 when companyCode is missing', async () => {
      req.companyCode = null;
      
      await getTodayTimesheet(req, res);
      
      expect(res.status).toHaveBeenCalledWith(401);
    });

    test('should return 400 when employeeId is missing', async () => {
      req.query = {};
      
      await getTodayTimesheet(req, res);
      
      expect(res.status).toHaveBeenCalledWith(400);
    });

    test('should successfully fetch today\'s timesheet', async () => {
      req.query = { employeeId: 'emp123' };
      const mockTimesheet = createMockTimesheet();
      mockSort.mockResolvedValue(mockTimesheet);

      await getTodayTimesheet(req, res);

      expect(res.json).toHaveBeenCalled();
    });

    test('should handle errors', async () => {
      req.query = { employeeId: 'emp123' };
      const testError = createTestError('Database error');
      mockSort.mockRejectedValue(testError);

      await getTodayTimesheet(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('getWeeklyTimesheets', () => {
    test('should return 401 when companyCode is missing', async () => {
      req.companyCode = null;
      
      await getWeeklyTimesheets(req, res);
      
      expect(res.status).toHaveBeenCalledWith(401);
    });

    test('should return 400 when employeeId is missing', async () => {
      req.query = {};
      
      await getWeeklyTimesheets(req, res);
      
      expect(res.status).toHaveBeenCalledWith(400);
    });

    test('should successfully fetch weekly timesheets', async () => {
      req.query = { employeeId: 'emp123' };
      const mockTimesheets = [createMockTimesheet()];
      mockSort.mockResolvedValue(mockTimesheets);

      await getWeeklyTimesheets(req, res);

      expect(res.json).toHaveBeenCalled();
    });

    test('should handle errors', async () => {
      req.query = { employeeId: 'emp123' };
      const testError = createTestError('Database error');
      mockSort.mockRejectedValue(testError);

      await getWeeklyTimesheets(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('getAllTimesheets', () => {
    test('should return 401 when companyCode is missing', async () => {
      req.companyCode = null;
      
      await getAllTimesheets(req, res);
      
      expect(res.status).toHaveBeenCalledWith(401);
    });

    test('should fetch all timesheets without filter', async () => {
      const mockTimesheets = [createMockTimesheet()];
      mockSort.mockResolvedValue(mockTimesheets);

      await getAllTimesheets(req, res);

      expect(mockFind).toHaveBeenCalledWith({});
      expect(res.json).toHaveBeenCalledWith(mockTimesheets);
    });

    test('should handle errors', async () => {
      const testError = createTestError('Database error');
      mockSort.mockRejectedValue(testError);

      await getAllTimesheets(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('getTimesheetById', () => {
    test('should return 401 when companyCode is missing', async () => {
      req.companyCode = null;
      
      await getTimesheetById(req, res);
      
      expect(res.status).toHaveBeenCalledWith(401);
    });

    test('should return 400 when id is missing', async () => {
      req.params = {};
      
      await getTimesheetById(req, res);
      
      expect(res.status).toHaveBeenCalledWith(400);
    });

    test('should successfully fetch timesheet by id', async () => {
      req.params = { id: 'timesheet123' };
      const mockTimesheet = createMockTimesheet();
      mockFindById.mockResolvedValue(mockTimesheet);

      await getTimesheetById(req, res);

      expect(mockFindById).toHaveBeenCalledWith('timesheet123');
      expect(res.json).toHaveBeenCalledWith(mockTimesheet);
    });

    test('should return 404 when timesheet not found', async () => {
      req.params = { id: 'nonexistent' };
      mockFindById.mockResolvedValue(null);

      await getTimesheetById(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    test('should handle errors', async () => {
      req.params = { id: 'timesheet123' };
      const testError = createTestError('Database error');
      mockFindById.mockRejectedValue(testError);

      await getTimesheetById(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('updateTimesheet', () => {
    test('should return 401 when companyCode is missing', async () => {
      req.companyCode = null;
      
      await updateTimesheet(req, res);
      
      expect(res.status).toHaveBeenCalledWith(401);
    });

    test('should return 400 when id is missing', async () => {
      req.params = {};
      
      await updateTimesheet(req, res);
      
      expect(res.status).toHaveBeenCalledWith(400);
    });

    test('should successfully update timesheet', async () => {
      req.params = { id: 'timesheet123' };
      req.body = { status: 'completed' };
      const mockTimesheet = createMockTimesheet({ status: 'completed' });
      mockFindByIdAndUpdate.mockResolvedValue(mockTimesheet);

      await updateTimesheet(req, res);

      expect(res.json).toHaveBeenCalledWith(mockTimesheet);
    });

    test('should return 404 when timesheet not found', async () => {
      req.params = { id: 'nonexistent' };
      req.body = { status: 'completed' };
      mockFindByIdAndUpdate.mockResolvedValue(null);

      await updateTimesheet(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    test('should handle errors', async () => {
      req.params = { id: 'timesheet123' };
      req.body = { status: 'completed' };
      const testError = createTestError('Database error');
      mockFindByIdAndUpdate.mockRejectedValue(testError);

      await updateTimesheet(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('deleteTimesheet', () => {
    test('should return 401 when companyCode is missing', async () => {
      req.companyCode = null;
      
      await deleteTimesheet(req, res);
      
      expect(res.status).toHaveBeenCalledWith(401);
    });

    test('should return 400 when id is missing', async () => {
      req.params = {};
      
      await deleteTimesheet(req, res);
      
      expect(res.status).toHaveBeenCalledWith(400);
    });

    test('should successfully delete timesheet', async () => {
      req.params = { id: 'timesheet123' };
      const mockTimesheet = createMockTimesheet();
      mockFindByIdAndDelete.mockResolvedValue(mockTimesheet);

      await deleteTimesheet(req, res);

      expect(mockFindByIdAndDelete).toHaveBeenCalledWith('timesheet123');
      expect(res.json).toHaveBeenCalled();
    });

    test('should return 404 when timesheet not found', async () => {
      req.params = { id: 'nonexistent' };
      mockFindByIdAndDelete.mockResolvedValue(null);

      await deleteTimesheet(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    test('should handle errors', async () => {
      req.params = { id: 'timesheet123' };
      const testError = createTestError('Database error');
      mockFindByIdAndDelete.mockRejectedValue(testError);

      await deleteTimesheet(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('getTimesheetsByDateRange', () => {
    test('should return 401 when companyCode is missing', async () => {
      req.companyCode = null;
      
      await getTimesheetsByDateRange(req, res);
      
      expect(res.status).toHaveBeenCalledWith(401);
    });

    test('should return 400 when required parameters are missing', async () => {
      req.query = { employeeId: 'emp123' };
      
      await getTimesheetsByDateRange(req, res);
      
      expect(res.status).toHaveBeenCalledWith(400);
    });

    test('should successfully fetch timesheets by date range', async () => {
      req.query = {
        employeeId: 'emp123',
        startDate: '2025-08-01',
        endDate: '2025-08-31'
      };
      const mockTimesheets = [createMockTimesheet()];
      mockSort.mockResolvedValue(mockTimesheets);

      await getTimesheetsByDateRange(req, res);

      expect(res.json).toHaveBeenCalledWith(mockTimesheets);
    });

    test('should handle errors', async () => {
      req.query = {
        employeeId: 'emp123',
        startDate: '2025-08-01',
        endDate: '2025-08-31'
      };
      const testError = createTestError('Database error');
      mockSort.mockRejectedValue(testError);

      await getTimesheetsByDateRange(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });
});
