// tests/organizationRoutes.test.js
import request from 'supertest';
import express from 'express';
import { jest } from '@jest/globals';

// --- MOCK CONTROLLERS ---
const mockControllers = {
  getOrganizationChart: jest.fn((req, res) => res.status(200).json({ chart: [] })),
  addPosition: jest.fn((req, res) => res.status(200).json({ message: 'Position added' })),
  updatePosition: jest.fn((req, res) => res.status(200).json({ message: 'Position updated' })),
  deletePosition: jest.fn((req, res) => res.status(200).json({ message: 'Position deleted' })),
  getAllPositions: jest.fn((req, res) => res.status(200).json([{ id: '1', name: 'CEO' }])),
  getPosition: jest.fn((req, res) => res.status(200).json({ id: req.params.id, name: 'CEO' })),
};

// --- MOCK MIDDLEWARE ---
const mockAuthenticate = jest.fn((req, res, next) => next());

// --- MOCK MODULES BEFORE IMPORTING ROUTER ---
jest.unstable_mockModule('../controllers/organizationController.js', () => mockControllers);
jest.unstable_mockModule('../middleware/companyAuth.js', () => ({ authenticate: mockAuthenticate }));

// --- DYNAMIC IMPORT OF ROUTER AFTER MOCKING ---
let router;
beforeAll(async () => {
  router = (await import('../routes/organizationRoutes.js')).default;
});

// --- SETUP EXPRESS APP ---
const app = express();
app.use(express.json());
app.use('/organization', (req, res, next) => router(req, res, next)); // use router

// --- TEST SUITE ---
describe('Organization Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('GET /organization/chart', async () => {
    const res = await request(app).get('/organization/chart');
    expect(res.status).toBe(200);
    expect(res.body.chart).toEqual([]);
    expect(mockAuthenticate).toHaveBeenCalled();
    expect(mockControllers.getOrganizationChart).toHaveBeenCalled();
  });

  it('GET /organization/positions', async () => {
    const res = await request(app).get('/organization/positions');
    expect(res.status).toBe(200);
    expect(res.body[0].name).toBe('CEO');
    expect(mockControllers.getAllPositions).toHaveBeenCalled();
  });

  it('GET /organization/positions/:id', async () => {
    const res = await request(app).get('/organization/positions/1');
    expect(res.status).toBe(200);
    expect(res.body.id).toBe('1');
    expect(mockControllers.getPosition).toHaveBeenCalled();
  });

  it('POST /organization/positions', async () => {
    const res = await request(app).post('/organization/positions').send({ name: 'Manager' });
    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Position added');
    expect(mockControllers.addPosition).toHaveBeenCalled();
  });

  it('PUT /organization/positions/:id', async () => {
    const res = await request(app).put('/organization/positions/1').send({ name: 'Director' });
    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Position updated');
    expect(mockControllers.updatePosition).toHaveBeenCalled();
  });

  it('DELETE /organization/positions/:id', async () => {
    const res = await request(app).delete('/organization/positions/1');
    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Position deleted');
    expect(mockControllers.deletePosition).toHaveBeenCalled();
  });
});
