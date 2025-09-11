import { jest } from '@jest/globals';
import request from 'supertest';
import express from 'express';

// --- Mock controllers ---
const mockGetAll = jest.fn((req, res) => res.status(200).json({ route: 'getAll' }));
const mockGetById = jest.fn((req, res) =>
  res.status(200).json({ route: 'getById', id: req.params.id })
);
const mockGetByNumber = jest.fn((req, res) =>
  res.status(200).json({ route: 'getByNumber', batchNumber: req.params.batchNumber })
);
const mockCreate = jest.fn((req, res) =>
  res.status(201).json({ route: 'create' })
);
const mockUpdate = jest.fn((req, res) =>
  res.status(200).json({ route: 'update', id: req.params.id })
);
const mockDelete = jest.fn((req, res) =>
  res.status(200).json({ route: 'delete', id: req.params.id })
);
const mockGetAssets = jest.fn((req, res) =>
  res.status(200).json({ route: 'getAssetsByBatch', batchNumber: req.params.batchNumber })
);

// Mock controller module
jest.unstable_mockModule('../controllers/assetBatchController.js', () => ({
  __esModule: true,
  getAllAssetBatches: mockGetAll,
  getAssetBatchById: mockGetById,
  getAssetBatchByNumber: mockGetByNumber,
  createAssetBatch: mockCreate,
  updateAssetBatch: mockUpdate,
  deleteAssetBatch: mockDelete,
  getAssetsByBatch: mockGetAssets,
}));

// --- Mock middleware ---
const mockAuth = jest.fn((req, res, next) => next());
jest.unstable_mockModule('../middleware/companyAuth.js', () => ({
  __esModule: true,
  authenticate: mockAuth,
}));

// Import router after mocks
const router = (await import('../routes/assetBatchRoutes.js')).default;

// Setup test app
const app = express();
app.use(express.json());
app.use('/batches', router);

describe('Asset Batch Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('applies authentication middleware to all routes', async () => {
    await request(app).get('/batches');
    await request(app).get('/batches/by-number/BN001');
    await request(app).get('/batches/BN001/assets');
    await request(app).get('/batches/123');
    await request(app).post('/batches').send({});
    await request(app).put('/batches/123').send({});
    await request(app).delete('/batches/123');

    expect(mockAuth).toHaveBeenCalledTimes(7);
  });

  it('GET /batches → getAllAssetBatches', async () => {
    const res = await request(app).get('/batches');
    expect(res.status).toBe(200);
    expect(res.body.route).toBe('getAll');
    expect(mockGetAll).toHaveBeenCalled();
  });

  it('GET /batches/by-number/:batchNumber → getAssetBatchByNumber', async () => {
    const res = await request(app).get('/batches/by-number/BN123');
    expect(res.status).toBe(200);
    expect(res.body.batchNumber).toBe('BN123');
    expect(mockGetByNumber).toHaveBeenCalled();
  });

  it('GET /batches/:batchNumber/assets → getAssetsByBatch', async () => {
    const res = await request(app).get('/batches/BN555/assets');
    expect(res.status).toBe(200);
    expect(res.body.batchNumber).toBe('BN555');
    expect(mockGetAssets).toHaveBeenCalled();
  });

  it('GET /batches/:id → getAssetBatchById', async () => {
    const res = await request(app).get('/batches/789');
    expect(res.status).toBe(200);
    expect(res.body.id).toBe('789');
    expect(mockGetById).toHaveBeenCalled();
  });

  it('POST /batches → createAssetBatch', async () => {
    const res = await request(app).post('/batches').send({ name: 'BatchA' });
    expect(res.status).toBe(201);
    expect(res.body.route).toBe('create');
    expect(mockCreate).toHaveBeenCalled();
  });

  it('PUT /batches/:id → updateAssetBatch', async () => {
    const res = await request(app).put('/batches/321').send({ name: 'Updated' });
    expect(res.status).toBe(200);
    expect(res.body.id).toBe('321');
    expect(mockUpdate).toHaveBeenCalled();
  });

  it('DELETE /batches/:id → deleteAssetBatch', async () => {
    const res = await request(app).delete('/batches/654');
    expect(res.status).toBe(200);
    expect(res.body.id).toBe('654');
    expect(mockDelete).toHaveBeenCalled();
  });
});
