import { jest } from '@jest/globals';

describe('Policy Controller', () => {
  let policyController;
  let req, res;
  let mockGetModelForCompany;
  let mockPolicyModel;

  beforeAll(async () => {
    // Mock the dependencies before importing
    mockGetModelForCompany = jest.fn();
    
    // Mock the model methods
    const mockFind = jest.fn();
    const mockSort = jest.fn();
    const mockFindByIdAndUpdate = jest.fn();
    const mockFindByIdAndDelete = jest.fn();
    const mockSave = jest.fn();

    mockPolicyModel = jest.fn().mockImplementation(function(data) {
      Object.assign(this, data);
      this.save = mockSave;
      return this;
    });
    mockPolicyModel.find = mockFind;
    mockPolicyModel.findByIdAndUpdate = mockFindByIdAndUpdate;
    mockPolicyModel.findByIdAndDelete = mockFindByIdAndDelete;

    // Setup chain
    mockFind.mockReturnValue({ sort: mockSort });
    mockSort.mockResolvedValue([]);
    mockSave.mockResolvedValue({ _id: 'test', title: 'Test Policy' });
    mockFindByIdAndUpdate.mockResolvedValue(null);
    mockFindByIdAndDelete.mockResolvedValue(null);

    mockGetModelForCompany.mockResolvedValue(mockPolicyModel);

    // Mock modules
    jest.doMock('../models/Policy.js', () => ({
      default: {},
      policySchema: {}
    }));
    
    jest.doMock('../models/genericModelFactory.js', () => ({
      default: mockGetModelForCompany
    }));

    // Now import the controller
    const module = await import('../controllers/policyController.js');
    policyController = module.policyController;
  });

  beforeEach(() => {
    req = {
      companyCode: 'TEST_COMPANY',
      params: {},
      body: {}
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
  });

  // Simplified tests that focus on the main logic
  test('getAllPolicies - should return 401 when companyCode is missing', async () => {
    req.companyCode = null;
    await policyController.getAllPolicies(req, res);
    expect(res.status).toHaveBeenCalledWith(401);
  });

  test('getAllPolicies - should return policies', async () => {
    await policyController.getAllPolicies(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  test('createPolicy - should return 401 when companyCode is missing', async () => {
    req.companyCode = null;
    await policyController.createPolicy(req, res);
    expect(res.status).toHaveBeenCalledWith(401);
  });

  test('createPolicy - should return 400 when title missing', async () => {
    req.body = { content: 'test' };
    await policyController.createPolicy(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('createPolicy - should return 400 when content missing', async () => {
    req.body = { title: 'test' };
    await policyController.createPolicy(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('createPolicy - should create policy when valid data provided', async () => {
    req.body = { title: 'Test Policy', content: 'Test content' };
    await policyController.createPolicy(req, res);
    expect(res.status).toHaveBeenCalledWith(201);
  });

  test('updatePolicy - should return 401 when companyCode is missing', async () => {
    req.companyCode = null;
    await policyController.updatePolicy(req, res);
    expect(res.status).toHaveBeenCalledWith(401);
  });

  test('updatePolicy - should return 400 when id missing', async () => {
    req.params = {};
    await policyController.updatePolicy(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('deletePolicy - should return 401 when companyCode is missing', async () => {
    req.companyCode = null;
    await policyController.deletePolicy(req, res);
    expect(res.status).toHaveBeenCalledWith(401);
  });

  test('deletePolicy - should return 400 when id missing', async () => {
    req.params = {};
    await policyController.deletePolicy(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });
});
