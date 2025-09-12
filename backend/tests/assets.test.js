import express from 'express';
import request from 'supertest';
import { jest } from '@jest/globals';

// --- Mock Asset model ---
const mockSave = jest.fn();
const mockFind = jest.fn();
const mockFindByIdAndUpdate = jest.fn();
const mockFindByIdAndDelete = jest.fn();

jest.unstable_mockModule('../models/Asset.js', () => ({
  __esModule: true,
  default: class Asset {
    constructor(data) {
      Object.assign(this, data);
    }
    save = mockSave;
    static find = mockFind;
    static findByIdAndUpdate = mockFindByIdAndUpdate;
    static findByIdAndDelete = mockFindByIdAndDelete;
  },
}));

// Import router after mocks
const router = (await import('../routes/assets.js')).default;

// Setup Express app
const app = express();
app.use(express.json());
app.use('/api/assets', router);

describe('Asset Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // GET /api/assets
  it('GET /api/assets → returns all assets', async () => {
    const mockAssets = [{ name: 'Asset1' }];
    mockFind.mockResolvedValue(mockAssets);

    const res = await request(app).get('/api/assets');
    expect(res.status).toBe(200);
    expect(res.body).toEqual(mockAssets);
    expect(mockFind).toHaveBeenCalledWith({});
  });

  it('GET /api/assets → filters by category', async () => {
    const mockAssets = [{ name: 'Asset1', category: 'Electronics' }];
    mockFind.mockResolvedValue(mockAssets);

    const res = await request(app).get('/api/assets?category=Electronics');
    expect(res.status).toBe(200);
    expect(res.body).toEqual(mockAssets);
    expect(mockFind).toHaveBeenCalledWith({ category: 'Electronics' });
  });

  it('GET /api/assets → filters by name', async () => {
    const mockAssets = [{ name: 'Laptop' }];
    mockFind.mockResolvedValue(mockAssets);

    const res = await request(app).get('/api/assets?name=Laptop');
    expect(res.status).toBe(200);
    expect(res.body).toEqual(mockAssets);
    expect(mockFind).toHaveBeenCalledWith({ name: { $regex: 'Laptop', $options: 'i' } });
  });

  it('GET /api/assets → handles errors', async () => {
    mockFind.mockRejectedValue(new Error('DB error'));

    const res = await request(app).get('/api/assets');
    expect(res.status).toBe(500);
    expect(res.body).toEqual({ error: 'Error fetching assets' });
  });

  // POST /api/assets
  it('POST /api/assets → creates asset', async () => {
    const mockAsset = { name: 'NewAsset' };
    mockSave.mockResolvedValue(mockAsset);

    const res = await request(app).post('/api/assets').send(mockAsset);
    expect(res.status).toBe(201);
    expect(res.body).toEqual(mockAsset);
  });

  it('POST /api/assets → handles save error', async () => {
    mockSave.mockRejectedValue(new Error('DB error'));

    const res = await request(app).post('/api/assets').send({ name: 'FailAsset' });
    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: 'Error adding asset' });
  });

  // PUT /api/assets/:id
  it('PUT /api/assets/:id → updates asset', async () => {
    const mockAsset = { name: 'UpdatedAsset' };
    mockFindByIdAndUpdate.mockResolvedValue(mockAsset);

    const res = await request(app).put('/api/assets/123').send({ name: 'UpdatedAsset' });
    expect(res.status).toBe(200);
    expect(res.body).toEqual(mockAsset);
  });

  it('PUT /api/assets/:id → asset not found', async () => {
    mockFindByIdAndUpdate.mockResolvedValue(null);

    const res = await request(app).put('/api/assets/123').send({ name: 'UpdatedAsset' });
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: 'Asset not found' });
  });

  it('PUT /api/assets/:id → handles error', async () => {
    mockFindByIdAndUpdate.mockRejectedValue(new Error('DB error'));

    const res = await request(app).put('/api/assets/123').send({ name: 'FailUpdate' });
    expect(res.status).toBe(500);
    expect(res.body).toEqual({ error: 'Error updating asset' });
  });

  // DELETE /api/assets/:id
  it('DELETE /api/assets/:id → deletes asset', async () => {
    mockFindByIdAndDelete.mockResolvedValue({ id: '123' });

    const res = await request(app).delete('/api/assets/123');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ message: 'Asset deleted successfully' });
  });

  it('DELETE /api/assets/:id → asset not found', async () => {
    mockFindByIdAndDelete.mockResolvedValue(null);

    const res = await request(app).delete('/api/assets/123');
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: 'Asset not found' });
  });

  it('DELETE /api/assets/:id → handles error', async () => {
    mockFindByIdAndDelete.mockRejectedValue(new Error('DB error'));

    const res = await request(app).delete('/api/assets/123');
    expect(res.status).toBe(500);
    expect(res.body).toEqual({ error: 'Error deleting asset' });
  });
});
