import { jest } from '@jest/globals';
import request from 'supertest';
import express from 'express';

// --- Mock AssetHistory model ---
const mockCountDocuments = jest.fn();
const mockAggregate = jest.fn();

jest.unstable_mockModule('../models/AssetHistory.js', () => ({
  __esModule: true,
  default: {
    countDocuments: mockCountDocuments,
    aggregate: mockAggregate,
  },
}));

// Import router after mocking
const router = (await import('../routes/assetDashboardRoutes.js')).default;

// Setup test app
const app = express();
app.use('/dashboard', router);

describe('Asset Dashboard Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('GET /dashboard/summary → returns summary data (success case)', async () => {
    mockCountDocuments
      .mockResolvedValueOnce(10) // totalAssets
      .mockResolvedValueOnce(7); // assetsInUse
    mockAggregate
      .mockResolvedValueOnce([{ _id: 'Laptop', count: 5 }]) // categoryData
      .mockResolvedValueOnce([{ _id: 'In Use', count: 7 }]); // statusData

    const res = await request(app).get('/dashboard/summary');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      totalAssets: 10,
      assetsInUse: 7,
      categoryData: [{ _id: 'Laptop', count: 5 }],
      statusData: [{ _id: 'In Use', count: 7 }],
    });

    expect(mockCountDocuments).toHaveBeenCalledTimes(2);
    expect(mockAggregate).toHaveBeenCalledTimes(2);
  });

  it('GET /dashboard/summary → returns 500 on error (error case)', async () => {
    mockCountDocuments.mockRejectedValue(new Error('DB error'));

    const res = await request(app).get('/dashboard/summary');

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ message: 'Error fetching summary data' });
  });
});
