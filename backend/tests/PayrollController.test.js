import { jest } from '@jest/globals';

describe('PayrollController', () => {
  let PayrollController;
  let req, res;
  let mockGetModelForCompany;
  let mockModel;

  beforeAll(async () => {
    // Mock dependencies before importing
    mockGetModelForCompany = jest.fn();
    
    const mockFind = jest.fn();
    const mockFindOne = jest.fn();
    const mockFindOneAndUpdate = jest.fn();
    const mockFindOneAndDelete = jest.fn();
    const mockSave = jest.fn();
    
    mockModel = jest.fn().mockImplementation(function(data) {
      Object.assign(this, data);
      this.save = mockSave;
      return this;
    });
    mockModel.find = mockFind;
    mockModel.findOne = mockFindOne;
    mockModel.findOneAndUpdate = mockFindOneAndUpdate;
    mockModel.findOneAndDelete = mockFindOneAndDelete;
    mockModel.findByUser = jest.fn();
    mockModel.findByEmpIdAndUser = jest.fn();

    // Setup default resolved values
    mockFind.mockResolvedValue([]);
    mockFindOne.mockResolvedValue(null);
    mockFindOneAndUpdate.mockResolvedValue(null);
    mockFindOneAndDelete.mockResolvedValue(null);
    mockSave.mockResolvedValue({});
    mockGetModelForCompany.mockResolvedValue(mockModel);

    // Mock modules
    jest.doMock('../models/UnifiedPayroll.js', () => ({
      default: {},
      unifiedPayrollSchema: {}
    }));
    
    jest.doMock('../models/genericModelFactory.js', () => ({
      default: mockGetModelForCompany
    }));

    jest.doMock('../services/PayrollPDFService.js', () => ({
      PayrollPDFService: {
        generatePayslipPDF: jest.fn().mockResolvedValue('/path/to/pdf')
      }
    }));

    jest.doMock('fs', () => ({
      default: {
        existsSync: jest.fn().mockReturnValue(true)
      }
    }));

    // Import after mocking
    const module = await import('../controllers/PayrollController.js');
    PayrollController = module.PayrollController;
  });

  beforeEach(() => {
    req = {
      companyCode: 'TEST_COMPANY',
      userId: 'user123',
      userEmail: 'user@test.com',
      params: {},
      query: {},
      body: {},
      headers: { authorization: 'Bearer token' },
      user: { _id: 'user123', email: 'user@test.com' }
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      download: jest.fn(),
      setHeader: jest.fn()
    };
  });

  // Basic validation tests that should work
  test('bulkCreateEmployees - returns 401 without companyCode', async () => {
    req.companyCode = null;
    await PayrollController.bulkCreateEmployees(req, res);
    expect(res.status).toHaveBeenCalledWith(401);
  });

  test('createEmployee - returns 401 without companyCode', async () => {
    req.companyCode = null;
    await PayrollController.createEmployee(req, res);
    expect(res.status).toHaveBeenCalledWith(401);
  });

  test('getAllEmployees - returns 401 without companyCode', async () => {
    req.companyCode = null;
    await PayrollController.getAllEmployees(req, res);
    expect(res.status).toHaveBeenCalledWith(401);
  });

  test('updateEmployee - returns 401 without companyCode', async () => {
    req.companyCode = null;
    await PayrollController.updateEmployee(req, res);
    expect(res.status).toHaveBeenCalledWith(401);
  });

  test('updateEmployeeLOP - returns 401 without companyCode', async () => {
    req.companyCode = null;
    await PayrollController.updateEmployeeLOP(req, res);
    expect(res.status).toHaveBeenCalledWith(401);
  });

  test('deleteEmployee - returns 401 without companyCode', async () => {
    req.companyCode = null;
    await PayrollController.deleteEmployee(req, res);
    expect(res.status).toHaveBeenCalledWith(401);
  });

  test('createAllowance - returns 401 without companyCode', async () => {
    req.companyCode = null;
    await PayrollController.createAllowance(req, res);
    expect(res.status).toHaveBeenCalledWith(401);
  });

  test('createDeduction - returns 401 without companyCode', async () => {
    req.companyCode = null;
    await PayrollController.createDeduction(req, res);
    expect(res.status).toHaveBeenCalledWith(401);
  });

  test('generatePayslip - returns 401 without companyCode', async () => {
    req.companyCode = null;
    await PayrollController.generatePayslip(req, res);
    expect(res.status).toHaveBeenCalledWith(401);
  });

  test('bulkGeneratePayslips - returns 401 without companyCode', async () => {
    req.companyCode = null;
    await PayrollController.bulkGeneratePayslips(req, res);
    expect(res.status).toHaveBeenCalledWith(401);
  });

  test('downloadPayslip - returns 401 without companyCode', async () => {
    req.companyCode = null;
    await PayrollController.downloadPayslip(req, res);
    expect(res.status).toHaveBeenCalledWith(401);
  });

  test('getPayslipsByEmployee - returns 401 without companyCode', async () => {
    req.companyCode = null;
    await PayrollController.getPayslipsByEmployee(req, res);
    expect(res.status).toHaveBeenCalledWith(401);
  });

  test('getPayslipsByMonth - returns 401 without companyCode', async () => {
    req.companyCode = null;
    await PayrollController.getPayslipsByMonth(req, res);
    expect(res.status).toHaveBeenCalledWith(401);
  });

  test('getAllPayslips - returns 401 without companyCode', async () => {
    req.companyCode = null;
    await PayrollController.getAllPayslips(req, res);
    expect(res.status).toHaveBeenCalledWith(401);
  });

  test('calculateBaseAfterDeductions - returns 401 without companyCode', async () => {
    req.companyCode = null;
    await PayrollController.calculateBaseAfterDeductions(req, res);
    expect(res.status).toHaveBeenCalledWith(401);
  });

  test('getUserPayslips - returns 401 without companyCode', async () => {
    req.companyCode = null;
    await PayrollController.getUserPayslips(req, res);
    expect(res.status).toHaveBeenCalledWith(401);
  });

  test('downloadUserPayslip - returns 401 without companyCode', async () => {
    req.companyCode = null;
    await PayrollController.downloadUserPayslip(req, res);
    expect(res.status).toHaveBeenCalledWith(401);
  });

  test('linkUserToEmployee - returns 401 without companyCode', async () => {
    req.companyCode = null;
    await PayrollController.linkUserToEmployee(req, res);
    expect(res.status).toHaveBeenCalledWith(401);
  });

  test('getAllAllowances - returns 401 without companyCode', async () => {
    req.companyCode = null;
    await PayrollController.getAllAllowances(req, res);
    expect(res.status).toHaveBeenCalledWith(401);
  });

  test('updateAllowance - returns 401 without companyCode', async () => {
    req.companyCode = null;
    await PayrollController.updateAllowance(req, res);
    expect(res.status).toHaveBeenCalledWith(401);
  });

  test('deleteAllowance - returns 401 without companyCode', async () => {
    req.companyCode = null;
    await PayrollController.deleteAllowance(req, res);
    expect(res.status).toHaveBeenCalledWith(401);
  });

  test('getAllDeductions - returns 401 without companyCode', async () => {
    req.companyCode = null;
    await PayrollController.getAllDeductions(req, res);
    expect(res.status).toHaveBeenCalledWith(401);
  });

  test('updateDeduction - returns 401 without companyCode', async () => {
    req.companyCode = null;
    await PayrollController.updateDeduction(req, res);
    expect(res.status).toHaveBeenCalledWith(401);
  });

  test('deleteDeduction - returns 401 without companyCode', async () => {
    req.companyCode = null;
    await PayrollController.deleteDeduction(req, res);
    expect(res.status).toHaveBeenCalledWith(401);
  });

  // Additional basic validation tests
  test('linkUserToEmployee - returns 400 without empId', async () => {
    req.body = {};
    await PayrollController.linkUserToEmployee(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('getUserPayslips - returns 401 without userId', async () => {
    req.userId = null;
    req.user = null;
    await PayrollController.getUserPayslips(req, res);
    expect(res.status).toHaveBeenCalledWith(401);
  });

  test('downloadUserPayslip - returns 401 without userId', async () => {
    req.userId = null;
    req.user = null;
    await PayrollController.downloadUserPayslip(req, res);
    expect(res.status).toHaveBeenCalledWith(401);
  });
});
