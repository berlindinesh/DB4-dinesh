import mockingoose from 'mockingoose';
import SkillZone from '../models/SkillZone.js';
import getModelForCompany from '../models/genericModelFactory.js';
import {
  getAllSkills,
  addSkill,
  addCandidate,
  updateCandidate,
  deleteCandidate,
  deleteSkill,
} from '../controllers/skillZoneController.js';

// Mock the factory to return the mongoose model so mockingoose works correctly
jest.mock('../models/genericModelFactory.js', () => ({
  __esModule: true,
  default: jest.fn(() => SkillZone),
}));

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
    mockingoose.resetAll();
    req = { companyCode: 'COMP123', body: {}, params: {} };
    res = mockRes();
  });

  describe('getAllSkills', () => {
    it('should return 401 if no companyCode', async () => {
      req.companyCode = null;
      await getAllSkills(req, res);
      expect(res.status).toHaveBeenCalledWith(401);
    });

    it('should return list of skills', async () => {
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

    it('should add a new skill', async () => {
      req.body = { name: 'Node.js' };
      mockingoose(SkillZone).toReturn(req.body, 'save');
      await addSkill(req, res);
      expect(res.status).toHaveBeenCalledWith(201);
    });
  });

  describe('addCandidate', () => {
    it('should return 400 if required fields missing', async () => {
      req.params.skillId = '507f1f77bcf86cd799439011';
      req.body = {};
      await addCandidate(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should add candidate', async () => {
      req.params.skillId = '507f1f77bcf86cd799439011';
      req.body = { name: 'Alice', reason: 'Good dev' };
      const skill = {
        _id: req.params.skillId,
        name: 'React',
        candidates: [],
        save: jest.fn(),
      };
      mockingoose(SkillZone).toReturn(skill, 'findOne');
      await addCandidate(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(skill.save).toHaveBeenCalled();
    });
  });

  describe('updateCandidate', () => {
    it('should return 404 if candidate not found', async () => {
      req.params = { skillId: '507f1f77bcf86cd799439011', candidateId: '2' };
      req.body = { name: 'Alice', reason: 'Updated' };
      const skill = { _id: req.params.skillId, candidates: [], save: jest.fn() };
      mockingoose(SkillZone).toReturn(skill, 'findOne');
      await updateCandidate(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('should update candidate', async () => {
      req.params = { skillId: '507f1f77bcf86cd799439011', candidateId: 'c1' };
      req.body = { name: 'Alice', reason: 'Updated' };
      const skill = {
        _id: req.params.skillId,
        name: 'React',
        save: jest.fn(),
        candidates: [{ _id: 'c1', name: 'Old', reason: 'Old reason' }],
      };
      mockingoose(SkillZone).toReturn(skill, 'findOne');
      await updateCandidate(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(skill.save).toHaveBeenCalled();
    });
  });

  describe('deleteCandidate', () => {
    it('should return 404 if candidate not found', async () => {
      req.params = { skillId: '507f1f77bcf86cd799439011', candidateId: '2' };
      const skill = {
        _id: req.params.skillId,
        candidates: [{ _id: '3' }],
        save: jest.fn(),
      };
      mockingoose(SkillZone).toReturn(skill, 'findOne');
      await deleteCandidate(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('should delete candidate', async () => {
      req.params = { skillId: '507f1f77bcf86cd799439011', candidateId: '3' };
      const skill = {
        _id: req.params.skillId,
        name: 'React',
        candidates: [{ _id: '3' }],
        save: jest.fn(),
      };
      mockingoose(SkillZone).toReturn(skill, 'findOne');
      await deleteCandidate(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(skill.save).toHaveBeenCalled();
    });
  });

  describe('deleteSkill', () => {
    it('should return 404 if skill not found', async () => {
      req.params.skillId = '507f1f77bcf86cd799439011';
      mockingoose(SkillZone).toReturn(null, 'findOneAndDelete');
      await deleteSkill(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('should delete skill', async () => {
      req.params.skillId = '507f1f77bcf86cd799439011';
      const deletedSkill = { name: 'React' };
      mockingoose(SkillZone).toReturn(deletedSkill, 'findOneAndDelete');
      await deleteSkill(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });
});
