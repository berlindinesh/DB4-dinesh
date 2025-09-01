import { jest } from '@jest/globals';

describe('Onboarding Controller', () => {
  let onboardingController;
  let req, res;
  let mockGetModelForCompany;
  let mockModel;

  beforeAll(async () => {
    // Mock dependencies before importing
    mockGetModelForCompany = jest.fn();
    
    const mockFind = jest.fn();
    const mockFindByIdAndUpdate = jest.fn();
    const mockFindByIdAndDelete = jest.fn();
    const mockSave = jest.fn();
    
    mockModel = jest.fn().mockImplementation(function(data) {
      Object.assign(this, data);
      this.save = mockSave;
      return this;
    });
    mockModel.find = mockFind;
    mockModel.findByIdAndUpdate = mockFindByIdAndUpdate;
    mockModel.findByIdAndDelete = mockFindByIdAndDelete;

    // Setup default resolved values
    mockFind.mockResolvedValue([]);
    mockFindByIdAndUpdate.mockResolvedValue(null);
    mockFindByIdAndDelete.mockResolvedValue(null);
    mockSave.mockResolvedValue({});
    mockGetModelForCompany.mockResolvedValue(mockModel);

    // Mock modules
    jest.doMock('../models/Onboarding.js', () => ({
      default: {},
      onboardingSchema: {}
    }));
    
    jest.doMock('../models/genericModelFactory.js', () => ({
      default: mockGetModelForCompany
    }));

    jest.doMock('../utils/mailer.js', () => ({
      sendOnboardingEmail: jest.fn().mockResolvedValue()
    }));

    jest.doMock('../models/Company.js', () => ({
      default: {
        findOne: jest.fn().mockResolvedValue({ name: 'Test Company' })
      }
    }));

    // Import after mocking
    const module = await import('../controllers/onboardingController.js');
    onboardingController = module;
  });

  beforeEach(() => {
    req = {
      companyCode: 'TEST_COMPANY',
      params: {},
      query: {},
      body: {}
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
  });

  // Authentication tests
  test('getCandidates - returns 401 without companyCode', async () => {
    req.companyCode = null;
    await onboardingController.getCandidates(req, res);
    expect(res.status).toHaveBeenCalledWith(401);
  });

  test('createCandidate - returns 401 without companyCode', async () => {
    req.companyCode = null;
    await onboardingController.createCandidate(req, res);
    expect(res.status).toHaveBeenCalledWith(401);
  });

  test('updateCandidate - returns 401 without companyCode', async () => {
    req.companyCode = null;
    await onboardingController.updateCandidate(req, res);
    expect(res.status).toHaveBeenCalledWith(401);
  });

  test('deleteCandidate - returns 401 without companyCode', async () => {
    req.companyCode = null;
    await onboardingController.deleteCandidate(req, res);
    expect(res.status).toHaveBeenCalledWith(401);
  });

  test('sendEmail - returns 401 without companyCode', async () => {
    req.companyCode = null;
    await onboardingController.sendEmail(req, res);
    expect(res.status).toHaveBeenCalledWith(401);
  });

  test('filterByStage - returns 401 without companyCode', async () => {
    req.companyCode = null;
    await onboardingController.filterByStage(req, res);
    expect(res.status).toHaveBeenCalledWith(401);
  });

  // Validation tests
  test('createCandidate - returns 400 without required fields', async () => {
    req.body = {};
    await onboardingController.createCandidate(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('updateCandidate - returns 400 without id', async () => {
    req.params = {};
    await onboardingController.updateCandidate(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('deleteCandidate - returns 400 without id', async () => {
    req.params = {};
    await onboardingController.deleteCandidate(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('sendEmail - returns 400 without required fields', async () => {
    req.body = {};
    await onboardingController.sendEmail(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  // Field validation tests
  test('createCandidate - validates all required fields individually', async () => {
    // Test missing name
    req.body = { email: 'test@test.com', jobPosition: 'Developer', mobile: '123456789', joiningDate: '2025-01-01' };
    await onboardingController.createCandidate(req, res);
    expect(res.status).toHaveBeenCalledWith(400);

    // Reset mock
    res.status.mockClear();

    // Test missing email
    req.body = { name: 'John Doe', jobPosition: 'Developer', mobile: '123456789', joiningDate: '2025-01-01' };
    await onboardingController.createCandidate(req, res);
    expect(res.status).toHaveBeenCalledWith(400);

    // Reset mock
    res.status.mockClear();

    // Test missing jobPosition
    req.body = { name: 'John Doe', email: 'test@test.com', mobile: '123456789', joiningDate: '2025-01-01' };
    await onboardingController.createCandidate(req, res);
    expect(res.status).toHaveBeenCalledWith(400);

    // Reset mock
    res.status.mockClear();

    // Test missing mobile
    req.body = { name: 'John Doe', email: 'test@test.com', jobPosition: 'Developer', joiningDate: '2025-01-01' };
    await onboardingController.createCandidate(req, res);
    expect(res.status).toHaveBeenCalledWith(400);

    // Reset mock
    res.status.mockClear();

    // Test missing joiningDate
    req.body = { name: 'John Doe', email: 'test@test.com', jobPosition: 'Developer', mobile: '123456789' };
    await onboardingController.createCandidate(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('sendEmail - validates all required fields individually', async () => {
    // Test missing email
    req.body = { name: 'John Doe', jobPosition: 'Developer', joiningDate: '2025-01-01' };
    await onboardingController.sendEmail(req, res);
    expect(res.status).toHaveBeenCalledWith(400);

    // Reset mock
    res.status.mockClear();

    // Test missing name
    req.body = { email: 'test@test.com', jobPosition: 'Developer', joiningDate: '2025-01-01' };
    await onboardingController.sendEmail(req, res);
    expect(res.status).toHaveBeenCalledWith(400);

    // Reset mock
    res.status.mockClear();

    // Test missing jobPosition
    req.body = { email: 'test@test.com', name: 'John Doe', joiningDate: '2025-01-01' };
    await onboardingController.sendEmail(req, res);
    expect(res.status).toHaveBeenCalledWith(400);

    // Reset mock
    res.status.mockClear();

    // Test missing joiningDate
    req.body = { email: 'test@test.com', name: 'John Doe', jobPosition: 'Developer' };
    await onboardingController.sendEmail(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  // Success scenario tests
  test('getCandidates - returns candidates successfully', async () => {
    await onboardingController.getCandidates(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  test('filterByStage - filters candidates successfully', async () => {
    req.query = { stage: 'Interview' };
    await onboardingController.filterByStage(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  test('createCandidate - creates candidate with all required fields', async () => {
    req.body = {
      name: 'John Doe',
      email: 'john@test.com',
      jobPosition: 'Developer',
      mobile: '123456789',
      joiningDate: '2025-01-01'
    };
    await onboardingController.createCandidate(req, res);
    expect(res.status).toHaveBeenCalledWith(201);
  });
});
