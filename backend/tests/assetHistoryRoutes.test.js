import { jest } from '@jest/globals';
import request from 'supertest';
import express from 'express';

// --- Mock controllers ---
const mockGetAll = jest.fn((req, res) =>
  res.status(200).json({ route: 'getAllAssets' })
);
const mockCreate = jest.fn((req, res) =>
  res.status(201).json({ route: 'createAsset' })
);
const mockUpdate = jest.fn((req, res) =>
  res.status(200).json({ route: 'updateAsset', id: req.params.id })
);
const mockDelete = jest.fn((req, res) =>
  res.status(200).json({ route: 'deleteAsset', id: req.params.id })
);
const mockSummary = jest.fn((req, res) =>
  res.status(200).json({ route: 'getSummaryData' })
);

// Mock controller module
jest.unstable_mockModule('../controllers/assetHistoryController.js', () => ({
  __esModule: true,
  getAllAssets: mockGetAll,
  createAsset: mockCreate,
  updateAsset: mockUpdate,
  deleteAsset: mockDelete,
  getSummaryData: mockSummary,
}));

// --- Mock middleware ---
const mockAuth = jest.fn((req, res, next) => next());
jest.unstable_mockModule('../middleware/companyAuth.js', () => ({
  __esModule: true,
  authenticate: mockAuth,
}));

// Import router after mocks
const router = (await import('../routes/assetHistory.js')).default;

// Setup test app
const app = express();
app.use(express.json());
app.use('/assets', router);

describe('Asset History Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('applies authentication middleware to all routes', async () => {
    await request(app).get('/assets');
    await request(app).get('/assets/summary');
    await request(app).post('/assets').send({});
    await request(app).put('/assets/123').send({});
    await request(app).delete('/assets/123');

    expect(mockAuth).toHaveBeenCalledTimes(5);
  });

  it('GET /assets → getAllAssets', async () => {
    const res = await request(app).get('/assets');
    expect(res.status).toBe(200);
    expect(res.body.route).toBe('getAllAssets');
    expect(mockGetAll).toHaveBeenCalled();
  });

  it('GET /assets/summary → getSummaryData', async () => {
    const res = await request(app).get('/assets/summary');
    expect(res.status).toBe(200);
    expect(res.body.route).toBe('getSummaryData');
    expect(mockSummary).toHaveBeenCalled();
  });

  it('POST /assets → createAsset', async () => {
    const res = await request(app).post('/assets').send({ name: 'Test Asset' });
    expect(res.status).toBe(201);
    expect(res.body.route).toBe('createAsset');
    expect(mockCreate).toHaveBeenCalled();
  });

  it('PUT /assets/:id → updateAsset', async () => {
    const res = await request(app).put('/assets/abc123').send({ name: 'Updated' });
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ route: 'updateAsset', id: 'abc123' });
    expect(mockUpdate).toHaveBeenCalled();
  });

  it('DELETE /assets/:id → deleteAsset', async () => {
    const res = await request(app).delete('/assets/xyz789');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ route: 'deleteAsset', id: 'xyz789' });
    expect(mockDelete).toHaveBeenCalled();
  });
});
