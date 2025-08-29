// tests/skillZoneController.test.js
import mockingoose from 'mockingoose';
import SkillZone, { skillZoneSchema } from '../models/SkillZone.js';
import {
  getAllSkills,
  addSkill,
  addCandidate,
  updateCandidate,
  deleteCandidate,
  deleteSkill,
} from '../controllers/skillZoneController.js';

// Mock the factory to return the real mongoose model so mockingoose works
import getModelForCompany from '../models/genericModelFactory.js';
jest.mock('../models/genericModelFactory.js', () => ({
  __esModule: true,
  default: jest.fn(() => SkillZone),
}));

const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('SkillZone Controller', () => {
  let req, res;

  beforeEach(() => {
    mockingoose.resetAll();
    res = mockRes();
    req = { companyCode: 'COMP123', body: {}, params: {} };
  });

  describe('getAllSkills', () => {
    it('should return 401 if no companyCode', async () => {
      req.companyCode = null;
      await getAllSkills(req, res);
      expect(res.status).toHaveBeenCalledWith(401);
    });

    it('should return skills list', async () => {
      mockingoose(SkillZone).toReturn([{ name: 'React' }], 'find');
      await getAllSkills(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith([{ name: 'React' }]);
    });

    it('should handle error', async () => {
      mockingoose(SkillZone).toReturn(new Error('DB error'), 'find');
      await getAllSkills(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('addSkill', () => {
    it('should return 400 if name missing', async () => {
      await addSkill(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should create new skill', async () => {
      req.body = { name: 'Node.js' };
      const savedSkill = { name: 'Node.js' };
      mockingoose(SkillZone).toReturn(savedSkill, 'save');
      await addSkill(req, res);
      expect(res.status).toHaveBeenCalledWith(201);
    });
  });

  // Similarly apply mockingoose for addCandidate, updateCandidate, deleteCandidate, deleteSkill
  // using SkillZone findById, save, and findByIdAndDelete mocks respectively.
});
