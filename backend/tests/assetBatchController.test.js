// tests/assetBatchController.test.js
import {
  jest,
  describe,
  test,
  expect,
  beforeEach,
} from '@jest/globals';
 
// ✅ Make it a jest.fn() (so we can call new MockAssetBatch())
const MockAssetBatch = jest.fn();
 
// Static methods
MockAssetBatch.find = jest.fn();
MockAssetBatch.findById = jest.fn();
MockAssetBatch.findByIdAndUpdate = jest.fn();
MockAssetBatch.findByIdAndDelete = jest.fn();
MockAssetBatch.findOne = jest.fn();
 
// Special: .find().sort() chaining
MockAssetBatch.find.mockImplementation(() => ({
  sort: jest.fn().mockResolvedValue([{ batchNumber: 'B1' }]),
}));
 
// ✅ Mock genericModelFactory to return our fake model
jest.unstable_mockModule('../models/genericModelFactory.js', () => {
  return {
    __esModule: true,
    default: jest.fn(() => MockAssetBatch),
  };
});
 
// Import controller AFTER mocking
const {
  createAssetBatch,
  getAllAssetBatches,
  getAssetBatchById,
  updateAssetBatch,
  deleteAssetBatch,
  getAssetBatchByNumber,
} = await import('../controllers/assetBatchController.js');
 
describe('AssetBatch Controller', () => {
  let req, res;
 
  beforeEach(() => {
    req = { body: {}, params: {}, companyCode: 'testCo' };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
 
    jest.clearAllMocks();
  });
 
  test('createAssetBatch should create a new batch', async () => {
    req.body = { batchNumber: 'B1', assetId: 'A1' };
 
    // no duplicate batch
    MockAssetBatch.findOne.mockResolvedValue(null);
 
    // ✅ mock "new AssetBatch()" returning an object with save()
    MockAssetBatch.mockImplementation(() => ({
      save: jest.fn().mockResolvedValue(req.body),
    }));
 
    await createAssetBatch(req, res);
 
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(req.body);
  });
 
  test('getAllAssetBatches should return all batches', async () => {
    await getAllAssetBatches(req, res);
    expect(res.json).toHaveBeenCalledWith([{ batchNumber: 'B1' }]);
  });
 
  test('getAssetBatchById should return a batch by id', async () => {
    req.params.id = '123';
    const batch = { _id: '123', batchNumber: 'B1' };
    MockAssetBatch.findById.mockResolvedValue(batch);
 
    await getAssetBatchById(req, res);
 
    expect(res.json).toHaveBeenCalledWith(batch);
  });
 
  test('updateAssetBatch should update a batch', async () => {
    req.params.id = '123';
    req.body = { batchNumber: 'B2' };
    const updatedBatch = { _id: '123', batchNumber: 'B2' };
    MockAssetBatch.findByIdAndUpdate.mockResolvedValue(updatedBatch);
 
    await updateAssetBatch(req, res);
 
    expect(res.json).toHaveBeenCalledWith(updatedBatch);
  });
 
  test('deleteAssetBatch should delete a batch', async () => {
    req.params.id = '123';
    const deletedBatch = { _id: '123', batchNumber: 'B1' };
    MockAssetBatch.findByIdAndDelete.mockResolvedValue(deletedBatch);
 
    await deleteAssetBatch(req, res);
 
    expect(res.json).toHaveBeenCalledWith({ message: 'Batch deleted successfully' });
  });
 
  test('getAssetBatchByNumber should return a batch by batchNumber', async () => {
    req.params.batchNumber = 'B1';
    const batch = { batchNumber: 'B1' };
    MockAssetBatch.findOne.mockResolvedValue(batch);
 
    await getAssetBatchByNumber(req, res);
 
    expect(res.json).toHaveBeenCalledWith(batch);
  });
});