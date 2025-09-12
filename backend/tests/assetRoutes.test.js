import express from 'express';
import request from 'supertest';
import { jest } from '@jest/globals';

// --- Mock controller ---
const mockCreateAssetsFromBatch = jest.fn((req, res) => {
  res.status(201).json({ message: 'Assets created' });
});

// Mock the controller module
jest.unstable_mockModule('../controllers/assetController.js', () => ({
  __esModule: true,
  createAssetsFromBatch: mockCreateAssetsFromBatch,
}));

// Import the router after mocks
const router = (await import('../routes/assetRoutes.js')).default;

// Setup Express app for testing
const app = express();
app.use(express.json());
app.use(router);

describe('Asset Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('POST /api/assets/from-batch → createAssetsFromBatch', async () => {
    const res = await request(app)
      .post('/api/assets/from-batch')
      .send({ batchName: 'Test Batch' });

    expect(res.status).toBe(201);
    expect(res.body).toEqual({ message: 'Assets created' });
    expect(mockCreateAssetsFromBatch).toHaveBeenCalledTimes(1);
  });
});
