// tests/leaveRequestController.test.js
import * as leaveController from '../controllers/leaveRequestController.js';
import LeaveRequest from '../models/LeaveRequest.js';
import { jest } from '@jest/globals';

LeaveRequest.find = jest.fn();
LeaveRequest.findById = jest.fn();
LeaveRequest.findByIdAndUpdate = jest.fn();
LeaveRequest.findByIdAndDelete = jest.fn();
LeaveRequest.prototype.save = jest.fn();

describe('LeaveRequest Controller', () => {
  const mockRes = () => {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
  };

  afterEach(() => jest.clearAllMocks());

  it('should get all leave requests', async () => {
    const req = { query: {} };
    const res = mockRes();
    LeaveRequest.find.mockResolvedValue([{ employeeName: 'John Doe' }]);
    await leaveController.getLeaveRequests(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith([{ employeeName: 'John Doe' }]);
  });

  it('should handle error when getLeaveRequests fails', async () => {
    const req = { query: {} };
    const res = mockRes();
    LeaveRequest.find.mockRejectedValue(new Error('DB error'));
    await leaveController.getLeaveRequests(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ message: 'DB error' });
  });

  it('should create a leave request with status Pending', async () => {
    const req = { body: { employeeName: 'John Doe', startDate: '2025-09-01', endDate: '2025-09-05' } };
    const res = mockRes();
    LeaveRequest.prototype.save.mockResolvedValue({ ...req.body, status: 'Pending' });
    await leaveController.createLeaveRequest(req, res);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({ ...req.body, status: 'Pending' });
  });

  it('should handle createLeaveRequest error', async () => {
    const req = { body: {} };
    const res = mockRes();
    LeaveRequest.prototype.save.mockRejectedValue(new Error('Save failed'));
    await leaveController.createLeaveRequest(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: 'Save failed' });
  });

  it('should update a leave request successfully', async () => {
    const req = { params: { id: '1' }, body: { reason: 'Personal' } };
    const res = mockRes();
    LeaveRequest.findById.mockResolvedValue({ status: 'Pending' });
    LeaveRequest.findByIdAndUpdate.mockResolvedValue({ _id: '1', reason: 'Personal' });
    await leaveController.updateLeaveRequest(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('should prevent employee updating processed leave request', async () => {
    const req = { params: { id: '1' }, body: {}, query: { employee: 'true' } };
    const res = mockRes();
    LeaveRequest.findById.mockResolvedValue({ status: 'Approved' });
    await leaveController.updateLeaveRequest(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: 'Cannot update a leave request that has already been processed' });
  });

  it('should delete leave request successfully', async () => {
    const req = { params: { id: '1' } };
    const res = mockRes();
    LeaveRequest.findById.mockResolvedValue({ status: 'Pending' });
    LeaveRequest.findByIdAndDelete.mockResolvedValue({});
    await leaveController.deleteLeaveRequest(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ message: 'Leave request deleted successfully' });
  });

  it('should prevent employee deleting processed leave request', async () => {
    const req = { params: { id: '1' }, query: { employee: 'true' } };
    const res = mockRes();
    LeaveRequest.findById.mockResolvedValue({ status: 'Approved' });
    await leaveController.deleteLeaveRequest(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: 'Cannot delete a leave request that has already been processed' });
  });

  it('should get leave requests for an employee', async () => {
    const req = { params: { employeeId: 'emp1' } };
    const res = mockRes();
    LeaveRequest.find.mockResolvedValue([{ employeeName: 'John Doe' }]);
    await leaveController.getEmployeeLeaveRequests(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith([{ employeeName: 'John Doe' }]);
  });

  it('should update leave status with valid data', async () => {
    const req = { params: { id: '1' }, body: { status: 'Approved', comment: 'OK' } };
    const res = mockRes();
    LeaveRequest.findByIdAndUpdate.mockResolvedValue({ status: 'Approved' });
    await leaveController.updateLeaveStatus(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('should reject update leave status with invalid status', async () => {
    const req = { params: { id: '1' }, body: { status: 'Invalid' } };
    const res = mockRes();
    await leaveController.updateLeaveStatus(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: 'Invalid status value' });
  });

  it('should require comment when rejecting leave', async () => {
    const req = { params: { id: '1' }, body: { status: 'Rejected', comment: '' } };
    const res = mockRes();
    await leaveController.updateLeaveStatus(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: 'Rejection reason is required' });
  });

  it('should update leave comment', async () => {
    const req = { params: { id: '1' }, body: { comment: 'New comment' } };
    const res = mockRes();
    LeaveRequest.findByIdAndUpdate.mockResolvedValue({ comment: 'New comment' });
    await leaveController.updateLeaveComment(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('should approve leave request', async () => {
    const req = { params: { id: '1' } };
    const res = mockRes();
    LeaveRequest.findByIdAndUpdate.mockResolvedValue({ status: 'approved' });
    await leaveController.approveLeaveRequest(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('should reject leave request with reason', async () => {
    const req = { params: { id: '1' }, body: { rejectionReason: 'No leave left' } };
    const res = mockRes();
    LeaveRequest.findByIdAndUpdate.mockResolvedValue({ status: 'rejected' });
    await leaveController.rejectLeaveRequest(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('should reject leave request without reason and return error', async () => {
    const req = { params: { id: '1' }, body: {} };
    const res = mockRes();
    await leaveController.rejectLeaveRequest(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: 'Rejection reason is required' });
  });
});
