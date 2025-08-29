


import { jest } from '@jest/globals';
import { getUsersWithRoles, updateUserRole, updateUserPermissions } from '../controllers/roleController.js';
import User from '../models/User.js';

// Helper to create a mocked response object
const mockResponse = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

// Clear mocks before each test
beforeEach(() => {
  jest.clearAllMocks();
});

describe('Role Controller Tests', () => {
  
  test('getUsersWithRoles should respond with 200 and return users', async () => {
    const req = { companyCode: 'ABC123' };
    const res = mockResponse();
    
    const mockUsers = [{ userId: '1', name: 'John Doe', role: 'admin' }];
    User.find = jest.fn().mockReturnValue({ select: jest.fn().mockResolvedValue(mockUsers) });
    
    await getUsersWithRoles(req, res);
    
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(mockUsers);
  });

  describe('updateUserRole', () => {
    it('should update user role successfully', async () => {
      const req = { companyCode: 'ABC123', params: { userId: '1' }, body: { role: 'manager' }};
      const res = mockResponse();

      const user = {
        _id: '1',
        userId: '1',
        name: 'John',
        email: 'john@test.com',
        role: 'admin',
        permissions: [],
        assignPermissions: jest.fn(),
        save: jest.fn()
      };

      User.findOne = jest.fn().mockResolvedValue(user);

      await updateUserRole(req, res);

      expect(user.role).toBe('manager');
      expect(user.assignPermissions).toHaveBeenCalled();
      expect(user.save).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        message: 'User role updated successfully',
        user: expect.objectContaining({ userId: '1', role: 'manager' })
      }));
    });

    it('should respond 404 if user not found', async () => {
      const req = { companyCode: 'ABC123', params: { userId: '1' }, body: { role: 'manager' }};
      const res = mockResponse();

      User.findOne = jest.fn().mockResolvedValue(null);

      await updateUserRole(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: 'User not found' });
    });

    it('should handle errors and respond 500', async () => {
      const req = { companyCode: 'ABC123', params: { userId: '1' }, body: { role: 'manager' }};
      const res = mockResponse();

      User.findOne = jest.fn().mockImplementation(() => { throw new Error('DB Error'); });

      await updateUserRole(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: 'DB Error' });
    });
  });

  describe('updateUserPermissions', () => {
    it('should update permissions successfully', async () => {
      const req = { companyCode: 'ABC123', params: { userId: '1' }, body: { permissions: ['view_employees'] }};
      const res = mockResponse();

      const user = {
        _id: '1',
        userId: '1',
        name: 'John',
        email: 'john@test.com',
        role: 'admin',
        permissions: [],
        save: jest.fn()
      };

      User.findOne = jest.fn().mockResolvedValue(user);

      await updateUserPermissions(req, res);

      expect(user.permissions).toEqual(['view_employees']);
      expect(user.save).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        message: 'User permissions updated successfully',
        user: expect.objectContaining({ userId: '1', permissions: ['view_employees'] })
      }));
    });

    it('should return 400 for invalid permissions', async () => {
      const req = { companyCode: 'ABC123', params: { userId: '1' }, body: { permissions: ['invalid_perm'] }};
      const res = mockResponse();

      const user = { save: jest.fn() };

      User.findOne = jest.fn().mockResolvedValue(user);

      await updateUserPermissions(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'Invalid permissions detected', invalidPermissions: ['invalid_perm'] });
    });

    it('should return 404 if user not found', async () => {
      const req = { companyCode: 'ABC123', params: { userId: '1' }, body: { permissions: ['view_employees'] }};
      const res = mockResponse();

      User.findOne = jest.fn().mockResolvedValue(null);

      await updateUserPermissions(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: 'User not found' });
    });

    it('should handle errors and respond 500', async () => {
      const req = { companyCode: 'ABC123', params: { userId: '1' }, body: { permissions: ['view_employees'] }};
      const res = mockResponse();

      User.findOne = jest.fn().mockImplementation(() => { throw new Error('DB Error'); });

      await updateUserPermissions(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: 'DB Error' });
    });
  });
});

