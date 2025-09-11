// tests/applicantProfileRoutes.test.js
import { jest } from '@jest/globals';
import request from 'supertest';
import express from 'express';

// --- Mock Controllers ---
const mockGetAll = jest.fn((req, res) => res.status(200).json({ route: 'getAllApplicantProfiles' }));
const mockCreate = jest.fn((req, res) => res.status(201).json({ route: 'createApplicantProfile' }));
const mockDelete = jest.fn((req, res) => res.status(200).json({ route: 'deleteApplicantProfile', id: req.params.id }));
const mockBatchDelete = jest.fn((req, res) => res.status(200).json({ route: 'batchDeleteApplicantProfiles' }));

jest.unstable_mockModule('../controllers/applicantProfileController.js', () => ({
  __esModule: true,
  getAllApplicantProfiles: mockGetAll,
  createApplicantProfile: mockCreate,
  deleteApplicantProfile: mockDelete,
  batchDeleteApplicantProfiles: mockBatchDelete,
}));

// --- Mock Middleware ---
const mockAuth = jest.fn((req, res, next) => next());
jest.unstable_mockModule('../middleware/companyAuth.js', () => ({
  __esModule: true,
  authenticate: mockAuth,
}));

// --- Import router after mocks ---
const router = (await import('../routes/applicantProfileRoutes.js')).default;

// --- Setup app for testing ---
const app = express();
app.use(express.json());
app.use('/applicants', router);

describe('ApplicantProfile Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should call authenticate middleware for all routes', async () => {
    await request(app).get('/applicants');
    await request(app).post('/applicants').send({});
    await request(app).delete('/applicants/123');
    await request(app).delete('/applicants/batch');

    // Authenticate should run 4 times
    expect(mockAuth).toHaveBeenCalledTimes(4);
  });

  it('GET /applicants should call getAllApplicantProfiles', async () => {
    const res = await request(app).get('/applicants');
    expect(res.status).toBe(200);
    expect(res.body.route).toBe('getAllApplicantProfiles');
    expect(mockGetAll).toHaveBeenCalled();
  });

  it('POST /applicants should call createApplicantProfile', async () => {
    const res = await request(app).post('/applicants').send({ name: 'Test' });
    expect(res.status).toBe(201);
    expect(res.body.route).toBe('createApplicantProfile');
    expect(mockCreate).toHaveBeenCalled();
  });

  it('DELETE /applicants/:id should call deleteApplicantProfile with id', async () => {
    const res = await request(app).delete('/applicants/abc123');
    expect(res.status).toBe(200);
    expect(res.body.id).toBe('abc123');
    expect(mockDelete).toHaveBeenCalled();
  });
});
