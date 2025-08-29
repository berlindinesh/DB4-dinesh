import mockingoose from 'mockingoose';
import SkillZone from '../models/SkillZone.js';
import {
  getAllSkills,
  addSkill,
  addCandidate,
  updateCandidate,
  deleteCandidate,
  deleteSkill,
} from '../controllers/skillZoneController.js';

import getModelForCompany from '../models/genericModelFactory.js';

jest.mock('../models/genericModelFactory.js', () => ({
  __esModule: true,
  default: jest.fn(() => SkillZone),
}));

// Use fake timers to prevent async import-after-teardown issues
jest.useFakeTimers();

const mockRes = () => {
  const res = {};
  res.status = jest.fn(() => res);
  res.json = jest.fn(() => res);
  return res;
};

describe('SkillZone Controller', () => {
  let req;
  let res;

  beforeEach(() => {
    res = mockRes();
    mockingoose.resetAll();
    req = { companyCode: 'COMP123', body: {}, params: {} };
  });

  // ---- Tests for getAllSkills ----
  it('getAllSkills returns 401 if no companyCode', async () => {
    req.companyCode = null;
    await getAllSkills(req, res);
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it('getAllSkills returns skill list', async () => {
    mockingoose(SkillZone).toReturn([{ name: 'React' }], 'find');
    await getAllSkills(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith([{ name: 'React' }]);
  });

  it('getAllSkills handles errors', async () => {
    mockingoose(SkillZone).toReturn(new Error('DB error'), 'find');
    await getAllSkills(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
  });

  // ---- Tests for addSkill ----
  it('addSkill returns 401 if no companyCode', async () => {
    req.companyCode = null;
    req.body = { name: 'Node.js' };
    await addSkill(req, res);
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it('addSkill returns 400 if no name', async () => {
    await addSkill(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('addSkill creates a skill', async () => {
    req.body = { name: 'Node.js' };
    mockingoose(SkillZone).toReturn(req.body, 'save');
    await addSkill(req, res);
    expect(res.status).toHaveBeenCalledWith(201);
  });

  it('addSkill handles validation error', async () => {
    const error = new Error('Validation error');
    error.name = 'ValidationError';
    error.errors = { name: { message: 'Name is required' } };
    mockingoose(SkillZone).toReturn(error, 'save');
    req.body = { name: 'Test' };
    await addSkill(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('addSkill handles generic error', async () => {
    mockingoose(SkillZone).toReturn(new Error('Generic error'), 'save');
    req.body = { name: 'Test' };
    await addSkill(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
  });

  // ---- Tests for addCandidate ----
  beforeEach(() => {
    req.params = { skillId: '507f191e810c19729de860ea' };
    req.body = { name: 'John Doe', reason: 'Qualified' };
  });

  it('addCandidate returns 401 if no companyCode', async () => {
    req.companyCode = null;
    await addCandidate(req, res);
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it('addCandidate returns 400 if name or reason missing', async () => {
    req.body = { name: '', reason: '' };
    await addCandidate(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('addCandidate returns 404 if skill not found', async () => {
    mockingoose(SkillZone).toReturn(null, 'findOne');
    await addCandidate(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('addCandidate adds candidate successfully', async () => {
    const skill = {
      _id: req.params.skillId,
      name: 'Test Skill',
      candidates: [],
      save: jest.fn().mockResolvedValue(true),
    };
    mockingoose(SkillZone).toReturn(skill, 'findOne');
    await addCandidate(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('addCandidate handles invalid ObjectId error', async () => {
    const error = new Error('Cast error');
    error.name = 'CastError';
    error.kind = 'ObjectId';
    mockingoose(SkillZone).toReturn(error, 'findOne');
    await addCandidate(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('addCandidate handles generic errors', async () => {
    mockingoose(SkillZone).toReturn(new Error('DB error'), 'findOne');
    await addCandidate(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
  });

  // You can add similar tests for updateCandidate, deleteCandidate, and deleteSkill following the same pattern as described earlier.

});

afterAll(() => {
  jest.runOnlyPendingTimers();
});
